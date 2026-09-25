import { FiStar } from "react-icons/fi"

const testimonials = [
  {
    quote:
      "FairWork's milestone escrow gives our team complete confidence when hiring remote Web3 engineers. Funds only release when deliverables pass our internal code review.",
    author: "Sarah Chen",
    role: "VP of Engineering",
    company: "Nexus Labs",
    rating: 5,
    avatarColor: "from-blue-500 to-indigo-600",
    initials: "SC",
    stat: "Completed 14 milestones",
  },
  {
    quote:
      "As a smart contract auditor, knowing the client's USDC is already locked in the escrow contract before I write a single report completely eliminates payment anxiety.",
    author: "Alex Rivera",
    role: "Lead Security Auditor",
    company: "AuditGuard",
    rating: 5,
    avatarColor: "from-emerald-500 to-teal-600",
    initials: "AR",
    stat: "$45,000+ earned in escrow",
  },
  {
    quote:
      "We shipped our React 19 dApp 3 weeks ahead of schedule. The Fiverr-style gig discovery combined with non-custodial crypto escrow makes this the gold standard platform.",
    author: "David Kim",
    role: "Founder & CEO",
    company: "Aura Network",
    rating: 5,
    avatarColor: "from-purple-500 to-pink-600",
    initials: "DK",
    stat: "Hired 6 senior devs",
  },
] as const

export function TestimonialsSection() {
  return (
    <section className="w-full bg-base border-b border-border/40 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 font-mono">
            Social Proof
          </span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            What clients and freelancers are saying
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-muted">
            See how forward-thinking teams and top talent get work done with complete peace of mind.
          </p>
        </div>

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.author}
              className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-7 shadow-lg transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/40"
            >
              <div>
                {/* 5-star rating */}
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(t.rating)].map((_, i) => (
                    <FiStar key={i} className="h-4 w-4 fill-amber-400" />
                  ))}
                </div>

                <p className="text-sm leading-relaxed text-foreground italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-10 w-10 rounded-full bg-gradient-to-tr ${t.avatarColor} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm`}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">{t.author}</h4>
                    <p className="text-[11px] text-subtle">
                      {t.role}, {t.company}
                    </p>
                  </div>
                </div>

                <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-mono text-emerald-400 font-medium">
                  {t.stat}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
