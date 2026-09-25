import { Link } from "react-router-dom"
import { FiCheckCircle, FiShield, FiGithub, FiGlobe, FiLock } from "react-icons/fi"
import { Logo } from "@/components/common/Logo"
import { useCurrency } from "@/context/CurrencyContext"
import { ThemeToggle } from "@/components/common/ThemeToggle"

const footerColumns = [
  {
    title: "Categories",
    links: [
      { label: "Web3 & Smart Contracts", href: "/projects?category=web3" },
      { label: "Programming & Tech", href: "/projects?category=dev" },
      { label: "UI/UX & Product Design", href: "/projects?category=design" },
      { label: "AI Services & Agents", href: "/projects?category=ai" },
      { label: "Mobile Apps", href: "/projects?category=mobile" },
      { label: "DevOps & Cloud Infra", href: "/projects?category=devops" },
      { label: "Security & Audits", href: "/projects?category=security" },
      { label: "Technical Writing", href: "/projects?category=writing" },
    ],
  },
  {
    title: "For Clients",
    links: [
      { label: "How FairWork Works", href: "/#how-it-works" },
      { label: "FairWork Pro Talent", href: "/projects" },
      { label: "Trust & Escrow Safety", href: "/#trust-guarantee" },
      { label: "Post a Project", href: "/register" },
      { label: "Dispute Arbitration", href: "/help" },
    ],
  },
  {
    title: "For Freelancers",
    links: [
      { label: "Become a Seller", href: "/register" },
      { label: "Explore Project Briefs", href: "/projects" },
      { label: "0% Take-Rate Model", href: "/#trust-guarantee" },
      { label: "Instant Crypto Payouts", href: "/#how-it-works" },
      { label: "Freelancer Guide", href: "/help" },
    ],
  },
  {
    title: "Legal & Standards",
    links: [
      { label: "Help Center", href: "/help" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Escrow Contract Rules", href: "/#trust-guarantee" },
      { label: "Open Source Codebase", href: "https://github.com/Suriya528/fairwork" },
    ],
  },
] as const

export function LandingFooter() {
  const currentYear = new Date().getFullYear()
  const { currency, setCurrency } = useCurrency()

  return (
    <footer className="w-full border-t border-border bg-base text-foreground" aria-label="Site footer">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Top 4-Column Directory Grid */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand Col */}
          <div className="flex flex-col gap-4 lg:col-span-1">
            <Link to="/" className="inline-block self-start" aria-label="FairWork Home">
              <div className="flex items-center gap-1">
                <Logo size="md" />
                <span className="h-2 w-2 rounded-full bg-emerald-500 -ml-1.5 mb-1" />
              </div>
            </Link>

            <p className="text-xs leading-relaxed text-muted max-w-xs">
              The world&apos;s leading freelance marketplace backed by non-custodial milestone escrow and zero platform commissions.
            </p>

            <div className="flex flex-col gap-2 pt-2 text-[11px] font-mono text-subtle">
              <div className="flex items-center gap-2">
                <FiCheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Ethereum Sepolia Testnet</span>
              </div>
              <div className="flex items-center gap-2">
                <FiLock className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Non-Custodial Escrow</span>
              </div>
              <div className="flex items-center gap-2">
                <FiShield className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                <span>48h Timelock Protection</span>
              </div>
            </div>
          </div>

          {/* Directory Links Columns */}
          <div className="grid gap-8 sm:grid-cols-2 lg:col-span-4 lg:grid-cols-4">
            {footerColumns.map((col) => (
              <div key={col.title} className="flex flex-col gap-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground font-mono">
                  {col.title}
                </h3>
                <ul className="flex flex-col gap-2.5" role="list">
                  {col.links.map(({ label, href }) => (
                    <li key={label}>
                      {href.startsWith("http") ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-muted hover:text-emerald-400 transition-colors"
                        >
                          {label}
                        </a>
                      ) : href.startsWith("#") || href.includes("/#") ? (
                        <a
                          href={href}
                          className="text-xs font-medium text-muted hover:text-emerald-400 transition-colors"
                        >
                          {label}
                        </a>
                      ) : (
                        <Link
                          to={href}
                          className="text-xs font-medium text-muted hover:text-emerald-400 transition-colors"
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
        </div>

        {/* Bottom Bar: Copyright, Language/Currency, Theme & Social */}
        <div className="mt-16 flex flex-col items-center justify-between border-t border-border pt-8 sm:flex-row gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-subtle">
              &copy; {currentYear} FairWork Protocol. Built for decentralized freelancing.
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Currency toggle */}
            <button
              type="button"
              onClick={() => setCurrency(currency === "USD" ? "INR" : "USD")}
              className="flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-mono font-semibold text-muted hover:border-border-strong hover:text-foreground transition-colors"
            >
              <FiGlobe className="h-3.5 w-3.5" />
              <span>{currency === "USD" ? "USD ($)" : "INR (₹)"}</span>
            </button>

            <ThemeToggle />

            <a
              href="https://github.com/Suriya528/fairwork"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-muted hover:text-foreground hover:bg-elevated transition-colors"
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
