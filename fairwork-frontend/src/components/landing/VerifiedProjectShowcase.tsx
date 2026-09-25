import { FiGitMerge, FiGitCommit, FiCheck } from "react-icons/fi"
import { useCurrency } from "@/context/CurrencyContext"

interface MergedMilestonePR {
  id: string
  prNumber: number
  title: string
  clientRepo: string
  domain: string
  budgetUSD: number
  timeline: string
  commitHash: string
  filesChanged: number
  additions: number
  deletions: number
  deliverables: string[]
  language: string
}

const mergedPRs: MergedMilestonePR[] = [
  {
    id: "pr-1",
    prNumber: 104,
    title: "Implement multi-asset vault contracts and property-based test suite",
    clientRepo: "synthetix-labs / vault-escrow",
    domain: "Smart Contracts",
    budgetUSD: 3600,
    timeline: "14 days",
    commitHash: "8f92a1c",
    filesChanged: 14,
    additions: 1240,
    deletions: 110,
    deliverables: [
      "Vault escrow architecture with reentrancy protection",
      "Invariant test suite in Foundry with 100% branch test coverage",
      "Slither automated static analysis signoff with 0 findings",
    ],
    language: "Solidity",
  },
  {
    id: "pr-2",
    prNumber: 88,
    title: "Build autonomous code review agent with GitHub App webhook listener",
    clientRepo: "devtools-org / reviewer-agent",
    domain: "AI Engineering",
    budgetUSD: 2800,
    timeline: "10 days",
    commitHash: "4c71e9a",
    filesChanged: 18,
    additions: 1820,
    deletions: 240,
    deliverables: [
      "AST code parser and multi-step evaluation pipeline",
      "GitHub webhook event listener with automated pull-request comments",
      "Optimized inference benchmarks on production repository branches",
    ],
    language: "Python",
  },
  {
    id: "pr-3",
    prNumber: 62,
    title: "Ship multi-brand Figma token architecture and web component library",
    clientRepo: "nexus-fintech / design-tokens",
    domain: "Product Design",
    budgetUSD: 2200,
    timeline: "8 days",
    commitHash: "2a90f3b",
    filesChanged: 26,
    additions: 980,
    deletions: 60,
    deliverables: [
      "Figma variables architecture supporting dark and light themes",
      "40+ responsive application primitives with state variants",
      "Exported token JSON pipeline synced directly to styling config",
    ],
    language: "Design Tokens",
  },
]

export function VerifiedProjectShowcase() {
  const { formatAmount } = useCurrency()

  return (
    <section className="relative w-full bg-base border-b border-border/40 py-20 sm:py-28 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Continuous Spine Line */}
        <div className="relative pl-6 sm:pl-10">
          <div
            className="pointer-events-none absolute left-0 top-2 bottom-0 w-[2px] bg-gradient-to-b from-blue-500 via-purple-500 to-emerald-500"
            aria-hidden
          />

          {/* Node on Spine */}
          <div className="absolute -left-[11px] top-0 flex h-6 w-6 items-center justify-center rounded-full border border-purple-400 bg-base text-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.5)]">
            <FiGitMerge className="h-3 w-3" />
          </div>

          <div className="max-w-3xl mb-12">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">
              Merged Deliverables
            </span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              Shipped through pull requests.
            </h2>
            <p className="mt-4 text-base text-muted">
              Inspect recently completed milestone pull requests, verified code reviews, and on-chain escrow settlements.
            </p>
          </div>

          {/* Merged PR Cards */}
          <div className="grid gap-6 lg:grid-cols-3">
            {mergedPRs.map((pr) => (
              <div
                key={pr.id}
                className="flex flex-col justify-between rounded-xl border border-border-strong bg-[#0d1117] p-6 shadow-md transition-all duration-200 hover:border-emerald-500/40"
              >
                <div>
                  {/* PR Header */}
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#8957e5] px-2.5 py-0.5 text-[11px] font-mono font-bold text-white">
                      <FiGitMerge className="h-3 w-3" />
                      Merged #{pr.prNumber}
                    </span>

                    <span className="font-mono text-xs text-emerald-400 font-bold">
                      {formatAmount(pr.budgetUSD * 100)} Settled
                    </span>
                  </div>

                  <p className="mt-3 font-mono text-[11px] text-blue-400 truncate">
                    {pr.clientRepo}
                  </p>

                  <h3 className="mt-1 text-sm font-bold text-foreground leading-snug">
                    {pr.title}
                  </h3>

                  {/* Deliverables */}
                  <ul className="mt-4 space-y-2 text-xs text-muted">
                    {pr.deliverables.map((d) => (
                      <li key={d} className="flex items-start gap-2">
                        <FiCheck className="mt-0.5 h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span className="leading-relaxed">{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Git Telemetry Footer */}
                <div className="mt-6 pt-4 border-t border-border/60 flex items-center justify-between font-mono text-[11px] text-subtle">
                  <div className="flex items-center gap-2">
                    <FiGitCommit className="h-3 w-3 text-subtle" />
                    <span>{pr.commitHash}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400">+{pr.additions}</span>
                    <span className="text-rose-400">−{pr.deletions}</span>
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
