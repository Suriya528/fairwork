import { Link } from "react-router-dom"
import { FiArrowRight, FiBriefcase, FiCode } from "react-icons/fi"
import { useAuth } from "@/context/AuthContext"

export function MarketplaceCTA() {
  const { status } = useAuth()
  const isAuthed = status === "authenticated"
  const destination = isAuthed ? "/projects" : "/register"

  return (
    <section className="w-full bg-base py-20 sm:py-28 border-b border-border/40 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">
            Start Building
          </span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl leading-tight">
            Build with certainty. Get paid without dispute.
          </h2>
          <p className="mt-4 text-base text-muted sm:text-lg">
            Whether you&apos;re commissioning critical software architecture or delivering senior-level design, FairWork replaces uncertainty with non-custodial milestone escrow.
          </p>
        </div>

        {/* Dual Funnels */}
        <div className="grid gap-8 md:grid-cols-2 max-w-5xl mx-auto">
          {/* Client Funnel */}
          <div className="flex flex-col justify-between rounded-3xl border border-border bg-surface p-8 sm:p-10 shadow-xl transition-all duration-300 hover:border-emerald-500/40">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <FiBriefcase className="h-5 w-5" />
                </span>
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-400">
                  For Project Leads &amp; Founders
                </span>
              </div>

              <h3 className="mt-6 text-2xl font-extrabold text-foreground">
                Commission Technical Milestones
              </h3>
              <p className="mt-3 text-sm text-muted leading-relaxed">
                Define explicit deliverable criteria and lock budgets in transparent escrow. Review working code, Figma specs, and security reports before authorizing on-chain payment release.
              </p>

              <ul className="mt-6 flex flex-col gap-2.5 text-xs text-muted">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Pre-screened senior engineers across core disciplines
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Funds remain safely locked in contract until you approve
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Formal on-chain dispute arbitration if deliverables differ from spec
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-border">
              <Link
                to={destination}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 transition-all active:scale-[0.98]"
              >
                <span>Post a Milestone Brief</span>
                <FiArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Specialist Funnel */}
          <div className="flex flex-col justify-between rounded-3xl border border-border bg-surface p-8 sm:p-10 shadow-xl transition-all duration-300 hover:border-emerald-500/40">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <FiCode className="h-5 w-5" />
                </span>
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-blue-400">
                  For Engineers &amp; Designers
                </span>
              </div>

              <h3 className="mt-6 text-2xl font-extrabold text-foreground">
                Deliver Work with Payout Certainty
              </h3>
              <p className="mt-3 text-sm text-muted leading-relaxed">
                Work with serious clients with pre-funded milestone escrow. Retain 100% of your earnings with zero platform commission and build an immutable on-chain reputation.
              </p>

              <ul className="mt-6 flex flex-col gap-2.5 text-xs text-muted">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                  Guaranteed contract escrow funded prior to kickoff
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                  0% platform commission (keep 100% of your fee)
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                  Instant wallet settlement directly in USDC
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-border">
              <Link
                to={destination}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border-strong bg-base hover:bg-elevated px-6 text-xs font-bold text-foreground transition-all active:scale-[0.98]"
              >
                <span>Browse Funded Opportunities</span>
                <FiArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
