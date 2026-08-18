import { useState } from "react"
import type { FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { FiMail, FiUser, FiBriefcase, FiUserCheck, FiCheckCircle } from "react-icons/fi"
import { AuthLayout } from "@/components/auth/AuthLayout"
import { FormField } from "@/components/auth/FormField"
import { PasswordField } from "@/components/auth/PasswordField"
import { PasswordStrength } from "@/components/auth/PasswordStrength"
import { SocialAuth } from "@/components/auth/SocialAuth"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
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
import { cn } from "@/lib/utils"

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
      email: validateEmail(email.trim()),
      role: role ? undefined : "Select how you want to use FairWork",
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

    const cleanEmail = email.trim()
    const cleanFirstName = firstName.trim()
    const cleanLastName = lastName.trim()

    setSubmitting(true)
    try {
      const session = await register({
        firstName: cleanFirstName,
        lastName: cleanLastName,
        email: cleanEmail,
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
      variant="register"
      title="Create your account"
      subtitle="Join FairWork to post projects or deliver work with escrow-protected milestone payments."
      footer={
        <>
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-primary underline-offset-2 transition-colors hover:text-primary-hover hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <SocialAuth action="sign up" />

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4.5">
          {/* Role Selection Product Cards */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">
              I want to <span className="text-danger">*</span>
            </label>
            <div
              role="radiogroup"
              aria-label="Account Type"
              className="grid grid-cols-2 gap-3"
            >
              {[
                {
                  value: "client" as Role,
                  title: "Hire Talent",
                  desc: "Post project briefs & fund milestone escrow",
                  icon: FiBriefcase,
                },
                {
                  value: "freelancer" as Role,
                  title: "Work & Earn",
                  desc: "Deliver milestones & receive direct P2P release",
                  icon: FiUserCheck,
                },
              ].map((item) => {
                const isSelected = role === item.value
                const Icon = item.icon
                return (
                  <button
                    type="button"
                    key={item.value}
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => {
                      setRole(item.value)
                      clearError("role")
                    }}
                    className={cn(
                      "relative flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      isSelected
                        ? "border-primary bg-primary/10 shadow-sm shadow-primary/10"
                        : "border-input-border bg-input hover:border-border-strong hover:bg-elevated/40",
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg border", isSelected ? "bg-primary text-primary-foreground border-primary" : "bg-elevated text-subtle border-border")}>
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        {isSelected && <FiCheckCircle className="h-4 w-4 text-primary" />}
                      </div>
                      <p className="mt-2 text-xs font-bold text-foreground">{item.title}</p>
                      <p className="mt-0.5 text-[11px] leading-tight text-muted">{item.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
            {errors.role && (
              <p id="role-error" className="text-xs text-danger" role="alert">
                {errors.role}
              </p>
            )}
          </div>

          {/* Name fields */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
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
          </div>

          {/* Email field */}
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

          {/* Password fields */}
          <div className="flex flex-col gap-3">
            <FormField
              id="password"
              label="Password"
              required
              error={errors.password}
              hint={!password ? "At least 8 characters with upper, lower, and a number" : undefined}
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
          </div>

          {/* Terms Checkbox */}
          <div className="flex flex-col gap-1">
            <Checkbox
              id="terms"
              checked={terms}
              label={
                <span className="text-xs">
                  I agree to the{" "}
                  <a href="#" className="text-primary hover:underline font-semibold">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-primary hover:underline font-semibold">
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

          <Button type="submit" fullWidth loading={submitting} className="h-11 font-semibold rounded-xl text-sm mt-1">
            {submitting ? "Creating account..." : "Create account"}
          </Button>
        </form>
      </div>
    </AuthLayout>
  )
}