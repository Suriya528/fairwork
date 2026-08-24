const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// Set env vars for testing before loading controller
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-key-123456789";
process.env.GOOGLE_CLIENT_ID = "mock-google-client-id.apps.googleusercontent.com";
process.env.GOOGLE_CLIENT_SECRET = "mock-google-client-secret-123";
process.env.GITHUB_CLIENT_ID = "mock-github-client-id";
process.env.GITHUB_CLIENT_SECRET = "mock-github-client-secret-123";
process.env.CLIENT_URL = "http://localhost:5173";
process.env.BACKEND_URL = "http://localhost:5000";

const oauthController = require("../src/controllers/oauthController");
const User = require("../src/models/User");
const OAuthCode = require("../src/models/OAuthCode");
const activityService = require("../src/services/activityService");
activityService.recordActivitySafely = () => {};
const axios = require("axios");

// Helper mock req/res builder
function createMockReqRes(options = {}) {
  const req = {
    query: options.query || {},
    headers: options.headers || {},
    body: options.body || {},
    cookies: options.cookies || {},
  };

  const res = {
    statusCode: 200,
    headers: {},
    cookiesSet: [],
    cookiesCleared: [],
    redirectUrl: null,
    jsonPayload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.jsonPayload = payload;
      return this;
    },
    redirect(url) {
      this.redirectUrl = url;
      return this;
    },
    cookie(name, val, opts) {
      this.cookiesSet.push({ name, val, opts });
      return this;
    },
    clearCookie(name) {
      this.cookiesCleared.push(name);
      return this;
    },
  };

  return { req, res };
}

test("OAuth Suite: initiateGoogleAuth generates PKCE challenge and signed state cookie", async () => {
  const { req, res } = createMockReqRes({ query: { role: "freelancer" } });
  await oauthController.initiateGoogleAuth(req, res);

  assert.equal(res.cookiesSet.length, 1);
  assert.equal(res.cookiesSet[0].name, "oauth_state_google");
  const cookieData = JSON.parse(res.cookiesSet[0].val);
  assert.ok(cookieData.nonce);
  assert.ok(cookieData.codeVerifier);

  assert.ok(res.redirectUrl.startsWith("https://accounts.google.com/o/oauth2/v2/auth"));
  assert.ok(res.redirectUrl.includes("code_challenge="));
  assert.ok(res.redirectUrl.includes("code_challenge_method=S256"));

  // Verify state query param contains signed JWT with matching nonce
  const urlObj = new URL(res.redirectUrl);
  const stateToken = urlObj.searchParams.get("state");
  const decoded = jwt.verify(stateToken, process.env.JWT_SECRET);
  assert.equal(decoded.nonce, cookieData.nonce);
  assert.equal(decoded.role, "freelancer");
});

test("OAuth Suite: initiateGithubAuth constructs authorization URL with state token", async () => {
  const { req, res } = createMockReqRes({ query: { role: "client" } });
  await oauthController.initiateGithubAuth(req, res);

  assert.equal(res.cookiesSet.length, 1);
  assert.equal(res.cookiesSet[0].name, "oauth_state_github");
  const cookieData = JSON.parse(res.cookiesSet[0].val);
  assert.ok(cookieData.nonce);

  assert.ok(res.redirectUrl.startsWith("https://github.com/login/oauth/authorize"));
  assert.ok(res.redirectUrl.includes("scope=user%3Aemail") || res.redirectUrl.includes("scope=user:email"));

  const urlObj = new URL(res.redirectUrl);
  const stateToken = urlObj.searchParams.get("state");
  const decoded = jwt.verify(stateToken, process.env.JWT_SECRET);
  assert.equal(decoded.nonce, cookieData.nonce);
  assert.equal(decoded.role, "client");
});

test("OAuth Suite: handleGoogleCallback rejects invalid/tampered state token", async () => {
  const { req, res } = createMockReqRes({
    query: { code: "some_code", state: "invalid.tampered.jwt" },
    headers: { cookie: 'oauth_state_google={"nonce":"123","codeVerifier":"456"}' },
  });

  await oauthController.handleGoogleCallback(req, res);

  assert.ok(res.redirectUrl.includes("/auth/callback?error=INVALID_OAUTH_STATE"));
});

test("OAuth Suite: handleGoogleCallback rejects state nonce mismatch", async () => {
  const stateToken = jwt.sign({ nonce: "actual_nonce" }, process.env.JWT_SECRET);
  const cookieVal = encodeURIComponent(JSON.stringify({ nonce: "different_nonce", codeVerifier: "abc" }));

  const { req, res } = createMockReqRes({
    query: { code: "some_code", state: stateToken },
    headers: { cookie: `oauth_state_google=${cookieVal}` },
  });

  await oauthController.handleGoogleCallback(req, res);

  assert.ok(res.redirectUrl.includes("/auth/callback?error=OAUTH_STATE_MISMATCH"));
});

test("OAuth Suite: handleGoogleCallback rejects denied authorization from provider", async () => {
  const { req, res } = createMockReqRes({
    query: { error: "access_denied" },
  });

  await oauthController.handleGoogleCallback(req, res);

  assert.ok(res.redirectUrl.includes("/auth/callback?error=OAUTH_DENIED"));
});

test("OAuth Suite: handleGoogleCallback handles successful OAuth exchange & existing user linking", async () => {
  const nonce = crypto.randomBytes(32).toString("hex");
  const codeVerifier = crypto.randomBytes(32).toString("hex");
  const stateToken = jwt.sign({ nonce, role: "freelancer" }, process.env.JWT_SECRET);
  const cookieVal = encodeURIComponent(JSON.stringify({ nonce, codeVerifier }));

  const originalPost = axios.post;
  const originalGet = axios.get;
  const originalFindOne = User.findOne;
  const originalCreateCode = OAuthCode.create;

  try {
    axios.post = async () => ({ data: { access_token: "mock_google_access_token" } });
    axios.get = async () => ({
      data: {
        sub: "google-uid-999",
        email: "existing_user@example.com",
        email_verified: true,
        name: "Google User",
      },
    });

    let savedGoogleId = null;
    let isSavedVerified = false;
    User.findOne = async () => ({
      _id: "user_obj_id_123",
      email: "existing_user@example.com",
      authProvider: "local",
      role: "freelancer",
      isSuspended: false,
      save: async function () {
        savedGoogleId = this.googleId;
        isSavedVerified = this.isEmailVerified;
      },
    });

    let createdExchangeCode = null;
    OAuthCode.create = async (doc) => {
      createdExchangeCode = doc.code;
      return doc;
    };

    const { req, res } = createMockReqRes({
      query: { code: "google_auth_code_123", state: stateToken },
      headers: { cookie: `oauth_state_google=${cookieVal}` },
    });

    await oauthController.handleGoogleCallback(req, res);

    assert.equal(savedGoogleId, "google-uid-999");
    assert.equal(isSavedVerified, true);
    assert.ok(createdExchangeCode);
    assert.equal(res.redirectUrl, `http://localhost:5173/auth/callback?code=${createdExchangeCode}`);
  } finally {
    axios.post = originalPost;
    axios.get = originalGet;
    User.findOne = originalFindOne;
    OAuthCode.create = originalCreateCode;
  }
});

test("OAuth Suite: handleGithubCallback processes primary verified email & account linking", async () => {
  const nonce = crypto.randomBytes(32).toString("hex");
  const codeVerifier = crypto.randomBytes(32).toString("hex");
  const stateToken = jwt.sign({ nonce, role: "client" }, process.env.JWT_SECRET);
  const cookieVal = encodeURIComponent(JSON.stringify({ nonce, codeVerifier }));

  const originalPost = axios.post;
  const originalGet = axios.get;
  const originalFindOne = User.findOne;
  const originalCreateCode = OAuthCode.create;

  try {
    axios.post = async () => ({ data: { access_token: "mock_github_access_token" } });
    axios.get = async (url) => {
      if (url.includes("/user/emails")) {
        return {
          data: [
            { email: "unverified@example.com", primary: false, verified: false },
            { email: "gh_verified@example.com", primary: true, verified: true },
          ],
        };
      }
      return { data: { id: 88888, login: "ghdev", name: "GitHub Dev", avatar_url: "https://github.com/avatar.png" } };
    };

    let savedGithubId = null;
    User.findOne = async () => ({
      _id: "user_obj_id_456",
      email: "gh_verified@example.com",
      authProvider: "local",
      role: "client",
      isSuspended: false,
      save: async function () {
        savedGithubId = this.githubId;
      },
    });

    let createdExchangeCode = null;
    OAuthCode.create = async (doc) => {
      createdExchangeCode = doc.code;
      return doc;
    };

    const { req, res } = createMockReqRes({
      query: { code: "github_auth_code_789", state: stateToken },
      headers: { cookie: `oauth_state_github=${cookieVal}` },
    });

    await oauthController.handleGithubCallback(req, res);

    assert.equal(savedGithubId, "88888");
    assert.ok(createdExchangeCode);
    assert.equal(res.redirectUrl, `http://localhost:5173/auth/callback?code=${createdExchangeCode}`);
  } finally {
    axios.post = originalPost;
    axios.get = originalGet;
    User.findOne = originalFindOne;
    OAuthCode.create = originalCreateCode;
  }
});

test("OAuth Suite: exchangeOAuthCode redeems code, enforces single-use, issues JWT", async () => {
  const originalFindOneAndDelete = OAuthCode.findOneAndDelete;
  const originalFindById = User.findById;

  try {
    const redeemedCodes = new Set();

    OAuthCode.findOneAndDelete = async ({ code }) => {
      if (code === "valid_one_time_code" && !redeemedCodes.has(code)) {
        redeemedCodes.add(code);
        return {
          code: "valid_one_time_code",
          userId: "64b0f9e1e4b0a1a2b3c4d5e6",
          expiresAt: new Date(Date.now() + 60000),
        };
      }
      return null;
    };

    User.findById = async (id) => {
      if (id === "64b0f9e1e4b0a1a2b3c4d5e6") {
        return {
          _id: "64b0f9e1e4b0a1a2b3c4d5e6",
          firstName: "Jane",
          lastName: "Doe",
          email: "jane@example.com",
          role: "freelancer",
          authProvider: "google",
          avatarUrl: "https://example.com/avatar.png",
          walletAddress: "",
          isSuspended: false,
        };
      }
      return null;
    };

    const { req, res } = createMockReqRes({ body: { code: "valid_one_time_code" } });
    await oauthController.exchangeOAuthCode(req, res);

    assert.equal(res.statusCode, 200);
    assert.ok(res.jsonPayload.token);
    assert.equal(res.jsonPayload.user.email, "jane@example.com");

    // Verify issued token signature and payload
    const decoded = jwt.verify(res.jsonPayload.token, process.env.JWT_SECRET);
    assert.equal(decoded.id, "64b0f9e1e4b0a1a2b3c4d5e6");
    assert.equal(decoded.role, "freelancer");

    // Second redemption should fail (single-use enforcement)
    const { req: req2, res: res2 } = createMockReqRes({ body: { code: "valid_one_time_code" } });
    await oauthController.exchangeOAuthCode(req2, res2);

    assert.equal(res2.statusCode, 400);
    assert.equal(res2.jsonPayload.message, "Invalid or expired authorization code");
  } finally {
    OAuthCode.findOneAndDelete = originalFindOneAndDelete;
    User.findById = originalFindById;
  }
});

test("OAuth Suite: exchangeOAuthCode returns signed roleSelectionToken for pending OAuth users", async () => {
  const originalFindOneAndDelete = OAuthCode.findOneAndDelete;

  try {
    OAuthCode.findOneAndDelete = async () => ({
      code: "pending_role_code",
      pendingOAuth: {
        googleId: "g-123",
        email: "new_user@example.com",
        firstName: "New",
        lastName: "User",
        authProvider: "google",
      },
      expiresAt: new Date(Date.now() + 300000),
    });

    const { req, res } = createMockReqRes({ body: { code: "pending_role_code" } });
    await oauthController.exchangeOAuthCode(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.jsonPayload.pendingRoleSelection, true);
    assert.ok(res.jsonPayload.roleSelectionToken);

    // Verify token contains profile and purpose claim
    const decoded = jwt.verify(res.jsonPayload.roleSelectionToken, process.env.JWT_SECRET);
    assert.equal(decoded.purpose, "oauth_role_selection");
    assert.equal(decoded.profile.email, "new_user@example.com");
  } finally {
    OAuthCode.findOneAndDelete = originalFindOneAndDelete;
  }
});

test("OAuth Suite: completeOAuthRoleSelection validates roleSelectionToken and prevents forged profiles", async () => {
  const originalFindOne = User.findOne;
  const originalCreate = User.create;

  try {
    // 1. Invalid / tampered token should fail
    const { req: reqFail, res: resFail } = createMockReqRes({
      body: { roleSelectionToken: "invalid.forged.jwt", role: "client" },
    });
    await oauthController.completeOAuthRoleSelection(reqFail, resFail);
    assert.equal(resFail.statusCode, 400);

    // 2. Valid token signed by server succeeds
    const validToken = jwt.sign(
      {
        profile: {
          googleId: "g-555",
          email: "verified_oauth_signup@example.com",
          firstName: "Valid",
          lastName: "Signup",
          authProvider: "google",
        },
        purpose: "oauth_role_selection",
      },
      process.env.JWT_SECRET,
      { expiresIn: "5m" }
    );

    User.findOne = async () => null; // New user signup
    User.create = async (doc) => ({
      ...doc,
      _id: "64b0f9e1e4b0a1a2b3c4d5e7",
    });

    const { req: reqPass, res: resPass } = createMockReqRes({
      body: { roleSelectionToken: validToken, role: "client" },
    });
    await oauthController.completeOAuthRoleSelection(reqPass, resPass);

    assert.equal(resPass.statusCode, 200);
    assert.ok(resPass.jsonPayload.token);
    assert.equal(resPass.jsonPayload.user.email, "verified_oauth_signup@example.com");
    assert.equal(resPass.jsonPayload.user.role, "client");
  } finally {
    User.findOne = originalFindOne;
    User.create = originalCreate;
  }
});
