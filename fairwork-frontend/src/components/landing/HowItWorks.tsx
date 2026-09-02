import { FiFileText, FiUserCheck, FiLock, FiCheckCircle } from "react-icons/fi"

/**
 * 4-step workflow matching FairWork's actual architecture:
 * project creation → freelancer assignment → escrow funding → milestone release.
 * Encodes actual product state machine rules.
 */
const steps = [
  {
    step: "01",
    icon: FiFileText,
    title: "Post Project & Milestones",
    description:
      "Client creates the project brief and breaks down deliverables into explicit milestone amounts.",
    statusBadge: "Draft / Funding",
    badgeTone: "text-muted bg-elevated border-border",
  },
  {
    step: "02",
    icon: FiUserCheck,
    title: "Assign Talent",
    description:
      "Select a qualified freelancer. Both parties agree on milestone scope and delivery terms.",
    statusBadge: "Freelancer Assigned",
    badgeTone: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  },
  {
    step: "03",
    icon: FiLock,
    title: "Fund On-Chain Escrow",
    description:
      "Client deposits milestone funds into the smart contract escrow. Neither party can withdraw unilaterally.",
    statusBadge: "Escrow Funded",
    badgeTone: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  },
  {
    step: "04",
    icon: FiCheckCircle,
    title: "Approve & Release Payment",
    description:
      "Freelancer submits deliverables. Client inspects work, approves, and authorizes instant on-chain release.",
    statusBadge: "Milestone Released",
    badgeTone: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
] as const

export function HowItWorks() {
  return (
    <section id="how-it-works" className="w-full bg-surface border-b border-border/40 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-primary font-mono">
            Protocol Workflow
          </span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            How FairWork protects every milestone
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-muted">
            A transparent, 4-step execution flow engineered for contract clarity and payment safety.
          </p>
        </div>

        {/* Connected Step Cards Grid */}
        <div className="relative mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Subtle connecting line across desktop steps */}
          <div className="pointer-events-none absolute top-1/2 left-0 hidden h-0.5 w-full -translate-y-6 bg-gradient-to-r from-primary/10 via-primary/30 to-emerald-500/20 lg:block" aria-hidden />

          {steps.map(({ step, icon: Icon, title, description, statusBadge, badgeTone }) => (
            <div
              key={step}
              className="relative flex flex-col justify-between rounded-2xl border border-border bg-base p-6 shadow-lg shadow-black/20 backdrop-blur-sm transition-all duration-200 hover:border-border-strong hover:-translate-y-1"
            >
              <div>
                {/* Step header */}
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <Icon className="h-5.5 w-5.5" aria-hidden />
                  </span>
                  <span className="font-mono text-sm font-bold text-subtle">{step}</span>
                </div>

                <h3 className="mt-5 text-base font-bold text-foreground">{title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted">{description}</p>
              </div>

              {/* Protocol State Indicator */}
              <div className="mt-6 pt-4 border-t border-border/60 flex items-center justify-between">
                <span className="text-[11px] font-mono text-subtle">State</span>
                <span className={`rounded px-2 py-0.5 font-mono text-[10px] font-semibold border ${badgeTone}`}>
                  {statusBadge}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
