require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../src/models/User"); // adjust path to your actual User model

async function makeAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const email = process.argv[2];

    if (!email) {
      throw new Error("Usage: node scripts/makeAdmin.js user@example.com");
    }

    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      { $set: { role: "admin" } },
      { new: true }
    ).select("firstName lastName email role");

    if (!user) {
      throw new Error(`User not found: ${email}`);
    }

    console.log("Admin role assigned successfully:");
    console.log(user);

    await mongoose.disconnect();
  } catch (error) {
    console.error("Failed:", error.message);
    process.exit(1);
  }
}

makeAdmin();