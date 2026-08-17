import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { Spinner } from "@/components/ui/Spinner"
import { useAuth } from "@/context/AuthContext"

/**
 * Gates its children behind a valid session. Three states:
 *  - loading: still verifying a stored token against GET /me — render
 *    a spinner, not a redirect, or a valid session would flash to
 *    /login for a moment on every refresh.
 *  - unauthenticated: no session, or the token was rejected — redirect
 *    to /login, remembering where we came from.
 *  - authenticated: render children as normal.
 */
export function ProtectedRoute({ children, requiredRole }: { children: ReactNode; requiredRole?: "admin" }) {
  const { status, user } = useAuth()
  const location = useLocation()

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base">
        <Spinner className="h-6 w-6 text-muted" />
      </div>
    )
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
