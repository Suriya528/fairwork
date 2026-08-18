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

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ firstName, lastName, email, password: hashed, role });

    const token = jwt.sign({ id: user._id, role: user.role, sessionId: crypto.randomUUID() }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({ token, user: { id: user._id, firstName, lastName, email, role } });
  } catch (err) {
    // The pre-check above improves the common case; the unique index remains
    // the authoritative guard for concurrent registrations.
    if (err?.code === 11000) return res.status(409).json({ message: "Email already exists" });
    if (err?.name === "ValidationError") return res.status(400).json({ message: "Invalid registration details" });
    console.error("Registration failed:", err);
    res.status(500).json({ message: "Unable to create account" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    if (user.isSuspended && user.role !== "admin") {
      return res.status(403).json({
        message: `Account is suspended. ${user.suspendedReason ? "Reason: " + user.suspendedReason : "Contact support for assistance."}`
      });
    }

    const token = jwt.sign({ id: user._id, role: user.role, sessionId: crypto.randomUUID() }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({ token, user: { id: user._id, firstName: user.firstName, lastName: user.lastName, email, role: user.role } });
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
    // Consume the verified nonce atomically. A concurrent replay can find the
    // record before either request deletes it, so the deletion result itself
    // is the single-use authority rather than the earlier read.
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
