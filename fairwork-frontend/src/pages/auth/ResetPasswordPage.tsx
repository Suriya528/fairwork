import { useState } from "react"
import type { FormEvent } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { FiLock, FiArrowLeft, FiCheckCircle, FiAlertTriangle } from "react-icons/fi"
import { AuthLayout } from "@/components/auth/AuthLayout"
import { FormField } from "@/components/auth/FormField"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { useToast } from "@/components/ui/Toast"
import { AuthError, resetPassword } from "@/services/authApi"

export function ResetPasswordPage() {
  const { toast } = useToast()
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")?.trim() || ""

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | undefined>()
  const [submitting, setSubmitting] = useState(false)
  const [completed, setCompleted] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(undefined)

    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setSubmitting(true)
    try {
      await resetPassword({ token, newPassword: password })
      setCompleted(true)
      toast({
        tone: "success",
        title: "Password reset successful",
        description: "You can now sign in with your new password.",
      })
    } catch (err) {
      const message =
        err instanceof AuthError
          ? err.message
          : err instanceof Error
          ? err.message
          : "Invalid or expired password reset link. Please request a new one."
      setError(message)
      toast({ tone: "error", title: "Reset failed", description: message })
    } finally {
      setSubmitting(false)
    }
  }

  // Token missing state
  if (!token) {
    return (
      <AuthLayout
        title="Invalid Reset Link"
        subtitle="This password reset link is missing a valid security token."
        footer={
          <Link
            to="/forgot-password"
            className="inline-flex items-center gap-1.5 font-semibold text-primary underline-offset-2 transition-colors hover:text-primary-hover hover:underline text-xs"
          >
            <FiArrowLeft className="h-4 w-4" aria-hidden />
            Request a new reset link
          </Link>
        }
      >
        <div className="flex flex-col gap-6">
          <div className="flex items-start gap-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
              <FiAlertTriangle className="h-4 w-4" aria-hidden />
            </span>
            <div className="text-xs leading-relaxed text-muted">
              <p className="font-bold text-foreground">Missing Token</p>
              <p className="mt-0.5">
                The link you clicked may have been truncated or altered. Please request a fresh reset link to continue.
              </p>
            </div>
          </div>

          <Link to="/forgot-password" className="w-full">
            <Button variant="primary" fullWidth className="h-11 rounded-xl font-semibold text-sm">
              Request new link
            </Button>
          </Link>
        </div>
      </AuthLayout>
    )
  }

  // Completed success state
  if (completed) {
    return (
      <AuthLayout
        title="Password Updated"
        subtitle="Your password has been changed successfully. All previous sessions have been signed out."
        footer={
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 font-semibold text-primary underline-offset-2 transition-colors hover:text-primary-hover hover:underline text-xs"
          >
            <FiArrowLeft className="h-4 w-4" aria-hidden />
            Sign in now
          </Link>
        }
      >
        <div className="flex flex-col gap-6">
          <div className="flex items-start gap-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <FiCheckCircle className="h-4 w-4" aria-hidden />
            </span>
            <div className="text-xs leading-relaxed text-muted">
              <p className="font-bold text-foreground">Security Verified</p>
              <p className="mt-0.5">
                Your account credentials have been updated and secured. You can now use your new password to sign in.
              </p>
            </div>
          </div>

          <Link to="/login" className="w-full">
            <Button variant="primary" fullWidth className="h-11 rounded-xl font-semibold text-sm">
              Continue to sign in
            </Button>
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Create New Password"
      subtitle="Enter a strong password of at least 8 characters for your FairWork account."
      footer={
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 font-semibold text-primary underline-offset-2 transition-colors hover:text-primary-hover hover:underline text-xs"
        >
          <FiArrowLeft className="h-4 w-4" aria-hidden />
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4.5">
        <FormField id="new-password" label="New Password" required error={error}>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            leftIcon={<FiLock className="h-4 w-4" />}
            value={password}
            invalid={!!error}
            onChange={(e) => {
              setPassword(e.target.value)
              if (error) setError(undefined)
            }}
          />
        </FormField>

        <FormField id="confirm-password" label="Confirm New Password" required>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            leftIcon={<FiLock className="h-4 w-4" />}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value)
              if (error) setError(undefined)
            }}
          />
        </FormField>

        <Button
          type="submit"
          fullWidth
          loading={submitting}
          className="h-11 font-semibold rounded-xl text-sm mt-1"
        >
          {submitting ? "Updating password..." : "Set new password"}
        </Button>
      </form>
    </AuthLayout>
  )
}
