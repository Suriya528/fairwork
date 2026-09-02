import { Link } from "react-router-dom"
import { FiCheck, FiBriefcase, FiUserCheck, FiArrowRight } from "react-icons/fi"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"

const clientBenefits = [
  "Access pre-verified technical freelancers across 8 core categories",
  "Milestone-based payment protection — pay only when deliverables pass review",
  "Transparent milestone tracking with real-time status updates",
  "Formal dispute arbitration path in case of scope disagreement",
  "On-chain transaction receipts for total auditability",
] as const

const freelancerBenefits = [
  "Browse verified client briefs with committed milestone budgets",
  "Guaranteed milestone funding held in smart contract escrow prior to kickoff",
  "Direct P2P payment releases straight to your connected crypto wallet",
  "Build an immutable, on-chain professional work history and rating",
  "Protected against arbitrary project cancellations or withheld payments",
] as const

const btnBase =
  "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"

export function PlatformBenefits() {
  const { status } = useAuth()
  const isAuthed = status === "authenticated"
  const destination = isAuthed ? "/projects" : "/register"

  return (
    <section className="w-full bg-surface border-b border-border/40 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-primary font-mono">
            Dual-Sided Protocol
          </span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Engineered for Clients and Freelancers
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-muted">
            FairWork aligns incentives for both sides of the contract with transparent terms and escrow protection.
          </p>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-2">
          {/* Client Card */}
          <div className="flex flex-col justify-between rounded-2xl border border-border bg-base p-7 shadow-xl shadow-black/20 hover:border-primary/40 transition-colors">
            <div>
              <div className="flex items-center justify-between border-b border-border pb-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <FiBriefcase className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">For Clients</h3>
                    <p className="text-xs text-subtle">Hire technical talent with zero payment risk</p>
                  </div>
                </div>
                <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-1 text-[11px] font-mono font-semibold text-primary">
                  Client Mode
                </span>
              </div>

              <ul className="mt-6 flex flex-col gap-3.5" role="list">
                {clientBenefits.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-xs leading-relaxed text-muted">
                    <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <FiCheck className="h-3 w-3" aria-hidden />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-border/80">
              <Link
                to={destination}
                className={cn(btnBase, "bg-primary text-primary-foreground hover:bg-primary-hover h-11 w-full gap-2 text-xs font-semibold shadow-md shadow-primary/10")}
              >
                Hire Freelancers
                <FiArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Freelancer Card */}
          <div className="flex flex-col justify-between rounded-2xl border border-border bg-base p-7 shadow-xl shadow-black/20 hover:border-border-strong transition-colors">
            <div>
              <div className="flex items-center justify-between border-b border-border pb-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-elevated text-foreground border border-border">
                    <FiUserCheck className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">For Freelancers</h3>
                    <p className="text-xs text-subtle">Get paid for every approved milestone</p>
                  </div>
                </div>
                <span className="rounded-full bg-elevated border border-border px-2.5 py-1 text-[11px] font-mono font-semibold text-muted">
                  Freelancer Mode
                </span>
              </div>

              <ul className="mt-6 flex flex-col gap-3.5" role="list">
                {freelancerBenefits.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-xs leading-relaxed text-muted">
                    <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-surface border border-border text-primary">
                      <FiCheck className="h-3 w-3" aria-hidden />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-border/80">
              <Link
                to={destination}
                className={cn(btnBase, "border border-border-strong bg-surface text-foreground hover:bg-surface-hover h-11 w-full gap-2 text-xs font-semibold")}
              >
                Browse Freelance Opportunities
                <FiArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
