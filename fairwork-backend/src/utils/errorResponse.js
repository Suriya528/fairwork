/**
 * Production-safe error response utility.
 * Logs the full error internally, returns a generic message to the client for 5xx errors.
 * For 4xx errors (business errors), returns the original message.
 */
function sendErrorResponse(res, err, context = "API") {
  const status = err.statusCode || err.status || 500;
  const isServerError = status >= 500;

  if (isServerError) {
    console.error(`[${context}] Internal error:`, err);
  }

  res.status(status).json({
    message: isServerError ? "Internal server error" : err.message,
    ...(err.code ? { code: err.code } : {}),
  });
}

module.exports = { sendErrorResponse };
