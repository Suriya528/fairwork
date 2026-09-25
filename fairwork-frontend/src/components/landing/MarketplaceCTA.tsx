import { Link } from "react-router-dom"
import { FiArrowRight, FiCheck } from "react-icons/fi"
import { useAuth } from "@/context/AuthContext"

export function MarketplaceCTA() {
  const { status } = useAuth()
  const isAuthed = status === "authenticated"
  const destination = isAuthed ? "/projects" : "/register"

  return (
    <section className="relative w-full bg-base py-20 sm:py-28 border-b border-border/40 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Continuous Spine Line Final Node */}
        <div className="relative pl-6 sm:pl-10">
          <div
            className="pointer-events-none absolute left-0 top-2 h-24 w-[2px] bg-gradient-to-b from-blue-500 to-transparent"
            aria-hidden
          />

          {/* Spine Termination Node */}
          <div className="absolute -left-[11px] top-0 flex h-6 w-6 items-center justify-center rounded-full border border-emerald-400 bg-base text-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]">
            <FiCheck className="h-3 w-3" />
          </div>

          <div className="max-w-4xl">
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl leading-[1.08]">
              The place for anyone from anywhere to build anything.
            </h2>

            <p className="mt-6 text-base text-muted sm:text-xl leading-relaxed max-w-2xl font-sans">
              Commission milestone deliverables with non-custodial escrow protection, or contribute your engineering skills with payout certainty.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
              <Link
                to={destination}
                className="flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-md bg-[#238636] hover:bg-[#2ea043] px-7 text-sm font-bold text-white shadow-sm transition-colors"
              >
                <span>Sign up for FairWork</span>
                <FiArrowRight className="h-4 w-4" />
              </Link>

              <Link
                to={destination}
                className="flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-md border border-border-strong bg-surface hover:bg-elevated px-6 text-sm font-semibold text-foreground transition-colors"
              >
                <span>Browse open briefs</span>
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-6 text-xs font-mono text-subtle">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Zero platform take-rate
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                Non-custodial smart contracts
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                Pull-request deliverable reviews
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
