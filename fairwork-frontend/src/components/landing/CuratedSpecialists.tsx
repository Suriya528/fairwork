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
    <section id="verified-specialists" className="relative w-full bg-base py-20 sm:py-28 overflow-hidden">
      {/* Subtle indigo/cyan radial ambiance */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute right-1/4 top-1/3 h-[420px] w-[420px] rounded-full bg-cyan-500/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Left-to-Right Section Header spanning full width */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10 w-full text-left">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-surface/80 px-3.5 py-1 text-xs font-mono text-muted mb-4 shadow-xs">
              <FiShield className="h-3.5 w-3.5 text-emerald-400" />
              <span className="font-medium text-foreground/90">Curated Deliverables</span>
            </div>

            <h2 className="text-3xl font-light tracking-tight text-foreground sm:text-5xl leading-[1.15]">
              Work with{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-200 to-emerald-300 font-normal">
                verified specialists.
              </span>
            </h2>

            <p className="mt-3 text-base font-light text-muted/90 sm:text-lg max-w-2xl leading-relaxed">
              Choose packaged milestones with clear delivery timelines, fixed pricing, and 100% smart contract escrow protection.
            </p>
          </div>

          {/* Discipline Filter Pills (flowing naturally on the right) */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
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

        {/* Amazon Product / Deliverable Package Cards Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {filtered.map((pkg) => (
            <div
              key={pkg.id}
              className="flex flex-col justify-between rounded-2xl border border-border/80 bg-surface p-6 sm:p-7 transition-all duration-200 hover:border-cyan-500/40 hover:shadow-xl"
            >
              <div>
                {/* Specialist Profile Bar */}
                <div className="flex items-center justify-between border-b border-border/70 pb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white font-medium text-sm shadow-xs",
                        pkg.avatarColor,
                      )}
                    >
                      {pkg.specialistName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {pkg.specialistName}
                        </span>
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono font-medium text-emerald-400">
                          Verified
                        </span>
                      </div>
                      <p className="text-xs text-muted mt-0.5 font-light">{pkg.role}</p>
                    </div>
                  </div>

                  {/* Rating Badge */}
                  <div className="flex items-center gap-1 rounded-lg border border-border/80 bg-elevated/60 px-2.5 py-1 text-xs font-medium text-foreground">
                    <FiStar className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span>{pkg.rating.toFixed(1)}</span>
                    <span className="text-[11px] text-subtle font-normal">({pkg.reviewsCount})</span>
                  </div>
                </div>

                {/* Package Title & Description */}
                <h3 className="mt-4 text-base font-medium text-foreground leading-snug">
                  {pkg.packageTitle}
                </h3>
                <p className="mt-2 text-xs font-light text-muted leading-relaxed">
                  {pkg.description}
                </p>

                {/* Deliverables Checklist */}
                <div className="mt-4 rounded-xl border border-border/80 bg-elevated/35 p-3.5 space-y-2 text-xs">
                  <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-subtle block mb-1">
                    What&apos;s Included:
                  </span>
                  {pkg.deliverables.map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <FiCheck className="mt-0.5 h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span className="text-foreground/85 font-light">{item}</span>
                    </div>
                  ))}
                </div>

                {/* Skill Pills */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {pkg.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-md border border-border/80 bg-elevated/40 px-2 py-0.5 text-[11px] font-mono text-muted font-normal"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Footer: Metadata + Escrow Seal + Commission CTA */}
              <div className="mt-6 pt-4 border-t border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-xs font-mono text-subtle font-normal">
                  <span className="flex items-center gap-1">
                    <FiClock className="h-3.5 w-3.5 text-cyan-400" />
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
                    <span className="text-base font-medium text-foreground font-mono">
                      {formatAmount(pkg.startingUSD)}
                    </span>
                  </div>

                  <Link
                    to={getCommissionUrl(pkg)}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-primary hover:bg-primary-hover px-4 text-xs font-medium text-white transition-all shadow-xs"
                  >
                    <span>Commission</span>
                    <FiArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Explore Bar spanning left to right */}
        <div className="mt-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-border/80 pt-6">
          <p className="text-xs font-light text-muted">
            Need a bespoke milestone schedule or custom multi-signoff escrow structure?
          </p>
          <Link
            to={isAuthed ? "/projects" : "/register"}
            className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-surface px-5 py-2.5 text-xs font-medium text-foreground hover:bg-elevated transition-colors shadow-xs self-start sm:self-auto"
          >
            <span>Explore All Deliverables &amp; Packages</span>
            <FiArrowRight className="h-3.5 w-3.5 text-cyan-400" />
          </Link>
        </div>
      </div>
    </section>
  )
}
