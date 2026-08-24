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
  let currentBlockNum = lastProcessedBlock - 1;
  let commonAncestorBlock = null;
  let depth = 1;

  while (depth <= MAX_REORG_DEPTH && currentBlockNum >= 0) {
    const checkpoint = await BlockCheckpoint.findOne({
      chainId,
      contractAddress: contractAddress.toLowerCase(),
      blockNumber: currentBlockNum,
    });

    if (!checkpoint) {
      throw new Error(`REORG_HISTORY_UNAVAILABLE: BlockCheckpoint missing for block ${currentBlockNum}`);
    }

    const onChainBlock = await publicClient.getBlock({ blockNumber: BigInt(currentBlockNum) });
    if (onChainBlock.hash.toLowerCase() === checkpoint.blockHash.toLowerCase()) {
      commonAncestorBlock = currentBlockNum;
      break;
    }

    currentBlockNum--;
    depth++;
  }

  if (commonAncestorBlock === null) {
    throw new Error(`REORG_EXCEEDS_MAX_DEPTH: Exceeded MAX_REORG_DEPTH (${MAX_REORG_DEPTH}) without finding common ancestor`);
  }

  return {
    hasReorg: true,
    commonAncestorBlock,
    reorgDepth: depth,
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

      // Reverse milestone projection ONLY if currently attributed to THIS event (atomic predicate)
      await Project.updateOne(
        {
          _id: event.projectId,
          [`milestones.${event.milestoneIndex}.settlementEventId`]: event._id,
        },
        {
          $set: {
            [`milestones.${event.milestoneIndex}.paymentReleased`]: false,
            [`milestones.${event.milestoneIndex}.settlementEventId`]: null,
          },
        },
        { session }
      );

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
