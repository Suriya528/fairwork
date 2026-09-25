import { useState } from "react"
import { Link } from "react-router-dom"
import { FiArrowRight, FiBook, FiGitBranch, FiUsers } from "react-icons/fi"
import { useCurrency } from "@/context/CurrencyContext"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"

interface ContributorRepo {
  id: string
  owner: string
  repo: string
  role: string
  category: "all" | "web3" | "dev" | "design" | "ai"
  description: string
  language: string
  languageColor: string
  milestoneCount: number
  turnaroundDays: number
  startingUSD: number
  mergedPRs: number
}

const contributorRepos: ContributorRepo[] = [
  {
    id: "repo-1",
    owner: "vance-security",
    repo: "solidity-escrow-audit",
    role: "Smart Contract Security Researcher",
    category: "web3",
    description: "Production smart contract security reviews, invariant test suites in Foundry, and Slither verification signoffs.",
    language: "Solidity",
    languageColor: "#8957e5",
    milestoneCount: 2,
    turnaroundDays: 7,
    startingUSD: 1400,
    mergedPRs: 38,
  },
  {
    id: "repo-2",
    owner: "elena-systems",
    repo: "web3-client-architecture",
    role: "Full-Stack Web & Interface Engineer",
    category: "dev",
    description: "Full-stack dApp frontend development with multi-wallet connectors, optimistic state machines, and Viem integration.",
    language: "TypeScript",
    languageColor: "#3178c6",
    milestoneCount: 3,
    turnaroundDays: 14,
    startingUSD: 2000,
    mergedPRs: 54,
  },
  {
    id: "repo-3",
    owner: "tanaka-design",
    repo: "defi-design-system",
    role: "Product & Design Systems Architect",
    category: "design",
    description: "Enterprise Figma component libraries, responsive interaction tokens, and production design engineering documentation.",
    language: "Figma Tokens",
    languageColor: "#F24E1E",
    milestoneCount: 2,
    turnaroundDays: 10,
    startingUSD: 1200,
    mergedPRs: 29,
  },
  {
    id: "repo-4",
    owner: "amira-labs",
    repo: "autonomous-rag-pipeline",
    role: "AI & Autonomous Systems Engineer",
    category: "ai",
    description: "Autonomous agent workflows, embedding retrieval pipelines, vector indexers, and evaluation benchmark frameworks.",
    language: "Python",
    languageColor: "#3572A5",
    milestoneCount: 3,
    turnaroundDays: 12,
    startingUSD: 1800,
    mergedPRs: 41,
  },
]

export function CuratedSpecialists() {
  const { formatAmount } = useCurrency()
  const { status } = useAuth()
  const isAuthed = status === "authenticated"
  const destination = isAuthed ? "/projects" : "/register"

  const [activeTab, setActiveTab] = useState<"all" | "web3" | "dev" | "design" | "ai">("all")

  const filtered = activeTab === "all"
    ? contributorRepos
    : contributorRepos.filter((r) => r.category === activeTab)

  return (
    <section id="verified-contributors" className="relative w-full bg-base border-b border-border/40 py-20 sm:py-28 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Continuous Spine Line */}
        <div className="relative pl-6 sm:pl-10">
          <div
            className="pointer-events-none absolute left-0 top-2 bottom-0 w-[2px] bg-gradient-to-b from-purple-500 via-blue-500 to-emerald-500"
            aria-hidden
          />

          {/* Node on Spine */}
          <div className="absolute -left-[11px] top-0 flex h-6 w-6 items-center justify-center rounded-full border border-blue-400 bg-base text-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.5)]">
            <FiUsers className="h-3 w-3" />
          </div>

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">
                Verified Contributors
              </span>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                Work with proven creators.
              </h2>
              <p className="mt-4 text-base text-muted max-w-xl">
                Inspect deliverable repositories, review commit histories, and commission milestones with verified talent.
              </p>
            </div>

            <Link
              to={destination}
              className="mt-4 md:mt-0 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 font-mono"
            >
              <span>Explore all contributors</span>
              <FiArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-6">
            {[
              { id: "all", label: "All Repositories" },
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
                  "whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-mono transition-colors cursor-pointer",
                  activeTab === tab.id
                    ? "bg-[#21262d] text-foreground font-semibold border border-border-strong"
                    : "text-muted hover:text-foreground",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Pinned Repository Style Cards Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {filtered.map((repo) => (
              <div
                key={repo.id}
                className="flex flex-col justify-between rounded-xl border border-border-strong bg-[#0d1117] p-5 sm:p-6 transition-all duration-200 hover:border-emerald-500/50"
              >
                <div>
                  {/* Repo Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-mono text-xs font-semibold">
                      <FiBook className="h-4 w-4 text-subtle shrink-0" />
                      <span className="text-blue-400 hover:underline cursor-pointer">
                        {repo.owner}
                      </span>
                      <span className="text-subtle">/</span>
                      <span className="text-foreground">{repo.repo}</span>
                    </div>

                    <span className="rounded-full border border-border bg-[#161b22] px-2 py-0.5 text-[10px] font-mono text-muted">
                      Verified
                    </span>
                  </div>

                  <p className="mt-1 font-mono text-[11px] text-subtle">
                    Role: {repo.role}
                  </p>

                  {/* Description */}
                  <p className="mt-3 text-xs text-muted leading-relaxed">
                    {repo.description}
                  </p>
                </div>

                {/* Bottom Metadata Bar with GitHub Language Dots */}
                <div className="mt-6 pt-4 border-t border-border/60 flex flex-wrap items-center justify-between gap-y-2 text-xs font-mono text-subtle">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: repo.languageColor }}
                      />
                      <span className="text-foreground text-[11px]">{repo.language}</span>
                    </span>

                    <span className="flex items-center gap-1 text-[11px]">
                      <FiGitBranch className="h-3 w-3 text-subtle" />
                      {repo.mergedPRs} merged PRs
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-bold text-foreground">
                      {formatAmount(repo.startingUSD * 100)}
                    </span>

                    <Link
                      to={destination}
                      className="inline-flex items-center gap-1 rounded bg-[#21262d] hover:bg-[#30363d] px-2.5 py-1 text-[11px] font-semibold text-foreground transition-colors"
                    >
                      <span>Fork brief</span>
                      <FiArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
