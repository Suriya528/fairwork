import { Link } from "react-router-dom"
import { FiShield, FiCpu, FiCheckCircle } from "react-icons/fi"

/**
 * Footer links — only routes that actually exist in the application.
 * No links to nonexistent pages.
 */
const footerSections = [
  {
    title: "Marketplace",
    links: [
      { label: "How It Works", href: "#how-it-works" },
      { label: "Category Taxonomy", href: "#categories" },
    ],
  },
  {
    title: "Get Started",
    links: [
      { label: "Create Account", href: "/register" },
      { label: "Find Freelancers", href: "/register" },
    ],
  },
  {
    title: "Account & Portal",
    links: [
      { label: "Log In", href: "/login" },
      { label: "Sign Up", href: "/register" },
    ],
  },
] as const

export function LandingFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="w-full border-t border-border bg-surface/80 text-foreground backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand & Protocol Status column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <FiShield className="h-4 w-4" aria-hidden />
              </span>
              <span className="text-base font-bold tracking-tight text-foreground">
                FairWork
              </span>
            </div>

            <p className="mt-3 max-w-xs text-xs leading-relaxed text-muted">
              A blockchain-powered freelancing marketplace with escrow-backed milestone payments and transparent dispute resolution.
            </p>

            <div className="mt-4 flex flex-col gap-1.5 pt-2">
              <div className="inline-flex items-center gap-2 font-mono text-[11px] text-subtle">
                <FiCheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                <span>Arbitrum & Ethereum Testnet</span>
              </div>
              <div className="inline-flex items-center gap-2 font-mono text-[11px] text-subtle">
                <FiCpu className="h-3.5 w-3.5 text-blue-400" />
                <span>EIP-712 Signed Contracts</span>
              </div>
            </div>
          </div>

          {/* Link columns */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-subtle font-mono">
                {section.title}
              </h3>
              <ul className="mt-4 flex flex-col gap-2.5" role="list">
                {section.links.map(({ label, href }) => (
                  <li key={label}>
                    {href.startsWith("#") ? (
                      <a
                        href={href}
                        className="text-xs text-muted transition-colors hover:text-foreground"
                      >
                        {label}
                      </a>
                    ) : (
                      <Link
                        to={href}
                        className="text-xs text-muted transition-colors hover:text-foreground"
                      >
                        {label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between border-t border-border/80 pt-6 sm:flex-row gap-3">
          <p className="text-xs text-subtle font-mono">
            &copy; {currentYear} FairWork Protocol. All rights reserved.
          </p>

          <div className="flex items-center gap-4 text-xs font-mono text-subtle">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Protocol v1.0 Operational</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
