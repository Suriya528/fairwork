import { Link } from "react-router-dom"
import { FiArrowRight, FiShield, FiLock } from "react-icons/fi"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"

const btnBase =
  "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]"
const btnPrimary =
  "bg-primary text-primary-foreground hover:bg-primary-hover shadow-lg shadow-primary/25"
const btnOutline =
  "border border-border-strong bg-surface/90 text-foreground hover:bg-surface-hover hover:border-subtle"

export function MarketplaceCTA() {
  const { status } = useAuth()
  const isAuthed = status === "authenticated"
  const destination = isAuthed ? "/projects" : "/register"

  return (
    <section className="w-full bg-base py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-border-strong bg-gradient-to-b from-surface via-surface to-elevated px-6 py-16 text-center sm:px-12 sm:py-24 shadow-2xl shadow-black/60">
          {/* Ambient Lighting */}
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
            <div className="absolute left-1/2 top-1/2 h-[450px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-primary/15 via-primary/5 to-transparent blur-3xl" />
          </div>

          <div className="mx-auto max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-base/80 px-3.5 py-1 text-xs text-muted font-mono mb-6">
              <FiLock className="h-3.5 w-3.5 text-primary" />
              <span>Smart Contract Milestone Escrow</span>
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              Build and scale with milestone-backed security
            </h2>

            <p className="mt-5 text-base text-muted sm:text-lg leading-relaxed">
              Post a project or browse technical contracts. Funds remain cryptographically locked in escrow until deliverables are submitted, reviewed, and approved.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
              <Link
                to={destination}
                className={cn(btnBase, btnPrimary, "h-12 w-full min-w-[200px] gap-2 px-7 text-base sm:w-auto")}
              >
                Post a Project
                <FiArrowRight className="h-4 w-4" aria-hidden />
              </Link>

              <Link
                to={destination}
                className={cn(btnBase, btnOutline, "h-12 w-full min-w-[200px] gap-2 px-7 text-base sm:w-auto")}
              >
                <FiShield className="h-4 w-4 text-primary" aria-hidden />
                Join as a Freelancer
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
