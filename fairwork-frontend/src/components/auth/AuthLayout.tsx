import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import {
  FiLock,
  FiCheckCircle,
  FiZap,
  FiCpu,
  FiLayers,
  FiCheck,
  FiUserPlus,
  FiFileText,
  FiArrowLeft,
  FiShield,
} from "react-icons/fi"
import { Logo } from "@/components/common/Logo"
import { cn } from "@/lib/utils"

interface AuthLayoutProps {
  /** Page variant for left-panel optimization. Defaults to "login". */
  variant?: "login" | "register" | "forgot-password"
  /** Form card heading, e.g. "Welcome back". */
  title: string
  /** Supporting copy under the heading. */
  subtitle: ReactNode
  children: ReactNode
  /** Optional footer row under the form (e.g. "Don't have an account?"). */
  footer?: ReactNode
}

/** Login Left-Panel Content: 3 full protocol pillars for returning users */
const loginPillars = [
  {
    icon: FiLock,
    title: "Milestone Escrow",
    description: "Funds locked safely in smart contracts prior to project kickoff.",
    badge: "Non-Custodial",
  },
  {
    icon: FiCheckCircle,
    title: "Deliverable Review",
    description: "Clients inspect work deliverables before authorizing milestone release.",
    badge: "Verified Sign-Off",
  },
  {
    icon: FiZap,
    title: "Direct P2P Settlement",
    description: "Approved payments transfer directly to the freelancer's wallet.",
    badge: "Instant Release",
  },
]

/** Register Left-Panel Content: 4 lightweight onboarding benefits arranged in a clean connected timeline */
const registerHighlights = [
  {
    icon: FiShield,
    title: "Zero Upfront Payment Risk",
    description: "Clients lock milestone funds in escrow before kickoff. Freelancers start work with 100% payment assurance.",
  },
  {
    icon: FiCheck,
    title: "Transparent Smart Contracts",
    description: "Milestone status, deliverables, and payment releases are tracked immutably on-chain.",
  },
  {
    icon: FiFileText,
    title: "Neutral Dispute Arbitration",
    description: "Fair, evidence-based dispute resolution protects both clients and freelancers if work is contested.",
  },
  {
    icon: FiZap,
    title: "Direct Wallet Settlement",
    description: "Approved funds transfer directly to your Web3 wallet without platform hold periods or extra fees.",
  },
]

/**
 * Shared Authentication Shell for FairWork.
 * Structure:
 *  - TOP BAR: Global Public Auth Navigation (Home | Login | Sign Up)
 *  - RESPONSIVE ORDERING:
 *      * Desktop (lg+): Left Branding Panel | Right Form Section
 *      * Small Screens (<lg): Form Section FIRST | Branding Panel SECOND
 *  - SCROLLING: Single document window flow (zero nested scrollbars)
 */
export function AuthLayout({
  variant = "login",
  title,
  subtitle,
  children,
  footer,
}: AuthLayoutProps) {
  const isRegister = variant === "register"

  return (
    <div className="min-h-screen w-full bg-base text-foreground flex flex-col">
      {/* GLOBAL PUBLIC/AUTH TOP NAVIGATION */}
      <header className="w-full border-b border-border/80 bg-base/90 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 py-3 flex items-center justify-between">
        <Link to="/" aria-label="FairWork Home">
          <Logo size="md" />
        </Link>

        {/* Global Public Auth Links */}
        <nav className="flex items-center gap-2.5 text-xs font-medium font-mono" aria-label="Global public auth navigation">
          <Link
            to="/"
            className="text-muted transition-colors hover:text-foreground"
          >
            Home
          </Link>
          <span className="text-subtle/40" aria-hidden>|</span>
          <Link
            to="/login"
            className={cn(
              "transition-colors rounded-md px-2 py-0.5 ai-glow-cta",
              variant === "login"
                ? "font-bold text-primary"
                : "text-muted hover:text-foreground",
            )}
          >
            Login
          </Link>
          <span className="text-subtle/40" aria-hidden>|</span>
          <Link
            to="/register"
            className={cn(
              "transition-colors",
              variant === "register"
                ? "font-bold text-primary"
                : "text-muted hover:text-foreground",
            )}
          >
            Sign Up
          </Link>
        </nav>
      </header>

      {/* RESPONSIVE LAYOUT BODY */}
      <main className="flex-1 flex flex-col lg:flex-row w-full">
        {/* FORM SECTION — First on Mobile/Tablet (order-1), Second on Desktop (lg:order-2) */}
        <section className="order-1 lg:order-2 flex w-full lg:w-1/2 flex-col justify-between p-4 sm:p-8 lg:p-12">
          {/* Form Card Container */}
          <div className="w-full max-w-md mx-auto py-4 sm:py-6">
            <div className="rounded-2xl border border-border bg-surface/90 p-6 sm:p-8 shadow-xl shadow-black/30 backdrop-blur-md">
              <header className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-foreground text-balance">
                  {title}
                </h2>
                <p className="mt-2 text-xs leading-relaxed text-muted text-pretty">
                  {subtitle}
                </p>
              </header>

              {children}

              {footer && (
                <div className="mt-6 pt-5 border-t border-border/80 text-center text-xs text-muted">
                  {footer}
                </div>
              )}
            </div>
          </div>

          {/* Footer Legal Links */}
          <footer className="w-full max-w-md mx-auto text-center py-2">
            <p className="text-[11px] leading-relaxed text-subtle font-mono">
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
            </p>
          </footer>
        </section>

        {/* BRANDING PANEL — Second on Mobile/Tablet (order-2), First on Desktop (lg:order-1) */}
        <aside className="order-2 lg:order-1 relative flex w-full lg:w-1/2 flex-col justify-between border-t lg:border-t-0 lg:border-r border-border bg-surface p-6 sm:p-8 xl:p-12">
          {/* Ambient lighting background glow */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
            <div className="absolute left-0 top-0 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-[350px] w-[350px] translate-x-1/3 translate-y-1/3 rounded-full bg-emerald-500/10 blur-3xl" />
          </div>

          {/* Contextual "Back to Home" Link */}
          <div className="relative z-10 flex items-center justify-between mb-6">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition-colors hover:text-foreground font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md px-1 py-0.5"
            >
              <FiArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Home</span>
            </Link>
          </div>

          {/* Left panel marketing content with natural vertical rhythm */}
          <div className="relative z-10 max-w-lg py-2 sm:py-4 flex-1 flex flex-col justify-start gap-6">
            {isRegister ? (
              /* Register Left Panel — Connected vertical timeline */
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary font-mono mb-4">
                  <FiUserPlus className="h-3.5 w-3.5" />
                  <span>Onboarding Protocol</span>
                </div>

                <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-foreground xl:text-3xl text-balance">
                  Start building with guaranteed payment protection.
                </h1>
                <p className="mt-3 text-xs leading-relaxed text-muted">
                  Create your account to post project briefs or deliver work with escrow-backed milestone security.
                </p>

                <div className="relative mt-6 ml-2 pl-6 border-l border-border/80 flex flex-col gap-5">
                  {registerHighlights.map((item) => {
                    const Icon = item.icon
                    return (
                      <div key={item.title} className="relative flex items-start gap-3">
                        <span className="absolute -left-[31px] top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-surface border border-border text-primary shadow-sm">
                          <Icon className="h-3 w-3 text-emerald-400" aria-hidden />
                        </span>
                        <div>
                          <h3 className="text-xs font-bold text-foreground tracking-tight">{item.title}</h3>
                          <p className="mt-1 text-xs leading-relaxed text-muted">{item.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              /* Login Left Panel — Concise 3 protocol pillars */
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400 font-mono mb-4">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Escrow Protocol Active</span>
                </div>

                <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-foreground xl:text-3xl text-balance">
                  The trust layer for independent work.
                </h1>
                <p className="mt-3 text-xs leading-relaxed text-muted">
                  Contracts, milestone escrow, and arbitrator dispute resolution in one unified platform.
                </p>

                <div className="mt-6 flex flex-col gap-3.5">
                  {loginPillars.map((item) => {
                    const Icon = item.icon
                    return (
                      <div
                        key={item.title}
                        className="flex items-start gap-3.5 rounded-xl border border-border/80 bg-base/60 p-3.5 backdrop-blur-sm transition-colors hover:border-border-strong"
                      >
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-elevated text-primary border border-border">
                          <Icon className="h-4 w-4" aria-hidden />
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-foreground">{item.title}</p>
                            <span className="rounded bg-elevated px-1.5 py-0.5 font-mono text-[9px] font-medium text-subtle border border-border">
                              {item.badge}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Left Footer Protocol Status */}
          <div className="relative z-10 flex items-center justify-between border-t border-border/80 pt-4 text-xs text-subtle font-mono mt-6">
            <div className="flex items-center gap-2">
              <FiCpu className="h-3.5 w-3.5 text-primary" />
              <span>Arbitrum & ETH Testnet</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FiLayers className="h-3.5 w-3.5 text-emerald-400" />
              <span>Escrow v1.0</span>
            </div>
          </div>
        </aside>
      </main>
    </div>
  )
}
