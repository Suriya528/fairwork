const Activity = require("../models/Activity");

async function recordActivity({ userIds, eventKey, ...activity }) {
  const recipients = [...new Set((userIds || []).filter(Boolean).map(String))];
  await Promise.all(recipients.map(async (userId) => {
    const recipientKey = eventKey ? `${eventKey}:${userId}` : undefined;
    try {
      await Activity.findOneAndUpdate(
        recipientKey ? { eventKey: recipientKey } : { _id: undefined },
        { $setOnInsert: { ...activity, userId, eventKey: recipientKey } },
        { upsert: true, new: true },
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
