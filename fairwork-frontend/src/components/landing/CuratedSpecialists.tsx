import { useState } from "react"
import { Link } from "react-router-dom"
import { FiArrowRight, FiCheck, FiShield, FiStar, FiClock, FiLayers } from "react-icons/fi"
import { useCurrency } from "@/context/CurrencyContext"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"

interface DeliverablePackage {
  id: string
  specialistName: string
  handle: string
  avatarColor: string
  role: string
  category: "all" | "web3" | "dev" | "design" | "ai"
  packageTitle: string
  description: string
  deliverables: string[]
  milestoneCount: number
  turnaroundDays: number
  rating: number
  reviewsCount: number
  startingUSD: number
  skills: string[]
}

const deliverablePackages: DeliverablePackage[] = [
  {
    id: "pkg-1",
    specialistName: "Vance Sterling",
    handle: "vance.eth",
    avatarColor: "from-purple-500 to-indigo-600",
    role: "Smart Contract Security Specialist",
    category: "web3",
    packageTitle: "Production Smart Contract Architecture & Invariant Testing",
    description: "End-to-end audited smart contract architecture with property-based test suites, reentrancy guards, and Slither security analysis.",
    deliverables: [
      "Custom non-custodial escrow contracts with timelock protection",
      "Comprehensive Foundry test suite with 100% branch test coverage",
      "Formal verification signoff and gas optimization report",
    ],
    milestoneCount: 2,
    turnaroundDays: 7,
    rating: 5.0,
    reviewsCount: 38,
    startingUSD: 1400,
    skills: ["Solidity", "Foundry", "Slither", "EIP-712"],
  },
  {
    id: "pkg-2",
    specialistName: "Elena Rostova",
    handle: "elena.dev",
    avatarColor: "from-blue-500 to-cyan-600",
    role: "Full-Stack Interface Engineer",
    category: "dev",
    packageTitle: "Full-Stack Web3 Application & Multi-Wallet Client",
    description: "Responsive dApp frontend architecture with optimistic state machines, multi-wallet connectors, and live transaction indexing.",
    deliverables: [
      "Next.js & Vite client with reactive state management",
      "Wagmi/Viem wallet connectors with automatic chain switching",
      "Real-time event sync and transaction confirmation toasts",
    ],
    milestoneCount: 3,
    turnaroundDays: 14,
    rating: 4.9,
    reviewsCount: 54,
    startingUSD: 2000,
    skills: ["React", "TypeScript", "Tailwind CSS", "Viem"],
  },
  {
    id: "pkg-3",
    specialistName: "Kenji Tanaka",
    handle: "tanaka.design",
    avatarColor: "from-amber-500 to-rose-600",
    role: "Design Systems & UX Architect",
    category: "design",
    packageTitle: "Enterprise Design System & Figma Token Architecture",
    description: "Complete Figma variable library, dark/light theme tokens, and production-ready component primitives built for scale.",
    deliverables: [
      "Multi-mode design tokens exported directly to code",
      "40+ responsive UI component specifications with active states",
      "Developer handoff documentation and micro-interaction guidelines",
    ],
    milestoneCount: 2,
    turnaroundDays: 10,
    rating: 5.0,
    reviewsCount: 29,
    startingUSD: 1200,
    skills: ["Figma Tokens", "Design Systems", "UI/UX", "Prototyping"],
  },
  {
    id: "pkg-4",
    specialistName: "Amira Patel",
    handle: "amira.ai",
    avatarColor: "from-emerald-500 to-teal-600",
    role: "Autonomous AI & Systems Engineer",
    category: "ai",
    packageTitle: "Autonomous AI Agent Pipeline & Knowledge Retrieval",
    description: "Autonomous task execution agents, multi-stage retrieval pipelines, vector indexers, and benchmark evaluation suites.",
    deliverables: [
      "Autonomous agent workflow with tool execution loop",
      "Vector embedding knowledge indexer with semantic retrieval",
      "Production REST endpoints with streaming token responses",
    ],
    milestoneCount: 3,
    turnaroundDays: 12,
    rating: 4.9,
    reviewsCount: 41,
    startingUSD: 1800,
    skills: ["Python", "LangChain", "Vector DBs", "FastAPI"],
  },
]

export function CuratedSpecialists() {
  const { formatAmount } = useCurrency()
  const { status, user } = useAuth()
  const isAuthed = status === "authenticated"
  const isClient = isAuthed && user?.role === "client"

  const [activeTab, setActiveTab] = useState<"all" | "web3" | "dev" | "design" | "ai">("all")

  function getCommissionUrl(pkg: DeliverablePackage) {
    if (!isAuthed) return "/register"
    if (!isClient) return `/projects?search=${encodeURIComponent(pkg.skills[0] || "")}`
    const cat =
      pkg.category === "web3"
        ? "Web3 & Smart Contracts"
        : pkg.category === "dev"
          ? "Web Development"
          : pkg.category === "design"
            ? "UI/UX Design"
            : "AI & Machine Learning"
    return `/projects/new?title=${encodeURIComponent(pkg.packageTitle)}&category=${encodeURIComponent(cat)}&budget=${pkg.startingUSD}`
  }

  const filtered = activeTab === "all"
    ? deliverablePackages
    : deliverablePackages.filter((r) => r.category === activeTab)

  return (
    <section id="verified-specialists" className="relative w-full bg-base border-b border-border/40 py-20 sm:py-28 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Centered Section Header */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-mono text-muted mb-4 shadow-xs">
            <FiShield className="h-3.5 w-3.5 text-emerald-400" />
            <span className="font-semibold text-foreground">Curated Deliverables</span>
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl leading-tight">
            Work with verified specialists.
          </h2>

          <p className="mt-4 text-base text-muted sm:text-lg max-w-2xl">
            Choose packaged milestones with clear delivery timelines, fixed pricing, and 100% smart contract escrow protection.
          </p>

          {/* Centered Discipline Filter Pills (Amazon / Airbnb Style) */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {[
              { id: "all", label: "All Packages" },
              { id: "web3", label: "Smart Contracts" },
              { id: "dev", label: "Web Applications" },
              { id: "design", label: "Design Systems" },
              { id: "ai", label: "Autonomous AI" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-medium transition-all cursor-pointer border",
                  activeTab === tab.id
                    ? "bg-foreground text-background border-foreground font-semibold shadow-xs"
                    : "border-border bg-surface text-muted hover:border-border-strong hover:text-foreground",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Amazon Product / Deliverable Package Cards Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {filtered.map((pkg) => (
            <div
              key={pkg.id}
              className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-6 sm:p-7 transition-all duration-200 hover:border-primary/50 hover:shadow-lg"
            >
              <div>
                {/* Specialist Profile Bar */}
                <div className="flex items-center justify-between border-b border-border/70 pb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white font-bold text-sm shadow-xs",
                        pkg.avatarColor,
                      )}
                    >
                      {pkg.specialistName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">
                          {pkg.specialistName}
                        </span>
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono font-semibold text-emerald-400">
                          Verified
                        </span>
                      </div>
                      <p className="text-xs text-muted mt-0.5 font-medium">{pkg.role}</p>
                    </div>
                  </div>

                  {/* Rating Badge */}
                  <div className="flex items-center gap-1 rounded-lg border border-border bg-elevated px-2.5 py-1 text-xs font-semibold text-foreground">
                    <FiStar className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span>{pkg.rating.toFixed(1)}</span>
                    <span className="text-[11px] text-subtle font-normal">({pkg.reviewsCount})</span>
                  </div>
                </div>

                {/* Package Title & Description */}
                <h3 className="mt-4 text-base font-bold text-foreground leading-snug">
                  {pkg.packageTitle}
                </h3>
                <p className="mt-2 text-xs text-muted leading-relaxed">
                  {pkg.description}
                </p>

                {/* Deliverables Checklist */}
                <div className="mt-4 rounded-xl border border-border/80 bg-elevated/40 p-3.5 space-y-2 text-xs">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-subtle block mb-1">
                    What&apos;s Included:
                  </span>
                  {pkg.deliverables.map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <FiCheck className="mt-0.5 h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span className="text-foreground/90">{item}</span>
                    </div>
                  ))}
                </div>

                {/* Skill Pills */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {pkg.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-md border border-border bg-surface px-2 py-0.5 text-[11px] font-mono text-muted"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Footer: Metadata + Escrow Seal + Commission CTA */}
              <div className="mt-6 pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-xs font-mono text-subtle">
                  <span className="flex items-center gap-1">
                    <FiClock className="h-3.5 w-3.5 text-primary" />
                    {pkg.turnaroundDays}-Day Turnaround
                  </span>
                  <span className="flex items-center gap-1">
                    <FiLayers className="h-3.5 w-3.5 text-subtle" />
                    {pkg.milestoneCount} Milestones
                  </span>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <div>
                    <span className="text-[10px] text-subtle uppercase font-mono block">Package Price</span>
                    <span className="text-base font-bold text-foreground font-mono">
                      {formatAmount(pkg.startingUSD)}
                    </span>
                  </div>

                  <Link
                    to={getCommissionUrl(pkg)}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-primary hover:bg-primary-hover px-4 text-xs font-bold text-white transition-all shadow-xs"
                  >
                    <span>Commission</span>
                    <FiArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Explore Link */}
        <div className="mt-12 text-center">
          <Link
            to={isAuthed ? "/projects" : "/register"}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-5 py-2.5 text-xs font-bold text-foreground hover:bg-elevated transition-colors shadow-xs"
          >
            <span>Explore All Deliverables &amp; Packages</span>
            <FiArrowRight className="h-3.5 w-3.5 text-primary" />
          </Link>
        </div>
      </div>
    </section>
  )
}
