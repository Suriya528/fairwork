import { useState } from "react"
import { Link } from "react-router-dom"
import { FiArrowRight, FiShield } from "react-icons/fi"
import { useCurrency } from "@/context/CurrencyContext"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"

interface SpecialistDossier {
  id: string
  name: string
  handle: string
  role: string
  category: "all" | "web3" | "dev" | "design" | "ai"
  deliverableTitle: string
  deliverableSpec: string
  stack: string[]
  milestoneCount: number
  turnaroundDays: number
  startingUSD: number
  verifiedAddress: string
}

const specialistDossiers: SpecialistDossier[] = [
  {
    id: "spec-1",
    name: "Marcus Vance",
    handle: "@vance.eth",
    role: "Senior Smart Contract Security Researcher",
    category: "web3",
    deliverableTitle: "Solidity Escrow Audit & Slither Invariant Testing",
    deliverableSpec: "Static analysis, property-based tests, reentrancy guards, and zero-vulnerability signoff report.",
    stack: ["Solidity", "Foundry", "Slither", "EIP-712"],
    milestoneCount: 2,
    turnaroundDays: 7,
    startingUSD: 1400,
    verifiedAddress: "0x742d...44e",
  },
  {
    id: "spec-2",
    name: "Elena Rostova",
    handle: "@elena.dev",
    role: "Full-Stack Web3 & React 19 Architect",
    category: "dev",
    deliverableTitle: "Production dApp Interface with Viem & Tailwind CSS",
    deliverableSpec: "Responsive React 19 frontend, wallet multi-connector, optimistic updates, and clean state machines.",
    stack: ["React 19", "Next.js 15", "TypeScript", "Viem"],
    milestoneCount: 3,
    turnaroundDays: 14,
    startingUSD: 2000,
    verifiedAddress: "0x892a...19c",
  },
  {
    id: "spec-3",
    name: "Kai Tanaka",
    handle: "@tanaka.design",
    role: "Principal Product & Design Systems Lead",
    category: "design",
    deliverableTitle: "DeFi Dashboard UI/UX & Tokenized Design Tokens",
    deliverableSpec: "Full Figma component library, interactive high-fidelity prototypes, and Tailwind sync specs.",
    stack: ["Figma Tokens", "Design Systems", "Prototyping", "UI/UX"],
    milestoneCount: 2,
    turnaroundDays: 10,
    startingUSD: 1200,
    verifiedAddress: "0x3f1b...80a",
  },
  {
    id: "spec-4",
    name: "Amira Patel",
    handle: "@amira.ai",
    role: "Autonomous Agent & LLM Systems Engineer",
    category: "ai",
    deliverableTitle: "Agentic Workflow & RAG Knowledge Retrieval Pipeline",
    deliverableSpec: "Multi-agent LangChain / Python backend with vector database indexing, evaluation benchmarks, and REST API.",
    stack: ["Python", "LangChain", "Vector DB", "FastAPI"],
    milestoneCount: 3,
    turnaroundDays: 12,
    startingUSD: 1800,
    verifiedAddress: "0x55c9...32d",
  },
]

export function CuratedSpecialists() {
  const { formatAmount } = useCurrency()
  const { status } = useAuth()
  const isAuthed = status === "authenticated"
  const destination = isAuthed ? "/projects" : "/register"

  const [activeFilter, setActiveFilter] = useState<"all" | "web3" | "dev" | "design" | "ai">("all")

  const filtered = activeFilter === "all"
    ? specialistDossiers
    : specialistDossiers.filter((d) => d.category === activeFilter)

  return (
    <section id="deliverable-dossiers" className="w-full bg-base border-b border-border/40 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">
              Verified Engineers &amp; Designers
            </span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Curated specialists with verified milestone histories
            </h2>
            <p className="mt-2 text-base text-muted max-w-xl">
              Collaborate directly with senior practitioners. Review deliverable specifications and commit milestones securely.
            </p>
          </div>

          <Link
            to={destination}
            className="mt-4 md:mt-0 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors font-mono"
          >
            <span>Explore all briefs</span>
            <FiArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Filter Pills */}
        <div className="mt-8 flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
          {[
            { id: "all", label: "All Specializations" },
            { id: "web3", label: "Smart Contracts & Protocol" },
            { id: "dev", label: "Web Applications" },
            { id: "design", label: "Product & UI/UX" },
            { id: "ai", label: "AI Systems & Agents" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id as typeof activeFilter)}
              className={cn(
                "whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer font-mono",
                activeFilter === tab.id
                  ? "bg-foreground text-base shadow-sm font-semibold"
                  : "border border-border bg-surface text-muted hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dossiers Grid */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {filtered.map((dossier) => (
            <div
              key={dossier.id}
              className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-6 shadow-md transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/40"
            >
              <div>
                {/* Header with profile */}
                <div className="flex items-start justify-between border-b border-border/80 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-foreground">{dossier.name}</h3>
                      <span className="font-mono text-xs text-subtle">{dossier.handle}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted font-medium">{dossier.role}</p>
                  </div>

                  <span className="inline-flex items-center gap-1 rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-400 font-semibold">
                    <FiShield className="h-3 w-3" />
                    Verified
                  </span>
                </div>

                {/* Deliverable Spec */}
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-foreground">
                    {dossier.deliverableTitle}
                  </h4>
                  <p className="mt-1 text-xs text-muted leading-relaxed">
                    {dossier.deliverableSpec}
                  </p>
                </div>

                {/* Tech Stack Chips */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {dossier.stack.map((tech) => (
                    <span
                      key={tech}
                      className="rounded bg-base px-2 py-0.5 font-mono text-[10px] text-subtle border border-border"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Footer with Milestone Terms & Action */}
              <div className="mt-6 pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-4 text-xs font-mono text-subtle">
                  <span>{dossier.milestoneCount} Milestones</span>
                  <span>•</span>
                  <span>~{dossier.turnaroundDays}d Turnaround</span>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-subtle uppercase block">From</span>
                    <span className="text-sm font-bold text-foreground font-mono">
                      {formatAmount(dossier.startingUSD * 100)}
                    </span>
                  </div>

                  <Link
                    to={destination}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all"
                  >
                    <span>View Brief</span>
                    <FiArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
