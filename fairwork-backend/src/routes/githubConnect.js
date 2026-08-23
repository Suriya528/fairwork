const express = require("express");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const router = express.Router();

const User = require("../models/User");
const GithubOAuthCredential = require("../models/GithubOAuthCredential");
const GithubActivityCache = require("../models/GithubActivityCache");
const { authenticateToken } = require("../middleware/auth");
const {
  encryptToken,
  decryptToken,
  fetchGithubViewerData,
  refreshGithubActivity,
  getUserGithubActivity,
} = require("../services/githubService");

const getClientUrl = () => (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");

function parseCookies(cookieHeader) {
  const list = {};
  if (!cookieHeader) return list;
  cookieHeader.split(";").forEach((cookie) => {
    const parts = cookie.split("=");
    list[parts.shift().trim()] = decodeURIComponent(parts.join("="));
  });
  return list;
}

// -----------------------------------------------------------------------------
// 1. Initiate GitHub Connection (Authenticated User)
// -----------------------------------------------------------------------------
router.get("/github/connect", authenticateToken, async (req, res) => {
  try {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
      return res.redirect(`${getClientUrl()}/settings?tab=integrations&error=OAUTH_CONFIG_MISSING`);
    }

    const stateNonce = crypto.randomBytes(32).toString("hex");
    const codeVerifier = crypto.randomBytes(32).toString("hex");
    const codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest("base64url");

    const stateToken = jwt.sign(
      { userId: req.user.id, nonce: stateNonce, purpose: "github_bind" },
      process.env.JWT_SECRET,
      { expiresIn: "5m" }
    );

    res.cookie("github_bind_state", JSON.stringify({ nonce: stateNonce, codeVerifier }), {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 300000, // 5 mins
    });

    const redirectUri = `${process.env.BACKEND_URL || "http://localhost:5000"}/api/users/github/connect/callback`;
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(
      clientId
    )}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=read%3Auser&state=${encodeURIComponent(
      stateToken
    )}&code_challenge=${encodeURIComponent(codeChallenge)}&code_challenge_method=S256`;

    res.redirect(githubAuthUrl);
  } catch (err) {
    console.error("GitHub connect init error:", err);
    res.redirect(`${getClientUrl()}/settings?tab=integrations&error=OAUTH_INIT_FAILED`);
  }
});

// -----------------------------------------------------------------------------
// 2. Callback for GitHub Connection (OAuth Exchange & Link)
// -----------------------------------------------------------------------------
router.get("/github/connect/callback", async (req, res) => {
  const clientUrl = getClientUrl();
  try {
    const { code, state, error: providerError } = req.query;
    if (providerError || !code || !state) {
      return res.redirect(`${clientUrl}/settings?tab=integrations&error=OAUTH_DENIED`);
    }

    const cookies = parseCookies(req.headers.cookie);
    let cookieData = {};
    try {
      cookieData = JSON.parse(cookies.github_bind_state || "{}");
    } catch {}

    let stateData;
    try {
      stateData = jwt.verify(state, process.env.JWT_SECRET);
    } catch {
      return res.redirect(`${clientUrl}/settings?tab=integrations&error=INVALID_OAUTH_STATE`);
    }

    if (
      stateData.purpose !== "github_bind" ||
      !cookieData.nonce ||
      cookieData.nonce !== stateData.nonce ||
      !cookieData.codeVerifier
    ) {
      return res.redirect(`${clientUrl}/settings?tab=integrations&error=OAUTH_STATE_MISMATCH`);
    }

    res.clearCookie("github_bind_state");

    const redirectUri = `${process.env.BACKEND_URL || "http://localhost:5000"}/api/users/github/connect/callback`;
    const tokenRes = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
        code_verifier: cookieData.codeVerifier,
      },
      { headers: { Accept: "application/json" } }
    );

    const accessToken = tokenRes.data?.access_token;
    if (!accessToken) {
      return res.redirect(`${clientUrl}/settings?tab=integrations&error=TOKEN_EXCHANGE_FAILED`);
    }

    // Fetch GitHub identity using GraphQL `viewer` query
    const viewer = await fetchGithubViewerData(accessToken);
    const githubUserId = String(viewer.id);

    // Verify user exists in FairWork
    const user = await User.findById(stateData.userId);
    if (!user) {
      return res.redirect(`${clientUrl}/settings?tab=integrations&error=USER_NOT_FOUND`);
    }

    // Encrypt token using AES-256-GCM + HKDF
    const encryptedAccessToken = encryptToken(accessToken);

    // Save encrypted credentials
    await GithubOAuthCredential.findOneAndUpdate(
      { githubUserId },
      {
        userId: user._id,
        githubUserId,
        encryptedAccessToken,
        scopes: ["read:user"],
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // Update User githubIdentity
    user.githubIdentity = {
      githubUserId,
      username: viewer.login,
      avatarUrl: viewer.avatarUrl || "",
      profileUrl: viewer.url || `https://github.com/${viewer.login}`,
      connectedAt: new Date(),
      visibility: user.githubIdentity?.visibility || "PUBLIC",
    };
    if (!user.githubUrl && viewer.url) user.githubUrl = viewer.url;
    await user.save();

    // Trigger async background activity fetch
    refreshGithubActivity(githubUserId, accessToken).catch((e) =>
      console.error("Initial GitHub activity fetch background error:", e.message)
    );

    return res.redirect(`${clientUrl}/settings?tab=integrations&github=connected`);
  } catch (err) {
    console.error("GitHub connect callback error:", err?.response?.data || err.message);
    return res.redirect(`${clientUrl}/settings?tab=integrations&error=OAUTH_PROVIDER_ERROR`);
  }
});

// -----------------------------------------------------------------------------
// 3. Disconnect GitHub Profile (Authenticated User)
// -----------------------------------------------------------------------------
router.delete("/github/disconnect", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const githubUserId = user.githubIdentity?.githubUserId;

    user.githubIdentity = undefined;
    await user.save();

    if (githubUserId) {
      await GithubOAuthCredential.deleteOne({ githubUserId });
      await GithubActivityCache.deleteOne({ githubUserId });
    }

    res.json({ message: "GitHub profile disconnected successfully" });
  } catch (err) {
    console.error("Disconnect GitHub error:", err);
    res.status(500).json({ message: "Failed to disconnect GitHub profile" });
  }
});

// -----------------------------------------------------------------------------
// 4. Update GitHub Profile Visibility (Public / Private)
// -----------------------------------------------------------------------------
router.patch("/github/visibility", authenticateToken, async (req, res) => {
  try {
    const { visibility } = req.body;
    if (!["PUBLIC", "PRIVATE"].includes(visibility)) {
      return res.status(400).json({ message: "Visibility must be PUBLIC or PRIVATE" });
    }

    const user = await User.findById(req.user.id);
    if (!user || !user.githubIdentity?.githubUserId) {
      return res.status(400).json({ message: "No connected GitHub profile found" });
    }

    user.githubIdentity.visibility = visibility;
    await user.save();

    res.json({ message: "Visibility updated successfully", githubIdentity: user.githubIdentity });
  } catch (err) {
    console.error("Update GitHub visibility error:", err);
    res.status(500).json({ message: "Failed to update GitHub profile visibility" });
  }
});

// -----------------------------------------------------------------------------
// 5. Get User's GitHub Activity (Public / Authenticated with Privacy Check)
// -----------------------------------------------------------------------------
router.get("/:id/github-activity", async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser || !targetUser.githubIdentity?.githubUserId) {
      return res.status(404).json({ message: "GitHub profile not connected" });
    }

    // Privacy check: If set to PRIVATE, only the profile owner can view
    const isOwner = req.user?.id === targetUser._id.toString();
    if (targetUser.githubIdentity.visibility === "PRIVATE" && !isOwner) {
      return res.status(403).json({ message: "GitHub profile activity is private" });
    }

    const activity = await getUserGithubActivity(targetUser.githubIdentity.githubUserId);

    res.json({
      identity: targetUser.githubIdentity,
      activity: activity || {
        contributionCalendar: { weeks: [] },
        topLanguages: [],
        topRepositories: [],
        longestStreak: 0,
        currentStreak: 0,
        totalContributionsYear: 0,
      },
    });
  } catch (err) {
    console.error("Get GitHub activity error:", err);
    res.status(500).json({ message: "Failed to retrieve GitHub activity data" });
  }
});

module.exports = router;
