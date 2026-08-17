import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"
import type { ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import {
  clearStoredSession,
  getMe,
  getStoredSession,
  login as apiLogin,
  register as apiRegister,
  storeSession,
  updateStoredSession,
} from "@/services/authApi"
import type {
  AuthSession,
  AuthUser,
  LoginPayload,
  RegisterPayload,
} from "@/services/authApi"

type AuthStatus = "loading" | "authenticated" | "unauthenticated"

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  status: AuthStatus
  login: (payload: LoginPayload) => Promise<AuthSession>
  register: (payload: RegisterPayload) => Promise<AuthSession>
  logout: () => void
  updateWallet: (walletAddress: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

/**
 * Centralized session state. Wraps authApi's network/storage functions
 * with React lifecycle: restores a session on refresh (verified against
 * GET /me, not just trusted from storage), and exposes login/register/
 * logout with the exact same call signatures LoginPage/RegisterPage
 * already used — so those pages only needed a one-line import swap.
 */
/**
 * login()/register() responses only include { id, firstName, lastName,
 * email, role } — avatarUrl/bio/reputationScore/totalReviews only come
 * from GET /me. Without this, a freshly-logged-in user would show an
 * empty avatar and zero rating until their next page refresh (which is
 * the only other path that calls getMe). Falls back to the lean session
 * on failure so a flaky enrichment call doesn't fail an otherwise-
 * successful login.
 */
async function enrichSession(session: AuthSession): Promise<AuthSession> {
  try {
    const fullUser = await getMe(session.token)
    return { ...session, user: fullUser }
  } catch {
    return session
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [status, setStatus] = useState<AuthStatus>("loading")

  useEffect(() => {
    let cancelled = false

    async function restore() {
      const stored = getStoredSession()
      if (!stored) {
        if (!cancelled) setStatus("unauthenticated")
        return
      }

      try {
        // Verify against the backend rather than trusting storage blindly —
        // this is what makes an expired/invalidated JWT get caught here
        // instead of silently "working" until some later call 401s.
        const freshUser = await getMe(stored.token)
        if (cancelled) return
        setUser(freshUser)
        setToken(stored.token)
        setStatus("authenticated")
      } catch {
        if (cancelled) return
        clearStoredSession()
        setStatus("unauthenticated")
      }
    }

    restore()
    return () => {
      cancelled = true
    }
  }, [])

  const applySession = useCallback((session: AuthSession, remember: boolean) => {
    storeSession(session, remember)
    setUser(session.user)
    setToken(session.token)
    setStatus("authenticated")
  }, [])

  const login = useCallback(
    async (payload: LoginPayload) => {
      const session = await apiLogin(payload)
      const enrichedSession = await enrichSession(session)
      applySession(enrichedSession, payload.remember ?? false)
      return enrichedSession
    },
    [applySession],
  )

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const session = await apiRegister(payload)
      const enrichedSession = await enrichSession(session)
      // Registering establishes an active session immediately (matches
      // existing behavior: RegisterPage already navigated to "/" right
      // after success). Defaulting to remembered — there's no "remember
      // me" checkbox on the register form to read instead.
      applySession(enrichedSession, true)
      return enrichedSession
    },
    [applySession],
  )

  const logout = useCallback(() => {
    clearStoredSession()
    setUser(null)
    setToken(null)
    setStatus("unauthenticated")
    navigate("/login")
  }, [navigate])

  const updateWallet = useCallback(async (walletAddress: string) => {
    if (!token || !user) throw new Error("You must be signed in to update your wallet.")
    const updated = { ...user, walletAddress }
    setUser(updated)
    updateStoredSession({ user: updated, token })
  }, [token, user])

  return (
    <AuthContext.Provider value={{ user, token, status, login, register, logout, updateWallet }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")
  return ctx
}
