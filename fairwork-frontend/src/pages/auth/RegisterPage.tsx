import { useState } from "react"
import type { FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { FiMail, FiUser } from "react-icons/fi"
import { AuthLayout } from "@/components/auth/AuthLayout"
import { FormField } from "@/components/auth/FormField"
import { PasswordField } from "@/components/auth/PasswordField"
import { PasswordStrength } from "@/components/auth/PasswordStrength"
import { SocialAuth } from "@/components/auth/SocialAuth"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Select, type SelectOption } from "@/components/ui/Select"
import { Checkbox } from "@/components/ui/Checkbox"
import { useToast } from "@/components/ui/Toast"
import { useAuth } from "@/context/AuthContext"
import {
  validateConfirmPassword,
  validateEmail,
  validateName,
  validatePassword,
} from "@/lib/validation"
import { AuthError } from "@/services/authApi"

type Role = "client" | "freelancer"

interface Errors {
  firstName?: string
  lastName?: string
  email?: string
  role?: string
  password?: string
  confirm?: string
  terms?: string
}

const ROLE_OPTIONS: SelectOption[] = [
  { label: "Client — I'm hiring", value: "client" },
  { label: "Freelancer — I'm working", value: "freelancer" },
]

export function RegisterPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { register } = useAuth()

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<Role | "">("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [terms, setTerms] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [submitting, setSubmitting] = useState(false)

  function clearError(key: keyof Errors) {
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev))
  }

  function validate(): boolean {
    const next: Errors = {
      firstName: validateName(firstName),
      lastName: validateName(lastName),
      email: validateEmail(email),
      role: role ? undefined : "Select a role to continue",
      password: validatePassword(password),
      confirm: validateConfirmPassword(confirm, password),
      terms: terms ? undefined : "You must accept the terms to continue",
    }
    setErrors(next)
    return !Object.values(next).some(Boolean)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      const session = await register({
        firstName,
        lastName,
        email,
        password,
        role: role as Role,
      })
      toast({
        tone: "success",
        title: "Account created",
        description: `Welcome to FairWork, ${session.user.name.split(" ")[0]}.`,
      })
      navigate("/")
    } catch (err) {
      if (err instanceof AuthError && err.fieldErrors) {
        setErrors((prev) => ({ ...prev, ...err.fieldErrors }))
      }
      const message =
        err instanceof AuthError ? err.message : "Something went wrong. Try again."
      toast({ tone: "error", title: "Sign up failed", description: message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start securing contracts with escrow-backed payments in minutes."
      footer={
        <>
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-primary underline-offset-2 transition-colors hover:text-primary-hover hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <SocialAuth action="sign up" />

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <FormField id="firstName" label="First name" required error={errors.firstName}>
            <Input
              id="firstName"
              type="text"
              autoComplete="given-name"
              placeholder="Jane"
              leftIcon={<FiUser className="h-4 w-4" />}
              value={firstName}
              invalid={!!errors.firstName}
              aria-describedby={errors.firstName ? "firstName-error" : undefined}
              onChange={(e) => {
                setFirstName(e.target.value)
                clearError("firstName")
              }}
            />
          </FormField>

          <FormField id="lastName" label="Last name" required error={errors.lastName}>
            <Input
              id="lastName"
              type="text"
              autoComplete="family-name"
              placeholder="Cooper"
              value={lastName}
              invalid={!!errors.lastName}
              aria-describedby={errors.lastName ? "lastName-error" : undefined}
              onChange={(e) => {
                setLastName(e.target.value)
                clearError("lastName")
              }}
            />
          </FormField>

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
                clearError("email")
              }}
            />
          </FormField>

          <FormField id="role" label="I am a" required error={errors.role}>
            <Select
              id="role"
              options={ROLE_OPTIONS}
              placeholder="Select your role"
              value={role}
              invalid={!!errors.role}
              aria-describedby={errors.role ? "role-error" : undefined}
              onChange={(e) => {
                setRole(e.target.value as Role)
                clearError("role")
              }}
            />
          </FormField>

          <FormField
            id="password"
            label="Password"
            required
            error={errors.password}
            hint={!password ? "At least 8 characters with a mix of cases and a number" : undefined}
          >
            <PasswordField
              id="password"
              autoComplete="new-password"
              placeholder="Create a password"
              value={password}
              invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              onChange={(e) => {
                setPassword(e.target.value)
                clearError("password")
              }}
            />
            {password && <PasswordStrength value={password} />}
          </FormField>

          <FormField
            id="confirm"
            label="Confirm password"
            required
            error={errors.confirm}
          >
            <PasswordField
              id="confirm"
              autoComplete="new-password"
              placeholder="Re-enter your password"
              value={confirm}
              invalid={!!errors.confirm}
              aria-describedby={errors.confirm ? "confirm-error" : undefined}
              onChange={(e) => {
                setConfirm(e.target.value)
                clearError("confirm")
              }}
            />
          </FormField>

          <div className="flex flex-col gap-1.5">
            <Checkbox
              id="terms"
              checked={terms}
              label={
                <span>
                  I agree to the{" "}
                  <a href="#" className="text-primary hover:underline">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-primary hover:underline">
                    Privacy Policy
                  </a>
                </span>
              }
              onChange={(e) => {
                setTerms(e.target.checked)
                clearError("terms")
              }}
            />
            {errors.terms && (
              <p className="text-xs text-danger" role="alert">
                {errors.terms}
              </p>
            )}
          </div>

          <Button type="submit" fullWidth loading={submitting}>
            {submitting ? "Creating account..." : "Create account"}
          </Button>
        </form>
      </div>
    </AuthLayout>
  )
}