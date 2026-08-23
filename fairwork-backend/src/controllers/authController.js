const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const WalletNonce = require("../models/WalletNonce");
const { DOMAIN, TYPES, PURPOSE, verifyWalletSignature } = require("../utils/walletVerification");
const { recordActivitySafely } = require("../services/activityService");

exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body ?? {};
    if (
      ![firstName, lastName, email, password].every((value) => typeof value === "string" && value.trim()) ||
      !["client", "freelancer"].includes(role)
    ) {
      return res.status(400).json({ message: "Invalid registration details" });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) return res.status(409).json({ message: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await User.create({
      firstName,
      lastName,
      email: cleanEmail,
      password: hashed,
      role,
      authProvider: "local",
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    });

    const token = jwt.sign({ id: user._id, role: user.role, sessionId: crypto.randomUUID() }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({ token, user: { id: user._id, firstName, lastName, email: cleanEmail, role } });
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ message: "Email already exists" });
    if (err?.name === "ValidationError") return res.status(400).json({ message: "Invalid registration details" });
    console.error("Registration failed:", err);
    res.status(500).json({ message: "Unable to create account" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

    const cleanEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    if (user.authProvider === "local" && !user.password) {
      return res.status(400).json({ message: "Please log in using your Google or GitHub account." });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    if (user.isSuspended && user.role !== "admin") {
      return res.status(403).json({
        message: `Account is suspended. ${user.suspendedReason ? "Reason: " + user.suspendedReason : "Contact support for assistance."}`,
        code: "ACCOUNT_SUSPENDED",
        isSuspended: true,
        suspendedAt: user.suspendedAt,
        suspendedReason: user.suspendedReason || "",
      });
    }

    const token = jwt.sign({ id: user._id, role: user.role, sessionId: crypto.randomUUID() }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({ token, user: { id: user._id, firstName: user.firstName, lastName: user.lastName, email: cleanEmail, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== "string") {
      return res.status(400).json({ message: "Verification token is required" });
    }

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired verification token" });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({ message: "Email verified successfully", isEmailVerified: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ message: "Email address is required" });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.json({ message: "If account exists, verification email has been sent." });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.emailVerificationToken = token;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    res.json({ message: "Verification email resent successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateWallet = async (req, res) => {
  res.status(410).json({ message: "Use EIP-712 wallet verification instead." });
};

exports.walletNonce = async (req, res) => {
  const nonce = crypto.randomBytes(32).toString("hex");
  await WalletNonce.deleteMany({ userId: req.user.id, sessionId: req.user.sessionId });
  await WalletNonce.create({ userId: req.user.id, sessionId: req.user.sessionId, nonce, expiresAt: new Date(Date.now() + 5 * 60 * 1000) });
  res.json({ nonce, domain: DOMAIN, types: TYPES, primaryType: "WalletVerification", purpose: PURPOSE, expiresInSeconds: 300 });
};

exports.verifyWallet = async (req, res) => {
  try {
    const { walletAddress, nonce, signature } = req.body;
    if (typeof walletAddress !== "string" || typeof nonce !== "string" || typeof signature !== "string") return res.status(400).json({ message: "walletAddress, nonce, and signature are required" });
    const record = await WalletNonce.findOne({ userId: req.user.id, sessionId: req.user.sessionId, nonce });
    if (!record || record.expiresAt <= new Date()) return res.status(400).json({ message: "Wallet verification nonce is expired or invalid" });
    const claimed = walletAddress.toLowerCase();
    const recovered = await verifyWalletSignature(claimed, nonce, signature);
    if (recovered !== claimed) return res.status(400).json({ message: "Invalid wallet signature" });
    const consumed = await WalletNonce.findOneAndDelete({ _id: record._id, userId: req.user.id, sessionId: req.user.sessionId, nonce });
    if (!consumed) return res.status(400).json({ message: "Wallet verification nonce is expired or invalid" });
    const user = await User.findByIdAndUpdate(req.user.id, { walletAddress: claimed }, { new: true, runValidators: true }).select("-password");
    recordActivitySafely({ userIds: [user._id], eventKey: `wallet-verified:${user._id}:${claimed}`, actorId: user._id, type: "wallet_verified", title: "Wallet verified", message: "Your wallet ownership was verified." });
    res.json(user);
  } catch (err) {
    if (err && err.code === 11000) return res.status(409).json({ message: "This wallet address is already associated with another account" });
    res.status(400).json({ message: "Invalid wallet signature" });
  }
};
