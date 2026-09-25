import { Link } from "react-router-dom"
import { FiStar, FiArrowRight, FiCheckCircle, FiShield, FiUsers, FiAward } from "react-icons/fi"
import { useAuth } from "@/context/AuthContext"

const proHighlights = [
  {
    icon: FiAward,
    title: "Dedicated Project Matching",
    description: "Get paired with pre-vetted, top 1% senior engineers and audited smart contract developers.",
  },
  {
    icon: FiShield,
    title: "Zero-Risk Escrow Protection",
    description: "Milestone funds remain on-chain in battle-tested contracts until you sign off on deliverables.",
  },
  {
    icon: FiUsers,
    title: "Full Team Collaboration",
    description: "Invite multiple stakeholders, manage team permissions, and centralize project milestones.",
  },
  {
    icon: FiCheckCircle,
    title: "0% Platform Take-Rate",
    description: "No hidden 20% commission like Web2 platforms. Transparent peer-to-peer crypto settlement.",
  },
] as const

export function FairWorkPro() {
  const { status } = useAuth()
  const isAuthed = status === "authenticated"
  const destination = isAuthed ? "/projects" : "/register"

  return (
    <section className="w-full bg-base border-b border-border/40 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-border-strong bg-gradient-to-br from-surface via-surface to-elevated p-8 sm:p-12 lg:p-16 shadow-2xl">
          {/* Subtle Ambient Glow */}
          <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="pointer-events-none absolute left-0 bottom-0 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl" />

          <div className="relative z-10 grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left Content */}
            <div className="lg:col-span-7">
              {/* Pro Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1 text-xs font-bold text-emerald-400 font-mono mb-6">
                <FiStar className="h-3.5 w-3.5 fill-emerald-400" />
                <span>fairwork pro.</span>
              </div>

              <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl leading-tight">
                A premium freelance solution designed for protocols & enterprises
              </h2>

              <p className="mt-5 text-base text-muted sm:text-lg leading-relaxed max-w-2xl">
                Upgrade to a curated experience packed with tools and benefits, dedicated to businesses seeking elite Web3 and full-stack talent.
              </p>

              {/* 4 Key Pro Highlights Grid */}
              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                {proHighlights.map(({ icon: Icon, title, description }) => (
                  <div key={title} className="flex flex-col gap-1.5 rounded-xl border border-border bg-base/60 p-4">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                        <Icon className="h-4 w-4" />
                      </span>
                      <h3 className="text-sm font-bold text-foreground">{title}</h3>
                    </div>
                    <p className="text-xs text-muted leading-relaxed pl-9">{description}</p>
                  </div>
                ))}
              </div>

              {/* Pro Action Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
                <Link
                  to={destination}
                  className="flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-emerald-600 px-7 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 active:scale-[0.98] transition-all"
                >
                  <span>Explore FairWork Pro</span>
                  <FiArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  to={destination}
                  className="flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface hover:bg-elevated px-7 text-sm font-semibold text-foreground transition-all"
                >
                  <span>Post a Custom Brief</span>
                </Link>
              </div>
            </div>

            {/* Right Graphic / Pro Showcase Banner */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-md rounded-2xl border border-border-strong bg-base/90 p-6 shadow-xl backdrop-blur-md">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div>
                    <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                      Vetted Talent Pool
                    </span>
                    <h3 className="text-sm font-bold text-foreground">Top 1% Global Freelancers</h3>
                  </div>
                  <span className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 text-[11px] font-mono text-emerald-400 font-bold">
                    Pass Rate: 3.2%
                  </span>
                </div>

                <div className="mt-4 flex flex-col gap-3">
                  {[
                    { name: "Elena Rostova", role: "ZK-Rollup & Circom Specialist", rating: "5.0", jobs: "42 jobs completed" },
                    { name: "David Chen", role: "Principal React & Web3 Architect", rating: "5.0", jobs: "58 jobs completed" },
                    { name: "Sarah Al-Mansoor", role: "Product Designer & Tokenomics UI", rating: "4.9", jobs: "37 jobs completed" },
                  ].map((dev) => (
                    <div key={dev.name} className="flex items-center justify-between rounded-xl border border-border/80 bg-surface/70 p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                          {dev.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">{dev.name}</p>
                          <p className="text-[11px] text-subtle">{dev.role}</p>
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-xs font-bold text-amber-400 flex items-center gap-0.5 justify-end">
                          <FiStar className="h-3 w-3 fill-amber-400" /> {dev.rating}
                        </span>
                        <span className="text-[10px] text-subtle">{dev.jobs}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-subtle font-mono">
                  <span>Audited Solidity Escrow</span>
                  <span className="text-emerald-400 font-semibold">100% Payout Rate</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
