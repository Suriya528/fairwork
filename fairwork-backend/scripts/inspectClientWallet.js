const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const User = require("../src/models/User");
const Project = require("../src/models/Project");

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");

  const users = await User.find({ role: "client" });
  console.log("\n=== REGISTERED CLIENT USERS ===");
  for (const u of users) {
    console.log(`User: ${u.name} (${u.email}) | ID: ${u._id} | Wallet: ${u.walletAddress || "NONE"}`);
  }

  const projects = await Project.find({}).populate("clientId", "name walletAddress");
  console.log("\n=== RECENT PROJECTS ===");
  for (const p of projects) {
    console.log(`Project: "${p.title}" | ID: ${p._id} | Client: ${p.clientId?.name} (${p.clientId?.walletAddress}) | Budget: $${p.budget} | Funded: ${p.escrowFunded}`);
  }

  await mongoose.disconnect();
}

main().catch(console.error);
