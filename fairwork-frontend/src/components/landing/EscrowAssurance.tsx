import { FiShield, FiLock, FiCheckCircle, FiCpu, FiAlertTriangle, FiPercent } from "react-icons/fi"

const securityGuardrails = [
  {
    icon: FiLock,
    title: "Non-Custodial Smart Contract Lockbox",
    description:
      "FairWork never holds client balances. Funds are committed directly to immutable smart contract storage on-chain, preventing corporate custody risk.",
    status: "Enabled",
  },
  {
    icon: FiCheckCircle,
    title: "Atomic Milestone Settlement",
    description:
      "Once a milestone deliverable passes review and the client signs off, the contract executes an immediate peer-to-peer transfer to the creator's wallet.",
    status: "Enabled",
  },
  {
    icon: FiShield,
    title: "Mutual Review Protection",
    description:
      "Built-in contract timelocks prevent unilateral balance withdrawal while deliverables are under active inspection, safeguarding both sides.",
    status: "Enabled",
  },
  {
    icon: FiPercent,
    title: "Zero Platform Commission",
    description:
      "Contributors receive 100% of the milestone value. Zero platform fee cuts, zero processing deductions, and zero withdrawal holds.",
    status: "Enabled",
  },
  {
    icon: FiAlertTriangle,
    title: "Formal On-Chain Arbitration",
    description:
      "If deliverables deviate from agreed specifications, either participant can trigger neutral arbitration with verifiable commit and review evidence.",
    status: "Enabled",
  },
  {
    icon: FiCpu,
    title: "Cryptographic Wallet Authentication",
    description:
      "Every milestone approval and contract state change is verified via cryptographic wallet signatures, providing permanent non-repudiation.",
    status: "Enabled",
  },
] as const

export function EscrowAssurance() {
  return (
    <section id="security-guardrails" className="relative w-full bg-base border-b border-border/40 py-20 sm:py-28 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Continuous Spine Line */}
        <div className="relative pl-6 sm:pl-10">
          <div
            className="pointer-events-none absolute left-0 top-2 bottom-0 w-[2px] bg-gradient-to-b from-emerald-500 via-teal-500 to-blue-500"
            aria-hidden
          />

          {/* Node on Spine */}
          <div className="absolute -left-[11px] top-0 flex h-6 w-6 items-center justify-center rounded-full border border-emerald-400 bg-base text-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]">
            <FiShield className="h-3 w-3" />
          </div>

          <div className="max-w-3xl mb-12">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">
              Security &amp; Trust
            </span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              Built-in protection for every commit.
            </h2>
            <p className="mt-4 text-base text-muted">
              Deterministic smart contract rules protect project funds and creator payouts at every checkpoint.
            </p>
          </div>

          {/* GitHub Security Bento Cards */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {securityGuardrails.map(({ icon: Icon, title, description, status }) => (
              <div
                key={title}
                className="flex flex-col justify-between rounded-xl border border-border-strong bg-[#0d1117] p-6 transition-all duration-200 hover:border-emerald-500/40"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-[#161b22] text-emerald-400">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      {status}
                    </span>
                  </div>

                  <h3 className="mt-5 text-sm sm:text-base font-bold text-foreground">
                    {title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted">
                    {description}
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-border/60 flex items-center justify-between text-[11px] font-mono text-subtle">
                  <span>Verification</span>
                  <span className="text-foreground font-semibold">On-Chain Guard</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
