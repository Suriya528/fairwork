import { FiFileText, FiLock, FiCheckCircle, FiSearch } from "react-icons/fi"

const steps = [
  {
    step: "01",
    icon: FiSearch,
    title: "1. Select a Gig or Post a Brief",
    description:
      "Browse verified gigs across 8+ technical domains or post your custom project requirements with milestone deadlines.",
    badge: "Browse & Scope",
    badgeColor: "text-muted bg-surface border-border",
  },
  {
    step: "02",
    icon: FiLock,
    title: "2. Lock Funds in Escrow",
    description:
      "Deposit milestone funds into the Ethereum/Sepolia smart contract. Funds are cryptographically secured — neither party can take them unilaterally.",
    badge: "Non-Custodial",
    badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    step: "03",
    icon: FiFileText,
    title: "3. Inspect Deliverables",
    description:
      "Freelancers submit verified code, repositories, and deliverables. Clients review and test the work before authorizing settlement.",
    badge: "Quality Review",
    badgeColor: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  },
  {
    step: "04",
    icon: FiCheckCircle,
    title: "4. One-Click Instant Payout",
    description:
      "When satisfied, client approves the milestone and funds release straight to the freelancer's wallet. Zero commission cut.",
    badge: "0% Commission",
    badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  },
] as const

export function HowItWorks() {
  return (
    <section id="how-it-works" className="w-full bg-surface border-b border-border/40 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 font-mono">
            How It Works
          </span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Everything you need to get work done
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-muted">
            A seamless, protected execution workflow built for trust, speed, and milestone transparency.
          </p>
        </div>

        {/* 4 Connected Step Cards */}
        <div className="relative mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ step, icon: Icon, title, description, badge, badgeColor }) => (
            <div
              key={step}
              className="relative flex flex-col justify-between rounded-2xl border border-border bg-base p-6 shadow-md transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-xl"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Icon className="h-6 w-6" aria-hidden />
                  </span>
                  <span className="font-mono text-xs font-bold text-subtle">{step}</span>
                </div>

                <h3 className="mt-5 text-base font-bold text-foreground">{title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted">{description}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-border/60 flex items-center justify-between">
                <span className="text-[11px] font-mono text-subtle">Protection</span>
                <span className={`rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold border ${badgeColor}`}>
                  {badge}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
