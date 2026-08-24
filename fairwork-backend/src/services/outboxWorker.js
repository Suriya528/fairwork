const crypto = require("crypto");
const mongoose = require("mongoose");
const OutboxEvent = require("../models/OutboxEvent");
const SettlementEvent = require("../models/SettlementEvent");
const Message = require("../models/Message");

/**
 * Outbox Event Worker
 * 
 * Guarantees atomic, reorg-safe system event notification processing.
 * Forces a write/write conflict with any concurrent reorg transaction on SettlementEvent.
 */

async function processOutboxEntry(entry, io = null) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Atomic state-touch/claim on settlement (WRITE, not just read)
    //    Forces document-level write conflict with reorg transaction
    const settlement = await SettlementEvent.findOneAndUpdate(
      {
        _id: entry.settlementEventId,
        status: "ACTIVE",
      },
      {
        $set: { notificationClaimToken: entry.claimToken },
      },
      { session, returnDocument: "after" }
    );

    if (!settlement) {
      // Settlement is ORPHANED_REORG or missing → cancel outbox
      await OutboxEvent.findOneAndUpdate(
        { _id: entry._id, claimToken: entry.claimToken },
        { $set: { status: "CANCELLED_REORG" } },
        { session }
      );
      await session.commitTransaction();
      return "CANCELLED_REORG";
    }

    // 2. Idempotent Message upsert with E11000 keyPattern inspection
    try {
      await Message.findOneAndUpdate(
        { projectId: entry.projectId, systemEventKey: entry.sourceEventKey },
        {
          $setOnInsert: {
            projectId: entry.projectId,
            senderId: null,
            content: entry.content,
            type: "SYSTEM_EVENT",
            systemEventKey: entry.sourceEventKey,
            eventStatus: "ACTIVE",
            settlementEventId: entry.settlementEventId,
          },
        },
        { upsert: true, session }
      );
    } catch (upsertErr) {
      if (upsertErr.code === 11000) {
        const kp = upsertErr.keyPattern || {};
        if (kp.projectId && kp.systemEventKey) {
          // Idempotent success — Message already exists from prior attempt
        } else {
          throw upsertErr;
        }
      } else {
        throw upsertErr;
      }
    }

    // 3. Fenced outbox completion (claim-token guard)
    const result = await OutboxEvent.findOneAndUpdate(
      { _id: entry._id, claimToken: entry.claimToken, status: "PROCESSING" },
      { $set: { status: "PROCESSED", processedAt: new Date() } },
      { session }
    );

    if (!result) {
      await session.abortTransaction();
      return "CLAIM_STOLEN";
    }

    await session.commitTransaction();

    // 4. Best-effort socket delivery with deterministic payload (outside transaction)
    if (io) {
      io.to(`project:${entry.projectId}`).emit("receive_message", {
        type: "SYSTEM_EVENT",
        systemEventKey: entry.sourceEventKey,
        eventStatus: "ACTIVE",
        settlementEventId: entry.settlementEventId.toString(),
        content: entry.content,
        projectId: entry.projectId.toString(),
      });
    }

    return "PROCESSED";
  } catch (err) {
    if (session.inTransaction()) await session.abortTransaction();
    throw err;
  } finally {
    await session.endSession();
  }
}

/**
 * Polls and claims pending outbox entries.
 */
async function pollAndProcessOutboxBatch(workerId = "worker-1", batchSize = 10, io = null) {
  const claimTTLMs = 30 * 1000;
  const now = new Date();

  const entries = await OutboxEvent.find({
    status: { $in: ["PENDING"] },
    $or: [
      { nextAttemptAt: null },
      { nextAttemptAt: { $lte: now } },
    ],
  })
    .limit(batchSize)
    .lean();

  const results = [];
  for (const rawEntry of entries) {
    const claimToken = crypto.randomUUID();
    const claimed = await OutboxEvent.findOneAndUpdate(
      { _id: rawEntry._id, status: "PENDING" },
      {
        $set: {
          status: "PROCESSING",
          workerId,
          claimToken,
          lockedUntil: new Date(Date.now() + claimTTLMs),
        },
        $inc: { attempts: 1 },
      },
      { returnDocument: "after" }
    );

    if (!claimed) continue; // Claimed by another worker

    try {
      const outcome = await processOutboxEntry(claimed, io);
      results.push({ id: claimed._id, outcome });
    } catch (err) {
      const isMaxAttempts = claimed.attempts >= claimed.maxAttempts;
      const nextStatus = isMaxAttempts ? "DEAD_LETTER" : "PENDING";
      const nextAttemptAt = new Date(Date.now() + Math.pow(2, claimed.attempts) * 1000);

      await OutboxEvent.updateOne(
        { _id: claimed._id, claimToken },
        {
          $set: {
            status: nextStatus,
            errorMessage: err.message,
            nextAttemptAt: isMaxAttempts ? null : nextAttemptAt,
          },
        }
      );
      results.push({ id: claimed._id, outcome: nextStatus, error: err.message });
    }
  }

  return results;
}

module.exports = {
  processOutboxEntry,
  pollAndProcessOutboxBatch,
};
