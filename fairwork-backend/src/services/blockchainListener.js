const fs = require("fs");
const path = require("path");
const { createPublicClient, http, decodeEventLog } = require("viem");
const { sepolia } = require("viem/chains");
const Project = require("../models/Project");
const Dispute = require("../models/Dispute");
const User = require("../models/User");
const SyncState = require("../models/BlockchainSyncState");
const { recordActivitySafely } = require("./activityService");
const CONFIRMATIONS = 2;
function artifact(name) { const base = process.env.BLOCKCHAIN_ARTIFACTS_DIR || path.resolve(__dirname, "../../../fairwork-blockchain/artifacts/contracts"); const file = path.join(base, `${name}.sol`, `${name}.json`); return JSON.parse(fs.readFileSync(file, "utf8")).abi; }
async function recordBlockchainActivity(projectId, log, type, title, message, extra = {}) {
  const project = await Project.findById(projectId).select("clientId freelancerId").lean();
  if (!project) return;
  const eventIdentity = log.transactionHash && log.logIndex !== undefined ? `${log.transactionHash}:${log.logIndex}` : `${log.blockHash}:${log.logIndex}`;
  recordActivitySafely({ userIds: [project.clientId, project.freelancerId], eventKey: `chain:${eventIdentity}`, type, title, message, projectId, ...extra });
}
async function startBlockchainListener() {
  try {
    const escrowAddress = process.env.ESCROW_CONTRACT_ADDRESS, disputeAddress = process.env.DISPUTE_CONTRACT_ADDRESS;
    if (!process.env.SEPOLIA_RPC_URL || !escrowAddress || !disputeAddress) return;
    const client = createPublicClient({ chain: sepolia, transport: http(process.env.SEPOLIA_RPC_URL) });
    let escrowAbi, disputeAbi;
    try {
      escrowAbi = artifact("EscrowContract");
      disputeAbi = artifact("DisputeContract");
    } catch {
      console.warn("Blockchain contract artifacts not found; listener paused.");
      return;
    }
  const processLog = async (log, abi, address) => { const event = decodeEventLog({ abi, data: log.data, topics: log.topics }); const a = event.args, projectId = a.projectId;
    if (event.eventName === "EscrowCreated") { await Project.findByIdAndUpdate(projectId, { escrowToken: a.token.toLowerCase() }); await recordBlockchainActivity(projectId, log, "escrow_created", "Escrow created", "Escrow was created on-chain."); }
    if (event.eventName === "EscrowFunded") { await Project.findByIdAndUpdate(projectId, { escrowFunded: true }); await recordBlockchainActivity(projectId, log, "escrow_funded", "Escrow funded", "Escrow funding was confirmed on-chain."); }
    if (event.eventName === "EscrowDisputed") { await Project.findByIdAndUpdate(projectId, { escrowDisputed: true }); await recordBlockchainActivity(projectId, log, "dispute_opened", "Escrow disputed", "A dispute was confirmed on-chain."); }
    if (event.eventName === "EscrowRefunded") { await Project.findByIdAndUpdate(projectId, { escrowCompleted: true }); await recordBlockchainActivity(projectId, log, "escrow_refunded", "Escrow refunded", "An escrow refund was confirmed on-chain."); }
    if (event.eventName === "MilestoneReleased") { const state = await client.readContract({ address: escrowAddress, abi: escrowAbi, functionName: "getEscrowParties", args: [projectId] }); await Project.updateOne({ _id: projectId }, { $set: { [`milestones.${Number(a.milestoneIndex)}.paymentReleased`]: true, escrowCompleted: state[4] } }); await recordBlockchainActivity(projectId, log, "milestone_released", "Milestone payment released", "A milestone payment was confirmed on-chain.", { milestoneIndex: Number(a.milestoneIndex) }); }
    if (event.eventName === "DisputeRaised") { const user = await User.findOne({ walletAddress: a.raisedBy.toLowerCase() }); if (user) await Dispute.findOneAndUpdate({ projectId }, { projectId, raisedBy: user._id, reason: a.reason, status: "pending" }, { upsert: true }); await recordBlockchainActivity(projectId, log, "dispute_opened", "Dispute raised", "A dispute was raised on-chain."); }
    if (event.eventName === "DisputeResolved") { const parties = await client.readContract({ address: escrowAddress, abi: escrowAbi, functionName: "getEscrowParties", args: [projectId] }); const winner = a.winner.toLowerCase() === parties[0].toLowerCase() ? "client" : "freelancer"; await Project.findByIdAndUpdate(projectId, { escrowCompleted: true, escrowDisputed: false }); const dispute = await Dispute.findOneAndUpdate({ projectId }, { status: "resolved", winner }, { new: true }); await recordBlockchainActivity(projectId, log, "dispute_resolved", "Dispute resolved", "A dispute resolution was confirmed on-chain.", { disputeId: dispute?._id }); }
  };
  let catchingUp = false;
  const catchUp = async () => { if (catchingUp) return; catchingUp = true; try { const head = await client.getBlockNumber(); const to = head > BigInt(CONFIRMATIONS) ? head - BigInt(CONFIRMATIONS) : 0n; const state = await SyncState.findOne({ key: "sepolia" }); const from = BigInt((state?.lastProcessedBlock ?? Number(process.env.BLOCKCHAIN_DEPLOYMENT_BLOCK || 0)) + 1); if (from > to) return; for (const [address, abi] of [[escrowAddress, escrowAbi], [disputeAddress, disputeAbi]]) for (const log of await client.getLogs({ address, fromBlock: from, toBlock: to })) await processLog(log, abi, address); await SyncState.findOneAndUpdate({ key: "sepolia" }, { lastProcessedBlock: Number(to) }, { upsert: true }); } finally { catchingUp = false; } };
  await catchUp();
  // viem's polling subscription is live processing; catch-up preserves the
  // same confirmation policy after reconnects and missed blocks.
  client.watchBlockNumber({ emitOnBegin: false, onBlockNumber: () => catchUp().catch(console.error) });
  } catch (err) {
    console.warn("Blockchain listener initialization error:", err.message);
  }
}
module.exports = { startBlockchainListener };
