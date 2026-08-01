import { useState } from "react"
import type { FormEvent } from "react"
import { Link } from "react-router-dom"
import { FiMail, FiArrowLeft, FiCheckCircle } from "react-icons/fi"
import { AuthLayout } from "@/components/auth/AuthLayout"
import { FormField } from "@/components/auth/FormField"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { useToast } from "@/components/ui/Toast"
import { validateEmail } from "@/lib/validation"
import { AuthError, requestPasswordReset } from "@/services/authApi"

export function ForgotPasswordPage() {
  const { toast } = useToast()

  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | undefined>()
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const validation = validateEmail(email)
    if (validation) {
      setError(validation)
      return
    }

    setSubmitting(true)
    try {
      await requestPasswordReset({ email })
      setSent(true)
    } catch (err) {
      const message =
        err instanceof AuthError ? err.message : "Something went wrong. Try again."
      toast({ tone: "error", title: "Request failed", description: message })
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle={
          <>
            If an account exists for{" "}
            <span className="font-medium text-foreground">{email}</span>, we&apos;ve
            sent a link to reset your password.
          </>
        }
        footer={
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 font-medium text-primary underline-offset-2 transition-colors hover:text-primary-hover hover:underline"
          >
            <FiArrowLeft className="h-4 w-4" aria-hidden />
            Back to sign in
          </Link>
        }
      >
        <div className="flex flex-col gap-6">
          <div className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success-soft text-success">
              <FiCheckCircle className="h-5 w-5" aria-hidden />
            </span>
            <div className="text-sm leading-relaxed text-muted">
              <p className="font-medium text-foreground">Email on its way</p>
              <p className="mt-0.5">
                The link expires in 30 minutes. Be sure to check your spam folder
                if you don&apos;t see it.
              </p>
            </div>
          </div>

          <Button
            variant="secondary"
            fullWidth
            type="button"
            onClick={() => setSent(false)}
          >
            Use a different email
          </Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter the email tied to your account and we'll send you a reset link."
      footer={
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 font-medium text-primary underline-offset-2 transition-colors hover:text-primary-hover hover:underline"
        >
          <FiArrowLeft className="h-4 w-4" aria-hidden />
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <FormField id="email" label="Email" required error={error}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            leftIcon={<FiMail className="h-4 w-4" />}
            value={email}
            invalid={!!error}
            aria-describedby={error ? "email-error" : undefined}
            onChange={(e) => {
              setEmail(e.target.value)
              if (error) setError(undefined)
            }}
          />
        </FormField>

        <Button type="submit" fullWidth loading={submitting}>
          {submitting ? "Sending link..." : "Send reset link"}
        </Button>
      </form>
    </AuthLayout>
  )
}
