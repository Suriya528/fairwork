import { FiCheck, FiShield, FiClock, FiCheckCircle } from "react-icons/fi"
import { useCurrency } from "@/context/CurrencyContext"

interface CompletedProject {
  id: string
  title: string
  clientIndustry: string
  domain: string
  budgetUSD: number
  turnaround: string
  deliverables: string[]
  verificationProof: string
}

const completedProjects: CompletedProject[] = [
  {
    id: "proj-1",
    title: "Multi-Asset Vault Contracts & Invariant Test Suite",
    clientIndustry: "Decentralized Finance Protocol",
    domain: "Smart Contracts",
    budgetUSD: 3600,
    turnaround: "14 days",
    deliverables: [
      "Non-custodial escrow architecture with reentrancy protection",
      "Invariant test suite in Foundry with 100% branch test coverage",
      "Slither automated static analysis signoff with 0 findings",
    ],
    verificationProof: "Settled on Sepolia #FW-104",
  },
  {
    id: "proj-2",
    title: "Autonomous Code Review Agent & Webhook Architecture",
    clientIndustry: "Developer Platform Infrastructure",
    domain: "AI Engineering",
    budgetUSD: 2800,
    turnaround: "10 days",
    deliverables: [
      "AST code parser and multi-step evaluation pipeline",
      "Event webhook listener with automated review comments",
      "Optimized inference benchmarks on production branches",
    ],
    verificationProof: "Settled on Sepolia #FW-088",
  },
  {
    id: "proj-3",
    title: "Multi-Theme Token System & UI Component Library",
    clientIndustry: "Enterprise Fintech Application",
    domain: "Product Design",
    budgetUSD: 2200,
    turnaround: "8 days",
    deliverables: [
      "Figma variables architecture supporting dark and light themes",
      "40+ responsive application primitives with active state variants",
      "Exported token JSON pipeline synced directly to styling config",
    ],
    verificationProof: "Settled on Sepolia #FW-062",
  },
]

export function VerifiedProjectShowcase() {
  const { formatAmount } = useCurrency()

  return (
    <section className="relative w-full bg-base py-20 sm:py-28 overflow-hidden">
      {/* Subtle emerald/teal glow */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute left-1/3 bottom-10 h-[380px] w-[380px] rounded-full bg-emerald-500/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Centered Section Header */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-surface/80 px-3.5 py-1 text-xs font-mono text-muted mb-4 shadow-xs">
            <FiShield className="h-3.5 w-3.5 text-emerald-400" />
            <span className="font-medium text-foreground/90">Verified Settlements</span>
          </div>

          <h2 className="text-3xl font-light tracking-tight text-foreground sm:text-5xl leading-[1.15]">
            Shipped deliverables.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-200 to-emerald-300 font-normal">
              Settled milestones.
            </span>
          </h2>

          <p className="mt-4 text-base font-light text-muted/90 sm:text-lg max-w-2xl leading-relaxed">
            Inspect completed projects, verified deliverable criteria, and transparent smart contract escrow releases.
          </p>
        </div>

        {/* Deliverable Showcase Cards Grid */}
        <div className="max-w-6xl mx-auto grid gap-6 lg:grid-cols-3">
          {completedProjects.map((proj) => (
            <div
              key={proj.id}
              className="flex flex-col justify-between rounded-2xl border border-border/80 bg-surface p-6 sm:p-7 shadow-lg transition-all duration-200 hover:border-cyan-500/40 hover:shadow-xl"
            >
              <div>
                {/* Header Bar */}
                <div className="flex items-center justify-between border-b border-border/80 pb-4">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-mono font-medium text-emerald-400">
                    <FiCheckCircle className="h-3 w-3" />
                    Escrow Settled
                  </span>

                  <span className="font-mono text-sm text-foreground font-medium">
                    {formatAmount(proj.budgetUSD)}
                  </span>
                </div>

                <div className="mt-4">
                  <span className="text-[11px] font-mono text-cyan-400 font-medium uppercase tracking-wider block">
                    {proj.domain} • {proj.clientIndustry}
                  </span>
                  <h3 className="mt-1.5 text-base font-medium text-foreground leading-snug">
                    {proj.title}
                  </h3>
                </div>

                {/* Deliverables Checklist */}
                <div className="mt-5 space-y-2.5">
                  <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-subtle block">
                    Verified Deliverables:
                  </span>
                  <ul className="space-y-2 text-xs text-muted">
                    {proj.deliverables.map((d) => (
                      <li key={d} className="flex items-start gap-2">
                        <FiCheck className="mt-0.5 h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span className="leading-relaxed text-foreground/85 font-light">{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Settlement Proof Footer */}
              <div className="mt-6 pt-4 border-t border-border/80 flex items-center justify-between font-mono text-[11px] text-subtle font-normal">
                <span className="flex items-center gap-1">
                  <FiClock className="h-3 w-3 text-subtle" />
                  {proj.turnaround}
                </span>

                <span className="text-emerald-400 font-medium">
                  {proj.verificationProof}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
