import { FiShield, FiLock, FiCheckCircle, FiCpu, FiAlertTriangle, FiPercent } from "react-icons/fi"

const assurancePillars = [
  {
    icon: FiLock,
    title: "Non-Custodial Smart Contract Escrow",
    description:
      "FairWork never takes custody of funds. Client deposits are held by immutable Solidity contracts on-chain, eliminating middleman bankruptcy or withholding risks.",
    badge: "Solidity ^0.8.28",
  },
  {
    icon: FiCheckCircle,
    title: "Deterministic Release Mechanism",
    description:
      "When you inspect and approve a milestone deliverable, the contract's atomic transfer immediately deposits the payment directly into the creator's wallet.",
    badge: "Instant Settlement",
  },
  {
    icon: FiShield,
    title: "48-Hour Mutual Review Timelock",
    description:
      "Neither party can unilaterally drain or cancel the escrow once deliverables are lodged for review, preventing arbitrary cancellations.",
    badge: "Anti-Clawback",
  },
  {
    icon: FiPercent,
    title: "Zero Platform Take-Rate (0% Commission)",
    description:
      "Freelancers receive 100% of agreed milestone amounts. No hidden 20% deduction or opaque processing markups.",
    badge: "100% to Creator",
  },
  {
    icon: FiAlertTriangle,
    title: "Transparent Dispute Arbitration",
    description:
      "If deliverables do not match agreed scope, either party can raise a formal dispute to an independent arbitrator with cryptographic evidence trails.",
    badge: "On-Chain Resolution",
  },
  {
    icon: FiCpu,
    title: "Cryptographic EIP-712 Authentication",
    description:
      "All agreements and authorizations are signed using standardized cryptographic wallet signatures, ensuring non-repudiation.",
    badge: "EIP-712 Standard",
  },
] as const

export function EscrowAssurance() {
  return (
    <section id="escrow-assurance" className="w-full bg-surface border-b border-border/40 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">
            Protocol Security
          </span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Engineered for mutual financial safety
          </h2>
          <p className="mt-4 text-base text-muted">
            FairWork removes trust liabilities from both sides of the contract through deterministic smart contracts.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {assurancePillars.map(({ icon: Icon, title, description, badge }) => (
            <div
              key={title}
              className="flex flex-col justify-between rounded-2xl border border-border bg-base p-6 shadow-sm transition-all duration-200 hover:border-emerald-500/40 hover:-translate-y-1"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="rounded bg-surface px-2 py-0.5 font-mono text-[10px] text-subtle border border-border">
                    {badge}
                  </span>
                </div>

                <h3 className="mt-5 text-base font-bold text-foreground">
                  {title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  {description}
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-border/60 flex items-center justify-between text-[11px] font-mono text-subtle">
                <span>Contract Guard</span>
                <span className="text-emerald-400 font-semibold">Active</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
