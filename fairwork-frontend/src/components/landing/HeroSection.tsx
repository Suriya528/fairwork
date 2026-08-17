import { useState } from "react"
import { Link } from "react-router-dom"
import {
  FiArrowRight,
  FiShield,
  FiCheckCircle,
  FiLock,
  FiZap,
  FiCode,
  FiLayers,
} from "react-icons/fi"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"

const btnBase =
  "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]"
const btnPrimary =
  "bg-primary text-primary-foreground hover:bg-primary-hover shadow-lg shadow-primary/20 hover:shadow-primary/30"
const btnOutline =
  "border border-border-strong bg-surface/80 text-foreground hover:bg-surface-hover hover:border-subtle backdrop-blur-sm"

export function HeroSection() {
  const { status } = useAuth()
  const isAuthed = status === "authenticated"
  const destination = isAuthed ? "/projects" : "/register"

  const [activeStep, setActiveStep] = useState<number>(2)

  return (
    <section className="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-24 lg:pt-44 lg:pb-32">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/4 rounded-full bg-gradient-to-b from-primary/20 via-primary/5 to-transparent blur-3xl" />
        <div className="absolute right-10 top-1/3 h-[300px] w-[300px] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute left-10 top-1/2 h-[300px] w-[300px] rounded-full bg-blue-600/10 blur-3xl" />
        {/* Subtle grid pattern background overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293715_1px,transparent_1px),linear-gradient(to_bottom,#1f293715_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Protocol Tag Eyebrow */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px] uppercase tracking-wider">
              Escrow-Protected Freelance Protocol
            </span>
          </div>
        </div>

        {/* Headline */}
        <div className="mx-auto mt-6 max-w-4xl text-center">
          <h1 className="text-balance text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Find elite talent.{" "}
            <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">
              Pay with total trust.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted sm:text-lg lg:text-xl">
            FairWork connects forward-thinking clients with top technical freelancers.
            Milestone payments are locked safely in smart contract escrow until you approve the work.
          </p>

          {/* Primary Action Buttons */}
          <div className="mt-9 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
            <Link
              to={destination}
              className={cn(btnBase, btnPrimary, "h-12 w-full min-w-[200px] gap-2 px-6 text-base sm:w-auto")}
            >
              Explore Marketplace
              <FiArrowRight className="h-4 w-4" aria-hidden />
            </Link>

            <Link
              to={destination}
              className={cn(btnBase, btnOutline, "h-12 w-full min-w-[200px] gap-2 px-6 text-base sm:w-auto")}
            >
              <FiCode className="h-4 w-4 text-emerald-400" aria-hidden />
              Become a Freelancer
            </Link>
          </div>
        </div>

        {/* Signature Interactive Hero Visual: Protocol Escrow Card */}
        <div className="mt-14 sm:mt-16">
          <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-border-strong bg-surface/90 p-5 sm:p-7 shadow-2xl shadow-black/60 backdrop-blur-xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary border border-primary/30">
                  <FiShield className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-foreground">Escrow Payment Protocol</h2>
                    <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 font-mono text-[10px] text-emerald-400 font-medium uppercase">
                      Active Contract
                    </span>
                  </div>
                  <p className="text-xs text-subtle font-mono">ID: prj_01 • 9,000 USDC Total Escrow</p>
                </div>
              </div>

              {/* Protocol status badge */}
              <div className="flex items-center gap-2 rounded-lg bg-elevated px-3 py-1.5 border border-border text-xs">
                <FiLock className="h-3.5 w-3.5 text-emerald-400" />
                <span className="font-mono text-xs text-muted">Funds Locked On-Chain</span>
              </div>
            </div>

            {/* Interactive Milestone Demonstration Track */}
            <div className="mt-6">
              <p className="text-xs font-semibold text-subtle uppercase tracking-wider mb-3">
                Milestone Settlement Sequence
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  {
                    step: 1,
                    title: "1. Audit & Kickoff",
                    amount: "$2,500 USDC",
                    status: "Released",
                    badgeTone: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
                    icon: FiCheckCircle,
                  },
                  {
                    step: 2,
                    title: "2. Component Library",
                    amount: "$4,000 USDC",
                    status: "Submitted / Review",
                    badgeTone: "bg-blue-500/10 text-blue-400 border-blue-500/30",
                    icon: FiZap,
                  },
                  {
                    step: 3,
                    title: "3. Token Handoff",
                    amount: "$2,500 USDC",
                    status: "In Escrow",
                    badgeTone: "bg-slate-800 text-slate-400 border-slate-700",
                    icon: FiLayers,
                  },
                ].map((ms) => {
                  const Icon = ms.icon
                  const isSelected = activeStep === ms.step
                  return (
                    <button
                      type="button"
                      key={ms.step}
                      onClick={() => setActiveStep(ms.step)}
                      className={cn(
                        "flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all duration-200",
                        isSelected
                          ? "border-primary bg-primary/10 shadow-md shadow-primary/10"
                          : "border-border bg-base/60 hover:border-border-strong hover:bg-elevated/40",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground">{ms.title}</span>
                        <Icon className={cn("h-4 w-4", isSelected ? "text-primary" : "text-subtle")} />
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-foreground">{ms.amount}</span>
                        <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-medium", ms.badgeTone)}>
                          {ms.status}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Interactive explanation pill */}
            <div className="mt-5 flex items-center justify-between rounded-xl bg-elevated/70 px-4 py-3 border border-border text-xs">
              <div className="flex items-center gap-2.5">
                <span className="flex h-2 w-2 rounded-full bg-blue-400" />
                <span className="text-muted">
                  {activeStep === 1 && "Milestone 1 completed. Funds released directly to freelancer's wallet address."}
                  {activeStep === 2 && "Milestone 2 submitted by freelancer. Client reviews deliverables before authorizing release."}
                  {activeStep === 3 && "Milestone 3 queued. Funds remain protected in smart contract escrow."}
                </span>
              </div>
              <span className="hidden sm:inline font-mono text-[11px] text-subtle">Click step to inspect</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
