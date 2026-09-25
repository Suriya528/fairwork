import { Link } from "react-router-dom"
import { FiGithub, FiGlobe } from "react-icons/fi"
import { Logo } from "@/components/common/Logo"
import { useCurrency } from "@/context/CurrencyContext"
import { ThemeToggle } from "@/components/common/ThemeToggle"

const footerSections = [
  {
    title: "Product",
    links: [
      { label: "Workflow Pipeline", href: "/#workflow-pipeline" },
      { label: "Verified Contributors", href: "/#verified-contributors" },
      { label: "Milestone Composer", href: "/#milestone-composer" },
      { label: "Security Guardrails", href: "/#security-guardrails" },
    ],
  },
  {
    title: "Specializations",
    links: [
      { label: "Smart Contracts", href: "/projects?category=web3" },
      { label: "Web Applications", href: "/projects?category=dev" },
      { label: "Design Systems", href: "/projects?category=design" },
      { label: "Autonomous AI", href: "/projects?category=ai" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Help Center", href: "/help" },
      { label: "Open Source Repository", href: "https://github.com/Suriya528/fairwork" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
    ],
  },
] as const

export function LandingFooter() {
  const currentYear = new Date().getFullYear()
  const { currency, setCurrency } = useCurrency()

  return (
    <footer className="w-full border-t border-border bg-[#0d1117] text-foreground" aria-label="Site footer">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand Column */}
          <div className="flex flex-col gap-4">
            <Link to="/" className="inline-block self-start" aria-label="FairWork Home">
              <Logo size="md" />
            </Link>

            <p className="text-xs leading-relaxed text-muted max-w-xs">
              The developer and creator platform for milestone-verified projects and non-custodial smart contract settlement.
            </p>

            {/* GitHub-style System Status Indicator */}
            <div className="inline-flex items-center gap-2 font-mono text-[11px] text-subtle">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>All systems operational</span>
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
                    {href.startsWith("http") ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted hover:text-blue-400 transition-colors"
                      >
                        {label}
                      </a>
                    ) : href.includes("/#") ? (
                      <a
                        href={href}
                        className="text-xs text-muted hover:text-blue-400 transition-colors"
                      >
                        {label}
                      </a>
                    ) : (
                      <Link
                        to={href}
                        className="text-xs text-muted hover:text-blue-400 transition-colors"
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
        <div className="mt-12 flex flex-col items-center justify-between border-t border-border/60 pt-6 sm:flex-row gap-4">
          <p className="text-xs font-mono text-subtle">
            &copy; {currentYear} FairWork. Built for global engineering collaboration.
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCurrency(currency === "USD" ? "INR" : "USD")}
              className="flex items-center gap-1 rounded-md border border-border bg-[#161b22] px-2.5 py-1 text-xs font-mono text-muted hover:text-foreground transition-colors"
            >
              <FiGlobe className="h-3 w-3" />
              <span>{currency}</span>
            </button>

            <ThemeToggle />

            <a
              href="https://github.com/Suriya528/fairwork"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-[#161b22] text-muted hover:text-foreground transition-colors"
              aria-label="GitHub Repository"
            >
              <FiGithub className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
