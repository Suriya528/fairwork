import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { exchangeOAuthCode } from "@/services/authApi"
import { Spinner } from "@/components/ui/Spinner"

export function AuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { loginSession } = useAuth()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    const code = searchParams.get("code")
    const error = searchParams.get("error")

    if (error) {
      if (error === "ACCOUNT_SUSPENDED") {
        setErrorMsg("Your FairWork account is currently suspended. Please contact support.")
      } else if (error === "EMAIL_NOT_VERIFIED") {
        setErrorMsg("Your email address is not verified on your social provider account.")
      } else {
        setErrorMsg("Social authentication failed or was cancelled. Please try again.")
      }
      return
    }

    if (!code) {
      setErrorMsg("Missing authorization code.")
      return
    }

    let isMounted = true

    exchangeOAuthCode(code)
      .then((res) => {
        if (!isMounted) return
        if (res.pendingRoleSelection) {
          navigate("/auth/select-role", {
            state: { profile: res.profile, code: res.tempCode },
            replace: true,
          })
        } else {
          loginSession(res.session)
          navigate("/dashboard", { replace: true })
        }
      })
      .catch((err: Error) => {
        if (isMounted) {
          setErrorMsg(err.message || "Failed to complete social login exchange.")
        }
      })

    return () => {
      isMounted = false
    }
  }, [searchParams, navigate, loginSession])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
        {errorMsg ? (
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-foreground">Authentication Error</h2>
            <p className="text-sm text-subtle">{errorMsg}</p>
            <button
              onClick={() => navigate("/login", { replace: true })}
              className="mt-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              Return to Login
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <Spinner className="h-8 w-8 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Completing Authentication</h2>
            <p className="text-sm text-subtle">Verifying your secure session with FairWork...</p>
          </div>
        )}
      </div>
    </div>
  )
}
