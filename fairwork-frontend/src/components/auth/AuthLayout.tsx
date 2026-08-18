import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import {
  FiShield,
  FiLock,
  FiCheckCircle,
  FiZap,
  FiCpu,
  FiLayers,
  FiCheck,
  FiUserPlus,
  FiFileText,
  FiArrowLeft,
} from "react-icons/fi"

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
 * Unified two-column authentication shell for FairWork.
 *  - Left Panel (lg:w-1/2): Branded marketing panel with logo, value proposition, and protocol highlights.
 *  - Right Panel (lg:w-1/2): Centered auth form card with top navigation link back to public landing (`/`).
 *  - Responsive: Collapses back to a single column below `lg:` with a mobile header.
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
    <main className="min-h-screen w-full bg-base text-foreground flex flex-col lg:flex-row">
      {/* Left Brand Panel — visible at lg: and above (50% desktop split) */}
      <aside className="relative hidden lg:flex lg:w-1/2 flex-col justify-between border-r border-border bg-surface p-8 xl:p-12 min-h-screen">
        {/* Ambient lighting background glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="absolute left-0 top-0 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-[350px] w-[350px] translate-x-1/3 translate-y-1/3 rounded-full bg-emerald-500/10 blur-3xl" />
        </div>

        {/* Brand logo & home link */}
        <div className="relative z-10 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 rounded-xl transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
              <FiShield className="h-5 w-5" aria-hidden />
            </span>
            <span className="text-xl font-bold tracking-tight text-foreground font-sans">
              FairWork
            </span>
          </Link>

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition-colors hover:text-foreground font-mono"
          >
            <FiArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Left panel marketing content */}
        <div className="relative z-10 my-auto py-8 max-w-lg">
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

              <div className="relative mt-8 ml-2 pl-6 border-l border-border/80 flex flex-col gap-6">
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
        <div className="relative z-10 flex items-center justify-between border-t border-border/80 pt-5 text-xs text-subtle font-mono">
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

      {/* Right Form Section (50% desktop split) */}
      <section className="flex w-full lg:w-1/2 flex-col justify-between p-6 sm:p-10 lg:p-12 min-h-screen">
        {/* Navigation Bar (Top of Right Panel) */}
        <header className="flex justify-between items-center w-full max-w-md mx-auto mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-opacity hover:opacity-90"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
              <FiShield className="h-5 w-5" aria-hidden />
            </span>
            <span className="text-lg font-bold tracking-tight text-foreground font-sans">
              FairWork
            </span>
          </Link>

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition-colors hover:text-foreground font-mono"
          >
            <FiArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Home</span>
          </Link>
        </header>

        {/* Form Card Container — Perfectly centered in right half */}
        <div className="my-auto w-full max-w-md mx-auto py-4">
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
    </main>
  )
}
