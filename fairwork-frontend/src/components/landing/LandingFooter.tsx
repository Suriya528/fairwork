import { Link } from "react-router-dom"
import { FiCpu, FiCheckCircle, FiShield } from "react-icons/fi"
import { Logo } from "@/components/common/Logo"

/**
 * Validated footer link categories.
 * All destinations point to verified public routes (/login, /register, /help)
 * or active homepage anchor sections (/#how-it-works, /#categories).
 * No fake routes, no dead links, and no exposed private routes.
 */
const footerSections = [
  {
    title: "For Clients",
    links: [
      { label: "Post a Project", href: "/register" },
      { label: "Find Freelancers", href: "/register" },
      { label: "How It Works", href: "/#how-it-works" },
    ],
  },
  {
    title: "For Freelancers",
    links: [
      { label: "Find Work", href: "/register" },
      { label: "Explore Categories", href: "/#categories" },
      { label: "Payment Escrow", href: "/#how-it-works" },
    ],
  },
  {
    title: "Platform & Portal",
    links: [
      { label: "Sign In", href: "/login" },
      { label: "Create Account", href: "/register" },
      { label: "Help Center", href: "/help" },
    ],
  },
] as const

export function LandingFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="w-full border-t border-border bg-surface text-foreground" aria-label="Site footer">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand & Protocol Status Column */}
          <div className="flex flex-col gap-4 lg:col-span-1">
            <Link to="/" className="inline-block self-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg" aria-label="FairWork Home">
              <Logo size="md" />
            </Link>

            <p className="max-w-xs text-xs leading-relaxed text-muted">
              FairWork connects clients and technical freelancers through milestone-based projects and escrow-protected payments.
            </p>

            {/* Protocol Identity Indicators */}
            <div className="flex flex-col gap-2 pt-1 font-mono text-[11px] text-subtle">
              <div className="inline-flex items-center gap-2">
                <FiCheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" aria-hidden />
                <span>Arbitrum &amp; Ethereum Testnet</span>
              </div>
              <div className="inline-flex items-center gap-2">
                <FiCpu className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden />
                <span>EIP-712 Signed Contracts</span>
              </div>
              <div className="inline-flex items-center gap-2">
                <FiShield className="h-3.5 w-3.5 text-emerald-400 shrink-0" aria-hidden />
                <span>Non-Custodial Escrow</span>
              </div>
            </div>
          </div>

          {/* Link Groups */}
          <nav className="grid gap-8 sm:grid-cols-3 lg:col-span-3" aria-label="Footer navigation">
            {footerSections.map((section) => (
              <div key={section.title} className="flex flex-col gap-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-subtle font-mono">
                  {section.title}
                </h3>
                <ul className="flex flex-col gap-2.5" role="list">
                  {section.links.map(({ label, href }) => (
                    <li key={label}>
                      {href.startsWith("#") ? (
                        <a
                          href={href}
                          className="inline-block py-0.5 text-xs font-medium text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
                        >
                          {label}
                        </a>
                      ) : (
                        <Link
                          to={href}
                          className="inline-block py-0.5 text-xs font-medium text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
                        >
                          {label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom Legal & Operational Bar */}
        <div className="mt-12 flex flex-col items-center justify-between border-t border-border/80 pt-6 sm:flex-row gap-4">
          <p className="text-xs text-subtle font-mono">
            &copy; {currentYear} FairWork Protocol. All rights reserved.
          </p>

          <div className="flex items-center gap-4 text-xs font-mono text-subtle">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden />
              <span>Protocol v1.0 Operational</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
