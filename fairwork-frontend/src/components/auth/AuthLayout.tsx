import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import {
  FiShield,
  FiLock,
  FiCheckCircle,
  FiTrendingUp,
} from "react-icons/fi"

interface AuthLayoutProps {
  /** Form card heading, e.g. "Welcome back". */
  title: string
  /** Supporting copy under the heading. */
  subtitle: ReactNode
  children: ReactNode
  /** Optional footer row under the form (e.g. "Don't have an account?"). */
  footer?: ReactNode
}

const brandFeatures = [
  {
    icon: FiLock,
    title: "Escrow-backed payments",
    description: "Funds are secured on-chain until milestones are approved.",
  },
  {
    icon: FiCheckCircle,
    title: "Verified milestones",
    description: "Clear deliverables with mutual sign-off before release.",
  },
  {
    icon: FiTrendingUp,
    title: "Fair dispute resolution",
    description: "Neutral arbitration keeps every engagement accountable.",
  },
]

/**
 * Two-pane authentication shell.
 *  - lg+: brand/marketing panel on the left, form on the right.
 *  - mobile: compact logo header, form only.
 * All auth pages render their form fields as `children`.
 */
export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <main className="flex min-h-screen bg-background">
      {/* Brand panel — hidden on small screens */}
      <aside className="relative hidden w-[46%] max-w-2xl flex-col justify-between border-r border-border bg-surface p-12 lg:flex">
        <Link
          to="/login"
          className="inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FiShield className="h-5 w-5" aria-hidden />
          </span>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            FairWork
          </span>
        </Link>

        <div className="max-w-md">
          <h1 className="text-3xl font-semibold leading-tight text-foreground text-balance">
            The trust layer for independent work.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Contracts, escrow, and dispute resolution in one protocol — so
            clients and freelancers can collaborate with confidence.
          </p>

          <ul className="mt-10 flex flex-col gap-6">
            {brandFeatures.map((feature) => {
              const Icon = feature.icon
              return (
                <li key={feature.title} className="flex items-start gap-4">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <Icon className="h-4.5 w-4.5" aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {feature.title}
                    </p>
                    <p className="mt-0.5 text-sm leading-relaxed text-muted">
                      {feature.description}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="flex items-center gap-2 text-xs text-subtle">
          <span className="flex h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
          Trusted by 12,000+ teams to secure over $80M in contracts
        </div>
      </aside>

      {/* Form pane */}
      <section className="flex flex-1 flex-col px-5 py-8 sm:px-8">
        {/* Mobile logo */}
        <Link
          to="/login"
          className="mb-8 inline-flex items-center gap-2.5 self-start rounded-lg lg:hidden"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FiShield className="h-5 w-5" aria-hidden />
          </span>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            FairWork
          </span>
        </Link>

        <div className="flex flex-1 flex-col justify-center">
          <div className="mx-auto w-full max-w-sm animate-slide-up">
            <header className="mb-8">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
                {title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted text-pretty">
                {subtitle}
              </p>
            </header>

            {children}

            {footer && (
              <p className="mt-8 text-center text-sm text-muted">{footer}</p>
            )}
          </div>
        </div>

        <footer className="mx-auto mt-8 w-full max-w-sm">
          <p className="text-center text-xs leading-relaxed text-subtle">
            By continuing you agree to our{" "}
            <a
              href="#"
              className="text-muted underline-offset-2 transition-colors hover:text-foreground hover:underline"
            >
              Terms
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
