import { useState } from "react"
import { Link } from "react-router-dom"
import {
  FiArrowRight,
  FiCheckCircle,
  FiShield,
  FiLock,
  FiCpu,
  FiGithub,
  FiFileText,
  FiStar,
  FiExternalLink,
  FiDollarSign,
} from "react-icons/fi"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"

interface FeatureItem {
  id: string
  category: "escrow" | "ai" | "verification" | "reputation"
  title: string
  badge: string
  description: string
  highlights: string[]
  technicalDetail: string
  icon: React.ComponentType<{ className?: string }>
  contractOrService?: string
  externalLink?: string
}

const features: FeatureItem[] = [
  {
    id: "milestone-escrow",
    category: "escrow",
    title: "Non-Custodial Milestone Escrow",
    badge: "Sepolia Verified",
    description:
      "Funds are locked milestone-by-milestone directly into immutable smart contract vaults. Zero platform custody, zero withdrawal delays, and zero platform commission.",
    highlights: [
      "Multi-milestone escrow locking in ERC-20 USDC",
      "48-hour mutual timelock prevents unilateral fund withdrawals",
      "Atomic, instant peer-to-peer payout on client approval",
    ],
    technicalDetail: "EscrowContract.sol (0xc0d1...376c)",
    icon: FiLock,
    externalLink: "https://sepolia.etherscan.io/address/0xc0d1b74a30a82d6fb846e446758a8c2ff391376c",
  },
  {
    id: "ai-mediation",
    category: "ai",
    title: "AI Dispute Mediation & Arbitrator Relay",
    badge: "Gemini + Arbitrator Relay",
    description:
      "Neutral AI evaluates project briefs, milestone specifications, and submitted deliverables to recommend a fair binary settlement with detailed reasoning.",
    highlights: [
      "Objective Gemini AI evidence analysis against agreed acceptance criteria",
      "48-hour mutual consensus window for client and freelancer",
      "Dual-consent backend arbitrator relay signs on-chain settlement",
    ],
    technicalDetail: "DisputeContract.sol (0x0423...7193)",
    icon: FiCpu,
    externalLink: "https://sepolia.etherscan.io/address/0x0423025a6a8c4bbbe1f9ecf0cb5d4542ac5b7193",
  },
  {
    id: "on-chain-reputation",
    category: "reputation",
    title: "On-Chain Sepolia Reputation Accumulator",
    badge: "O(1) Accumulator",
    description:
      "Immutable performance credentials that travel with your Ethereum address. Completed milestones and client ratings are permanently written to Sepolia.",
    highlights: [
      "O(1) gas complexity accumulator for totalScore and ratingCount",
      "Non-transferable reputation bound to verified Web3 wallets",
      "Dual persistence: on-chain Etherscan verification + rich platform reviews",
    ],
    technicalDetail: "ReputationContract.sol (0xfa25...6674)",
    icon: FiStar,
    externalLink: "https://sepolia.etherscan.io/address/0xfa25823ccf7343fdfd7fa20a785d996331e66674",
  },
  {
    id: "github-ci",
    category: "verification",
    title: "GitHub PR Deliverable CI/CD Verification",
    badge: "Automated Checks",
    description:
      "Freelancers attach GitHub pull requests to milestone deliverables. The system validates test suites and commit statuses while keeping release 100% client-gated.",
    highlights: [
      "Direct GitHub API check-run and commit status inspection",
      "Strict author attribution matching against verified freelancer GitHub",
      "Informational badges (CI Green, Failing, Pending) without removing client approval",
    ],
    technicalDetail: "GitHub REST API + Octokit CI Verifier",
    icon: FiGithub,
  },
  {
    id: "ai-contracts",
    category: "ai",
    title: "AI Legal Contract Agreement & E-Signatures",
    badge: "Legally Binding",
    description:
      "Before any escrow funds are deposited, an AI engine drafts a formal, project-specific Freelance Services Agreement mutually executed with digital signatures.",
    highlights: [
      "Custom contract generated from milestone scope, budget, and deadlines",
      "Dual cryptographic digital signatures from client and freelancer",
      "Immutable audit record and unique reference tracking ID",
    ],
    technicalDetail: "Gemini Contract Generator + E-Sign Engine",
    icon: FiFileText,
  },
  {
    id: "zero-fee-payouts",
    category: "escrow",
    title: "0% Platform Commission & Instant USDC",
    badge: "100% to Creator",
    description:
      "Unlike legacy freelance portals taking 10% to 20% of every dollar earned, FairWork charges 0% platform commission on milestone releases.",
    highlights: [
      "Direct wallet-to-wallet transfer in ERC-20 USDC",
      "Zero hidden processing markups or withdrawal penalties",
      "MetaMask and injected Web3 wallet compatibility",
    ],
    technicalDetail: "MockUSDC.sol (0xf21b...f575)",
    icon: FiDollarSign,
    externalLink: "https://sepolia.etherscan.io/address/0xf21bdf6737a3009359f9ec1fa515e6d74702f575",
  },
]

export function PlatformFeatures() {
  const { status, user } = useAuth()
  const isAuthed = status === "authenticated"
  const isClient = isAuthed && user?.role === "client"
  const ctaDestination = isAuthed ? (isClient ? "/projects/new" : "/projects") : "/register"

  const [activeTab, setActiveTab] = useState<"all" | "escrow" | "ai" | "verification" | "reputation">("all")

  const filtered = activeTab === "all" ? features : features.filter((f) => f.category === activeTab)

  return (
    <section id="platform-features" className="relative w-full bg-base py-20 sm:py-28 overflow-hidden">
      {/* Subtle radial glow */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute right-1/4 top-1/3 h-[420px] w-[420px] rounded-full bg-cyan-500/5 blur-3xl" />
        <div className="absolute left-1/4 bottom-10 h-[380px] w-[380px] rounded-full bg-emerald-500/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Centered Section Header */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-surface/80 px-3.5 py-1 text-xs font-mono text-muted mb-4 shadow-xs">
            <FiShield className="h-3.5 w-3.5 text-emerald-400" />
            <span className="font-medium text-foreground/90">Core Architecture</span>
          </div>

          <h2 className="text-3xl font-light tracking-tight text-foreground sm:text-5xl leading-[1.15]">
            Engineered for{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-200 to-emerald-300 font-normal">
              trustless collaboration.
            </span>
          </h2>

          <p className="mt-4 text-base font-light text-muted/90 sm:text-lg max-w-2xl leading-relaxed">
            FairWork eliminates central gatekeepers, opaque holding periods, and unfair fees through deterministic smart contracts and AI-assisted mediation.
          </p>

          {/* Filter Pills */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {[
              { id: "all", label: "All Capabilities" },
              { id: "escrow", label: "Milestone Escrow" },
              { id: "ai", label: "AI Mediation & Legal" },
              { id: "verification", label: "CI/CD Verification" },
              { id: "reputation", label: "On-Chain Reputation" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-normal transition-all cursor-pointer border",
                  activeTab === tab.id
                    ? "bg-cyan-500/15 text-cyan-300 border-cyan-400/50 font-medium shadow-xs"
                    : "border-border/80 bg-surface/70 text-muted hover:border-border-strong hover:text-foreground",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-2xl border border-border/80 bg-surface p-6 sm:p-7 transition-all duration-200 hover:border-cyan-500/40 hover:shadow-xl"
              >
                <div>
                  {/* Top Bar with Icon & Badge */}
                  <div className="flex items-center justify-between border-b border-border/70 pb-4">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-elevated/70 text-cyan-400 border border-border/80 shadow-xs">
                      <Icon className="h-5 w-5" />
                    </span>

                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-mono font-medium text-emerald-400">
                      {item.badge}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="mt-4 text-base font-medium text-foreground leading-snug">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-xs font-light text-muted leading-relaxed">
                    {item.description}
                  </p>

                  {/* Bullet Highlights */}
                  <div className="mt-4 rounded-xl border border-border/80 bg-elevated/35 p-3.5 space-y-2 text-xs">
                    <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-subtle block mb-1">
                      Key Safeguards:
                    </span>
                    {item.highlights.map((h) => (
                      <div key={h} className="flex items-start gap-2">
                        <FiCheckCircle className="mt-0.5 h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span className="text-foreground/85 font-light leading-relaxed">{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Technical Detail & Explorer Link */}
                <div className="mt-6 pt-4 border-t border-border/80 flex items-center justify-between text-[11px] font-mono text-subtle">
                  <span className="truncate max-w-[200px]" title={item.technicalDetail}>
                    {item.technicalDetail}
                  </span>

                  {item.externalLink ? (
                    <a
                      href={item.externalLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1 font-sans text-xs shrink-0"
                    >
                      Etherscan <FiExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-emerald-400 font-medium">Verified Active</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom Callout */}
        <div className="mt-14 rounded-2xl border border-border/80 bg-surface/90 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-lg">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-base font-medium text-foreground">Ready to post or deliver on FairWork?</h4>
            <p className="text-xs text-muted font-light max-w-xl">
              Experience transparent milestone escrow with zero platform take-rate and full cryptographic settlement protection.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to={ctaDestination}
              className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary hover:bg-primary-hover px-5 text-xs font-medium text-white transition-colors shadow-sm"
            >
              <span>{isClient ? "Create Project Brief" : "Explore Active Projects"}</span>
              <FiArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
