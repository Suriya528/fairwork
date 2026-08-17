require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../src/models/User");

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) throw new Error("Usage: npm run promote-admin -- user@example.com");
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is not configured");
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne({ email });
  if (!user) throw new Error(`No existing user found for ${email}`);
  if (user.role === "admin") { console.log(`${email} is already an admin.`); return; }
  user.role = "admin";
  await user.save();
  console.log(`${email} was promoted to admin. They must sign in again to receive an admin JWT.`);
}

main().catch((err) => { console.error(err.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
