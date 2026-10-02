import { Link } from "react-router-dom"
import { Logo } from "@/components/common/Logo"

const footerSections = [
  {
    title: "Product",
    links: [
      { label: "Escrow Pipeline", href: "/#workflow-pipeline" },
      { label: "Core Features", href: "/#platform-features" },
      { label: "Milestone Studio", href: "/#milestone-composer" },
      { label: "Sepolia Contracts", href: "/#protocol-contracts" },
    ],
  },
  {
    title: "Disciplines",
    links: [
      { label: "Smart Contracts & Web3", href: "/projects?category=Web3+%26+Smart+Contracts" },
      { label: "Web Development", href: "/projects?category=Web+Development" },
      { label: "UI/UX Design", href: "/projects?category=UI%2FUX+Design" },
      { label: "AI & Machine Learning", href: "/projects?category=AI+%26+Machine+Learning" },
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
              <h3 className="text-xs font-mono font-medium uppercase tracking-wider text-subtle">
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
        </div>
      </div>
    </footer>
  )
}
