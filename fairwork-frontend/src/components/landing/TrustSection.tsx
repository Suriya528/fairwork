import { FiShield, FiEye, FiAlertTriangle, FiCheckCircle, FiLock, FiCpu } from "react-icons/fi"

/**
 * Trust section highlighting FairWork's escrow & dispute architecture.
 * Features a protocol verification card alongside core trust pillars.
 */
const features = [
  {
    icon: FiShield,
    title: "Non-Custodial Milestone Escrow",
    description:
      "Funds are locked on-chain in smart contracts. Neither client nor freelancer can withdraw unilaterally.",
  },
  {
    icon: FiEye,
    title: "Transparent Payment Ledger",
    description:
      "Every escrow deposit, milestone submission, and approval is recorded on-chain with immutable transaction hashes.",
  },
  {
    icon: FiAlertTriangle,
    title: "Arbitrator Dispute Resolution",
    description:
      "If a deliverable is contested, formal dispute arbitration allows evidence submission and fair resolution.",
  },
  {
    icon: FiCheckCircle,
    title: "Upfront Budget Lock",
    description:
      "Milestone amounts are set before kickoff. No hidden platform commissions or surprise deductions.",
  },
] as const

export function TrustSection() {
  return (
    <section className="w-full bg-base border-b border-border/40 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-12">
          {/* Left Column: Messaging */}
          <div className="lg:col-span-6">
            <span className="text-xs font-bold uppercase tracking-widest text-primary font-mono">
              Payment Protection Infrastructure
            </span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Contract security without middleman risk
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted">
              Traditional freelance platforms control your money and charge unpredictable fees.
              FairWork uses smart contracts to guarantee that clients pay only for verified work, and freelancers get paid immediately upon approval.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {features.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="rounded-xl border border-border bg-surface p-4.5 transition-colors hover:border-border-strong"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4.5 w-4.5" aria-hidden />
                    </span>
                    <h3 className="text-sm font-bold text-foreground">{title}</h3>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted">{description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Protocol Trust Card Component */}
          <div className="lg:col-span-6">
            <div className="rounded-2xl border border-border-strong bg-gradient-to-b from-surface via-surface to-elevated p-6 sm:p-8 shadow-2xl shadow-black/50">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2.5">
                  <FiCpu className="h-5 w-5 text-primary" />
                  <span className="font-mono text-xs font-bold text-foreground uppercase tracking-wider">
                    Escrow Contract Rules
                  </span>
                </div>
                <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 font-mono text-[10px] text-emerald-400 font-medium">
                  Verified Smart Contract
                </span>
              </div>

              {/* Protocol Security Principles list */}
              <div className="mt-6 flex flex-col gap-4">
                {[
                  {
                    label: "1. Deposit Stage",
                    text: "Client funds milestone -> Tokens locked in Escrow Contract",
                    icon: FiLock,
                    accent: "text-blue-400",
                  },
                  {
                    label: "2. Submission Stage",
                    text: "Freelancer uploads deliverables & notifies Client",
                    icon: FiEye,
                    accent: "text-amber-400",
                  },
                  {
                    label: "3. Settlement Stage",
                    text: "Client approves -> Automated instant release to Freelancer wallet",
                    icon: FiCheckCircle,
                    accent: "text-emerald-400",
                  },
                  {
                    label: "4. Dispute Stage",
                    text: "Contested milestone -> Submitted to Arbitrator authority for resolution",
                    icon: FiAlertTriangle,
                    accent: "text-rose-400",
                  },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.label} className="flex items-start gap-3 rounded-xl border border-border/80 bg-base/50 p-3.5">
                      <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-elevated ${item.accent}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <div>
                        <p className="font-mono text-xs font-bold text-foreground">{item.label}</p>
                        <p className="mt-0.5 text-xs text-muted leading-relaxed">{item.text}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Security Guarantee Banner */}
              <div className="mt-6 flex items-center justify-between rounded-xl bg-primary/10 border border-primary/20 p-3.5 text-xs">
                <span className="text-muted">Zero platform hold. Direct P2P protocol settlement.</span>
                <span className="font-mono font-bold text-primary">EIP-712 Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
