import { FiCheck, FiX, FiLock } from "react-icons/fi"

const comparisonRows = [
  {
    feature: "Platform Take-Rate / Fee",
    fairwork: "0% Commission (You keep 100%)",
    traditional: "10% to 20% platform cut",
    advantage: true,
  },
  {
    feature: "Payout Release Speed",
    fairwork: "Instant upon client approval",
    traditional: "14 to 21-day holding period",
    advantage: true,
  },
  {
    feature: "Fund Custody & Security",
    fairwork: "Non-custodial smart contract escrow",
    traditional: "Held in centralized corporate accounts",
    advantage: true,
  },
  {
    feature: "Chargeback & Clawback Risk",
    fairwork: "Protected by 48h timelock guarantee",
    traditional: "Vulnerable to bank credit card chargebacks",
    advantage: true,
  },
  {
    feature: "Global Currency Settlement",
    fairwork: "Native USDC & Multi-Currency",
    traditional: "High FX fees & international wire delays",
    advantage: true,
  },
  {
    feature: "Professional Reputation",
    fairwork: "Immutable, portable on-chain record",
    traditional: "Locked inside a single platform database",
    advantage: true,
  },
] as const

export function PlatformComparison() {
  return (
    <section className="w-full bg-surface border-b border-border/40 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 font-mono">
            Platform Comparison
          </span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Why freelancers and clients choose FairWork
          </h2>
          <p className="mt-3 text-base text-muted">
            See how modern decentralized escrow transforms freelance collaboration compared to legacy Web2 middlemen.
          </p>
        </div>

        {/* Comparison Matrix Table */}
        <div className="overflow-hidden rounded-3xl border border-border-strong bg-base shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-surface/80">
                  <th scope="col" className="p-5 sm:p-6 text-xs font-bold uppercase tracking-wider text-subtle font-mono">
                    Feature & Protection
                  </th>
                  <th scope="col" className="p-5 sm:p-6 text-emerald-400 font-extrabold text-sm sm:text-base border-x border-border/60 bg-emerald-500/5">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      FairWork Escrow
                    </div>
                  </th>
                  <th scope="col" className="p-5 sm:p-6 text-muted font-bold text-sm sm:text-base">
                    Traditional Platforms
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-sans">
                {comparisonRows.map((row) => (
                  <tr key={row.feature} className="hover:bg-surface-hover/30 transition-colors">
                    <td className="p-5 sm:p-6 font-semibold text-foreground text-xs sm:text-sm">
                      {row.feature}
                    </td>

                    {/* FairWork Column */}
                    <td className="p-5 sm:p-6 border-x border-border/60 bg-emerald-500/5">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                          <FiCheck className="h-3.5 w-3.5" />
                        </span>
                        <span className="font-bold text-foreground text-xs sm:text-sm">
                          {row.fairwork}
                        </span>
                      </div>
                    </td>

                    {/* Traditional Platforms Column */}
                    <td className="p-5 sm:p-6 text-muted">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-rose-400">
                          <FiX className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-xs sm:text-sm text-subtle">
                          {row.traditional}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Callout in Comparison */}
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-border bg-surface/50 p-6 gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <FiLock className="h-5 w-5" />
              </span>
              <p className="text-xs text-muted max-w-lg">
                Your money is safeguarded by open-source smart contracts, ensuring unbiased payment delivery for every milestone.
              </p>
            </div>
            <span className="font-mono text-xs text-emerald-400 font-bold shrink-0">
              Zero Platform Commission
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
