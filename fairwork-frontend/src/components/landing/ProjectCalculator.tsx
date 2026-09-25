import { useState } from "react"
import { Link } from "react-router-dom"
import {
  FiCode,
  FiShield,
  FiLayout,
  FiCpu,
  FiSmartphone,
  FiArrowRight,
  FiCheck,
  FiClock,
  FiSliders,
} from "react-icons/fi"
import { useCurrency } from "@/context/CurrencyContext"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"

interface ProjectOption {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  baseUSD: number
  typicalDays: number
  milestones: number
  description: string
}

const projectOptions: ProjectOption[] = [
  {
    id: "web",
    label: "Web Application",
    icon: FiCode,
    baseUSD: 800,
    typicalDays: 14,
    milestones: 3,
    description: "Full-stack web application with responsive UI, reactive state, and REST/GraphQL APIs.",
  },
  {
    id: "smart-contract",
    label: "Smart Contract & Audit",
    icon: FiShield,
    baseUSD: 1200,
    typicalDays: 10,
    milestones: 2,
    description: "Audited smart contracts, property-based invariant test suites, and deployment scripts.",
  },
  {
    id: "ui-ux",
    label: "UI/UX & Design System",
    icon: FiLayout,
    baseUSD: 500,
    typicalDays: 8,
    milestones: 2,
    description: "Figma component system, multi-theme variables, and developer handoff documentation.",
  },
  {
    id: "ai",
    label: "AI Agents & Automation",
    icon: FiCpu,
    baseUSD: 950,
    typicalDays: 12,
    milestones: 3,
    description: "Autonomous task agents, retrieval pipelines, vector indexers, and evaluation suites.",
  },
  {
    id: "mobile",
    label: "Mobile Engineering",
    icon: FiSmartphone,
    baseUSD: 1100,
    typicalDays: 18,
    milestones: 4,
    description: "Cross-platform mobile application with native bridges and push notifications.",
  },
]

type ScopeTier = "starter" | "growth" | "enterprise"

const scopeMultipliers: Record<ScopeTier, { factor: number; label: string; desc: string }> = {
  starter: { factor: 1, label: "Standard Scope", desc: "Core deliverables, focused timeline" },
  growth: { factor: 1.8, label: "Extended Scope", desc: "Full test suite, staging, optimizations" },
  enterprise: { factor: 3.2, label: "Production Scale", desc: "End-to-end architecture & security signoff" },
}

export function ProjectCalculator() {
  const { formatAmount } = useCurrency()
  const { status, user } = useAuth()
  const isAuthed = status === "authenticated"
  const isClient = isAuthed && user?.role === "client"

  const [selectedProjectId, setSelectedProjectId] = useState<string>("web")
  const [selectedScope, setSelectedScope] = useState<ScopeTier>("starter")

  const selectedProject = projectOptions.find((p) => p.id === selectedProjectId) || projectOptions[0]
  const scopeData = scopeMultipliers[selectedScope]

  const estimatedUSD = Math.round(selectedProject.baseUSD * scopeData.factor)
  const estimatedDays = Math.round(
    selectedProject.typicalDays * (selectedScope === "starter" ? 1 : selectedScope === "growth" ? 1.5 : 2.2),
  )
  const calculatedMilestones =
    selectedScope === "starter"
      ? selectedProject.milestones
      : selectedScope === "growth"
        ? selectedProject.milestones + 1
        : selectedProject.milestones + 2

  const destination = isAuthed
    ? isClient
      ? `/projects/new?title=${encodeURIComponent(selectedProject.label)}&budget=${estimatedUSD}`
      : "/projects"
    : "/register"

  return (
    <section id="milestone-composer" className="relative w-full bg-surface/40 border-y border-border/60 py-20 sm:py-28 overflow-hidden">
      {/* Subtle architectural cyan glow */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute left-1/2 top-1/2 h-[420px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Left-to-Right Section Header spanning full width */}
        <div className="w-full mb-12 text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-surface/80 px-3.5 py-1 text-xs font-mono text-muted mb-4 shadow-xs">
            <FiSliders className="h-3.5 w-3.5 text-cyan-400" />
            <span className="font-medium text-foreground/90">Interactive Estimator</span>
          </div>

          <h2 className="text-3xl font-light tracking-tight text-foreground sm:text-5xl leading-[1.15] w-full text-pretty">
            Scope your project{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-200 to-emerald-300 font-normal">
              in minutes.
            </span>
          </h2>

          <p className="mt-4 text-base font-light text-muted/90 sm:text-lg w-full leading-relaxed text-pretty">
            Select your technical discipline and project complexity to estimate milestone checkpoints and escrow deposits.
          </p>
        </div>

        {/* Milestone Studio Grid spanning full width (left end to right end) */}
        <div className="w-full grid gap-6 lg:grid-cols-12 items-start">
          {/* Left: Configuration Controls */}
          <div className="lg:col-span-7 rounded-2xl border border-border/80 bg-surface p-6 sm:p-7 shadow-xl">
            <div className="border-b border-border/80 pb-4 mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-medium text-foreground">Milestone Configuration</h3>
                <p className="text-xs font-light text-muted mt-0.5">Customize scope parameters</p>
              </div>
              <span className="rounded-full bg-cyan-500/10 border border-cyan-500/25 px-2.5 py-0.5 text-[10px] font-mono font-medium text-cyan-300">
                Live Estimates
              </span>
            </div>

            <div className="space-y-6">
              {/* Category Picker */}
              <div>
                <label className="block text-xs font-mono font-medium uppercase tracking-wider text-subtle mb-3">
                  1. Select Discipline
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {projectOptions.map((opt) => {
                    const Icon = opt.icon
                    const isSelected = selectedProjectId === opt.id
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedProjectId(opt.id)}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all cursor-pointer",
                          isSelected
                            ? "border-cyan-400/60 bg-cyan-500/5 shadow-xs"
                            : "border-border/80 bg-elevated/35 hover:bg-elevated/70",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
                            isSelected
                              ? "bg-primary text-white border-primary"
                              : "bg-surface text-muted border-border/80",
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-xs font-medium text-foreground">{opt.label}</p>
                          <p className="text-[10px] text-subtle font-mono mt-0.5 font-normal">Base: ${opt.baseUSD}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Scope Tier Picker */}
              <div>
                <label className="block text-xs font-mono font-medium uppercase tracking-wider text-subtle mb-3">
                  2. Complexity &amp; Verification Level
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {(["starter", "growth", "enterprise"] as ScopeTier[]).map((tier) => {
                    const isSelected = selectedScope === tier
                    const data = scopeMultipliers[tier]
                    return (
                      <button
                        key={tier}
                        type="button"
                        onClick={() => setSelectedScope(tier)}
                        className={cn(
                          "flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all cursor-pointer",
                          isSelected
                            ? "border-cyan-400/60 bg-cyan-500/5 shadow-xs"
                            : "border-border/80 bg-elevated/35 hover:bg-elevated/70",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className={cn("text-xs font-medium", isSelected ? "text-cyan-300" : "text-foreground")}>
                            {data.label}
                          </span>
                          {isSelected && <FiCheck className="h-4 w-4 text-cyan-400" />}
                        </div>
                        <p className="mt-1.5 text-[11px] font-light text-subtle leading-snug">{data.desc}</p>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Escrow Summary Card (Stripe Clarity) */}
          <div className="lg:col-span-5 rounded-2xl border border-border/80 bg-surface p-6 sm:p-7 shadow-xl">
            <div className="border-b border-border/80 pb-3 flex items-center justify-between">
              <span className="text-xs font-mono font-medium uppercase tracking-wider text-foreground/90">
                Escrow Breakdown
              </span>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono text-emerald-400 font-medium">
                0% Fee
              </span>
            </div>

            <div className="mt-5 rounded-xl border border-border/80 bg-elevated/50 p-4 text-left">
              <span className="text-[10px] font-mono uppercase tracking-wider text-subtle">
                Estimated Escrow Deposit
              </span>
              <div className="mt-1 text-3xl font-normal text-foreground font-mono">
                {formatAmount(estimatedUSD)}
              </div>
              <span className="text-[11px] text-muted font-mono mt-0.5 block font-normal">
                ≈ {estimatedUSD} USDC committed in smart contract
              </span>
            </div>

            <div className="mt-5 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-border/60">
                <span className="text-subtle">Milestone Checkpoints</span>
                <span className="text-foreground font-medium">{calculatedMilestones} stages</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/60">
                <span className="text-subtle flex items-center gap-1">
                  <FiClock className="h-3 w-3" /> Turnaround
                </span>
                <span className="text-foreground font-medium">~{estimatedDays} days</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/60">
                <span className="text-subtle">Platform Commission</span>
                <span className="text-emerald-400 font-medium">$0.00 (0%)</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-subtle">Creator Receipt</span>
                <span className="text-emerald-400 font-medium">100% of Escrow</span>
              </div>
            </div>

            <div className="mt-6 pt-2">
              <Link
                to={destination}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-hover px-5 text-xs font-medium text-white transition-all shadow-xs"
              >
                <span>Create Milestone Brief</span>
                <FiArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
