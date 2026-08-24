import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { useNavigate } from "react-router-dom"
import {
  clearStoredSession,
  getMe,
  getStoredSession,
  login as apiLogin,
  register as apiRegister,
  updateWallet as apiUpdateWallet,
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
  loginSession: (session: AuthSession, remember?: boolean) => void
  register: (payload: RegisterPayload) => Promise<AuthSession>
  logout: () => void
  updateWallet: (walletAddress: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

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

  const logout = useCallback(() => {
    clearStoredSession()
    setUser(null)
    setToken(null)
    setStatus("unauthenticated")
    navigate("/login")
  }, [navigate])

  // Cross-tab session sync and 401 unauthorized interceptor
  useEffect(() => {
    function handleStorageChange(e: StorageEvent) {
      if (e.key === "fairwork_auth_session") {
        if (!e.newValue) {
          // Logged out in another tab
          setUser(null)
          setToken(null)
          setStatus("unauthenticated")
          navigate("/login")
        } else {
          // Logged in or session updated in another tab
          try {
            const parsed = JSON.parse(e.newValue) as AuthSession
            if (parsed?.token && parsed?.user) {
              setUser(parsed.user)
              setToken(parsed.token)
              setStatus("authenticated")
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    }

    function handleUnauthorized() {
      logout()
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("unauthorized_access", handleUnauthorized)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("unauthorized_access", handleUnauthorized)
    }
  }, [logout, navigate])

  useEffect(() => {
    let cancelled = false

    async function restore() {
      const stored = getStoredSession()
      if (!stored) {
        if (!cancelled) setStatus("unauthenticated")
        return
      }

      try {
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

  const loginSession = useCallback(
    (session: AuthSession, remember = true) => {
      applySession(session, remember)
    },
    [applySession],
  )

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const session = await apiRegister(payload)
      const enrichedSession = await enrichSession(session)
      applySession(enrichedSession, true)
      return enrichedSession
    },
    [applySession],
  )

  const updateWallet = useCallback(
    async (walletAddress: string) => {
      if (!token) return
      const updatedUser = await apiUpdateWallet(walletAddress, token)
      setUser(updatedUser)
      if (user) {
        const stored = getStoredSession()
        if (stored) {
          updateStoredSession({ ...stored, user: updatedUser })
        }
      }
    },
    [token, user],
  )

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        status,
        login,
        loginSession,
        register,
        logout,
        updateWallet,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")
  return ctx
}
