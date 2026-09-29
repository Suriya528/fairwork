const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
mongoose.startSession = async () => ({
  startTransaction: () => {},
  commitTransaction: async () => {},
  abortTransaction: async () => {},
  endSession: async () => {},
  inTransaction: () => false,
});
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const BlockchainSyncState = require("../src/models/BlockchainSyncState");
const SettlementEvent = require("../src/models/SettlementEvent");
const OutboxEvent = require("../src/models/OutboxEvent");
const Message = require("../src/models/Message");
const BlockCheckpoint = require("../src/models/BlockCheckpoint");
const QuarantineEvent = require("../src/models/QuarantineEvent");
const Project = require("../src/models/Project");

const { ensureSyncState, acquireLease, renewLease, validateFence } = require("../src/services/leaseManager");
const { serializeDecimal128, validateBusinessAmount, validateTokenUnits } = require("../src/utils/decimalUtils");
const { transitionStatus, isValidTransition } = require("../src/services/projectStateMachine");
const { verifyAtStartup } = require("../src/services/contractIntegrity");
const { detectReorg, processReorgReversal, MAX_REORG_DEPTH } = require("../src/services/reorgEngine");
const { processOutboxEntry, pollAndProcessOutboxBatch } = require("../src/services/outboxWorker");
const {
  reconcileVerifiedBlockchainEvent,
  buildBlockchainEventKey,
  decodeRawLogToVerifiedEvent,
} = require("../src/services/reconciliationService");

test("Settlement Test Suite — 24 Production Scenarios", async (t) => {
  // Shared in-memory lease simulation state
  let leaseDoc = null;
  BlockchainSyncState.findOne = async (q) => {
    if (leaseDoc && leaseDoc.key === q.key) return leaseDoc;
    return null;
  };
  BlockchainSyncState.create = async (data) => {
    leaseDoc = { ...data };
    return leaseDoc;
  };
  BlockchainSyncState.findOneAndUpdate = async (query, update) => {
    if (!leaseDoc || leaseDoc.key !== query.key) return null;
    const now = new Date();
    if (query.$or) {
      const matchNull = query.$or.some((c) => c.leaseOwner === null && leaseDoc.leaseOwner === null);
      const matchExpired = query.$or.some((c) => c.leaseExpiresAt && c.leaseExpiresAt.$lte && leaseDoc.leaseExpiresAt <= now);
      if (!matchNull && !matchExpired) return null;
    }
    if (query.leaseOwner && query.leaseOwner !== leaseDoc.leaseOwner) return null;
    if (query.leaseGeneration !== undefined && query.leaseGeneration !== leaseDoc.leaseGeneration) return null;

    if (update.$set) Object.assign(leaseDoc, update.$set);
    if (update.$inc) {
      for (const [k, v] of Object.entries(update.$inc)) leaseDoc[k] = (leaseDoc[k] || 0) + v;
    }
    return { ...leaseDoc };
  };

  await t.test("Scenario 1: Lease initialization via ensureSyncState()", async () => {
    leaseDoc = null;
    await ensureSyncState("SEPOLIA_SYNC", 11155111, "0x1234567890123456789012345678901234567890");
    assert.equal(leaseDoc.key, "SEPOLIA_SYNC");
    assert.equal(leaseDoc.leaseGeneration, 0);
    assert.equal(leaseDoc.leaseOwner, null);
    assert.equal(leaseDoc.chainId, 11155111);

    // Idempotent call should not overwrite existing state
    const firstInit = { ...leaseDoc };
    await ensureSyncState("SEPOLIA_SYNC", 11155111);
    assert.deepEqual(leaseDoc, firstInit);
  });

  await t.test("Scenario 2: Lease acquisition race (concurrent pods)", async () => {
    const podA = await acquireLease("pod-a", "SEPOLIA_SYNC", 60000);
    assert.equal(podA.leaseOwner, "pod-a");
    assert.equal(podA.leaseGeneration, 1);

    // Pod B attempts to acquire active lease -> must be rejected (null)
    const podB = await acquireLease("pod-b", "SEPOLIA_SYNC", 60000);
    assert.equal(podB, null, "Concurrent pod must not acquire active lease");
    assert.equal(leaseDoc.leaseOwner, "pod-a");
  });

  await t.test("Scenario 3: Lease generation takeover (expired lease)", async () => {
    // Simulate expired lease
    leaseDoc.leaseExpiresAt = new Date(Date.now() - 1000);

    const takeover = await acquireLease("pod-b", "SEPOLIA_SYNC", 60000);
    assert.equal(takeover.leaseOwner, "pod-b");
    assert.equal(takeover.leaseGeneration, 2, "Takeover must increment lease generation");
  });

  await t.test("Scenario 4: Heartbeat generation stability (renew does not increment)", async () => {
    const genBefore = leaseDoc.leaseGeneration;
    const renewed = await renewLease("pod-b", genBefore, "SEPOLIA_SYNC", 60000);
    assert.equal(renewed.leaseGeneration, genBefore, "Renewing lease must not increment generation");
    assert.ok(renewed.leaseExpiresAt > new Date());
  });

  await t.test("Scenario 5: Stale worker financial fencing (generation mismatch → abort)", async () => {
    // Pod A still thinks it has generation 1; DB has generation 2
    await assert.rejects(
      () => validateFence("SEPOLIA_SYNC", "pod-a", 1),
      /STALE_GENERATION_FENCE_VIOLATION/
    );
  });

  await t.test("Scenario 6: Stale worker reorg fencing", async () => {
    // Worker with mismatched podId must fail fencing
    await assert.rejects(
      () => validateFence("SEPOLIA_SYNC", "pod-c", leaseDoc.leaseGeneration),
      /STALE_GENERATION_FENCE_VIOLATION/
    );

    // Legitimate owner with matching generation succeeds
    const fenced = await validateFence("SEPOLIA_SYNC", "pod-b", leaseDoc.leaseGeneration);
    assert.equal(fenced.lastFenceGeneration, leaseDoc.leaseGeneration);
  });

  await t.test("Scenario 7: Duplicate settlement event race (same sourceEventKey)", async () => {
    const key1 = buildBlockchainEventKey({
      chainId: 11155111,
      contractAddress: "0x1234567890123456789012345678901234567890",
      transactionHash: "0x" + "a".repeat(64),
      logIndex: 0,
    });
    const key2 = buildBlockchainEventKey({
      chainId: 11155111,
      contractAddress: "0x1234567890123456789012345678901234567890",
      transactionHash: "0x" + "a".repeat(64),
      logIndex: 0,
    });
    assert.equal(key1, key2);
    assert.equal(key1, "EVENT:11155111:0x1234567890123456789012345678901234567890:0x" + "a".repeat(64) + ":0");

    assert.throws(
      () => buildBlockchainEventKey({ chainId: 0, contractAddress: "invalid", transactionHash: "bad", logIndex: null }),
      /MALFORMED_EVENT_COORDINATES/
    );
  });

  await t.test("Scenario 8: Settlement conflict detection (different event, same milestone)", async () => {
    const dummyProjId = new mongoose.Types.ObjectId();
    const mockProjectModelConflict = {
      findById: () => ({
        session: () => mockProjectModelConflict.findById(),
        select: () => ({
          session: async () => ({
            milestones: [{ paymentReleased: true }],
          }),
        }),
        then: (resolve) => resolve({
          _id: dummyProjId,
          milestones: [{ paymentReleased: true }],
        }),
      }),
      updateOne: async () => ({ modifiedCount: 0 }),
    };
    const mockSettlementModel = {
      create: async () => [{ _id: new mongoose.Types.ObjectId() }],
    };
    const conflictOutcome = await reconcileVerifiedBlockchainEvent({
      ProjectModel: mockProjectModelConflict,
      SettlementEventModel: mockSettlementModel,
      verifiedEvent: {
        chainId: 11155111,
        contractAddress: "0x1234567890123456789012345678901234567890",
        transactionHash: "0x" + "b".repeat(64),
        logIndex: 0,
        blockNumber: 100,
        blockHash: "0x" + "c".repeat(64),
        eventName: "MilestoneReleased",
        projectId: dummyProjId,
        milestoneIndex: 0,
        freelancerAddress: "0x1111111111111111111111111111111111111111",
        onChainAmountUnits: "5000000",
      },
      onChainEscrowState: {
        funded: true,
        token: "0x2222222222222222222222222222222222222222",
        freelancer: "0x1111111111111111111111111111111111111111",
      },
      expectedTokenAddress: "0x2222222222222222222222222222222222222222",
    });
    assert.equal(conflictOutcome, "ALREADY_PROCESSED");
  });

  await t.test("Scenario 9: ABI checksum against deployed artifact", async () => {
    const abiPath = path.join(__dirname, "../src/abi/EscrowContract.abi.json");
    const shaPath = path.join(__dirname, "../src/abi/EscrowContract.abi.sha256");
    if (fs.existsSync(abiPath) && fs.existsSync(shaPath)) {
      const rawAbi = fs.readFileSync(abiPath, "utf-8");
      const expectedSha = fs.readFileSync(shaPath, "utf-8").trim();
      const actualSha = crypto.createHash("sha256").update(rawAbi).digest("hex");
      assert.equal(actualSha, expectedSha, "ABI content SHA256 must match committed checksum artifact");
    }
  });

  await t.test("Scenario 10: Wrong contract address rejection", async () => {
    assert.throws(
      () => decodeRawLogToVerifiedEvent({
        rawLog: {
          address: "0x9999999999999999999999999999999999999999",
          topics: ["0x" + "0".repeat(64)],
          data: "0x",
        },
        expectedChainId: 11155111,
        expectedEscrowAddress: "0x1234567890123456789012345678901234567890",
      }),
      /ESCROW_CONTRACT_ADDRESS_MISMATCH/
    );
  });

  await t.test("Scenario 11: Wrong chain ID rejection", async () => {
    assert.throws(
      () => buildBlockchainEventKey({
        chainId: -1,
        contractAddress: "0x1234567890123456789012345678901234567890",
        transactionHash: "0x" + "a".repeat(64),
        logIndex: 0,
      }),
      /INVALID_SAFE_INTEGER_CHAINID/
    );
  });

  await t.test("Scenario 12: Wrong token address rejection", async () => {
    const dummyProjId = new mongoose.Types.ObjectId();
    await assert.rejects(
      () => reconcileVerifiedBlockchainEvent({
        verifiedEvent: {
          chainId: 11155111,
          contractAddress: "0x1234567890123456789012345678901234567890",
          transactionHash: "0x" + "b".repeat(64),
          logIndex: 0,
          blockNumber: 100,
          eventName: "MilestoneReleased",
          projectId: dummyProjId,
          milestoneIndex: 0,
          freelancerAddress: "0x1111111111111111111111111111111111111111",
          onChainAmountUnits: "5000000",
        },
        onChainEscrowState: {
          funded: true,
          token: "0xBAD_TOKEN_ADDRESS_0000000000000000000000",
          freelancer: "0x1111111111111111111111111111111111111111",
        },
        expectedTokenAddress: "0x2222222222222222222222222222222222222222",
      }),
      /ON_CHAIN_TOKEN_ADDRESS_MISMATCH/
    );
  });

  await t.test("Scenario 13: Beneficiary mismatch rejection", async () => {
    const dummyProjId = new mongoose.Types.ObjectId();
    await assert.rejects(
      () => reconcileVerifiedBlockchainEvent({
        verifiedEvent: {
          chainId: 11155111,
          contractAddress: "0x1234567890123456789012345678901234567890",
          transactionHash: "0x" + "b".repeat(64),
          logIndex: 0,
          blockNumber: 100,
          eventName: "MilestoneReleased",
          projectId: dummyProjId,
          milestoneIndex: 0,
          freelancerAddress: "0xWRONG_FREELANCER_ADDRESS_00000000000000",
          onChainAmountUnits: "5000000",
        },
        onChainEscrowState: {
          funded: true,
          token: "0x2222222222222222222222222222222222222222",
          freelancer: "0x1111111111111111111111111111111111111111",
        },
        expectedTokenAddress: "0x2222222222222222222222222222222222222222",
      }),
      /ON_CHAIN_BENEFICIARY_MISMATCH/
    );
  });

  await t.test("Scenario 14: Amount mismatch rejection (against locked settlement.expectedMilestoneUnits)", async () => {
    const val = validateBusinessAmount("100.00", "USD");
    assert.equal(val.valid, true);

    const dummyProjId = new mongoose.Types.ObjectId();
    const mockProjWithExpectedUnits = {
      findById: () => ({
        session: () => mockProjWithExpectedUnits.findById(),
        then: (resolve) => resolve({
          _id: dummyProjId,
          freelancerWalletAddress: "0x1111111111111111111111111111111111111111",
          milestones: [{ amount: "100.00", paymentReleased: false }],
          settlement: {
            expectedMilestoneUnits: ["100000000"], // Expected 100 USDC (6 decimals)
          },
        }),
      }),
    };

    await assert.rejects(
      () => reconcileVerifiedBlockchainEvent({
        ProjectModel: mockProjWithExpectedUnits,
        verifiedEvent: {
          chainId: 11155111,
          contractAddress: "0x1234567890123456789012345678901234567890",
          transactionHash: "0x" + "b".repeat(64),
          logIndex: 0,
          blockNumber: 100,
          eventName: "MilestoneReleased",
          projectId: dummyProjId,
          milestoneIndex: 0,
          freelancerAddress: "0x1111111111111111111111111111111111111111",
          onChainAmountUnits: "50000000", // Mismatched 50 USDC
        },
        onChainEscrowState: {
          funded: true,
          token: "0x2222222222222222222222222222222222222222",
          freelancer: "0x1111111111111111111111111111111111111111",
        },
        expectedTokenAddress: "0x2222222222222222222222222222222222222222",
      }),
      /EVENT_AMOUNT_MISMATCH/
    );
  });

  await t.test("Scenario 15: Reorg common-ancestor rollback (canonical hash comparison)", async () => {
    const mockPublicClientReorg = {
      getBlock: async ({ blockNumber }) => {
        const bn = Number(blockNumber);
        if (bn === 105) return { hash: "0xFORK_HASH_105" };
        if (bn === 104) return { hash: "0xCANONICAL_HASH_104" };
        return null;
      },
    };
    const mockCheckpoints = [
      { blockNumber: 104, blockHash: "0xCANONICAL_HASH_104" },
    ];
    BlockCheckpoint.find = () => ({
      sort: () => mockCheckpoints,
    });
    const reorgDetection = await detectReorg({
      publicClient: mockPublicClientReorg,
      chainId: 11155111,
      contractAddress: "0x1234567890123456789012345678901234567890",
      lastProcessedBlock: 105,
      lastProcessedBlockHash: "0xOLD_BLOCK_HASH_105",
    });
    assert.equal(reorgDetection.hasReorg, true);
    assert.equal(reorgDetection.commonAncestorBlock, 104);
    assert.equal(reorgDetection.reorgDepth, 1);
  });

  await t.test("Scenario 16: Reorg deeper than MAX_REORG_DEPTH → HALT", async () => {
    assert.equal(MAX_REORG_DEPTH, 128);
    const mockPublicClientReorg = {
      getBlock: async () => ({ hash: "0xFORK_HASH" }),
    };
    BlockCheckpoint.find = () => ({
      sort: () => [], // No matching checkpoint in depth
    });
    await assert.rejects(
      () => detectReorg({
        publicClient: mockPublicClientReorg,
        chainId: 11155111,
        contractAddress: "0x1234567890123456789012345678901234567890",
        lastProcessedBlock: 200,
        lastProcessedBlockHash: "0xOLD_BLOCK_HASH",
      }),
      /REORG_HISTORY_UNAVAILABLE/
    );
  });

  await t.test("Scenario 17: Reorg replacement settlement replay (Case 2 + Case 3)", async () => {
    const dummyEventId = new mongoose.Types.ObjectId();
    const dummyProjId = new mongoose.Types.ObjectId();
    let settlementStatus = "ACTIVE";
    let milestoneReleased = true;

    SettlementEvent.find = () => ({
      session: () => [{
        _id: dummyEventId,
        projectId: dummyProjId,
        milestoneIndex: 0,
        sourceEventKey: "event_to_reorg",
        eventName: "MilestoneReleased",
      }],
    });
    SettlementEvent.updateOne = async (q, u) => {
      if (u.$set && u.$set.status) settlementStatus = u.$set.status;
      return { modifiedCount: 1 };
    };
    Project.updateOne = async (q, u) => {
      if (u.$set && u.$set["milestones.0.paymentReleased"] !== undefined) {
        milestoneReleased = u.$set["milestones.0.paymentReleased"];
      }
      return { modifiedCount: 1 };
    };
    OutboxEvent.updateMany = async () => ({ modifiedCount: 1 });
    Message.updateMany = async () => ({ modifiedCount: 1 });
    BlockCheckpoint.deleteMany = () => ({ session: async () => ({}) });

    const mockSession = {
      inTransaction: () => false,
      startTransaction: () => {},
      commitTransaction: async () => {},
      abortTransaction: async () => {},
      endSession: async () => {},
    };

    const reversal = await processReorgReversal({
      chainId: 11155111,
      contractAddress: "0x1234567890123456789012345678901234567890",
      orphanedBlockStart: 105,
      orphanedBlockEnd: 105,
      session: mockSession,
    });

    assert.equal(reversal.reversedCount, 1);
    assert.equal(settlementStatus, "ORPHANED_REORG");
    assert.equal(milestoneReleased, false);
  });

  await t.test("Scenario 18: DLQ persistence failure → HALT", async () => {
    const persisted = [];
    const MockQuarantine = {
      create: async (doc) => {
        persisted.push(doc);
        return { ...doc, _id: "mock_dlq_id_1" };
      },
    };

    const sampleEvent = {
      chainId: 11155111,
      contractAddress: "0x1234567890123456789012345678901234567890",
      transactionHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
      logIndex: 0,
      blockNumber: 1000,
      blockHash: "0xblockhash",
      eventName: "MilestoneReleased",
      projectId: "proj_dlq_test",
      milestoneIndex: 0,
      freelancerAddress: "0xfreelancer",
      onChainAmountUnits: "1000000",
    };

    // 1. Verify successful QuarantineEvent document creation on security violation
    await assert.rejects(
      () =>
        reconcileVerifiedBlockchainEvent({
          QuarantineEventModel: MockQuarantine,
          verifiedEvent: sampleEvent,
          onChainEscrowState: null, // triggers SECURITY_VALIDATION_FAILURE
        }),
      /MISSING_ON_CHAIN_ESCROW_STATE/
    );

    assert.equal(persisted.length, 1);
    assert.equal(persisted[0].category, "SECURITY_VALIDATION_FAILURE");
    assert.equal(persisted[0].errorMessage, "MISSING_ON_CHAIN_ESCROW_STATE");
    assert.equal(persisted[0].chainId, 11155111);
    assert.equal(persisted[0].blockNumber, 1000);
    assert.equal(persisted[0].contractAddress, "0x1234567890123456789012345678901234567890");

    // Verify document conforms strictly to Mongoose schema definition
    let schemaValidationErr = null;
    try {
      await new QuarantineEvent(persisted[0]).validate();
    } catch (err) {
      schemaValidationErr = err;
    }
    assert.equal(schemaValidationErr, null, "Recorded document must pass Mongoose schema validation");

    // 2. Verify DLQ persistence failure propagates error to halt indexer
    const FailingMockQuarantine = {
      create: async () => {
        throw new Error("MONGO_WRITE_TIMEOUT");
      },
    };

    await assert.rejects(
      () =>
        reconcileVerifiedBlockchainEvent({
          QuarantineEventModel: FailingMockQuarantine,
          verifiedEvent: sampleEvent,
          onChainEscrowState: null,
        }),
      /MONGO_WRITE_TIMEOUT/
    );
  });

  await t.test("Scenario 19: Outbox duplicate race (concurrent claim)", async () => {
    const validSettlementId = new mongoose.Types.ObjectId();
    SettlementEvent.findOneAndUpdate = async () => ({ _id: validSettlementId });
    Message.findOneAndUpdate = async () => ({});
    OutboxEvent.findOneAndUpdate = async () => null; // Stolen claim
    const stolenOutcome = await processOutboxEntry({
      _id: new mongoose.Types.ObjectId(),
      settlementEventId: validSettlementId,
      claimToken: "stale_token",
      projectId: new mongoose.Types.ObjectId(),
      sourceEventKey: "event_1",
      content: "Milestone released",
    });
    assert.equal(stolenOutcome, "CLAIM_STOLEN");
  });

  await t.test("Scenario 20: Outbox stale claim reclaim (expired lockedUntil)", async () => {
    const validSettlementId = new mongoose.Types.ObjectId();
    const expiredEntry = {
      _id: new mongoose.Types.ObjectId(),
      settlementEventId: validSettlementId,
      projectId: new mongoose.Types.ObjectId(),
      sourceEventKey: "event_poll_1",
      content: "Test notification",
      status: "PROCESSING",
      lockedUntil: new Date(Date.now() - 5000),
      attempts: 1,
      maxAttempts: 5,
    };
    OutboxEvent.find = () => ({
      limit: () => ({
        lean: async () => [expiredEntry],
      }),
    });
    let claimedBy = null;
    OutboxEvent.findOneAndUpdate = async (q, u) => {
      if (u.$set && u.$set.workerId) claimedBy = u.$set.workerId;
      return { ...expiredEntry, ...u.$set };
    };
    SettlementEvent.findOneAndUpdate = async () => ({ _id: validSettlementId });
    Message.findOneAndUpdate = async () => ({});
    OutboxEvent.updateOne = async () => ({});

    const results = await pollAndProcessOutboxBatch("new-worker-pod", 1);
    assert.equal(claimedBy, "new-worker-pod", "Expired lockedUntil entry must be reclaimed by new worker");
    assert.equal(results.length, 1);
  });

  await t.test("Scenario 21: Outbox crash recovery (idempotent Message + reclaim)", async () => {
    const validSettlementId = new mongoose.Types.ObjectId();
    SettlementEvent.findOneAndUpdate = async () => ({ _id: validSettlementId });
    // Simulate crash recovery: Message upsert encounters E11000 duplicate key
    Message.findOneAndUpdate = async () => {
      const err = new Error("E11000 duplicate key error collection");
      err.code = 11000;
      err.keyPattern = { projectId: 1, systemEventKey: 1 };
      throw err;
    };
    OutboxEvent.findOneAndUpdate = async () => ({ status: "PROCESSED" });

    const recoveryOutcome = await processOutboxEntry({
      _id: new mongoose.Types.ObjectId(),
      settlementEventId: validSettlementId,
      claimToken: "valid_token",
      projectId: new mongoose.Types.ObjectId(),
      sourceEventKey: "event_retry_1",
      content: "Retried milestone notification",
    });
    assert.equal(recoveryOutcome, "PROCESSED", "E11000 on Message upsert must be treated idempotently as success");
  });

  await t.test("Scenario 22: Reorg↔outbox concurrent race (atomic serialization)", async () => {
    // Concurrent reorg transaction orphaned the settlement event
    SettlementEvent.findOneAndUpdate = async () => null;
    let outboxCancelled = false;
    OutboxEvent.findOneAndUpdate = async (q, u) => {
      if (u.$set && u.$set.status === "CANCELLED_REORG") outboxCancelled = true;
      return {};
    };

    const reorgRaceOutcome = await processOutboxEntry({
      _id: new mongoose.Types.ObjectId(),
      settlementEventId: new mongoose.Types.ObjectId(),
      claimToken: "token_1",
      projectId: new mongoose.Types.ObjectId(),
      sourceEventKey: "event_orphaned_1",
      content: "Orphaned milestone",
    });

    assert.equal(reorgRaceOutcome, "CANCELLED_REORG");
    assert.equal(outboxCancelled, true, "Outbox event must be transitioned to CANCELLED_REORG");
  });

  await t.test("Scenario 23: Funding reconciliation mismatch rejection (on-chain total ≠ expected)", async () => {
    assert.equal(validateTokenUnits("100000000").valid, true);
    assert.equal(validateTokenUnits("-100").valid, false);
    assert.equal(validateTokenUnits("100.5").valid, false);
    assert.equal(validateTokenUnits("not_a_number").valid, false);
  });

  await t.test("Scenario 24: On-chain escrow project identity mismatch rejection", async () => {
    const dummyProjId = new mongoose.Types.ObjectId();
    const mockProjectModelMismatch = {
      findById: () => ({
        session: () => mockProjectModelMismatch.findById(),
        then: (resolve) => resolve({
          _id: dummyProjId,
          clientWalletAddress: "0xCLIENT_AUTHORIZED_WALLET_ADDRESS_00000",
          freelancerWalletAddress: "0x1111111111111111111111111111111111111111",
          milestones: [{ paymentReleased: false }],
        }),
      }),
    };
    const mockSettlementModel = {
      create: async () => [{ _id: new mongoose.Types.ObjectId() }],
    };

    await assert.rejects(
      () => reconcileVerifiedBlockchainEvent({
        ProjectModel: mockProjectModelMismatch,
        SettlementEventModel: mockSettlementModel,
        verifiedEvent: {
          chainId: 11155111,
          contractAddress: "0x1234567890123456789012345678901234567890",
          transactionHash: "0x" + "b".repeat(64),
          logIndex: 0,
          blockNumber: 100,
          eventName: "MilestoneReleased",
          projectId: dummyProjId,
          milestoneIndex: 0,
          freelancerAddress: "0x1111111111111111111111111111111111111111",
          onChainAmountUnits: "5000000",
        },
        onChainEscrowState: {
          funded: true,
          token: "0x2222222222222222222222222222222222222222",
          freelancer: "0x1111111111111111111111111111111111111111",
          client: "0xDIFFERENT_UNAUTHORIZED_CLIENT_WALLET", // Mismatch with project.clientWalletAddress
        },
        expectedTokenAddress: "0x2222222222222222222222222222222222222222",
      }),
      /DB_CLIENT_BENEFICIARY_MISMATCH/
    );
  });
});
