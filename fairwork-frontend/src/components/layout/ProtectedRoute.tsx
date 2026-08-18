import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { Spinner } from "@/components/ui/Spinner"
import { useAuth } from "@/context/AuthContext"

/**
 * Gates its children behind a valid session and optional role check.
 */
export function ProtectedRoute({
  children,
  requiredRole,
}: {
  children: ReactNode
  requiredRole?: "admin" | "client" | "freelancer"
}) {
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
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
