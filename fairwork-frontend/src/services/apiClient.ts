/**
 * Shared authenticated-fetch helper for every backend domain service
 * (projects now; contracts/escrow/transactions/etc. as each module gets
 * its own integration pass). Owns the API base URL so it's defined in
 * exactly one place — authApi.ts imports it from here rather than
 * keeping its own copy.
 */

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api"

export class ApiError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

interface ApiFetchOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  /** Bearer token for routes behind the backend's `auth` middleware. */
  token?: string
  body?: unknown
  signal?: AbortSignal
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { method = "GET", token, body, signal } = options

  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined,
      signal,
    })
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      throw err
    }
    throw new ApiError("Can't reach the server. Check your connection and try again.")
  }

  let data: unknown = null
  try {
    data = await res.json()
  } catch {
    // Empty or non-JSON body is fine for some responses (e.g. 204s).
  }

  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      // Global 401 interceptor signal
      window.dispatchEvent(new CustomEvent("unauthorized_access"))
    }

    const message =
      data && typeof data === "object" && "message" in data && typeof (data as Record<string, unknown>).message === "string"
        ? (data as { message: string }).message
        : "Something went wrong."
    throw new ApiError(message, res.status)
  }

  return data as T
}
