import { Link } from "react-router-dom"
import { FiGlobe } from "react-icons/fi"
import { Logo } from "@/components/common/Logo"
import { useCurrency } from "@/context/CurrencyContext"
import { ThemeToggle } from "@/components/common/ThemeToggle"

const footerSections = [
  {
    title: "Product",
    links: [
      { label: "Escrow Pipeline", href: "/#workflow-pipeline" },
      { label: "Specialists", href: "/#verified-specialists" },
      { label: "Milestone Studio", href: "/#milestone-composer" },
      { label: "Buyer Protection", href: "/#security-guardrails" },
    ],
  },
  {
    title: "Disciplines",
    links: [
      { label: "Smart Contracts", href: "/projects?category=web3" },
      { label: "Full-Stack Web", href: "/projects?category=dev" },
      { label: "Design Systems", href: "/projects?category=design" },
      { label: "Autonomous AI", href: "/projects?category=ai" },
    ],
  },
  {
    title: "Platform",
    links: [
      { label: "Help Center", href: "/help" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
    ],
  },
] as const

export function LandingFooter() {
  const currentYear = new Date().getFullYear()
  const { currency, setCurrency } = useCurrency()

  return (
    <footer className="w-full border-t border-border bg-surface text-foreground" aria-label="Site footer">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand Column */}
          <div className="flex flex-col gap-4">
            <Link to="/" className="inline-block self-start" aria-label="FairWork Home">
              <Logo size="md" />
            </Link>

            <p className="text-xs leading-relaxed text-muted max-w-xs">
              The premier platform for milestone-verified technical projects and non-custodial smart contract escrow settlement.
            </p>

            <div className="inline-flex items-center gap-2 font-mono text-[11px] text-subtle">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Smart Contracts Operational</span>
            </div>
          </div>

          {/* Navigation Columns */}
          {footerSections.map((section) => (
            <div key={section.title} className="flex flex-col gap-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-subtle">
                {section.title}
              </h3>
              <ul className="flex flex-col gap-2" role="list">
                {section.links.map(({ label, href }) => (
                  <li key={label}>
                    {href.includes("/#") ? (
                      <a
                        href={href}
                        className="text-xs text-muted hover:text-primary transition-colors"
                      >
                        {label}
                      </a>
                    ) : (
                      <Link
                        to={href}
                        className="text-xs text-muted hover:text-primary transition-colors"
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

        {/* Bottom Legal & Utility Bar */}
        <div className="mt-12 flex flex-col items-center justify-between border-t border-border/70 pt-6 sm:flex-row gap-4">
          <p className="text-xs font-mono text-subtle">
            &copy; {currentYear} FairWork. Secured by decentralized milestone escrow.
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCurrency(currency === "USD" ? "INR" : "USD")}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-elevated px-2.5 py-1 text-xs font-mono text-muted hover:text-foreground transition-colors"
            >
              <FiGlobe className="h-3 w-3" />
              <span>{currency}</span>
            </button>

            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  )
}
