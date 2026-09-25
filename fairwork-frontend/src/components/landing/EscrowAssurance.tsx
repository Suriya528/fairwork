import { FiShield, FiLock, FiCheckCircle, FiCpu, FiAlertTriangle, FiPercent } from "react-icons/fi"

const securityGuardrails = [
  {
    icon: FiLock,
    title: "Non-Custodial Smart Contract Lockbox",
    description:
      "FairWork never holds client balances in a central company account. Funds are committed directly to smart contract escrow storage on-chain.",
    tag: "Cryptographic Vault",
  },
  {
    icon: FiCheckCircle,
    title: "Atomic Milestone Settlement",
    description:
      "Once a deliverable passes inspection and the client confirms signoff, the contract executes an immediate peer-to-peer payout straight to the creator.",
    tag: "Instant Finality",
  },
  {
    icon: FiShield,
    title: "Mutual Inspection Protection",
    description:
      "Contract timelocks protect both sides: clients receive an inspection window, and specialists are guaranteed funds cannot be unilaterally pulled during review.",
    tag: "Dual Guardrail",
  },
  {
    icon: FiPercent,
    title: "Zero Platform Commission",
    description:
      "Specialists keep 100% of their agreed milestone pricing. No 20% platform cut, zero processing markups, and zero hidden withdrawal deductions.",
    tag: "100% Payout",
  },
  {
    icon: FiAlertTriangle,
    title: "Decentralized On-Chain Arbitration",
    description:
      "If deliverables diverge from agreed milestone acceptance criteria, either participant can escalate to neutral arbitration with on-chain evidence.",
    tag: "Impartial Resolution",
  },
  {
    icon: FiCpu,
    title: "Cryptographic Wallet Verification",
    description:
      "Every milestone approval and contract state transition is secured via EIP-712 wallet signatures, ensuring tamper-proof non-repudiation.",
    tag: "EIP-712 Verified",
  },
] as const

export function EscrowAssurance() {
  return (
    <section id="security-guardrails" className="relative w-full bg-base border-b border-border/40 py-20 sm:py-28 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Centered Section Header */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-mono text-muted mb-4 shadow-xs">
            <FiShield className="h-3.5 w-3.5 text-emerald-400" />
            <span className="font-semibold text-foreground">Buyer &amp; Creator Assurance</span>
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl leading-tight">
            Guaranteed protection for every milestone.
          </h2>

          <p className="mt-4 text-base text-muted sm:text-lg max-w-2xl">
            Deterministic smart contract rules protect project deposits and creator payouts at every checkpoint.
          </p>
        </div>

        {/* Bento Trust Grid */}
        <div className="max-w-6xl mx-auto grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {securityGuardrails.map(({ icon: Icon, title, description, tag }) => (
            <div
              key={title}
              className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-6 sm:p-7 shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-elevated text-emerald-400 shadow-xs">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="rounded-full border border-border bg-elevated px-2.5 py-0.5 font-mono text-[10px] text-muted font-semibold">
                    {tag}
                  </span>
                </div>

                <h3 className="mt-5 text-base font-bold text-foreground leading-snug">
                  {title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-muted font-normal">
                  {description}
                </p>
              </div>

              <div className="mt-6 pt-3.5 border-t border-border/70 flex items-center justify-between text-[11px] font-mono text-subtle">
                <span>Security Model</span>
                <span className="text-emerald-400 font-semibold">Smart Contract Enforced</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
