import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  FiShield,
  FiCheckCircle,
  FiArrowRight,
  FiSearch,
  FiLock,
  FiZap,
  FiLayers,
  FiCheck,
  FiDollarSign,
} from "react-icons/fi"
import { useAuth } from "@/context/AuthContext"
import { useCurrency } from "@/context/CurrencyContext"

const quickCategories = [
  { label: "Smart Contracts", query: "Web3 & Smart Contracts" },
  { label: "Web Applications", query: "Web Development" },
  { label: "UI/UX Design", query: "UI/UX Design" },
  { label: "Autonomous AI", query: "AI & Machine Learning" },
  { label: "Mobile Apps", query: "Mobile Development" },
] as const

type StudioTab = "escrow" | "deliverables" | "settlement"

export function HeroSection() {
  const { status, user } = useAuth()
  const { formatAmount } = useCurrency()
  const navigate = useNavigate()
  const isAuthed = status === "authenticated"
  const isClient = isAuthed && user?.role === "client"
  const destination = isAuthed ? (isClient ? "/projects/new" : "/projects") : "/register"

  const [inputQuery, setInputQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [activeTab, setActiveTab] = useState<StudioTab>("escrow")

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (inputQuery.trim()) params.set("search", inputQuery.trim())
    if (selectedCategory && selectedCategory !== "all") params.set("category", selectedCategory)
    const queryString = params.toString()
    navigate(queryString ? `/projects?${queryString}` : "/projects")
  }

  return (
    <section className="relative w-full bg-base border-b border-border/40 pt-28 pb-20 sm:pt-36 sm:pb-28 overflow-hidden">
      {/* Ambient background glow & radial grid */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute left-1/2 top-0 h-[640px] w-[1000px] -translate-x-1/2 rounded-full bg-gradient-to-b from-cyan-500/10 via-teal-500/5 to-transparent blur-3xl" />
        <div className="absolute right-1/4 top-1/4 h-[380px] w-[380px] rounded-full bg-indigo-500/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Centered Hero Content Header */}
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Centered Monumental Title with elegant optical weights */}
          <h1 className="text-balance text-4xl sm:text-6xl lg:text-7xl font-light tracking-tight text-foreground leading-[1.12]">
            Where ambitious projects get built.{" "}
            <span className="block font-normal text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-200 to-emerald-300">
              Guaranteed by milestone escrow.
            </span>
          </h1>

          {/* Centered Subtitle */}
          <p className="mt-6 text-base text-muted/90 sm:text-xl leading-relaxed max-w-2xl font-light">
            Commission verified specialists, inspect deliverables against clear milestone criteria, and release payments directly to creator wallets with 0% platform fee deduction.
          </p>

          {/* Amazon / Airbnb Style Universal Department & Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="mt-10 w-full max-w-3xl rounded-2xl border border-border/80 bg-surface/90 p-2 shadow-2xl backdrop-blur-md flex flex-col sm:flex-row items-stretch gap-2"
          >
            {/* Department Dropdown Selector */}
            <div className="relative sm:w-48 shrink-0">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                aria-label="Select discipline"
                className="h-12 w-full appearance-none rounded-xl border-0 bg-elevated/60 px-3.5 pr-8 text-xs font-medium text-foreground focus:bg-elevated focus:outline-none cursor-pointer"
              >
                <option value="all">All Disciplines</option>
                <option value="Web3 & Smart Contracts">Smart Contracts &amp; Web3</option>
                <option value="Web Development">Web Development</option>
                <option value="UI/UX Design">UI/UX Design</option>
                <option value="AI & Machine Learning">AI &amp; Machine Learning</option>
                <option value="Mobile Development">Mobile Development</option>
                <option value="Backend & API Systems">Backend &amp; API Systems</option>
                <option value="Cloud & DevOps">Cloud &amp; DevOps</option>
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-subtle text-xs">
                ▼
              </div>
            </div>

            {/* Keyword Search Input */}
            <div className="relative flex-1">
              <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Search deliverable packages, audits, apps, tokens..."
                className="h-12 w-full rounded-xl border-0 bg-transparent pl-10 pr-4 text-xs sm:text-sm font-normal text-foreground placeholder:text-subtle focus:outline-none"
                aria-label="Search query"
              />
            </div>

            {/* High-conversion Search CTA */}
            <button
              type="submit"
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-hover px-6 text-xs sm:text-sm font-medium text-white shadow-sm transition-all shrink-0 cursor-pointer"
            >
              <span>Explore Briefs</span>
              <FiArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Quick Department Filter Pills */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-subtle font-mono text-[11px]">Popular:</span>
            {quickCategories.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => navigate(`/projects?search=${encodeURIComponent(item.query)}`)}
                className="rounded-full border border-border/70 bg-surface/70 px-3 py-1 text-[11px] font-normal text-muted hover:border-border-strong hover:text-foreground transition-colors cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Hero Feature Badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-muted/80 font-mono">
            <span className="inline-flex items-center gap-1.5">
              <FiShield className="h-3.5 w-3.5 text-emerald-400" />
              100% Escrow Protection
            </span>
            <span className="inline-flex items-center gap-1.5">
              <FiZap className="h-3.5 w-3.5 text-sky-400" />
              Instant Wallet Payout
            </span>
            <span className="inline-flex items-center gap-1.5">
              <FiDollarSign className="h-3.5 w-3.5 text-indigo-400" />
              0% Platform Commission
            </span>
          </div>
        </div>

        {/* Centered Smart Contract Escrow & Deliverable Studio (Linear + Stripe Precision) */}
        <div className="mt-14 max-w-5xl mx-auto overflow-hidden rounded-2xl border border-border bg-surface/90 shadow-2xl backdrop-blur-xl">
          {/* Studio Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border bg-elevated/40 px-5 py-3.5 gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <FiLock className="h-3.5 w-3.5" />
              </span>
              <div>
                <span className="text-xs font-medium text-foreground">Interactive Escrow Studio</span>
                <span className="text-[11px] text-subtle font-mono block sm:inline sm:ml-2">
                  Vault ID: #FW-8842-SEPOLIA
                </span>
              </div>
            </div>

            {/* Studio Navigation Tabs */}
            <div className="flex items-center rounded-lg border border-border bg-surface p-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("escrow")}
                className={`rounded-md px-3 py-1 transition-colors cursor-pointer ${
                  activeTab === "escrow"
                    ? "bg-elevated text-foreground shadow-xs font-medium"
                    : "text-muted hover:text-foreground font-normal"
                }`}
              >
                Escrow Ledger
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("deliverables")}
                className={`rounded-md px-3 py-1 transition-colors cursor-pointer ${
                  activeTab === "deliverables"
                    ? "bg-elevated text-foreground shadow-xs font-medium"
                    : "text-muted hover:text-foreground font-normal"
                }`}
              >
                Inspection Checklist
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("settlement")}
                className={`rounded-md px-3 py-1 transition-colors cursor-pointer ${
                  activeTab === "settlement"
                    ? "bg-elevated text-foreground shadow-xs font-medium"
                    : "text-muted hover:text-foreground font-normal"
                }`}
              >
                Settlement Flow
              </button>
            </div>
          </div>

          {/* 4-Stage Visual Settlement Pipeline */}
          <div className="border-b border-border/80 bg-surface/50 p-4 sm:p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {[
                {
                  step: "01",
                  title: "Deposit Locked",
                  desc: "USDC secured in vault",
                  status: "completed",
                },
                {
                  step: "02",
                  title: "Milestone Execution",
                  desc: "Work in staging review",
                  status: "completed",
                },
                {
                  step: "03",
                  title: "Deliverable Signoff",
                  desc: "Client review window",
                  status: "active",
                },
                {
                  step: "04",
                  title: "Direct Payout",
                  desc: "0% fee straight to creator",
                  status: "ready",
                },
              ].map((stage) => {
                const isCompleted = stage.status === "completed"
                const isActive = stage.status === "active"
                return (
                  <div
                    key={stage.step}
                    className={`rounded-xl border p-3.5 transition-all ${
                      isActive
                        ? "border-emerald-500/50 bg-emerald-500/10 shadow-xs"
                        : isCompleted
                          ? "border-border bg-elevated/40"
                          : "border-border/60 bg-surface/40 opacity-75"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono mb-1">
                      <span className="text-subtle font-medium">{stage.step}</span>
                      {isCompleted ? (
                        <FiCheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                      ) : isActive ? (
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-subtle" />
                      )}
                    </div>
                    <p className="text-xs font-medium text-foreground">{stage.title}</p>
                    <p className="text-[11px] text-muted mt-0.5">{stage.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Tab 1 Content: Escrow Ledger */}
          {activeTab === "escrow" && (
            <div className="p-5 sm:p-7 grid gap-6 md:grid-cols-12 items-center">
              <div className="md:col-span-7 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div>
                    <h3 className="text-sm sm:text-base font-medium text-foreground">
                      Milestone 02: Production dApp Interface &amp; Invariant Tests
                    </h3>
                    <p className="text-xs text-muted mt-0.5 font-light">
                      Client committed deposit • Mutual 48-hour timelock active
                    </p>
                  </div>
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-xs font-medium text-emerald-400">
                    Vault Funded
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="rounded-lg border border-border bg-elevated/50 p-3">
                    <span className="text-[10px] text-subtle uppercase block">Secured Balance</span>
                    <span className="text-base font-medium text-foreground mt-0.5 block">
                      {formatAmount(2400)}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-normal">Locked on-chain</span>
                  </div>
                  <div className="rounded-lg border border-border bg-elevated/50 p-3">
                    <span className="text-[10px] text-subtle uppercase block">Platform Deduction</span>
                    <span className="text-base font-medium text-emerald-400 mt-0.5 block">$0.00</span>
                    <span className="text-[10px] text-subtle font-normal">100% to creator</span>
                  </div>
                </div>

                <p className="text-xs text-muted leading-relaxed font-sans font-light">
                  The client has funded this milestone into the smart contract escrow lockbox. Funds are completely protected from unilateral withdrawal while deliverables are submitted and reviewed.
                </p>
              </div>

              <div className="md:col-span-5 rounded-xl border border-border bg-elevated/70 p-4 font-mono text-xs space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-border/60 text-[11px] text-subtle">
                  <span>Smart Contract State</span>
                  <span className="text-emerald-400">Verified</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-subtle">Contract Address:</span>
                  <span className="text-foreground">0x71C...a89B</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-subtle">Dispute Arbiter:</span>
                  <span className="text-foreground">Decentralized</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-subtle">Release Trigger:</span>
                  <span className="text-foreground font-medium">Client Wallet Sig</span>
                </div>
                <div className="pt-2 border-t border-border/60">
                  <Link
                    to={destination}
                    className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-sans text-xs font-medium text-white transition-colors"
                  >
                    <span>Commission Similar Milestone</span>
                    <FiArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2 Content: Inspection Checklist */}
          {activeTab === "deliverables" && (
            <div className="p-5 sm:p-7 space-y-4">
              <div className="border-b border-border pb-3">
                <h3 className="text-sm sm:text-base font-medium text-foreground">
                  Deliverable Inspection Criteria
                </h3>
                <p className="text-xs text-muted mt-0.5 font-light">
                  Clear specifications verified prior to milestone escrow release.
                </p>
              </div>

              <div className="divide-y divide-border/60 rounded-xl border border-border bg-elevated/40 text-xs">
                {[
                  {
                    name: "Automated Test Suite & Typecheck",
                    detail: "100% unit tests pass with zero runtime regressions",
                    status: "passed",
                  },
                  {
                    name: "Staging Preview Deployment",
                    detail: "Responsive UI preview live on custom verification URL",
                    status: "passed",
                  },
                  {
                    name: "Security Analysis & Invariant Testing",
                    detail: "Automated security report generated with 0 high/critical issues",
                    status: "passed",
                  },
                  {
                    name: "Client Deliverable Review",
                    detail: "Client inspection window open for signoff and release",
                    status: "pending",
                  },
                ].map((item) => (
                  <div key={item.name} className="flex items-center justify-between p-3.5">
                    <div className="flex items-center gap-2.5">
                      {item.status === "passed" ? (
                        <FiCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : (
                        <FiLayers className="h-4 w-4 text-sky-400 shrink-0" />
                      )}
                      <div>
                        <p className="font-medium text-foreground">{item.name}</p>
                        <p className="text-[11px] text-muted font-light">{item.detail}</p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-medium uppercase px-2 py-0.5 rounded ${
                        item.status === "passed"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-sky-500/10 text-sky-400"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3 Content: Settlement Flow */}
          {activeTab === "settlement" && (
            <div className="p-5 sm:p-7 grid gap-6 md:grid-cols-12 items-center">
              <div className="md:col-span-6 space-y-3">
                <h3 className="text-sm sm:text-base font-medium text-foreground">
                  Direct Wallet-to-Wallet Settlement
                </h3>
                <p className="text-xs text-muted leading-relaxed font-light">
                  When the client confirms the deliverable, FairWork executes the smart contract release. Funds transfer directly to the creator&apos;s wallet without intermediary custody or holding periods.
                </p>
                <div className="rounded-lg border border-border bg-elevated/40 p-3 font-mono text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-subtle">Milestone Total:</span>
                    <span className="text-foreground font-medium">{formatAmount(2400)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-subtle">Platform Fee:</span>
                    <span className="text-emerald-400 font-medium">$0.00 (0%)</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-border/60">
                    <span className="text-subtle">Creator Net:</span>
                    <span className="text-emerald-400 font-medium">{formatAmount(2400)}</span>
                  </div>
                </div>
              </div>

              <div className="md:col-span-6 flex flex-col justify-center items-center text-center p-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                <div className="h-12 w-12 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-3">
                  <FiZap className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-medium text-foreground">Instant Finality</h4>
                <p className="text-xs text-muted mt-1 max-w-xs font-light">
                  Zero withdrawal delays. The moment a milestone is released, tokens arrive directly in creator storage.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
