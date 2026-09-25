import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  FiSearch,
  FiArrowRight,
  FiStar,
  FiShield,
  FiCheckCircle,
  FiLock,
  FiZap,
} from "react-icons/fi"
import { useAuth } from "@/context/AuthContext"
import { useCurrency } from "@/context/CurrencyContext"

const popularSearches = [
  "Smart Contract Audit",
  "React 19 & Next.js",
  "UI/UX Design",
  "AI Agents & Python",
  "Solidity Escrow",
  "Logo & Branding",
] as const

const trustedBrands = [
  { name: "Ethereum", symbol: "ETH" },
  { name: "Polygon", symbol: "POLYGON" },
  { name: "Arbitrum", symbol: "ARB" },
  { name: "OpenZeppelin", symbol: "OZ" },
  { name: "MetaMask", symbol: "WEB3" },
  { name: "Chainlink", symbol: "LINK" },
] as const

export function HeroSection() {
  const { status } = useAuth()
  const { formatAmount } = useCurrency()
  const navigate = useNavigate()
  const isAuthed = status === "authenticated"
  const destination = isAuthed ? "/projects" : "/register"

  const [searchQuery, setSearchQuery] = useState("")

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/projects?search=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      navigate("/projects")
    }
  }

  function handleTagClick(tag: string) {
    navigate(`/projects?search=${encodeURIComponent(tag)}`)
  }

  return (
    <section className="relative w-full bg-base border-b border-border/40 overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-20 lg:pt-40 lg:pb-24">
      {/* Background ambient mesh lighting */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-b from-emerald-500/15 via-primary/10 to-transparent blur-3xl" />
        <div className="absolute right-0 top-1/4 h-[350px] w-[350px] rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute left-0 top-1/3 h-[300px] w-[300px] rounded-full bg-emerald-600/10 blur-3xl" />
        {/* Subtle grid lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Fiverr-style Hero Headline & Search */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Pro Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400 mb-6 backdrop-blur-sm">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[11px] uppercase tracking-wider">
                Trusted by 15,000+ Freelancers &amp; Teams • 0% Platform Commission
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-balance text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl text-left">
              Find the right{" "}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400 bg-clip-text text-transparent">
                freelance service
              </span>
              , right away.
            </h1>

            {/* Subhead */}
            <p className="mt-5 text-base leading-relaxed text-muted sm:text-lg lg:text-xl text-left max-w-2xl">
              Scale your business with verified global talent. Milestone funds remain safely locked in non-custodial smart contracts until you inspect and approve the work.
            </p>

            {/* Fiverr-Style Hero Search Bar */}
            <form onSubmit={handleSearch} className="mt-8 w-full max-w-2xl">
              <div className="flex flex-col sm:flex-row items-stretch rounded-2xl sm:rounded-xl border-2 border-border bg-surface shadow-xl shadow-black/20 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all overflow-hidden p-1.5 sm:p-1">
                <div className="relative flex-1 flex items-center">
                  <FiSearch className="pointer-events-none absolute left-3.5 h-5 w-5 text-subtle" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for any service (e.g. smart contract audit, react website)..."
                    className="h-12 w-full bg-transparent pl-11 pr-4 text-sm text-foreground placeholder:text-subtle outline-none"
                    aria-label="Search freelance services"
                  />
                </div>
                <button
                  type="submit"
                  className="mt-2 sm:mt-0 flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-7 text-sm font-bold text-white transition-all hover:bg-emerald-500 active:scale-[0.98] shrink-0 shadow-md shadow-emerald-600/20"
                >
                  <FiSearch className="h-4 w-4" />
                  <span>Search</span>
                </button>
              </div>
            </form>

            {/* Popular Search Tag Pills */}
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted">
              <span className="font-semibold text-subtle">Popular:</span>
              {popularSearches.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagClick(tag)}
                  className="rounded-full border border-border bg-surface/80 px-3 py-1 text-xs text-muted transition-all hover:border-emerald-500/50 hover:bg-elevated hover:text-foreground cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Trusted By Strip */}
            <div className="mt-10 pt-6 border-t border-border/60 w-full">
              <p className="text-xs font-semibold uppercase tracking-wider text-subtle font-mono mb-3">
                Trusted by high-growth teams & protocols
              </p>
              <div className="flex flex-wrap items-center gap-6 sm:gap-8 opacity-75">
                {trustedBrands.map((brand) => (
                  <span
                    key={brand.name}
                    className="font-mono text-xs font-bold text-muted hover:text-foreground transition-colors tracking-widest uppercase flex items-center gap-1.5"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
                    {brand.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Fiverr-style Freelancer Spotlight & Escrow Card */}
          <div className="lg:col-span-5 w-full">
            <div className="relative">
              {/* Main Talent Showcase Card */}
              <div className="overflow-hidden rounded-2xl border border-border-strong bg-surface/95 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl">
                {/* Profile Header */}
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-emerald-500 to-blue-600 p-0.5">
                        <div className="h-full w-full rounded-full bg-surface flex items-center justify-center font-bold text-sm text-foreground">
                          AR
                        </div>
                      </div>
                      <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-surface" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-foreground">Alex Rivera</h3>
                        <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                          PRO VERIFIED
                        </span>
                      </div>
                      <p className="text-xs text-subtle">Smart Contract Security Auditor</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-bold text-amber-400">
                    <FiStar className="h-3.5 w-3.5 fill-amber-400" />
                    <span>5.0</span>
                    <span className="text-subtle font-normal">(86)</span>
                  </div>
                </div>

                {/* Gig Title */}
                <div className="mt-4">
                  <p className="text-sm font-semibold text-foreground leading-snug">
                    &quot;I will audit your Solidity smart contracts with formal verification & reorg safety&quot;
                  </p>
                </div>

                {/* Simulated Milestone Escrow Box */}
                <div className="mt-4 rounded-xl border border-border bg-base/80 p-3.5">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-mono text-subtle text-[11px]">Milestone Escrow Status</span>
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-emerald-400">
                      <FiLock className="h-3 w-3" />
                      {formatAmount(150000)} (1,500 USDC) Locked
                    </span>
                  </div>

                  <div className="flex h-2 w-full overflow-hidden rounded-full bg-surface border border-border">
                    <div className="h-full bg-emerald-500" style={{ width: "60%" }} title="Milestone 1 & 2 Approved" />
                    <div className="h-full bg-blue-500" style={{ width: "40%" }} title="Final Milestone In Review" />
                  </div>

                  <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono text-subtle">
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                      <FiCheckCircle className="h-3 w-3" /> Phase 1 Released
                    </span>
                    <span className="flex items-center gap-1 text-blue-400 font-semibold">
                      <FiZap className="h-3 w-3" /> Phase 2 In Review
                    </span>
                  </div>
                </div>

                {/* Price & Action */}
                <div className="mt-5 flex items-center justify-between pt-3 border-t border-border">
                  <div>
                    <span className="text-[11px] text-subtle uppercase tracking-wider font-mono">Starting at</span>
                    <div className="text-lg font-extrabold text-foreground font-mono">
                      {formatAmount(50000)} <span className="text-xs text-subtle font-normal">/ milestone</span>
                    </div>
                  </div>

                  <Link
                    to={destination}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary hover:bg-primary-hover px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-all"
                  >
                    <span>View Profile</span>
                    <FiArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {/* Floating Badge: Non-Custodial Security */}
              <div className="absolute -bottom-5 -left-4 hidden sm:flex items-center gap-2 rounded-xl border border-border bg-base/95 px-3.5 py-2 shadow-xl backdrop-blur-md">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                  <FiShield className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <p className="text-[11px] font-bold text-foreground">100% Escrow Protection</p>
                  <p className="text-[10px] text-subtle font-mono">Pay On Approval</p>
                </div>
              </div>

              {/* Floating Badge: Instant Payout */}
              <div className="absolute -top-4 -right-3 hidden sm:flex items-center gap-2 rounded-xl border border-border bg-base/95 px-3.5 py-2 shadow-xl backdrop-blur-md">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                  <FiZap className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <p className="text-[11px] font-bold text-foreground">Instant Wallet Payout</p>
                  <p className="text-[10px] text-subtle font-mono">On Client Approval</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
