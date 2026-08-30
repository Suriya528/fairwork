const mongoose = require("mongoose");
const Activity = require("../models/Activity");

async function recordActivity({ userIds, eventKey, ...activity }) {
  if (mongoose.connection.readyState !== 1) {
    return; // Do not hang on buffer timeouts if disconnected
  }
  const recipients = [...new Set((userIds || []).filter(Boolean).map(String))];
  await Promise.all(recipients.map(async (userId) => {
    const recipientKey = eventKey ? `${eventKey}:${userId}` : undefined;
    try {
      await Activity.findOneAndUpdate(
        recipientKey ? { eventKey: recipientKey } : { _id: undefined },
        { $setOnInsert: { ...activity, userId, eventKey: recipientKey } },
        { upsert: true, returnDocument: "after" },
      );
    } catch (error) {
      if (error?.code !== 11000) throw error;
    }
  }));
}

function recordActivitySafely(activity) {
  return recordActivity(activity).catch((error) => console.error("Activity recording failed:", error.message));
}

module.exports = { recordActivity, recordActivitySafely };
