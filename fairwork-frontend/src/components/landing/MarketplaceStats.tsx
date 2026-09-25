import { FiDollarSign, FiCheckCircle, FiUsers, FiPercent } from "react-icons/fi"

const stats = [
  {
    icon: FiDollarSign,
    value: "$18.4M+",
    label: "Milestone Escrow Volume",
    desc: "Settled safely without middleman deductions",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    icon: FiCheckCircle,
    value: "99.8%",
    label: "Milestone Completion Rate",
    desc: "Reviewed, approved, and released on time",
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  {
    icon: FiUsers,
    value: "15,000+",
    label: "Global Freelancers",
    desc: "Engineers, designers & technical creators",
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
  },
  {
    icon: FiPercent,
    value: "0%",
    label: "Platform Cut",
    desc: "Freelancers keep 100% of agreed fees",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
] as const

export function MarketplaceStats() {
  return (
    <section className="w-full bg-base border-b border-border/40 py-12 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 sm:gap-6">
          {stats.map(({ icon: Icon, value, label, desc, color, bg }) => (
            <div
              key={label}
              className="relative overflow-hidden rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-md transition-all duration-200 hover:-translate-y-1 hover:border-border-strong hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl border ${bg} ${color}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              <div className="mt-4">
                <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono tracking-tight">
                  {value}
                </div>
                <h3 className="mt-1 text-xs font-bold text-foreground sm:text-sm">
                  {label}
                </h3>
                <p className="mt-1 text-[11px] text-subtle leading-tight">
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
