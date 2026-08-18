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
    <section className="relative w-full bg-base border-b border-border/40 overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-24 lg:pt-40 lg:pb-28">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="absolute left-1/3 top-0 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/4 rounded-full bg-gradient-to-b from-primary/20 via-primary/5 to-transparent blur-3xl" />
        <div className="absolute right-10 top-1/3 h-[350px] w-[350px] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute left-10 top-1/2 h-[350px] w-[350px] rounded-full bg-blue-600/10 blur-3xl" />
        {/* Grid pattern background overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293715_1px,transparent_1px),linear-gradient(to_bottom,#1f293715_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left-Aligned Hero Text Block */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Protocol Tag Eyebrow */}
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary backdrop-blur-md mb-6">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[11px] uppercase tracking-wider">
                Escrow-Protected Freelance Protocol
              </span>
            </div>

            {/* Left-aligned headline */}
            <h1 className="text-balance text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl text-left">
              Find elite talent.{" "}
              <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">
                Pay with total trust.
              </span>
            </h1>

            {/* Left-aligned subhead */}
            <p className="mt-6 text-base leading-relaxed text-muted sm:text-lg lg:text-xl text-left max-w-2xl">
              FairWork connects forward-thinking clients with top technical freelancers.
              Milestone payments are locked safely in smart contract escrow until you approve the work.
            </p>

            {/* Left-aligned Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
              <Link
                to={destination}
                className={cn(btnBase, btnPrimary, "h-12 w-full sm:w-auto min-w-[200px] gap-2 px-6 text-base")}
              >
                Explore Marketplace
                <FiArrowRight className="h-4 w-4" aria-hidden />
              </Link>

              <Link
                to={destination}
                className={cn(btnBase, btnOutline, "h-12 w-full sm:w-auto min-w-[200px] gap-2 px-6 text-base")}
              >
                <FiCode className="h-4 w-4 text-emerald-400" aria-hidden />
                Become a Freelancer
              </Link>
            </div>
          </div>

          {/* Right Column: Signature Interactive Protocol Escrow Card */}
          <div className="lg:col-span-5 w-full">
            <div className="overflow-hidden rounded-2xl border border-border-strong bg-surface/90 p-5 sm:p-7 shadow-2xl shadow-black/60 backdrop-blur-xl">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary border border-primary/30">
                    <FiShield className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-foreground">Escrow Payment Protocol</h2>
                      <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 font-mono text-[10px] text-emerald-400 font-medium uppercase">
                        Active
                      </span>
                    </div>
                    <p className="text-xs text-subtle font-mono">ID: prj_01 • ₹90,000 (900 USDC Escrow)</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-lg bg-elevated px-2.5 py-1 border border-border text-xs">
                  <FiLock className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="font-mono text-xs text-muted">Funds Locked</span>
                </div>
              </div>

              {/* Interactive Milestone Demonstration Track */}
              <div className="mt-5">
                <p className="text-xs font-semibold text-subtle uppercase tracking-wider mb-3">
                  Milestone Settlement Sequence
                </p>
                <div className="flex flex-col gap-2.5">
                  {[
                    {
                      step: 1,
                      title: "1. Audit & Kickoff",
                      amount: "₹25,000",
                      token: "250 USDC",
                      status: "Released",
                      badgeTone: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
                      icon: FiCheckCircle,
                    },
                    {
                      step: 2,
                      title: "2. Component Library",
                      amount: "₹40,000",
                      token: "400 USDC",
                      status: "Submitted / Review",
                      badgeTone: "bg-blue-500/10 text-blue-400 border-blue-500/30",
                      icon: FiZap,
                    },
                    {
                      step: 3,
                      title: "3. Token Handoff",
                      amount: "₹25,000",
                      token: "250 USDC",
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
                          "flex items-center justify-between rounded-xl border p-3 text-left transition-all duration-200",
                          isSelected
                            ? "border-primary bg-primary/10 shadow-md shadow-primary/10"
                            : "border-border bg-base/60 hover:border-border-strong hover:bg-elevated/40",
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={cn("h-4 w-4", isSelected ? "text-primary" : "text-subtle")} />
                          <span className="text-xs font-semibold text-foreground">{ms.title}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <div className="flex flex-col items-end">
                            <span className="font-mono text-xs font-bold text-foreground">{ms.amount}</span>
                            <span className="font-mono text-[10px] text-subtle">{ms.token}</span>
                          </div>
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
              <div className="mt-4 flex items-center justify-between rounded-xl bg-elevated/70 px-3.5 py-2.5 border border-border text-xs">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-blue-400" />
                  <span className="text-muted leading-tight">
                    {activeStep === 1 && "Milestone 1 completed. Funds released directly to freelancer's wallet."}
                    {activeStep === 2 && "Milestone 2 submitted. Client inspects deliverables before authorizing release."}
                    {activeStep === 3 && "Milestone 3 queued. Funds remain protected in smart contract escrow."}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
