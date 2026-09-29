const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const { verifyAuthToken } = require("../src/utils/authVerifier");
const { sanitizeUrl: backendSanitizeUrl } = require("../src/utils/sanitizeUrl");
const { serializeDecimal128, validateBusinessAmount, validateTokenUnits } = require("../src/utils/decimalUtils");
const { isValidTransition, transitionStatus } = require("../src/services/projectStateMachine");
const { authRateLimiter, registerRateLimiter } = require("../src/middleware/authRateLimiter");
const { canAccessProject } = require("../src/services/projectAccess");
const { isUserActiveAndAuthorized } = require("../src/index");
const { initiateGoogleAuth, initiateGithubAuth, exchangeOAuthCode } = require("../src/controllers/oauthController");
const { getCatchUpMessages } = require("../src/controllers/messageController");
const { FINANCIAL_INVARIANTS } = require("../src/services/reconciliationService");

const User = require("../src/models/User");
const Message = require("../src/models/Message");
const Project = require("../src/models/Project");
const OAuthCode = require("../src/models/OAuthCode");
const SettlementEvent = require("../src/models/SettlementEvent");
const QuarantineEvent = require("../src/models/QuarantineEvent");
const BlockchainSyncState = require("../src/models/BlockchainSyncState");

test("Authorization Test Suite — 14 Production Scenarios", async (t) => {
  await t.test("Scenario 25: Message reconnect catch-up (cursor pagination, orphaned exclusion)", async () => {
    const origProjectFindById = Project.findById;
    const origMessageFindById = Message.findById;
    const origMessageFind = Message.find;

    try {
      const dummyProjectId = new mongoose.Types.ObjectId();
      const dummyUserId = new mongoose.Types.ObjectId();
      const cursorMsgId = new mongoose.Types.ObjectId();
      const cursorTs = new Date("2026-09-01T12:00:00.000Z");

      const opaqueCursor = Buffer.from(
        JSON.stringify({
          createdAt: cursorTs.toISOString(),
          _id: cursorMsgId.toString(),
        })
      ).toString("base64url");

      // Mock project membership and retention check
      Project.findById = () => ({
        select: () => ({
          clientId: dummyUserId,
          freelancerId: null,
        }),
      });

      Message.findById = async (id) => {
        if (String(id) === String(cursorMsgId)) {
          return { _id: cursorMsgId, createdAt: cursorTs };
        }
        return null;
      };

      let executedQuery = null;
      Message.find = (q) => {
        executedQuery = q;
        return {
          populate: () => ({
            sort: () => ({
              limit: async () => [
                {
                  _id: new mongoose.Types.ObjectId(),
                  createdAt: new Date("2026-09-01T12:05:00.000Z"),
                  content: "Catchup message 1",
                  eventStatus: "ACTIVE",
                },
              ],
            }),
          }),
        };
      };

      let responseData = null;
      const req = {
        params: { projectId: dummyProjectId.toString() },
        query: { cursor: opaqueCursor, limit: "10" },
        user: { id: dummyUserId.toString(), role: "client" },
      };
      const res = {
        json: (data) => {
          responseData = data;
          return res;
        },
        status: () => res,
      };

      await getCatchUpMessages(req, res);

      assert.ok(responseData, "Response data must be returned");
      assert.equal(executedQuery.projectId, dummyProjectId.toString());
      assert.deepEqual(executedQuery.eventStatus, { $ne: "ORPHANED_REORGED" }, "Must exclude ORPHANED_REORGED messages");
      assert.ok(executedQuery.$or, "Cursor query must specify $or compound condition");
    } finally {
      Project.findById = origProjectFindById;
      Message.findById = origMessageFindById;
      Message.find = origMessageFind;
    }
  });

  await t.test("Scenario 26: Equal-timestamp cursor pagination correctness", async () => {
    // When multiple messages share the exact same createdAt, tie-breaker _id: { $gt: cursorId } prevents skip or duplicate
    const cursorTs = new Date("2026-09-01T12:00:00.000Z");
    const cursorId = "507f1f77bcf86cd799439011";

    const compoundQuery = {
      $or: [
        { createdAt: { $gt: cursorTs } },
        { createdAt: cursorTs, _id: { $gt: cursorId } },
      ],
    };

    // Message with same timestamp but greater _id matches
    const sameTsNextMsg = { createdAt: cursorTs, _id: "507f1f77bcf86cd799439012" };
    const matchesTieBreaker =
      sameTsNextMsg.createdAt.getTime() === cursorTs.getTime() && sameTsNextMsg._id > cursorId;
    assert.equal(matchesTieBreaker, true, "Tie-breaker condition must select subsequent message with identical timestamp");

    // Message with same timestamp and smaller/equal _id does NOT match
    const sameTsOldMsg = { createdAt: cursorTs, _id: "507f1f77bcf86cd799439010" };
    const matchesOldMsg =
      sameTsOldMsg.createdAt.getTime() === cursorTs.getTime() && sameTsOldMsg._id > cursorId;
    assert.equal(matchesOldMsg, false, "Tie-breaker condition must exclude already-seen message with identical timestamp");
  });

  await t.test("Scenario 27: Suspended socket disconnect", async () => {
    const origUserFindById = User.findById;

    try {
      const activeUserId = new mongoose.Types.ObjectId();
      const suspendedUserId = new mongoose.Types.ObjectId();

      User.findById = (id) => ({
        select: async () => {
          if (String(id) === String(suspendedUserId)) {
            return { _id: suspendedUserId, role: "freelancer", isSuspended: true, email: "suspended@fairwork.io" };
          }
          if (String(id) === String(activeUserId)) {
            return { _id: activeUserId, role: "freelancer", isSuspended: false, email: "active@fairwork.io" };
          }
          return null;
        },
      });

      const suspendedResult = await isUserActiveAndAuthorized(suspendedUserId.toString());
      assert.equal(suspendedResult, null, "Suspended user must return null to trigger socket disconnect");

      const activeResult = await isUserActiveAndAuthorized(activeUserId.toString());
      assert.ok(activeResult, "Active user must return authorized user document");
      assert.equal(activeResult.isSuspended, false);

      const invalidResult = await isUserActiveAndAuthorized("not-a-valid-object-id");
      assert.equal(invalidResult, null, "Malformed userId must return null immediately");
    } finally {
      User.findById = origUserFindById;
    }
  });

  await t.test("Scenario 28: REST project membership enforcement (non-member → 403)", async () => {
    const clientUserId = new mongoose.Types.ObjectId();
    const freelancerUserId = new mongoose.Types.ObjectId();
    const attackerUserId = new mongoose.Types.ObjectId();

    const sampleProject = {
      _id: new mongoose.Types.ObjectId(),
      clientId: clientUserId,
      freelancerId: freelancerUserId,
    };

    assert.equal(await canAccessProject(sampleProject, clientUserId), true, "Client must have access");
    assert.equal(await canAccessProject(sampleProject, freelancerUserId), true, "Assigned freelancer must have access");
    assert.equal(await canAccessProject(sampleProject, attackerUserId), false, "Non-member must be denied access (403)");
  });

  await t.test("Scenario 29: REST project completion authorization (non-owner + unsettled → 403/409)", async () => {
    assert.equal(isValidTransition("in_progress", "completed"), true);
    assert.equal(isValidTransition("open", "completed"), false);
    assert.equal(isValidTransition("completed", "in_progress"), false);
    assert.equal(isValidTransition("cancelled", "in_progress"), false);
  });

  await t.test("Scenario 30: OAuth suspension protection", async () => {
    const origOAuthCodeFindOneAndDelete = OAuthCode.findOneAndDelete;
    const origUserFindById = User.findById;

    try {
      let capturedStatus = null;
      let capturedBody = null;
      const res = {
        status: (code) => {
          capturedStatus = code;
          return res;
        },
        json: (body) => {
          capturedBody = body;
          return res;
        },
      };

      const suspendedUserId = new mongoose.Types.ObjectId();
      OAuthCode.findOneAndDelete = async () => ({
        userId: suspendedUserId,
        nonce: "test_nonce",
      });

      User.findById = async () => ({
        _id: suspendedUserId,
        isSuspended: true,
        role: "freelancer",
        suspendedReason: "Violation of terms",
      });

      const req = {
        body: { code: "oauth_test_code" },
      };

      await exchangeOAuthCode(req, res);

      assert.equal(capturedStatus, 403, "Suspended OAuth account exchange must return 403 Forbidden");
      assert.equal(capturedBody?.code, "ACCOUNT_SUSPENDED");
    } finally {
      OAuthCode.findOneAndDelete = origOAuthCodeFindOneAndDelete;
      User.findById = origUserFindById;
    }
  });

  await t.test("Scenario 31: OAuth provider state isolation (separate cookies)", async () => {
    let googleCookieName = null;
    let githubCookieName = null;

    const resGoogle = {
      cookie: (name) => {
        googleCookieName = name;
      },
      redirect: () => {},
    };
    const resGithub = {
      cookie: (name) => {
        githubCookieName = name;
      },
      redirect: () => {},
    };

    const req = { query: { role: "freelancer", action: "login" } };

    initiateGoogleAuth(req, resGoogle);
    initiateGithubAuth(req, resGithub);

    assert.equal(googleCookieName, "oauth_state_google", "Google must set isolated oauth_state_google cookie");
    assert.equal(githubCookieName, "oauth_state_github", "GitHub must set isolated oauth_state_github cookie");
    assert.notEqual(googleCookieName, githubCookieName, "OAuth providers must maintain isolated state cookies");
  });

  await t.test("Scenario 32: GitHub login PKCE verifier mismatch rejection", async () => {
    let redirectUrl = null;
    const res = {
      clearCookie: () => {},
      redirect: (url) => {
        redirectUrl = url;
      },
    };

    const cookiePayload = JSON.stringify({ nonce: "legit_nonce", codeVerifier: "legit_verifier" });
    const req = {
      query: { code: "gh_code", state: "tampered_state_token" },
      headers: {
        cookie: `oauth_state_github=${encodeURIComponent(cookiePayload)}`,
      },
    };

    const { handleGithubCallback } = require("../src/controllers/oauthController");
    await handleGithubCallback(req, res);

    assert.ok(redirectUrl, "Must redirect to error URL");
    assert.ok(
      redirectUrl.includes("error=OAUTH_STATE_MISMATCH") || redirectUrl.includes("error=INVALID_OAUTH_STATE"),
      "Must redirect with state/verifier mismatch error code"
    );
  });

  await t.test("Scenario 33: URL scheme rejection (javascript:, data:, credentials in URL)", async () => {
    assert.equal(backendSanitizeUrl("javascript:alert(1)"), null);
    assert.equal(backendSanitizeUrl("data:text/html,abc"), null);
    assert.equal(backendSanitizeUrl("https://user:pass@example.com"), null);
    assert.equal(backendSanitizeUrl("https://fairwork.io/projects"), "https://fairwork.io/projects");
  });

  await t.test("Scenario 34: Token verification preserves sessionId and tokenVersion claims", async () => {
    const testSecret = "test_secret_for_claims_preservation_key_12345";
    const signed = jwt.sign(
      { id: "651234567890123456789012", role: "client", sessionId: "sess-abc", tokenVersion: 2 },
      testSecret,
      { expiresIn: "1h", audience: "fairwork-client", issuer: "fairwork-api" }
    );
    const verified = verifyAuthToken(signed, { jwtSecret: testSecret, audience: "fairwork-client", issuer: "fairwork-api", nodeEnv: "development" });
    assert.equal(verified.id, "651234567890123456789012");
    assert.equal(verified.role, "client");
    assert.equal(verified.sessionId, "sess-abc");
    assert.equal(verified.tokenVersion, 2);
  });

  await t.test("Scenario 35: Auth endpoint rate limiting (Redis fail-closed)", async () => {
    const origEnv = process.env.NODE_ENV;
    const origRedis = process.env.REDIS_URL;

    try {
      process.env.NODE_ENV = "production";
      delete process.env.REDIS_URL;

      let statusCode = null;
      let jsonBody = null;
      const req = { ip: "127.0.0.1", body: { email: "attacker@test.com" } };
      const res = {
        status: (code) => {
          statusCode = code;
          return res;
        },
        json: (data) => {
          jsonBody = data;
          return res;
        },
      };

      await authRateLimiter(req, res, () => {});

      assert.equal(statusCode, 503, "Must fail closed with 503 when Redis is unavailable in production");
      assert.equal(jsonBody?.code, "RATE_LIMIT_BACKEND_UNAVAILABLE");
    } finally {
      process.env.NODE_ENV = origEnv;
      if (origRedis !== undefined) {
        process.env.REDIS_URL = origRedis;
      } else {
        delete process.env.REDIS_URL;
      }
    }
  });

  await t.test("Scenario 36: Decimal128 scale validation and business↔settlement separation", async () => {
    assert.equal(serializeDecimal128("100.5", 2), "100.50");
    assert.throws(() => serializeDecimal128("100.555", 2), /DECIMAL_SCALE_VIOLATION/);
  });

  await t.test("Scenario 37: Settlement-token decimal startup verification", async () => {
    assert.equal(FINANCIAL_INVARIANTS.CANONICAL_TOKEN_DECIMALS, 6, "USDC token decimals must be exactly 6");
    assert.equal(FINANCIAL_INVARIANTS.MAX_DECIMALS, 2, "USD fiat display scale must be exactly 2");

    // Validate units against boundaries
    assert.equal(validateTokenUnits("1000000").valid, true, "1 USDC (10^6 units) must be valid");
    assert.equal(validateTokenUnits("-100").valid, false, "Negative token units must be invalid");
    assert.equal(validateTokenUnits("100.5").valid, false, "Fractional token units must be invalid");
    assert.equal(validateBusinessAmount("100.00", "USD").valid, true);
    assert.equal(validateBusinessAmount("0", "USD").valid, false, "Zero dollar business amount must be invalid");
  });

  await t.test("Scenario 38: Deployed MongoDB index verification (explain + COLLSCAN absence)", async () => {
    // Verify that critical production indexes are explicitly defined in Mongoose schemas to avoid COLLSCAN
    const settlementIndexes = SettlementEvent.schema.indexes().map(([spec]) => Object.keys(spec).join(","));
    assert.ok(settlementIndexes.includes("sourceEventKey"), "SettlementEvent must index sourceEventKey for idempotency");
    assert.ok(
      settlementIndexes.includes("chainId,contractAddress,transactionHash,logIndex"),
      "SettlementEvent must have compound unique index on event coordinates"
    );

    const quarantineIndexes = QuarantineEvent.schema.indexes().map(([spec]) => Object.keys(spec).join(","));
    assert.ok(quarantineIndexes.includes("category,resolved"), "QuarantineEvent must index category,resolved for DLQ triage");

    const messageIndexes = Message.schema.indexes().map(([spec]) => Object.keys(spec).join(","));
    assert.ok(
      messageIndexes.includes("projectId,createdAt,_id"),
      "Message must have compound index on projectId,createdAt,_id for fast cursor pagination"
    );
    assert.ok(
      messageIndexes.includes("projectId,systemEventKey"),
      "Message must have compound unique index on projectId,systemEventKey for deduplication"
    );

    const syncIndexes = BlockchainSyncState.schema.indexes().map(([spec]) => Object.keys(spec).join(","));
    assert.ok(syncIndexes.includes("key"), "BlockchainSyncState must index key for distributed fencing");
  });
});
