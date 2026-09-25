import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  FiSearch,
  FiArrowRight,
  FiGitPullRequest,
  FiShield,
} from "react-icons/fi"
import { useAuth } from "@/context/AuthContext"
import { useCurrency } from "@/context/CurrencyContext"
import { cn } from "@/lib/utils"

const heroSearchChips = [
  "Smart Contract Audit",
  "React 19 & Next.js",
  "UI/UX Design Systems",
  "AI Agents & RAG",
  "Solidity Escrow",
] as const

interface MockMilestone {
  step: number
  name: string
  spec: string
  amountUSD: number
  status: "Released" | "In Review" | "Locked"
  statusBadge: string
  artifact: string
  proofType: string
  deliverableSnippet: string
}

const mockMilestones: MockMilestone[] = [
  {
    step: 1,
    name: "01. Core Architecture & Slither Audit",
    spec: "Non-reentrant escrow contract with 0 high/critical issues",
    amountUSD: 1200,
    status: "Released",
    statusBadge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    artifact: "Pull Request #38 (Merged)",
    proofType: "0x892a...c41e • Sepolia Block #6,419,203",
    deliverableSnippet: "Slither verified: 0 reentrancy vectors, 100% branch test coverage across 14 scenarios.",
  },
  {
    step: 2,
    name: "02. React 19 Client & Viem Integration",
    spec: "Full dApp interface with EIP-712 wallet signatures",
    amountUSD: 1800,
    status: "In Review",
    statusBadge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    artifact: "Deployment Preview (Vercel)",
    proofType: "Review Window Active: 36h Remaining",
    deliverableSnippet: "Client inspecting milestone deliverables. 1,800 USDC ready for instant cryptographic release.",
  },
  {
    step: 3,
    name: "03. Production Deployment & Subgraph",
    spec: "Multi-chain event listener & outbox reconciliation",
    amountUSD: 1000,
    status: "Locked",
    statusBadge: "bg-surface text-subtle border-border",
    artifact: "Pending Phase 2 Acceptance",
    proofType: "Locked in EscrowContract.sol",
    deliverableSnippet: "1,000 USDC safely locked on-chain. Cannot be claimed until deliverables pass inspection.",
  },
]

export function HeroSection() {
  const { status } = useAuth()
  const { formatAmount } = useCurrency()
  const navigate = useNavigate()
  const isAuthed = status === "authenticated"
  const destination = isAuthed ? "/projects" : "/register"

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMilestone, setSelectedMilestone] = useState<number>(2)

  const activeMilestone = mockMilestones.find(m => m.step === selectedMilestone) || mockMilestones[1]

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/projects?search=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      navigate("/projects")
    }
  }

  return (
    <section className="relative w-full bg-base border-b border-border/40 overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-24 lg:pt-40 lg:pb-28">
      {/* Subtle radial atmosphere */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-b from-emerald-500/10 via-primary/5 to-transparent blur-3xl" />
        <div className="absolute right-10 top-1/4 h-[350px] w-[350px] rounded-full bg-blue-600/5 blur-3xl" />
        <div className="absolute left-10 top-1/3 h-[300px] w-[300px] rounded-full bg-emerald-600/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          {/* Left Column: Authoritative Copy & Command Search */}
          <div className="lg:col-span-6 flex flex-col items-start text-left">
            {/* Protocol Tag */}
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-mono text-muted mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Non-Custodial Milestone Settlement</span>
            </div>

            {/* Main Typographic Headline */}
            <h1 className="text-balance text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl leading-[1.08]">
              Work delivered in milestones.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400">
                Settled with certainty.
              </span>
            </h1>

            {/* Subhead */}
            <p className="mt-6 text-base text-muted sm:text-lg leading-relaxed max-w-xl">
              FairWork connects technical talent and founders through smart contract escrow. Milestone funds remain locked on-chain and release instantly to the creator once work is inspected and approved.
            </p>

            {/* Command-Grade Search Input */}
            <form onSubmit={handleSearch} className="mt-8 w-full max-w-xl">
              <div className="flex items-center rounded-xl border border-border bg-surface p-1.5 shadow-lg shadow-black/20 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500/30 transition-all">
                <FiSearch className="h-4 w-4 ml-3 text-subtle shrink-0" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by role, stack, or deliverable (e.g. Next.js, Foundry, Figma)..."
                  className="h-10 w-full bg-transparent px-3 text-xs sm:text-sm text-foreground placeholder:text-subtle outline-none"
                  aria-label="Search projects and talent"
                />
                <button
                  type="submit"
                  className="flex h-9 items-center justify-center rounded-lg bg-emerald-600 px-4 text-xs font-semibold text-white transition-all hover:bg-emerald-500 active:scale-[0.98] shrink-0"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Suggestion Chips */}
            <div className="mt-3.5 flex flex-wrap items-center gap-1.5 text-xs text-subtle">
              <span className="font-mono text-[11px] text-muted">Specializations:</span>
              {heroSearchChips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => navigate(`/projects?search=${encodeURIComponent(chip)}`)}
                  className="rounded-md border border-border/80 bg-surface/60 px-2 py-0.5 text-[11px] text-muted transition-colors hover:border-emerald-500/50 hover:text-foreground cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <Link
                to={destination}
                className="flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 transition-all"
              >
                <span>Explore Open Briefs</span>
                <FiArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                to={destination}
                className="flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-border bg-surface px-6 text-xs font-semibold text-foreground hover:bg-elevated transition-all"
              >
                <span>Offer Engineering Services</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Signature Interactive Milestone Settlement Console */}
          <div className="lg:col-span-6 w-full">
            <div className="overflow-hidden rounded-2xl border border-border-strong bg-surface/90 shadow-2xl backdrop-blur-xl">
              {/* Console Header Bar */}
              <div className="flex items-center justify-between border-b border-border bg-surface px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
                    <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
                    <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
                  </div>
                  <span className="ml-2 font-mono text-[11px] text-subtle">
                    contract::escrow_settlement_console
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-mono text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                    Live Contract
                  </span>
                </div>
              </div>

              {/* Active Project Dossier */}
              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/80 pb-4">
                  <div>
                    <span className="text-[10px] font-mono text-emerald-400 uppercase font-semibold">
                      Contract Brief #FW-9042
                    </span>
                    <h2 className="text-base font-bold text-foreground">
                      DeFi Liquidity Hub &amp; Web3 Interface
                    </h2>
                  </div>

                  <div className="flex items-center gap-2 font-mono">
                    <span className="rounded-lg border border-border bg-base px-2.5 py-1 text-xs font-bold text-foreground">
                      {formatAmount(400000)} Total Escrow
                    </span>
                  </div>
                </div>

                {/* Milestone Progress Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-[11px] font-mono text-subtle mb-1.5">
                    <span>Milestone Allocation</span>
                    <span className="text-foreground font-semibold">
                      {formatAmount(120000)} Released • {formatAmount(180000)} In Review
                    </span>
                  </div>
                  <div className="flex h-2 w-full overflow-hidden rounded-full bg-base border border-border">
                    <div className="h-full bg-emerald-500" style={{ width: "30%" }} title="Milestone 1 Released" />
                    <div className="h-full bg-blue-500" style={{ width: "45%" }} title="Milestone 2 In Review" />
                    <div className="h-full bg-slate-700" style={{ width: "25%" }} title="Milestone 3 Locked" />
                  </div>
                </div>

                {/* Interactive Milestone Selector */}
                <div className="mt-5 flex flex-col gap-2">
                  <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-subtle">
                    Click milestone to inspect deliverable verification:
                  </p>

                  {mockMilestones.map((ms) => {
                    const isSelected = selectedMilestone === ms.step
                    return (
                      <button
                        key={ms.step}
                        type="button"
                        onClick={() => setSelectedMilestone(ms.step)}
                        className={cn(
                          "flex items-center justify-between rounded-xl border p-3 text-left transition-all cursor-pointer",
                          isSelected
                            ? "border-emerald-500/70 bg-emerald-500/5 shadow-sm"
                            : "border-border bg-base/50 hover:bg-base hover:border-border-strong",
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={cn(
                              "flex h-6 w-6 items-center justify-center rounded-md font-mono text-xs font-bold",
                              isSelected ? "bg-emerald-500 text-white" : "bg-surface text-subtle",
                            )}
                          >
                            {ms.step}
                          </span>
                          <div>
                            <p className="text-xs font-bold text-foreground">{ms.name}</p>
                            <p className="text-[10px] text-subtle font-mono truncate max-w-[200px] sm:max-w-xs">
                              {ms.spec}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <span className="font-mono text-xs font-bold text-foreground">
                            {formatAmount(ms.amountUSD * 100)}
                          </span>
                          <span className={cn("rounded border px-2 py-0.5 text-[10px] font-mono font-medium", ms.statusBadge)}>
                            {ms.status}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Inspected Milestone Artifact Drawer */}
                <div className="mt-4 rounded-xl border border-border bg-base/90 p-3.5">
                  <div className="flex items-center justify-between text-xs border-b border-border/60 pb-2 mb-2">
                    <span className="flex items-center gap-1.5 font-mono text-[11px] text-subtle">
                      <FiGitPullRequest className="h-3.5 w-3.5 text-emerald-400" />
                      Artifact: {activeMilestone.artifact}
                    </span>
                    <span className="font-mono text-[10px] text-subtle">
                      {activeMilestone.proofType}
                    </span>
                  </div>

                  <p className="text-xs text-muted leading-relaxed">
                    {activeMilestone.deliverableSnippet}
                  </p>
                </div>

                {/* Bottom Assurance Note */}
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-border text-[11px] font-mono text-subtle">
                  <span className="flex items-center gap-1.5">
                    <FiShield className="h-3.5 w-3.5 text-emerald-400" />
                    Zero platform take-rate (100% P2P)
                  </span>
                  <span className="text-foreground font-semibold">
                    EIP-712 Authenticated
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
