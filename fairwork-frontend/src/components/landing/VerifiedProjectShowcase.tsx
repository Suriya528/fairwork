import { FiCheckCircle } from "react-icons/fi"
import { useCurrency } from "@/context/CurrencyContext"

interface VerifiedProject {
  id: string
  title: string
  clientType: string
  domain: string
  budgetUSD: number
  timeline: string
  milestonesCount: number
  deliverableHighlights: string[]
  stack: string[]
  settlementHash: string
}

const verifiedProjects: VerifiedProject[] = [
  {
    id: "proj-1",
    title: "Multi-Asset Vault Escrow & Invariant Suite",
    clientType: "DeFi Infrastructure Team",
    domain: "Smart Contracts",
    budgetUSD: 3600,
    timeline: "14 days",
    milestonesCount: 3,
    deliverableHighlights: [
      "ERC-4626 vault integration with reentrancy protection",
      "Formal invariant test suite in Foundry with 100% branch coverage",
      "Zero high/medium severity findings in automated Slither scans",
    ],
    stack: ["Solidity", "Foundry", "Slither", "USDC"],
    settlementHash: "0x4b9a...18e2",
  },
  {
    id: "proj-2",
    title: "Autonomous Code Review Agent & GitHub App",
    clientType: "Developer Tooling Startup",
    domain: "AI Engineering",
    budgetUSD: 2800,
    timeline: "10 days",
    milestonesCount: 2,
    deliverableHighlights: [
      "Custom AST parsing pipeline with LangChain & Claude 3.5 Sonnet",
      "GitHub Webhook listener with automated PR comment generation",
      "Sub-2s inference latency benchmark on benchmark test repos",
    ],
    stack: ["Python", "FastAPI", "LangChain", "Vector DB"],
    settlementHash: "0x7a2c...89d1",
  },
  {
    id: "proj-3",
    title: "Enterprise Multi-Brand Design System & Tokens",
    clientType: "FinTech Product Studio",
    domain: "Product Design",
    budgetUSD: 2200,
    timeline: "8 days",
    milestonesCount: 2,
    deliverableHighlights: [
      "Figma variables architecture supporting dark, light, and high-contrast",
      "40+ responsive dApp component primitives with interactive variants",
      "Exported JSON token pipeline synced directly to Tailwind config",
    ],
    stack: ["Figma Tokens", "Tailwind CSS", "React Primitives"],
    settlementHash: "0x1f8e...44a7",
  },
]

export function VerifiedProjectShowcase() {
  const { formatAmount } = useCurrency()

  return (
    <section className="w-full bg-surface border-b border-border/40 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">
            Case Studies
          </span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Shipped on FairWork
          </h2>
          <p className="mt-4 text-base text-muted">
            Explore recently settled engineering and design projects completed through verifiable smart contract milestones.
          </p>
        </div>

        {/* Project Cards Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          {verifiedProjects.map((project) => (
            <div
              key={project.id}
              className="flex flex-col justify-between rounded-2xl border border-border bg-base p-7 shadow-md transition-all duration-200 hover:border-emerald-500/40 hover:-translate-y-1"
            >
              <div>
                {/* Meta Header */}
                <div className="flex items-center justify-between border-b border-border/80 pb-4">
                  <span className="rounded-md border border-border bg-surface px-2.5 py-1 text-[11px] font-mono font-medium text-subtle">
                    {project.domain}
                  </span>
                  <span className="flex items-center gap-1 font-mono text-[11px] text-emerald-400 font-semibold">
                    <FiCheckCircle className="h-3.5 w-3.5" />
                    Settled On-Chain
                  </span>
                </div>

                {/* Title & Client */}
                <div className="mt-5">
                  <h3 className="text-base font-bold text-foreground leading-snug">
                    {project.title}
                  </h3>
                  <p className="mt-1 text-xs text-subtle font-mono">
                    Client: {project.clientType}
                  </p>
                </div>

                {/* Highlights List */}
                <ul className="mt-5 flex flex-col gap-2.5 text-xs text-muted" role="list">
                  {project.deliverableHighlights.map((hl) => (
                    <li key={hl} className="flex items-start gap-2 leading-relaxed">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <span>{hl}</span>
                    </li>
                  ))}
                </ul>

                {/* Tech Stack Chips */}
                <div className="mt-5 flex flex-wrap gap-1.5 pt-4 border-t border-border/60">
                  {project.stack.map((item) => (
                    <span
                      key={item}
                      className="rounded bg-surface px-2 py-0.5 font-mono text-[10px] text-subtle border border-border"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Project Ledger Bar */}
              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between font-mono text-xs">
                <div>
                  <span className="text-[10px] text-subtle uppercase block">Escrow Settled</span>
                  <span className="font-bold text-foreground">
                    {formatAmount(project.budgetUSD * 100)}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-subtle uppercase block">Duration</span>
                  <span className="text-muted font-medium">
                    {project.timeline} ({project.milestonesCount} stages)
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
