import { useState } from "react"
import type { FormEvent } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { FiMail } from "react-icons/fi"
import { AuthLayout } from "@/components/auth/AuthLayout"
import { FormField } from "@/components/auth/FormField"
import { PasswordField } from "@/components/auth/PasswordField"
import { SocialAuth } from "@/components/auth/SocialAuth"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Checkbox } from "@/components/ui/Checkbox"
import { useToast } from "@/components/ui/Toast"
import { useAuth } from "@/context/AuthContext"
import { validateEmail, validateRequired } from "@/lib/validation"
import { AuthError } from "@/services/authApi"

interface Errors {
  email?: string
  password?: string
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const { login } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(true)
  const [errors, setErrors] = useState<Errors>({})
  const [submitting, setSubmitting] = useState(false)

  function validate(): boolean {
    const trimmedEmail = email.trim()
    const next: Errors = {
      email: validateEmail(trimmedEmail),
      password: validateRequired(password, "Password"),
    }
    setErrors(next)
    return !next.email && !next.password
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!validate()) return

    const cleanEmail = email.trim()
    setSubmitting(true)
    try {
      const session = await login({ email: cleanEmail, password, remember })
      toast({
        tone: "success",
        title: "Welcome back",
        description: `Signed in as ${session.user.name}.`,
      })
      const redirectTo =
        (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/"
      navigate(redirectTo, { replace: true })
    } catch (err) {
      const message =
        err instanceof AuthError ? err.message : "Something went wrong. Try again."
      toast({ tone: "error", title: "Sign in failed", description: message })
      setErrors((prev) => ({ ...prev, password: message }))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      variant="login"
      title="Sign in to FairWork"
      subtitle="Access your projects, milestone deliverables, and payment escrow."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-primary underline-offset-2 transition-colors hover:text-primary-hover hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <SocialAuth action="sign in" />

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4.5">
          <FormField id="email" label="Email" required error={errors.email}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              leftIcon={<FiMail className="h-4 w-4" />}
              value={email}
              invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              onChange={(e) => {
                setEmail(e.target.value)
                if (errors.email) setErrors((p) => ({ ...p, email: undefined }))
              }}
            />
          </FormField>

          <FormField
            id="password"
            label="Password"
            required
            error={errors.password}
            labelAccessory={
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-primary underline-offset-2 transition-colors hover:text-primary-hover hover:underline"
              >
                Forgot password?
              </Link>
            }
          >
            <PasswordField
              id="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              onChange={(e) => {
                setPassword(e.target.value)
                if (errors.password) setErrors((p) => ({ ...p, password: undefined }))
              }}
            />
          </FormField>

          <Checkbox
            id="remember"
            label={<span className="text-xs">Keep me signed in</span>}
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />

          <Button type="submit" fullWidth aiGlow loading={submitting} className="h-11 font-semibold rounded-xl text-sm mt-1">
            {submitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    </AuthLayout>
  )
}