/**
 * Auth service layer.
 *
 * login()/register()/getMe() call the real Express + MongoDB API
 * (routes/auth.js). This file owns all raw session storage too — the
 * React-facing lifecycle (state, restore-on-refresh, redirect-on-logout)
 * lives in src/context/AuthContext.tsx, which calls the functions here.
 *
 * API_URL and the generic authenticated-fetch helper live in
 * apiClient.ts, shared with every other domain service (projectsApi.ts,
 * and whatever comes next) — this file only keeps its own POST wrapper
 * for login/register since those two need auth-specific error shaping
 * (the synthesized fieldErrors below) that other domains don't.
 *
 * requestPasswordReset() is still a mock — routes/auth.js has no
 * /forgot-password endpoint yet.
 */

import { API_URL } from "./apiClient"

export interface AuthUser {
  id: string
  name: string
  email: string
  role: "client" | "freelancer"
  /** Empty string if the user hasn't connected a wallet yet. */
  walletAddress: string
  /** Empty string if none set. */
  avatarUrl: string
  /** Empty string if none set. */
  bio: string
  /** Backend field is reputationScore — renamed here to match how the UI refers to it. */
  rating: number
  /** Backend field is totalReviews. */
  reviewCount: number
  createdAt: string
}

export interface AuthSession {
  user: AuthUser
  token: string
}

export interface LoginPayload {
  email: string
  password: string
  remember?: boolean
}

export interface RegisterPayload {
  firstName: string
  lastName: string
  email: string
  password: string
  role: "client" | "freelancer"
}

export interface ForgotPasswordPayload {
  email: string
}

/** Normalized error thrown by every service call so the UI can trust `.message`. */
export class AuthError extends Error {
  /** Optional per-field messages, e.g. { email: "Already registered" }. */
  fieldErrors?: Record<string, string>
  status?: number

  constructor(
    message: string,
    options?: { fieldErrors?: Record<string, string>; status?: number },
  ) {
    super(message)
    this.name = "AuthError"
    this.fieldErrors = options?.fieldErrors
    this.status = options?.status
  }
}

// --- Backend response shapes -------------------------------------------

/**
 * Covers both response shapes the backend actually returns:
 *  - register/login: { id, firstName, lastName, email, role }  (no walletAddress in payload)
 *  - GET /me:        raw Mongoose doc — _id, firstName, lastName, email,
 *                     role, walletAddress, skills, bio, reputationScore, ...
 * toAuthUser() only reads the fields AuthUser actually needs.
 */
interface BackendUser {
  id?: string
  _id?: string
  firstName: string
  lastName: string
  email: string
  role: "client" | "freelancer"
  walletAddress?: string
  avatarUrl?: string
  bio?: string
  /** Only present on GET /me — register/login responses don't include it. */
  reputationScore?: number
  /** Only present on GET /me — register/login responses don't include it. */
  totalReviews?: number
  createdAt?: string
}

interface BackendAuthResponse {
  token: string
  user: BackendUser
}

function toAuthUser(user: BackendUser): AuthUser {
  return {
    id: user.id ?? user._id ?? "",
    name: `${user.firstName} ${user.lastName}`.trim(),
    email: user.email,
    role: user.role,
    walletAddress: user.walletAddress ?? "",
    avatarUrl: user.avatarUrl ?? "",
    bio: user.bio ?? "",
    rating: user.reputationScore ?? 0,
    reviewCount: user.totalReviews ?? 0,
    createdAt: user.createdAt ?? "",
  }
}

/** Shared POST helper for login/register. */
async function authPost(path: string, body: unknown): Promise<BackendAuthResponse> {
  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  } catch {
    throw new AuthError("Can't reach the server. Check your connection and try again.")
  }

  let data: Record<string, unknown> = {}
  try {
    data = await res.json()
  } catch {
    // Non-JSON or empty body — fall through with data = {}.
  }

  if (!res.ok) {
    const message = typeof data.message === "string" ? data.message : "Something went wrong."

    // The backend returns a flat { message }, no structured field errors.
    // Synthesize the one case RegisterPage already knows how to highlight
    // (duplicate email), so its existing error UI keeps working without
    // any backend change.
    const fieldErrors =
      path === "/auth/register" && /email/i.test(message) && /exists/i.test(message)
        ? { email: message }
        : undefined

    throw new AuthError(message, { status: res.status, fieldErrors })
  }

  return data as unknown as BackendAuthResponse
}

// --- Public API: network calls ----------------------------------------

export async function login(payload: LoginPayload): Promise<AuthSession> {
  const data = await authPost("/auth/login", {
    email: payload.email,
    password: payload.password,
  })
  return { user: toAuthUser(data.user), token: data.token }
}

export async function register(payload: RegisterPayload): Promise<AuthSession> {
  const data = await authPost("/auth/register", {
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email,
    password: payload.password,
    role: payload.role,
  })
  return { user: toAuthUser(data.user), token: data.token }
}

/**
 * Verifies a stored token against the backend and returns fresh user data.
 * Used on app load to restore a session — and to detect an expired or
 * invalidated token, since jwt.verify() failing means this 401s.
 */
export async function getMe(token: string): Promise<AuthUser> {
  let res: Response
  try {
    res = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch {
    throw new AuthError("Can't reach the server. Check your connection and try again.")
  }

  if (!res.ok) {
    throw new AuthError("Session expired or invalid.", { status: res.status })
  }

  const data = (await res.json()) as BackendUser
  return toAuthUser(data)
}

/** Updates the one account field the backend currently persists. */
export async function updateWallet(walletAddress: string, token: string): Promise<AuthUser> {
  const data = await fetch(`${API_URL}/auth/wallet`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ walletAddress }),
  })
  if (!data.ok) {
    let message = "Unable to update wallet."
    try { message = ((await data.json()) as { message?: string }).message ?? message } catch { /* ignore */ }
    throw new AuthError(message, { status: data.status })
  }
  return toAuthUser((await data.json()) as BackendUser)
}

export async function requestPasswordReset(
  payload: ForgotPasswordPayload,
): Promise<{ ok: true }> {
  // No /forgot-password route exists on the backend yet (routes/auth.js
  // only has register/login/me/wallet). Keeping this mocked rather than
  // inventing a server endpoint that wasn't part of this task.
  await new Promise((resolve) => setTimeout(resolve, 900))
  void payload
  return { ok: true }
}

// --- Session storage -----------------------------------------------------
//
// remember=true -> localStorage (survives browser restart)
// remember=false -> sessionStorage (cleared when the tab closes)
// This is the first thing to actually read LoginPayload.remember, which
// existed before but was ignored.

const STORAGE_KEY = "fairwork_auth_session"

export function storeSession(session: AuthSession, remember: boolean): void {
  try {
    const payload = JSON.stringify(session)
    if (remember) {
      localStorage.setItem(STORAGE_KEY, payload)
      sessionStorage.removeItem(STORAGE_KEY)
    } else {
      sessionStorage.setItem(STORAGE_KEY, payload)
      localStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    // Storage can throw in restrictive environments (e.g. private mode) —
    // the session still works for this tab via React state regardless.
  }
}

/** Reads whichever storage currently holds a session, if any. */
export function getStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthSession
    if (!parsed?.token || !parsed?.user?.id) return null
    return parsed
  } catch {
    return null
  }
}

/** Replaces the stored session without changing its original persistence choice. */
export function updateStoredSession(session: AuthSession): void {
  try {
    if (localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    } else if (sessionStorage.getItem(STORAGE_KEY)) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    }
  } catch {
    // The in-memory session remains valid if storage is unavailable.
  }
}

/** Low-level storage clear. AuthContext.logout() calls this plus clears React state and redirects — use that, not this, from components. */
export function clearStoredSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Logout should never fail because storage threw.
  }
}
