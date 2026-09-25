import { useState } from "react"
import {
  FiCheckCircle,
  FiShield,
  FiLock,
  FiZap,
  FiEye,
  FiCheck,
} from "react-icons/fi"
import { useCurrency } from "@/context/CurrencyContext"
import { cn } from "@/lib/utils"

const fiverrValuePillars = [
  {
    title: "Over 700 technical disciplines",
    description:
      "Get results from skilled freelancers from all over the world, for every task, at any price point.",
  },
  {
    title: "Clear, transparent pricing",
    description:
      "No hourly billing surprises or hidden platform fees. Project milestone budgets are set and committed before kickoff.",
  },
  {
    title: "Non-custodial milestone escrow",
    description:
      "Milestone funds are cryptographically locked on-chain in smart contracts. Payouts release only when you approve the work.",
  },
  {
    title: "Protected & dispute-ready",
    description:
      "24/7 arbitration and a 48-hour timelock prevent unilateral chargebacks, keeping both clients and freelancers 100% secure.",
  },
] as const

export function TrustSection() {
  const { formatAmount } = useCurrency()
  const [activeTab, setActiveTab] = useState<number>(1)

  return (
    <section id="trust-guarantee" className="w-full bg-surface border-b border-border/40 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-14">
          {/* Left Column: Fiverr Core Value Props */}
          <div className="lg:col-span-6">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 font-mono">
              The FairWork Advantage
            </span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl leading-tight">
              A whole world of freelance talent at your fingertips
            </h2>

            <div className="mt-8 flex flex-col gap-6">
              {fiverrValuePillars.map((pillar) => (
                <div key={pillar.title} className="flex items-start gap-4">
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                    <FiCheck className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      {pillar.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: High-Converting Interactive Escrow Card */}
          <div className="lg:col-span-6">
            <div className="relative overflow-hidden rounded-3xl border border-border-strong bg-base p-6 sm:p-8 shadow-2xl shadow-black/50 backdrop-blur-xl">
              {/* Decorative Glow */}
              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
              <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <FiShield className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Live Milestone Settlement</h3>
                    <p className="font-mono text-xs text-subtle">Project ID #FW-84920</p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-mono text-[11px] font-semibold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Smart Contract Verified
                </span>
              </div>

              {/* Summary Stats Strip */}
              <div className="mt-5 grid grid-cols-3 gap-3 rounded-2xl border border-border bg-surface p-3.5 text-center font-mono">
                <div>
                  <span className="text-[10px] text-subtle uppercase">Total Escrow</span>
                  <p className="mt-0.5 text-xs font-bold text-foreground">{formatAmount(240000)}</p>
                </div>
                <div>
                  <span className="text-[10px] text-subtle uppercase">Released</span>
                  <p className="mt-0.5 text-xs font-bold text-emerald-400">{formatAmount(160000)}</p>
                </div>
                <div>
                  <span className="text-[10px] text-subtle uppercase">In Escrow</span>
                  <p className="mt-0.5 text-xs font-bold text-blue-400">{formatAmount(80000)}</p>
                </div>
              </div>

              {/* Milestone Steps Interactive Timeline */}
              <div className="mt-6 flex flex-col gap-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-subtle font-mono">
                  Milestone Deliverables:
                </p>

                {[
                  {
                    id: 1,
                    title: "Phase 1: Architecture & Smart Contracts",
                    amount: formatAmount(80000),
                    status: "Paid to Wallet",
                    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
                    icon: FiCheckCircle,
                    detail: "Deliverable approved by client. 800 USDC sent directly to freelancer wallet.",
                  },
                  {
                    id: 2,
                    title: "Phase 2: Frontend & EIP-712 Integration",
                    amount: formatAmount(80000),
                    status: "Client Reviewing",
                    badge: "bg-blue-500/10 text-blue-400 border-blue-500/30",
                    icon: FiEye,
                    detail: "Freelancer uploaded GitHub PR. Client has 48h to review before auto-release.",
                  },
                  {
                    id: 3,
                    title: "Phase 3: Testnet Deploy & Security Audit",
                    amount: formatAmount(80000),
                    status: "Locked in Escrow",
                    badge: "bg-slate-800 text-slate-400 border-slate-700",
                    icon: FiLock,
                    detail: "800 USDC committed in EscrowContract.sol, awaiting Phase 2 completion.",
                  },
                ].map((item) => {
                  const Icon = item.icon
                  const isSelected = activeTab === item.id
                  return (
                    <div
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={cn(
                        "rounded-xl border p-3.5 cursor-pointer transition-all duration-200",
                        isSelected
                          ? "border-emerald-500/80 bg-surface shadow-md"
                          : "border-border bg-surface/50 hover:bg-surface hover:border-border-strong",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Icon
                            className={cn(
                              "h-4 w-4 shrink-0",
                              isSelected ? "text-emerald-400" : "text-subtle",
                            )}
                          />
                          <span className="text-xs font-bold text-foreground">
                            {item.title}
                          </span>
                        </div>
                        <span className={cn("rounded-md border px-2 py-0.5 text-[10px] font-mono font-medium", item.badge)}>
                          {item.status}
                        </span>
                      </div>

                      {isSelected && (
                        <div className="mt-2.5 pt-2.5 border-t border-border/60 text-xs text-muted leading-relaxed flex items-center justify-between">
                          <span>{item.detail}</span>
                          <span className="font-mono font-bold text-foreground shrink-0 ml-2">
                            {item.amount}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Bottom Guarantee Banner */}
              <div className="mt-6 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-muted">
                <FiZap className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>
                  Payments are non-custodial: client funds are held by the contract, not a middleman company.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
