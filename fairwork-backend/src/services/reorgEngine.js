const mongoose = require("mongoose");
const BlockCheckpoint = require("../models/BlockCheckpoint");
const SettlementEvent = require("../models/SettlementEvent");
const Project = require("../models/Project");
const OutboxEvent = require("../models/OutboxEvent");
const Message = require("../models/Message");

const MAX_REORG_DEPTH = 128;

/**
 * Reorg Engine
 * Detects blockchain reorganizations by hash comparison and reverses orphaned DB state.
 */

async function detectReorg({ publicClient, chainId, contractAddress, lastProcessedBlock, lastProcessedBlockHash }) {
  if (!lastProcessedBlock || !lastProcessedBlockHash) {
    return { hasReorg: false };
  }

  // 1. Fetch canonical block hash for lastProcessedBlock from blockchain RPC
  const canonicalBlock = await publicClient.getBlock({ blockNumber: BigInt(lastProcessedBlock) });
  if (!canonicalBlock || !canonicalBlock.hash) {
    throw new Error(`REORG_CHECK_FAILED_CANNOT_FETCH_BLOCK_${lastProcessedBlock}`);
  }

  if (canonicalBlock.hash.toLowerCase() === lastProcessedBlockHash.toLowerCase()) {
    // Hashes match → no reorg
    return { hasReorg: false };
  }

  // 2. Mismatch → walk backwards to locate common ancestor
  const minSearchBlock = Math.max(0, lastProcessedBlock - MAX_REORG_DEPTH);
  const checkpoints = await BlockCheckpoint.find({
    chainId,
    contractAddress: contractAddress.toLowerCase(),
    blockNumber: { $lt: lastProcessedBlock, $gte: minSearchBlock },
  }).sort({ blockNumber: -1 });

  let commonAncestorBlock = null;
  let reorgDepth = 0;

  for (const checkpoint of checkpoints) {
    const onChainBlock = await publicClient.getBlock({ blockNumber: BigInt(checkpoint.blockNumber) });
    if (onChainBlock && onChainBlock.hash && onChainBlock.hash.toLowerCase() === checkpoint.blockHash.toLowerCase()) {
      commonAncestorBlock = checkpoint.blockNumber;
      reorgDepth = lastProcessedBlock - commonAncestorBlock;
      break;
    }
  }

  if (commonAncestorBlock === null) {
    if (!checkpoints || checkpoints.length === 0) {
      throw new Error(`REORG_HISTORY_UNAVAILABLE: BlockCheckpoint missing for block ${lastProcessedBlock - 1}`);
    }
    throw new Error(`REORG_EXCEEDS_MAX_DEPTH: Exceeded MAX_REORG_DEPTH (${MAX_REORG_DEPTH}) without finding common ancestor`);
  }

  return {
    hasReorg: true,
    commonAncestorBlock,
    reorgDepth,
    orphanedBlockStart: commonAncestorBlock + 1,
    orphanedBlockEnd: lastProcessedBlock,
  };
}

/**
 * Reverses settlement events, milestone projections, outbox entries, and system messages
 * for blocks orphaned by a reorg.
 */
async function processReorgReversal({ chainId, contractAddress, orphanedBlockStart, orphanedBlockEnd, io = null, session: externalSession = null }) {
  const session = externalSession || (await mongoose.startSession());
  const isSelfManaged = !externalSession;
  if (isSelfManaged) session.startTransaction();

  try {
    // 1. Fetch all ACTIVE settlement events in the orphaned block range
    const affectedEvents = await SettlementEvent.find({
      chainId,
      contractAddress: contractAddress.toLowerCase(),
      blockNumber: { $gte: orphanedBlockStart, $lte: orphanedBlockEnd },
      status: "ACTIVE",
    }).session(session);

    const reversedEventIds = [];

    for (const event of affectedEvents) {
      // Mark SettlementEvent as ORPHANED_REORG
      await SettlementEvent.updateOne(
        { _id: event._id, status: "ACTIVE" },
        { $set: { status: "ORPHANED_REORG" } },
        { session }
      );

      // Event-specific state reversal
      if (!event.eventName || event.eventName === "MilestoneReleased") {
        // Reverse milestone projection ONLY if currently attributed to THIS event (atomic predicate)
        const milestoneResult = await Project.updateOne(
          {
            _id: event.projectId,
            [`milestones.${event.milestoneIndex}.settlementEventId`]: event._id,
          },
          {
            $set: {
              [`milestones.${event.milestoneIndex}.paymentReleased`]: false,
              [`milestones.${event.milestoneIndex}.settlementEventId`]: null,
              [`milestones.${event.milestoneIndex}.status`]: "in_progress",
            },
            $unset: {
              [`milestones.${event.milestoneIndex}.releaseTxnHash`]: "",
              [`milestones.${event.milestoneIndex}.releasedAt`]: "",
            },
          },
          { session }
        );

        if (milestoneResult.modifiedCount > 0) {
          // If project status had transitioned to completed, revert to in_progress
          await Project.updateOne(
            { _id: event.projectId, status: "completed", escrowCompleted: true },
            { $set: { status: "in_progress", escrowCompleted: false } },
            { session }
          );
        }
      } else if (event.eventName === "EscrowFunded") {
        await Project.updateOne(
          { _id: event.projectId, escrowTxnHash: event.transactionHash },
          {
            $set: { escrowFunded: false, status: "open" },
            $unset: { escrowTxnHash: "" },
          },
          { session }
        );
      } else if (event.eventName === "EscrowRefunded") {
        await Project.updateOne(
          { _id: event.projectId, escrowCompleted: true },
          { $set: { escrowCompleted: false, status: "in_progress" } },
          { session }
        );
      } else if (event.eventName === "RefundRequested") {
        await Project.updateOne(
          { _id: event.projectId, refundRequested: true },
          {
            $set: { refundRequested: false },
            $unset: { refundRequestedAt: "" },
          },
          { session }
        );
      } else if (event.eventName === "RefundCancelled") {
        await Project.updateOne(
          { _id: event.projectId, refundRequested: false },
          { $set: { refundRequested: true } },
          { session }
        );
      } else if (event.eventName === "EscrowDisputed") {
        await Project.updateOne(
          { _id: event.projectId, status: "disputed" },
          { $set: { status: "in_progress" } },
          { session }
        );
      } else if (event.eventName === "DisputeResolved") {
        await Project.updateOne(
          { _id: event.projectId, escrowCompleted: true },
          { $set: { escrowCompleted: false, status: "disputed" } },
          { session }
        );
      }

      // Cancel PENDING or PROCESSING outbox entries
      await OutboxEvent.updateMany(
        { settlementEventId: event._id, status: { $in: ["PENDING", "PROCESSING"] } },
        { $set: { status: "CANCELLED_REORG" } },
        { session }
      );

      // Mark System Messages as ORPHANED_REORGED
      await Message.updateMany(
        { projectId: event.projectId, systemEventKey: event.sourceEventKey },
        { $set: { eventStatus: "ORPHANED_REORGED" } },
        { session }
      );

      reversedEventIds.push(event._id);
    }

    // Clean up orphaned BlockCheckpoints above common ancestor
    await BlockCheckpoint.deleteMany({
      chainId,
      contractAddress: contractAddress.toLowerCase(),
      blockNumber: { $gte: orphanedBlockStart },
    }).session(session);

    if (isSelfManaged) await session.commitTransaction();

    // Best-effort socket emit to inform UI of reorg reversal
    if (io) {
      for (const event of affectedEvents) {
        io.to(`project:${event.projectId}`).emit("receive_message", {
          type: "SYSTEM_EVENT",
          systemEventKey: event.sourceEventKey,
          eventStatus: "ORPHANED_REORGED",
          settlementEventId: event._id.toString(),
          projectId: event.projectId.toString(),
          content: "[REORG] Settlement event was orphaned by a blockchain reorg.",
        });
      }
    }

    return { reversedCount: reversedEventIds.length, reversedEventIds };
  } catch (err) {
    if (isSelfManaged && session.inTransaction()) await session.abortTransaction();
    throw err;
  } finally {
    if (isSelfManaged) await session.endSession();
  }
}

module.exports = {
  detectReorg,
  processReorgReversal,
  MAX_REORG_DEPTH,
};
