import { Link } from "react-router-dom"
import { FiArrowRight, FiShield, FiZap, FiDollarSign } from "react-icons/fi"
import { useAuth } from "@/context/AuthContext"

export function MarketplaceCTA() {
  const { status, user } = useAuth()
  const isAuthed = status === "authenticated"
  const isClient = isAuthed && user?.role === "client"
  const destination = isAuthed ? (isClient ? "/projects/new" : "/projects") : "/register"

  return (
    <section className="relative w-full bg-gradient-to-b from-surface/50 via-base to-base py-24 sm:py-32 border-b border-border/40 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute left-1/2 top-1/2 h-[450px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-cyan-500/10 via-emerald-500/10 to-teal-500/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          {/* Centered Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-surface/80 px-4 py-1.5 text-xs font-mono text-muted mb-6 shadow-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-foreground/90">Zero Platform Commission</span>
          </div>

          <h2 className="text-3xl font-light tracking-tight text-foreground sm:text-5xl lg:text-6xl leading-[1.12]">
            Build with certainty.{" "}
            <span className="block font-normal text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-200 to-emerald-300">
              Settle with confidence.
            </span>
          </h2>

          <p className="mt-6 text-base text-muted/90 sm:text-xl leading-relaxed max-w-2xl font-light">
            Commission deliverables backed by non-custodial smart contracts, or offer your technical expertise with 100% milestone payout assurance.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto">
            <Link
              to={destination}
              className="flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-hover px-8 text-sm font-medium text-white shadow-md transition-all cursor-pointer"
            >
              <span>Get Started Free</span>
              <FiArrowRight className="h-4 w-4" />
            </Link>

            <Link
              to="/projects"
              className="flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-border/80 bg-surface hover:bg-elevated px-7 text-sm font-medium text-foreground transition-colors shadow-xs cursor-pointer"
            >
              <span>Explore Deliverables</span>
            </Link>
          </div>

          {/* Trust Value Props */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-xs font-mono text-muted font-normal">
            <span className="inline-flex items-center gap-1.5">
              <FiShield className="h-4 w-4 text-emerald-400" />
              Non-custodial lockbox
            </span>
            <span className="inline-flex items-center gap-1.5">
              <FiZap className="h-4 w-4 text-cyan-400" />
              Instant wallet payouts
            </span>
            <span className="inline-flex items-center gap-1.5">
              <FiDollarSign className="h-4 w-4 text-teal-400" />
              0% platform take-rate
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
