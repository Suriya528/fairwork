import { useEffect, useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { exchangeOAuthCode } from "@/services/authApi"
import { Spinner } from "@/components/ui/Spinner"

/** Maps backend error codes to user-friendly messages. */
const ERROR_MESSAGES: Record<string, string> = {
  OAUTH_CONFIG_MISSING:
    "Social login is not configured on this server. Please contact the site administrator.",
  OAUTH_INIT_FAILED:
    "Unable to start the social login process. Please try again.",
  OAUTH_DENIED:
    "Social authentication was cancelled or denied by the provider.",
  INVALID_OAUTH_STATE:
    "The authentication session expired or was tampered with. Please try signing in again.",
  OAUTH_STATE_MISMATCH:
    "Security validation failed (state mismatch). Please clear your cookies and try again.",
  TOKEN_EXCHANGE_FAILED:
    "Unable to verify your identity with the provider. This usually means the server's OAuth credentials are misconfigured.",
  EMAIL_NOT_VERIFIED:
    "Your email address is not verified on your social provider account. Please verify it and try again.",
  ACCOUNT_SUSPENDED:
    "Your FairWork account is currently suspended. Please contact support for assistance.",
  OAUTH_PROVIDER_ERROR:
    "The authentication provider returned an error. This usually means the server's OAuth client secret is missing or invalid.",
}

export function AuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { loginSession } = useAuth()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  // Prevent React 18 StrictMode double-mount from consuming the one-time code twice
  const hasExchanged = useRef(false)

  useEffect(() => {
    if (hasExchanged.current) return
    hasExchanged.current = true

    const code = searchParams.get("code")
    const error = searchParams.get("error")

    if (error) {
      setErrorMsg(
        ERROR_MESSAGES[error] ??
          "Social authentication failed or was cancelled. Please try again.",
      )
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
            state: { roleSelectionToken: res.roleSelectionToken, profile: res.profile },
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
