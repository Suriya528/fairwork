import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { FiBriefcase, FiUserCheck } from "react-icons/fi"
import { useAuth } from "@/context/AuthContext"
import { completeOAuthRoleSelection } from "@/services/authApi"
import { AuthLayout } from "@/components/auth/AuthLayout"
import { Button } from "@/components/ui/Button"

type Role = "client" | "freelancer"

export function SelectRolePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { loginSession } = useAuth()
  const roleSelectionToken: string | undefined = location.state?.roleSelectionToken
  const profile = location.state?.profile

  const [role, setRole] = useState<Role>("freelancer")
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!roleSelectionToken) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
          <h2 className="text-lg font-bold text-foreground">Session Invalid</h2>
          <p className="mt-2 text-sm text-subtle">No pending social account session found. Please try signing in again.</p>
          <button
            onClick={() => navigate("/register", { replace: true })}
            className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
          >
            Return to Registration
          </button>
        </div>
      </div>
    )
  }

  const displayName = profile?.firstName || profile?.email || "there"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErrorMsg(null)

    try {
      const session = await completeOAuthRoleSelection(roleSelectionToken, role)
      loginSession(session)
      navigate("/dashboard", { replace: true })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed"
      setErrorMsg(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      variant="register"
      title="Choose Your Role"
      subtitle={`Welcome ${displayName}! Select how you intend to use FairWork.`}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {errorMsg && (
          <div className="rounded-xl border border-danger/20 bg-danger/10 p-3.5 text-xs text-danger">
            {errorMsg}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-foreground">
            I want to <span className="text-danger">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                value: "client" as Role,
                title: "Hire Talent",
                desc: "Post project briefs & fund milestone escrow",
                icon: FiBriefcase,
              },
              {
                value: "freelancer" as Role,
                title: "Deliver Work",
                desc: "Submit proposals & earn USDC on completion",
                icon: FiUserCheck,
              },
            ].map((option) => {
              const Icon = option.icon
              const selected = role === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRole(option.value)}
                  className={`flex flex-col gap-2.5 rounded-2xl border p-4 text-left transition-all ${
                    selected
                      ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                      : "border-border bg-card hover:border-subtle"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                        selected ? "bg-primary text-primary-foreground" : "bg-muted text-subtle"
                      }`}
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <span
                      className={`h-4 w-4 rounded-full border ${
                        selected
                          ? "border-primary bg-primary ring-2 ring-primary/20"
                          : "border-border bg-card"
                      }`}
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{option.title}</h3>
                    <p className="mt-0.5 text-xs text-subtle leading-normal">{option.desc}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <Button type="submit" loading={submitting} className="w-full py-3">
          Complete Account Setup
        </Button>
      </form>
    </AuthLayout>
  )
}
