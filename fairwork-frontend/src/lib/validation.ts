/**
 * Lightweight, dependency-free form validators.
 * Each validator returns an error string, or `undefined` when the value is valid.
 * Kept framework-agnostic so pages can compose them however they need.
 */

// Pragmatic email pattern — good enough for client-side UX; the server remains
// the source of truth.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmail(value: string): string | undefined {
  const trimmed = value.trim()
  if (!trimmed) return "Email is required"
  if (!EMAIL_RE.test(trimmed)) return "Enter a valid email address"
  return undefined
}

export function validateRequired(
  value: string,
  label = "This field",
): string | undefined {
  if (!value.trim()) return `${label} is required`
  return undefined
}

export function validateName(value: string): string | undefined {
  const trimmed = value.trim()
  if (!trimmed) return "Full name is required"
  if (trimmed.length < 2) return "Name must be at least 2 characters"
  return undefined
}

export function validatePassword(value: string): string | undefined {
  if (!value) return "Password is required"
  if (value.length < 8) return "Password must be at least 8 characters"
  if (!/[a-z]/.test(value) || !/[A-Z]/.test(value)) {
    return "Include both uppercase and lowercase letters"
  }
  if (!/\d/.test(value)) return "Include at least one number"
  return undefined
}

export function validateConfirmPassword(
  value: string,
  original: string,
): string | undefined {
  if (!value) return "Please confirm your password"
  if (value !== original) return "Passwords do not match"
  return undefined
}

export interface PasswordStrength {
  /** 0 (empty) – 4 (strong) */
  score: number
  label: "Empty" | "Weak" | "Fair" | "Good" | "Strong"
  /** Tailwind text/bg token suffix for coloring the meter. */
  tone: "muted" | "danger" | "warning" | "info" | "success"
}

/**
 * Derives a coarse strength score for the password meter UI.
 * This is presentation-only — real strength enforcement belongs on the server.
 */
export function getPasswordStrength(value: string): PasswordStrength {
  if (!value) return { score: 0, label: "Empty", tone: "muted" }

  let score = 0
  if (value.length >= 8) score++
  if (value.length >= 12) score++
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++
  if (/\d/.test(value)) score++
  if (/[^A-Za-z0-9]/.test(value)) score++

  const clamped = Math.min(score, 4)

  const map: Record<number, PasswordStrength> = {
    0: { score: 0, label: "Empty", tone: "muted" },
    1: { score: 1, label: "Weak", tone: "danger" },
    2: { score: 2, label: "Fair", tone: "warning" },
    3: { score: 3, label: "Good", tone: "info" },
    4: { score: 4, label: "Strong", tone: "success" },
  }
  return map[clamped]
}
