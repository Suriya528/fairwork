import { useEffect, useRef, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { FiCheckCircle, FiAlertCircle, FiArrowRight, FiMail } from "react-icons/fi"
import { AuthLayout } from "@/components/auth/AuthLayout"
import { Button } from "@/components/ui/Button"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/components/ui/Toast"
import { resendVerificationEmail, verifyEmail } from "@/services/authApi"

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()
  const { toast } = useToast()

  const token = searchParams.get("token")?.trim() || ""
  const hasRequested = useRef(false)

  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      setErrorMessage("No verification token was provided in the link.")
      return
    }

    // React 19 StrictMode double-mount prevention latch
    if (hasRequested.current) return
    hasRequested.current = true

    async function performVerification() {
      try {
        await verifyEmail(token)
        setSuccess(true)
        // Refresh active user in AuthContext to instantly unblock guarded UI
        await refreshUser()
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : "Verification token is invalid or has expired. Please request a new link."
        setErrorMessage(msg)
      } finally {
        setLoading(false)
      }
    }

    performVerification()
  }, [token, refreshUser])

  async function handleResend() {
    if (!user?.email) {
      navigate("/login")
      return
    }

    setResending(true)
    try {
      await resendVerificationEmail(user.email)
      toast({
        tone: "success",
        title: "Verification link sent",
        description: `We've sent a new verification link to ${user.email}.`,
      })
    } catch (err) {
      toast({
        tone: "error",
        title: "Resend failed",
        description: err instanceof Error ? err.message : "Unable to send verification link.",
      })
    } finally {
      setResending(false)
    }
  }

  if (loading) {
    return (
      <AuthLayout
        title="Verifying Email"
        subtitle="Please wait while we confirm your email address..."
      >
        <div className="flex flex-col items-center justify-center py-10 gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-primary border-t-transparent" />
          <p className="text-xs text-muted">Confirming cryptographic security token...</p>
        </div>
      </AuthLayout>
    )
  }

  if (success) {
    return (
      <AuthLayout
        title="Email Verified!"
        subtitle="Your email address has been successfully confirmed."
        footer={
          <Link
            to={user ? "/dashboard" : "/login"}
            className="inline-flex items-center gap-1.5 font-semibold text-primary underline-offset-2 transition-colors hover:text-primary-hover hover:underline text-xs"
          >
            <span>{user ? "Go to Dashboard" : "Sign in to FairWork"}</span>
            <FiArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        }
      >
        <div className="flex flex-col gap-6">
          <div className="flex items-start gap-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <FiCheckCircle className="h-4 w-4" aria-hidden />
            </span>
            <div className="text-xs leading-relaxed text-muted">
              <p className="font-bold text-foreground">Full Platform Access Unlocked</p>
              <p className="mt-0.5">
                Your account is now fully verified. You can create projects, fund escrows, and receive milestone payments.
              </p>
            </div>
          </div>

          <Link to={user ? "/dashboard" : "/login"} className="w-full">
            <Button variant="primary" fullWidth className="h-11 rounded-xl font-semibold text-sm">
              {user ? "Continue to Dashboard" : "Sign in now"}
            </Button>
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Verification Failed"
      subtitle="We could not verify your email address with this link."
      footer={
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 font-semibold text-primary underline-offset-2 transition-colors hover:text-primary-hover hover:underline text-xs"
        >
          Return to sign in
        </Link>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex items-start gap-3.5 rounded-xl border border-danger/30 bg-danger/10 p-4">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-danger/20 text-danger">
            <FiAlertCircle className="h-4 w-4" aria-hidden />
          </span>
          <div className="text-xs leading-relaxed text-muted">
            <p className="font-bold text-foreground">Invalid or Expired Link</p>
            <p className="mt-0.5">
              {errorMessage || "The verification link may have expired (24-hour limit) or has already been used."}
            </p>
          </div>
        </div>

        {user ? (
          <Button
            variant="primary"
            fullWidth
            loading={resending}
            onClick={handleResend}
            className="h-11 rounded-xl font-semibold text-sm"
          >
            <FiMail className="mr-2 h-4 w-4" />
            Resend verification email
          </Button>
        ) : (
          <Link to="/login" className="w-full">
            <Button variant="secondary" fullWidth className="h-11 rounded-xl font-semibold text-sm">
              Sign in to request new link
            </Button>
          </Link>
        )}
      </div>
    </AuthLayout>
  )
}
