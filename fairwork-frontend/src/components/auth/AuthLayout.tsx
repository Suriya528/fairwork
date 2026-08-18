import { useEffect } from "react"
import type { ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { FiX } from "react-icons/fi"
import { LandingPage } from "@/pages/LandingPage"
import { cn } from "@/lib/utils"

interface AuthLayoutProps {
  /** Page variant for authentication optimization. Defaults to "login". */
  variant?: "login" | "register" | "forgot-password"
  /** Form card heading, e.g. "Welcome back". */
  title: string
  /** Supporting copy under the heading. */
  subtitle: ReactNode
  children: ReactNode
  /** Optional footer row under the form (e.g. "Don't have an account?"). */
  footer?: ReactNode
}

/**
 * Shared Authentication Shell for FairWork.
 * Structure:
 *  - BACKGROUND: Crisp, unblurred FairWork Marketplace Landing Page
 *  - OVERLAY: Theme-aware translucent overlay veil without blur
 *  - FOREGROUND: Centered clean-bordered modal surface containing the auth form
 */
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: AuthLayoutProps) {
  const navigate = useNavigate()

  function handleClose() {
    navigate("/", { replace: false })
  }

  // Handle Escape key to return to homepage
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        handleClose()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <div className="relative min-h-screen w-full bg-base text-foreground">
      {/* HOMEPAGE PRODUCT CONTEXT LAYER (Crisp, sharp, unblurred) */}
      <div className="pointer-events-none select-none opacity-80" aria-hidden="true">
        <LandingPage />
      </div>

      {/* FOCUSED AUTHENTICATION OVERLAY & MODAL SURFACE (Zero blur) */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-overlay animate-fade-in"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleClose()
          }
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
          className={cn(
            "relative w-full max-w-md my-auto rounded-2xl border border-border-strong bg-surface p-6 sm:p-8 shadow-2xl animate-slide-up",
          )}
        >
          {/* Top Close Button (×) */}
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-xl text-muted hover:bg-elevated hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close authentication and return to homepage"
          >
            <FiX className="h-5 w-5" aria-hidden />
          </button>

          {/* Form Header */}
          <header className="mb-6 pr-8">
            <h1
              id="auth-modal-title"
              className="text-2xl font-bold tracking-tight text-foreground text-balance"
            >
              {title}
            </h1>
            <p className="mt-2 text-xs leading-relaxed text-muted text-pretty">
              {subtitle}
            </p>
          </header>

          {/* Form Content */}
          <div>{children}</div>

          {/* Optional Footer */}
          {footer && (
            <div className="mt-6 pt-5 border-t border-border/80 text-center text-xs text-muted">
              {footer}
            </div>
          )}

          {/* Legal Fineprint */}
          <footer className="mt-6 text-center text-[11px] leading-relaxed text-subtle font-mono">
            By continuing you agree to FairWork&apos;s{" "}
            <a
              href="#"
              className="text-muted underline-offset-2 transition-colors hover:text-foreground hover:underline"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="#"
              className="text-muted underline-offset-2 transition-colors hover:text-foreground hover:underline"
            >
              Privacy Policy
            </a>
            .
          </footer>
        </div>
      </div>
    </div>
  )
}
