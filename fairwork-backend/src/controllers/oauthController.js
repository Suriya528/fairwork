const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const User = require("../models/User");
const OAuthCode = require("../models/OAuthCode");
const { recordActivitySafely } = require("../services/activityService");

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

function parseName(fullName, fallback = "User") {
  if (!fullName || typeof fullName !== "string") {
    return { firstName: fallback, lastName: "" };
  }
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

// -----------------------------------------------------------------------------
// GOOGLE OAUTH FLOW
// -----------------------------------------------------------------------------
exports.initiateGoogleAuth = async (req, res) => {
  try {
    const { role, action } = req.query;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return res.redirect(`${getClientUrl()}/login?error=OAUTH_CONFIG_MISSING`);
    }

    const stateNonce = crypto.randomBytes(32).toString("hex");
    const codeVerifier = crypto.randomBytes(32).toString("hex");
    const codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest("base64url");

    const stateToken = jwt.sign(
      { role: ["client", "freelancer"].includes(role) ? role : null, action, nonce: stateNonce },
      process.env.JWT_SECRET,
      { expiresIn: "5m" }
    );

    res.cookie("oauth_state", JSON.stringify({ nonce: stateNonce, codeVerifier }), {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 300000, // 5 mins
    });

    const redirectUri = `${process.env.BACKEND_URL || "http://localhost:5000"}/api/auth/google/callback`;
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      clientId
    )}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=openid%20email%20profile&state=${encodeURIComponent(
      stateToken
    )}&code_challenge=${encodeURIComponent(codeChallenge)}&code_challenge_method=S256`;

    res.redirect(googleAuthUrl);
  } catch (err) {
    console.error("Google auth init error:", err);
    res.redirect(`${getClientUrl()}/login?error=OAUTH_INIT_FAILED`);
  }
};

exports.handleGoogleCallback = async (req, res) => {
  const clientUrl = getClientUrl();
  try {
    const { code, state, error: providerError } = req.query;
    if (providerError || !code || !state) {
      return res.redirect(`${clientUrl}/login?error=OAUTH_DENIED`);
    }

    const cookies = parseCookies(req.headers.cookie);
    let cookieData = {};
    try {
      cookieData = JSON.parse(cookies.oauth_state || "{}");
    } catch {}

    let stateData;
    try {
      stateData = jwt.verify(state, process.env.JWT_SECRET);
    } catch {
      return res.redirect(`${clientUrl}/login?error=INVALID_OAUTH_STATE`);
    }

    if (!cookieData.nonce || cookieData.nonce !== stateData.nonce || !cookieData.codeVerifier) {
      return res.redirect(`${clientUrl}/login?error=OAUTH_STATE_MISMATCH`);
    }

    res.clearCookie("oauth_state");

    const redirectUri = `${process.env.BACKEND_URL || "http://localhost:5000"}/api/auth/google/callback`;
    const tokenRes = await axios.post("https://oauth2.googleapis.com/token", {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code_verifier: cookieData.codeVerifier,
    });

    const accessToken = tokenRes.data?.access_token;
    if (!accessToken) {
      return res.redirect(`${clientUrl}/login?error=TOKEN_EXCHANGE_FAILED`);
    }

    const userinfoRes = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const profile = userinfoRes.data;
    if (!profile || !profile.email || !profile.email_verified) {
      return res.redirect(`${clientUrl}/login?error=EMAIL_NOT_VERIFIED`);
    }

    const email = profile.email.toLowerCase().trim();
    let user = await User.findOne({ $or: [{ googleId: profile.sub }, { email }] });

    if (user) {
      if (!user.googleId) {
        user.googleId = profile.sub;
        if (!user.isEmailVerified) user.isEmailVerified = true;
        await user.save();
      }

      if (user.isSuspended && user.role !== "admin") {
        return res.redirect(`${clientUrl}/login?error=ACCOUNT_SUSPENDED`);
      }

      const exchangeCode = crypto.randomBytes(32).toString("hex");
      await OAuthCode.create({
        code: exchangeCode,
        userId: user._id,
        nonce: stateData.nonce,
        expiresAt: new Date(Date.now() + 60000),
      });

      return res.redirect(`${clientUrl}/auth/callback?code=${exchangeCode}`);
    }

    // New User Signup
    const { firstName, lastName } = parseName(profile.name || `${profile.given_name || ""} ${profile.family_name || ""}`.trim(), "User");
    const chosenRole = stateData.role;

    if (!chosenRole) {
      // Pending Role Selection Flow
      const exchangeCode = crypto.randomBytes(32).toString("hex");
      await OAuthCode.create({
        code: exchangeCode,
        nonce: stateData.nonce,
        pendingOAuth: {
          googleId: profile.sub,
          email,
          firstName,
          lastName,
          avatarUrl: profile.picture || "",
          authProvider: "google",
        },
        expiresAt: new Date(Date.now() + 300000), // 5 min window to choose role
      });

      return res.redirect(`${clientUrl}/auth/callback?code=${exchangeCode}`);
    }

    // Create User with Role
    user = await User.create({
      firstName,
      lastName,
      email,
      role: chosenRole,
      authProvider: "google",
      googleId: profile.sub,
      avatarUrl: profile.picture || "",
    });

    recordActivitySafely({
      userIds: [user._id],
      eventKey: `user-registered-google:${user._id}`,
      actorId: user._id,
      type: "account_created",
      title: "Account Created",
      message: "Registered via Google OAuth.",
    });

    const exchangeCode = crypto.randomBytes(32).toString("hex");
    await OAuthCode.create({
      code: exchangeCode,
      userId: user._id,
      nonce: stateData.nonce,
      expiresAt: new Date(Date.now() + 60000),
    });

    return res.redirect(`${clientUrl}/auth/callback?code=${exchangeCode}`);
  } catch (err) {
    console.error("Google OAuth callback error:", err?.response?.data || err.message);
    return res.redirect(`${clientUrl}/login?error=OAUTH_PROVIDER_ERROR`);
  }
};

// -----------------------------------------------------------------------------
// GITHUB OAUTH FLOW
// -----------------------------------------------------------------------------
exports.initiateGithubAuth = async (req, res) => {
  try {
    const { role, action } = req.query;
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
      return res.redirect(`${getClientUrl()}/login?error=OAUTH_CONFIG_MISSING`);
    }

    const stateNonce = crypto.randomBytes(32).toString("hex");
    const stateToken = jwt.sign(
      { role: ["client", "freelancer"].includes(role) ? role : null, action, nonce: stateNonce },
      process.env.JWT_SECRET,
      { expiresIn: "5m" }
    );

    res.cookie("oauth_state", JSON.stringify({ nonce: stateNonce }), {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 300000,
    });

    const redirectUri = `${process.env.BACKEND_URL || "http://localhost:5000"}/api/auth/github/callback`;
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(
      clientId
    )}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email&state=${encodeURIComponent(stateToken)}`;

    res.redirect(githubAuthUrl);
  } catch (err) {
    console.error("GitHub auth init error:", err);
    res.redirect(`${getClientUrl()}/login?error=OAUTH_INIT_FAILED`);
  }
};

exports.handleGithubCallback = async (req, res) => {
  const clientUrl = getClientUrl();
  try {
    const { code, state, error: providerError } = req.query;
    if (providerError || !code || !state) {
      return res.redirect(`${clientUrl}/login?error=OAUTH_DENIED`);
    }

    const cookies = parseCookies(req.headers.cookie);
    let cookieData = {};
    try {
      cookieData = JSON.parse(cookies.oauth_state || "{}");
    } catch {}

    let stateData;
    try {
      stateData = jwt.verify(state, process.env.JWT_SECRET);
    } catch {
      return res.redirect(`${clientUrl}/login?error=INVALID_OAUTH_STATE`);
    }

    if (!cookieData.nonce || cookieData.nonce !== stateData.nonce) {
      return res.redirect(`${clientUrl}/login?error=OAUTH_STATE_MISMATCH`);
    }

    res.clearCookie("oauth_state");

    const redirectUri = `${process.env.BACKEND_URL || "http://localhost:5000"}/api/auth/github/callback`;
    const tokenRes = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
      },
      { headers: { Accept: "application/json" } }
    );

    const accessToken = tokenRes.data?.access_token;
    if (!accessToken) {
      return res.redirect(`${clientUrl}/login?error=TOKEN_EXCHANGE_FAILED`);
    }

    // Fetch user profile
    const userRes = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}`, "User-Agent": "FairWork-App" },
    });
    const ghUser = userRes.data;

    // Fetch user emails
    const emailsRes = await axios.get("https://api.github.com/user/emails", {
      headers: { Authorization: `Bearer ${accessToken}`, "User-Agent": "FairWork-App" },
    });
    const emails = Array.isArray(emailsRes.data) ? emailsRes.data : [];
    const primaryVerifiedEmailObj = emails.find((e) => e.primary && e.verified);

    if (!primaryVerifiedEmailObj || !primaryVerifiedEmailObj.email) {
      return res.redirect(`${clientUrl}/login?error=EMAIL_NOT_VERIFIED`);
    }

    const email = primaryVerifiedEmailObj.email.toLowerCase().trim();
    const githubId = String(ghUser.id);
    let user = await User.findOne({ $or: [{ githubId }, { email }] });

    if (user) {
      if (!user.githubId) {
        user.githubId = githubId;
        if (!user.githubUrl && ghUser.html_url) user.githubUrl = ghUser.html_url;
        if (!user.isEmailVerified) user.isEmailVerified = true;
        await user.save();
      }

      if (user.isSuspended && user.role !== "admin") {
        return res.redirect(`${clientUrl}/login?error=ACCOUNT_SUSPENDED`);
      }

      const exchangeCode = crypto.randomBytes(32).toString("hex");
      await OAuthCode.create({
        code: exchangeCode,
        userId: user._id,
        nonce: stateData.nonce,
        expiresAt: new Date(Date.now() + 60000),
      });

      return res.redirect(`${clientUrl}/auth/callback?code=${exchangeCode}`);
    }

    // New User Signup
    const { firstName, lastName } = parseName(ghUser.name || ghUser.login, "User");
    const chosenRole = stateData.role;

    if (!chosenRole) {
      // Pending Role Selection Flow
      const exchangeCode = crypto.randomBytes(32).toString("hex");
      await OAuthCode.create({
        code: exchangeCode,
        nonce: stateData.nonce,
        pendingOAuth: {
          githubId,
          email,
          firstName,
          lastName,
          avatarUrl: ghUser.avatar_url || "",
          githubUrl: ghUser.html_url || "",
          authProvider: "github",
        },
        expiresAt: new Date(Date.now() + 300000),
      });

      return res.redirect(`${clientUrl}/auth/callback?code=${exchangeCode}`);
    }

    // Create User with Role
    user = await User.create({
      firstName,
      lastName,
      email,
      role: chosenRole,
      authProvider: "github",
      githubId,
      avatarUrl: ghUser.avatar_url || "",
      githubUrl: ghUser.html_url || "",
    });

    recordActivitySafely({
      userIds: [user._id],
      eventKey: `user-registered-github:${user._id}`,
      actorId: user._id,
      type: "account_created",
      title: "Account Created",
      message: "Registered via GitHub OAuth.",
    });

    const exchangeCode = crypto.randomBytes(32).toString("hex");
    await OAuthCode.create({
      code: exchangeCode,
      userId: user._id,
      nonce: stateData.nonce,
      expiresAt: new Date(Date.now() + 60000),
    });

    return res.redirect(`${clientUrl}/auth/callback?code=${exchangeCode}`);
  } catch (err) {
    console.error("GitHub OAuth callback error:", err?.response?.data || err.message);
    return res.redirect(`${clientUrl}/login?error=OAUTH_PROVIDER_ERROR`);
  }
};

// -----------------------------------------------------------------------------
// OAUTH CODE REDEMPTION & ROLE SELECTION ENDPOINTS
// -----------------------------------------------------------------------------
exports.exchangeOAuthCode = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code || typeof code !== "string") {
      return res.status(400).json({ message: "Authorization code is required" });
    }

    const record = await OAuthCode.findOneAndDelete({ code });
    if (!record || record.expiresAt <= new Date()) {
      return res.status(400).json({ message: "Invalid or expired authorization code" });
    }

    if (record.pendingOAuth) {
      // Issue a signed, short-lived JWT containing the verified profile.
      // This prevents account takeover — the frontend cannot fabricate or
      // tamper with the profile payload sent to completeOAuthRoleSelection.
      const roleSelectionToken = jwt.sign(
        { profile: record.pendingOAuth, purpose: "oauth_role_selection" },
        process.env.JWT_SECRET,
        { expiresIn: "5m" }
      );

      return res.json({
        pendingRoleSelection: true,
        roleSelectionToken,
      });
    }

    if (!record.userId) {
      return res.status(400).json({ message: "Malformed authorization code document" });
    }

    const user = await User.findById(record.userId);
    if (!user) return res.status(404).json({ message: "User account not found" });

    if (user.isSuspended && user.role !== "admin") {
      return res.status(403).json({
        message: `Account is suspended. ${user.suspendedReason ? "Reason: " + user.suspendedReason : "Contact support."}`,
        code: "ACCOUNT_SUSPENDED",
      });
    }

    const token = jwt.sign({ id: user._id, role: user.role, sessionId: crypto.randomUUID() }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        walletAddress: user.walletAddress,
        authProvider: user.authProvider,
      },
    });
  } catch (err) {
    console.error("OAuth code exchange error:", err);
    res.status(500).json({ message: "Unable to complete OAuth exchange" });
  }
};

exports.completeOAuthRoleSelection = async (req, res) => {
  try {
    const { roleSelectionToken, role } = req.body;
    if (!roleSelectionToken || typeof roleSelectionToken !== "string" || !["client", "freelancer"].includes(role)) {
      return res.status(400).json({ message: "Valid role selection token and role ('client' or 'freelancer') are required" });
    }

    // Verify the signed token — this is the ONLY way to prove the profile
    // was issued by our server during a legitimate OAuth exchange.
    let payload;
    try {
      payload = jwt.verify(roleSelectionToken, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ message: "Role selection session has expired. Please sign in again." });
    }

    if (!payload || payload.purpose !== "oauth_role_selection" || !payload.profile) {
      return res.status(400).json({ message: "Invalid role selection token" });
    }

    const profile = payload.profile;
    const email = (profile.email || "").toLowerCase().trim();
    if (!email) return res.status(400).json({ message: "Profile email is required" });

    let user = await User.findOne({ email });
    if (user) {
      if (profile.googleId && !user.googleId) user.googleId = profile.googleId;
      if (profile.githubId && !user.githubId) user.githubId = profile.githubId;
      if (!user.isEmailVerified) user.isEmailVerified = true;
      await user.save();
    } else {
      user = await User.create({
        firstName: profile.firstName || "User",
        lastName: profile.lastName || "",
        email,
        role,
        authProvider: profile.authProvider,
        googleId: profile.googleId || undefined,
        githubId: profile.githubId || undefined,
        avatarUrl: profile.avatarUrl || "",
        githubUrl: profile.githubUrl || "",
      });

      recordActivitySafely({
        userIds: [user._id],
        eventKey: `user-registered-oauth-select-role:${user._id}`,
        actorId: user._id,
        type: "account_created",
        title: "Account Created",
        message: `Registered via OAuth as ${role}.`,
      });
    }

    const token = jwt.sign({ id: user._id, role: user.role, sessionId: crypto.randomUUID() }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        walletAddress: user.walletAddress,
        authProvider: user.authProvider,
      },
    });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }
    console.error("Complete OAuth role selection error:", err);
    res.status(500).json({ message: "Unable to complete registration" });
  }
};
