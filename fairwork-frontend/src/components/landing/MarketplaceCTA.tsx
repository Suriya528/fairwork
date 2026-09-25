import { Link } from "react-router-dom"
import { FiArrowRight, FiBriefcase, FiUserCheck, FiZap } from "react-icons/fi"
import { useAuth } from "@/context/AuthContext"

export function MarketplaceCTA() {
  const { status } = useAuth()
  const isAuthed = status === "authenticated"
  const destination = isAuthed ? "/projects" : "/register"

  return (
    <section className="w-full bg-surface py-20 sm:py-28 border-b border-border/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Fiverr-Style Dual Banner */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 font-mono">
            Get Started Today
          </span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Suddenly it&apos;s all so doable.
          </h2>
          <p className="mt-4 text-base text-muted sm:text-lg">
            Whether you&apos;re looking to hire specialized talent or offer your skills to global clients, FairWork makes collaboration seamless and risk-free.
          </p>
        </div>

        {/* Two High-Conversion Action Cards */}
        <div className="grid gap-8 md:grid-cols-2">
          {/* Card 1: For Clients */}
          <div className="relative overflow-hidden rounded-3xl border border-border bg-base p-8 sm:p-10 shadow-xl transition-all duration-300 hover:border-emerald-500/40 hover:shadow-2xl flex flex-col justify-between">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/10 blur-2xl" />

            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <FiBriefcase className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 font-mono text-xs font-bold text-emerald-400">
                  Clients & Founders
                </span>
              </div>

              <h3 className="mt-6 text-2xl font-extrabold text-foreground">
                Find talent your way
              </h3>
              <p className="mt-3 text-sm text-muted leading-relaxed">
                Work with the best freelance talent from around the world on our secure, milestone-backed platform. Deposit funds into escrow only when you&apos;re ready to start.
              </p>

              <ul className="mt-6 flex flex-col gap-2.5 text-xs text-muted">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Pre-verified engineers across 8+ technical disciplines
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  100% money-back guarantee via 48h escrow timelock
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Zero platform markup or surprise commissions
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-border/80">
              <Link
                to={destination}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 transition-all active:scale-[0.98]"
              >
                <span>Post a Project Brief</span>
                <FiArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Card 2: For Freelancers / Sellers */}
          <div className="relative overflow-hidden rounded-3xl border border-border bg-base p-8 sm:p-10 shadow-xl transition-all duration-300 hover:border-blue-500/40 hover:shadow-2xl flex flex-col justify-between">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-blue-500/10 blur-2xl" />

            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <FiUserCheck className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 font-mono text-xs font-bold text-blue-400">
                  Freelancers & Sellers
                </span>
              </div>

              <h3 className="mt-6 text-2xl font-extrabold text-foreground">
                Earn on your own terms
              </h3>
              <p className="mt-3 text-sm text-muted leading-relaxed">
                Offer your services to top clients, build an immutable on-chain reputation, and get paid instantly in USDC to your Web3 wallet upon milestone approval.
              </p>

              <ul className="mt-6 flex flex-col gap-2.5 text-xs text-muted">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                  Guaranteed funds deposited in smart contract escrow prior to kickoff
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                  Instant P2P settlement straight to your MetaMask / EVM wallet
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                  Keep 100% of your earnings with 0% platform commission
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-border/80">
              <Link
                to={destination}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-border-strong bg-surface hover:bg-elevated hover:border-emerald-500/50 px-6 text-sm font-bold text-foreground transition-all active:scale-[0.98]"
              >
                <span>Become a Seller</span>
                <FiZap className="h-4 w-4 text-emerald-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
