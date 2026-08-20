/**
 * Centralized production error logger and error reference ID generator for FairWork.
 */

export interface ErrorLogContext {
  feature?: string
  route?: string
  userId?: string
  [key: string]: unknown
}

const SENSITIVE_KEYS = [
  "password",
  "token",
  "jwt",
  "secret",
  "privatekey",
  "seed",
  "mnemonic",
  "signature",
  "authorization",
]

function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.some((k) => key.toLowerCase().includes(k))) {
      sanitized[key] = "[REDACTED]"
    } else if (val && typeof val === "object" && !Array.isArray(val)) {
      sanitized[key] = sanitizeObject(val as Record<string, unknown>)
    } else {
      sanitized[key] = val
    }
  }
  return sanitized
}

/**
 * Generates a short, collision-resistant error reference code like `FW-7K3P9`.
 */
export function generateErrorRef(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let ref = "FW-"
  for (let i = 0; i < 5; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return ref
}

/**
 * Safely logs unexpected errors with reference IDs without exposing sensitive credentials.
 */
export function logError(error: unknown, context: ErrorLogContext = {}): string {
  const errorRef = generateErrorRef()
  const timestamp = new Date().toISOString()
  const sanitizedContext = sanitizeObject(context)

  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorStack = error instanceof Error ? error.stack : undefined

  if (import.meta.env.DEV) {
    console.error(`[FairWork Error ${errorRef}]`, {
      message: errorMessage,
      timestamp,
      context: sanitizedContext,
      stack: errorStack,
    })
  } else {
    // Production structured console logging (can be wired to Sentry/LogRocket in production)
    console.error(
      JSON.stringify({
        level: "error",
        errorRef,
        timestamp,
        message: errorMessage,
        context: sanitizedContext,
      }),
    )
  }

  return errorRef
}

/**
 * Global unhandled promise rejection and window error monitor.
 */
export function setupGlobalErrorListeners(): void {
  if (typeof window === "undefined") return

  window.onerror = (message, source, lineno, colno, error) => {
    logError(error || message, {
      source,
      lineno,
      colno,
      type: "uncaught_window_error",
    })
  }

  window.onunhandledrejection = (event: PromiseRejectionEvent) => {
    logError(event.reason, {
      type: "unhandled_promise_rejection",
    })
  }
}
