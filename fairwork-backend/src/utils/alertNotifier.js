const http = require("http");
const https = require("https");
const { logger } = require("./logger");

/**
 * Dispatches an asynchronous alert to an operator webhook (Slack, Discord, PagerDuty, Datadog).
 * Safe against network failures, non-blocking, and fail-safe.
 */
async function notifyOperatorAlert({ level = "ERROR", title, message, details = {}, err = null }) {
  const webhookUrl = process.env.ALERT_WEBHOOK_URL;
  if (!webhookUrl) {
    // Webhook not configured; alert recorded via structured logger only
    return false;
  }

  try {
    const url = new URL(webhookUrl);
    const client = url.protocol === "https:" ? https : http;

    const payload = JSON.stringify({
      environment: process.env.NODE_ENV || "development",
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      title: title || "FAIRWORK_ALERT",
      message: message || "No message provided",
      details,
      error: err ? { message: err.message, stack: err.stack } : undefined,
    });

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
      timeout: 3000,
    };

    return new Promise((resolve) => {
      const req = client.request(url, options, (res) => {
        res.resume(); // Consume stream to free memory
        resolve(res.statusCode >= 200 && res.statusCode < 300);
      });

      req.on("error", (e) => {
        logger.warn(`Alert webhook dispatch error: ${e.message}`);
        resolve(false);
      });

      req.on("timeout", () => {
        req.destroy();
        logger.warn("Alert webhook dispatch timed out");
        resolve(false);
      });

      req.write(payload);
      req.end();
    });
  } catch (parseErr) {
    logger.warn(`Invalid ALERT_WEBHOOK_URL configuration: ${parseErr.message}`);
    return false;
  }
}

module.exports = { notifyOperatorAlert };
