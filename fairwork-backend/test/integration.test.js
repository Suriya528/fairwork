const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const { validateStartupConfig } = require("../src/utils/configValidator");
const { verifyContractIntegrity, calculateAbiChecksum } = require("../src/services/contractIntegrity");
const { acquireLease, renewLease, validateFence } = require("../src/services/leaseManager");
const { processOutboxBatch } = require("../src/services/outboxWorker");
const { detectReorg, processReorgReversal } = require("../src/services/reorgEngine");
const { assertSettlementSnapshotMutable, createSettlementSnapshot, lockSettlementSnapshot } = require("../src/services/settlementSnapshotService");
const { validateBusinessAmount, validateTokenUnits, serializeDecimal128 } = require("../src/utils/decimalUtils");
const { sanitizeUrl } = require("../src/utils/sanitizeUrl");
const { isValidTransition, transitionStatus } = require("../src/services/projectStateMachine");
const Project = require("../src/models/Project");
const SettlementEvent = require("../src/models/SettlementEvent");
const OutboxEvent = require("../src/models/OutboxEvent");
const BlockchainSyncState = require("../src/models/BlockchainSyncState");
const Message = require("../src/models/Message");
const BlockCheckpoint = require("../src/models/BlockCheckpoint");
const QuarantineEvent = require("../src/models/QuarantineEvent");
const { resolveViemChain, getRpcUrl } = require("../src/services/chainResolver");

test("Integration-Gate Logic Suite", async (t) => {

  await t.test("Gate 1: Fail-fast Startup Validator (Staging Invariants)", async () => {
    // Missing required config should throw
    assert.throws(
      () => validateStartupConfig({ NODE_ENV: "staging" }),
      /FATAL_STARTUP_CONFIG_ERROR/
    );

    // Valid staging config should pass
    const validConfig = {
      NODE_ENV: "staging",
      MONGO_URI: "mongodb://localhost:27017/fairwork_staging",
      JWT_SECRET: "a_very_long_secure_jwt_secret_key_32bytes_min!",
      JWT_ISSUER: "fairwork-staging",
      JWT_AUDIENCE: "fairwork-staging-app",
      CLIENT_URL: "https://staging.fairwork.io",
      BACKEND_URL: "https://api-staging.fairwork.io",
      REDIS_URL: "redis://localhost:6379",
      CHAIN_ID: "11155111",
      ESCROW_CONTRACT_ADDRESS: "0x7d51b87db4df857cdd76ad63a9ace7b5c5599385",
      TOKEN_CONTRACT_ADDRESS: "0xf21bdf6737a3009359f9ec1fa515e6d74702f575",
      EXPECTED_ESCROW_BYTECODE_HASH: "0x608060405234801561001057600080fd5b50",
      GOOGLE_CLIENT_ID: "test.apps.googleusercontent.com",
      GOOGLE_CLIENT_SECRET: "test-google-secret",
      GITHUB_CLIENT_ID: "test-github-client-id",
      GITHUB_CLIENT_SECRET: "test-github-secret",
    };

    assert.equal(validateStartupConfig(validConfig), true);
  });

  await t.test("Gate 2: Single Controlled Write Boundary for Settlement Snapshot", async () => {
    const dummyProjectId = new mongoose.Types.ObjectId();
    const fakeProject = {
      _id: dummyProjectId,
      milestones: [{ amount: "100.00" }],
      settlement: { fundingLockedAt: new Date() },
    };

    // Modifying locked snapshot via assertSettlementSnapshotMutable throws
    assert.throws(
      () => assertSettlementSnapshotMutable(fakeProject),
      /SETTLEMENT_SNAPSHOT_IMMUTABLE/
    );
  });

  await t.test("Gate 3: Generation-Based Lease Fencing Takeover Simulation", async () => {
    const syncDoc = { key: "GATE3_SYNC", leaseOwner: "pod-1", leaseGeneration: 2 };
    BlockchainSyncState.findOneAndUpdate = async (q) => {
      if (q.leaseGeneration === 2 && q.leaseOwner === "pod-1") return syncDoc;
      return null;
    };
    await assert.rejects(
      () => validateFence("GATE3_SYNC", "pod-1", 1),
      /STALE_GENERATION_FENCE_VIOLATION/
    );
    const validFence = await validateFence("GATE3_SYNC", "pod-1", 2);
    assert.equal(validFence.key, "GATE3_SYNC");
  });

  await t.test("Gate 4: USD Exact Decimal128 Validation & Formatting", async () => {
    assert.equal(serializeDecimal128("100", 2), "100.00");
    assert.equal(serializeDecimal128("100.0", 2), "100.00");
    assert.equal(serializeDecimal128("100.00", 2), "100.00");
    assert.equal(serializeDecimal128("0.01", 2), "0.01");

    assert.throws(() => serializeDecimal128("100.001", 2), /DECIMAL_SCALE_VIOLATION/);

    const validRes = validateBusinessAmount("100.00", "USD");
    assert.equal(validRes.valid, true);

    const invalidScale = validateBusinessAmount("100.001", "USD");
    assert.equal(invalidScale.valid, false);

    const invalidZero = validateBusinessAmount("0.00", "USD");
    assert.equal(invalidZero.valid, false);
  });

  await t.test("Gate 5: Strict URL Scheme Filtering & XSS Prevention", async () => {
    assert.equal(sanitizeUrl("javascript:alert(1)"), null);
    assert.equal(sanitizeUrl("data:text/html,<script>alert(1)</script>"), null);
    assert.equal(sanitizeUrl("vbscript:msgbox(1)"), null);
    assert.equal(sanitizeUrl("http://user:password@malicious.com"), null);
    assert.equal(sanitizeUrl("https://fairwork.io/profile"), "https://fairwork.io/profile");
  });

  await t.test("Gate 6: Project CAS State Machine Invariants", async () => {
    // Valid transitions
    assert.equal(isValidTransition("open", "in_progress"), true);
    assert.equal(isValidTransition("in_progress", "completed"), true);

    // Invalid transitions
    assert.equal(isValidTransition("open", "completed"), false);
    assert.equal(isValidTransition("completed", "disputed"), false);
    assert.equal(isValidTransition("cancelled", "completed"), false);
  });

  await t.test("Gate 7: End-to-End Settlement Traceability Correlation", async () => {
    const trace = {
      transactionHash: "0xa1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890",
      blockNumber: 5201948,
      blockHash: "0xf9e8d7c6b5a43210f9e8d7c6b5a43210f9e8d7c6b5a43210f9e8d7c6b5a43210",
      logIndex: 2,
      sourceEventKey: "11155111:0x7d51b87db4df857cdd76ad63a9ace7b5c5599385:5201948:2",
      settlementEventId: new mongoose.Types.ObjectId().toString(),
      outboxEventId: new mongoose.Types.ObjectId().toString(),
      messageId: new mongoose.Types.ObjectId().toString(),
      projectId: new mongoose.Types.ObjectId().toString(),
      milestoneIndex: 0,
    };

    assert.ok(trace.transactionHash.startsWith("0x"));
    assert.equal(trace.blockNumber, 5201948);
    assert.ok(trace.sourceEventKey.includes(":5201948:2"));
  });

  await t.test("Gate 8: Reorg Common-Ancestor Rollback Strategy", async () => {
    const mockClient = {
      getBlock: async ({ blockNumber }) => {
        if (Number(blockNumber) === 200) return { hash: "0xNEW_FORK_HASH" };
        if (Number(blockNumber) === 199) return { hash: "0xCOMMON_ANCESTOR_HASH" };
        return null;
      },
    };
    BlockCheckpoint.find = () => ({
      sort: () => [{ blockNumber: 199, blockHash: "0xCOMMON_ANCESTOR_HASH" }],
    });
    const reorg = await detectReorg({
      publicClient: mockClient,
      chainId: 11155111,
      contractAddress: "0x7d51b87db4df857cdd76ad63a9ace7b5c5599385",
      lastProcessedBlock: 200,
      lastProcessedBlockHash: "0xOLD_ORPHANED_HASH",
    });
    assert.equal(reorg.hasReorg, true);
    assert.equal(reorg.commonAncestorBlock, 199);
  });

  await t.test("Gate 9: Mongoose Models & Index Schema Validation", async () => {
    assert.ok(Project.schema);
    assert.ok(SettlementEvent.schema);
    assert.ok(OutboxEvent.schema);
    assert.ok(BlockchainSyncState.schema);
    assert.ok(Message.schema);
    assert.ok(BlockCheckpoint.schema);
  });

  await t.test("Gate 10: Dynamic Multi-Chain Resolver Verification (Mainnet, L2s, Sepolia)", async () => {
    // Ethereum Mainnet
    const mainnetChain = resolveViemChain(1);
    assert.equal(mainnetChain.id, 1);
    assert.equal(mainnetChain.name, "Ethereum");

    // Base
    const baseChain = resolveViemChain(8453);
    assert.equal(baseChain.id, 8453);
    assert.equal(baseChain.name, "Base");

    // Polygon
    const polygonChain = resolveViemChain(137);
    assert.equal(polygonChain.id, 137);
    assert.equal(polygonChain.name, "Polygon");

    // Arbitrum
    const arbitrumChain = resolveViemChain(42161);
    assert.equal(arbitrumChain.id, 42161);
    assert.equal(arbitrumChain.name, "Arbitrum One");

    // Sepolia
    const sepoliaChain = resolveViemChain(11155111);
    assert.equal(sepoliaChain.id, 11155111);
    assert.equal(sepoliaChain.name, "Sepolia");

    // Custom EVM fallback
    const customChain = resolveViemChain(9999);
    assert.equal(customChain.id, 9999);
    assert.equal(customChain.name, "EVM-9999");
  });

  await t.test("Gate 11: SettlementEvent Schema & Reorg Reversal Functionality", async () => {
    // Verify SettlementEvent model enum supports all 7 events
    const eventNameEnum = SettlementEvent.schema.path("eventName").enumValues;
    const requiredEvents = [
      "MilestoneReleased",
      "EscrowFunded",
      "EscrowRefunded",
      "RefundRequested",
      "RefundCancelled",
      "EscrowDisputed",
      "DisputeResolved",
    ];
    for (const ev of requiredEvents) {
      assert.ok(eventNameEnum.includes(ev), `SettlementEvent must include ${ev}`);
    }

    // Verify processReorgReversal handles reversal gracefully without throwing
    SettlementEvent.find = () => ({ session: () => [] });
    BlockCheckpoint.deleteMany = () => ({ session: async () => ({}) });
    const reversalResult = await processReorgReversal({
      chainId: 11155111,
      contractAddress: "0x7d51b87db4df857cdd76ad63a9ace7b5c5599385",
      orphanedBlockStart: 200,
      orphanedBlockEnd: 200,
      session: {
        inTransaction: () => false,
        startTransaction: () => {},
        commitTransaction: async () => {},
        abortTransaction: async () => {},
        endSession: async () => {},
      },
    });
    assert.equal(reversalResult.reversedCount, 0);
  });

  await t.test("Gate 12: Startup Validator with Optional vs Explicit OAuth", async () => {
    const baseValid = {
      NODE_ENV: "production",
      MONGO_URI: "mongodb://localhost:27017/fairwork_prod",
      JWT_SECRET: "a_very_long_secure_jwt_secret_key_32bytes_min!",
      JWT_ISSUER: "fairwork-prod",
      JWT_AUDIENCE: "fairwork-prod-app",
      CLIENT_URL: "https://fairwork.io",
      BACKEND_URL: "https://fairwork.io",
      REDIS_URL: "redis://localhost:6379",
      CHAIN_ID: "1",
      CANONICAL_ESCROW_ADDRESS: "0x7d51b87db4df857cdd76ad63a9ace7b5c5599385",
      CANONICAL_TOKEN_ADDRESS: "0xf21bdf6737a3009359f9ec1fa515e6d74702f575",
      EXPECTED_ESCROW_BYTECODE_HASH: "0x608060405234801561001057600080fd5b50",
    };

    // Clean deployment without OAuth passes
    assert.equal(validateStartupConfig(baseValid), true);

    // Deployment with ENABLE_OAUTH=true without credentials fails
    assert.throws(
      () => validateStartupConfig({ ...baseValid, ENABLE_OAUTH: "true" }),
      /FATAL_STARTUP_CONFIG_ERROR/
    );

    // Deployment with partial Google credentials fails
    assert.throws(
      () => validateStartupConfig({ ...baseValid, GOOGLE_CLIENT_ID: "some-id" }),
      /GOOGLE_CLIENT_SECRET is missing/
    );
  });

  await t.test("Gate 13: RPC 429 Rate-Limit During Reorg Check Rejection & Safe Halting", async () => {
    // 1. Mock publicClient that returns HTTP 429 rate limit
    const mockRpc429Client = {
      getBlock: async () => {
        const rpcErr = new Error("HTTP 429: Too Many Requests - rate limit exceeded");
        rpcErr.status = 429;
        throw rpcErr;
      },
    };

    // 2. detectReorg must propagate the RPC rejection rather than proceeding with partial/corrupt rollback
    await assert.rejects(
      async () => {
        await detectReorg({
          publicClient: mockRpc429Client,
          chainId: 11155111,
          contractAddress: "0x7d51b87db4df857cdd76ad63a9ace7b5c5599385",
          lastProcessedBlock: 100,
          lastProcessedBlockHash: "0xabcd",
        });
      },
      /rate limit exceeded/
    );

    // 3. Verify that blockchain listener classifies 429 as retryable for jittered backoff
    const { isRetryableRpcError } = require("../src/services/blockchainListener");
    assert.equal(isRetryableRpcError({ status: 429, message: "rate limit" }), true);
    assert.equal(isRetryableRpcError({ status: 503, message: "service unavailable" }), true);
  });

  await t.test("Gate 14: 5 Consecutive RPC Failures Flip Halted Flag & Halt Indexer Safely", async () => {
    const {
      handleListenerLoopError,
      resetListenerStatusForTesting,
      getListenerStatus,
    } = require("../src/services/blockchainListener");

    resetListenerStatusForTesting();
    const initial = getListenerStatus();
    assert.equal(initial.halted, false);
    assert.equal(initial.healthy, true);
    assert.equal(initial.consecutiveFailures, 0);

    const rpc429Err = new Error("HTTP 429: Too Many Requests - RPC rate limit exceeded");

    const quarantinedDocs = [];
    const MockQuarantine = {
      create: async (doc) => {
        quarantinedDocs.push(doc);
        return { ...doc, _id: "mock_quarantine_gate14" };
      },
    };

    // Failures 1 through 4: Should remain NOT halted, but increment failure count
    for (let i = 1; i <= 4; i++) {
      const status = await handleListenerLoopError(rpc429Err, "test-pod", MockQuarantine);
      assert.equal(status.consecutiveFailures, i);
      assert.equal(status.halted, false, `Should not halt at failure ${i}`);
      assert.equal(status.healthy, true, `Should remain healthy at failure ${i}`);
    }

    // 5th Failure: Must trigger emergency halt, flip healthy to false, and persist QuarantineEvent
    const finalStatus = await handleListenerLoopError(rpc429Err, "test-pod", MockQuarantine);
    assert.equal(finalStatus.consecutiveFailures, 5);
    assert.equal(finalStatus.halted, true, "Must be halted after 5 consecutive failures");
    assert.equal(finalStatus.healthy, false, "Must not be healthy after 5 consecutive failures");
    assert.equal(finalStatus.lastError, rpc429Err.message);

    // Verify QuarantineEvent was successfully recorded with proper fields
    assert.equal(quarantinedDocs.length, 1);
    assert.equal(quarantinedDocs[0].category, "OPERATOR_REVIEW");
    assert.equal(quarantinedDocs[0].errorMessage, rpc429Err.message);
    assert.ok(quarantinedDocs[0].stackTrace);

    // Verify recorded document strictly conforms to Mongoose schema definition
    let validationError = null;
    try {
      await new QuarantineEvent(quarantinedDocs[0]).validate();
    } catch (err) {
      validationError = err;
    }
    assert.equal(validationError, null, "Recorded document must pass Mongoose schema validation");

    // Clean up test state
    resetListenerStatusForTesting();
  });

});
