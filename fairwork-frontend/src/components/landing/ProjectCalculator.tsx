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
  FiLayers,
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
    description: "Full-stack web application with modern reactive state and responsive UI.",
  },
  {
    id: "smart-contract",
    label: "Smart Contract & Audit",
    icon: FiShield,
    baseUSD: 1200,
    typicalDays: 10,
    milestones: 2,
    description: "Audited Solidity smart contracts, invariant tests, and deployment scripts.",
  },
  {
    id: "ui-ux",
    label: "UI/UX & Design System",
    icon: FiLayout,
    baseUSD: 500,
    typicalDays: 8,
    milestones: 2,
    description: "Figma component system, interactive prototypes, and design tokens.",
  },
  {
    id: "ai",
    label: "AI Agents & Automation",
    icon: FiCpu,
    baseUSD: 950,
    typicalDays: 12,
    milestones: 3,
    description: "Autonomous agent workflows, knowledge retrieval pipelines, and REST APIs.",
  },
  {
    id: "mobile",
    label: "Mobile Engineering",
    icon: FiSmartphone,
    baseUSD: 1100,
    typicalDays: 18,
    milestones: 4,
    description: "Cross-platform iOS and Android application with native bridges.",
  },
]

type ScopeTier = "starter" | "growth" | "enterprise"

const scopeMultipliers: Record<ScopeTier, { factor: number; label: string; desc: string }> = {
  starter: { factor: 1, label: "Standard Scope", desc: "Core deliverables, focused timeline" },
  growth: { factor: 1.8, label: "Extended Scope", desc: "Full test suite, optimizations, staging" },
  enterprise: { factor: 3.2, label: "Production Scale", desc: "End-to-end architecture & security review" },
}

export function ProjectCalculator() {
  const { formatAmount } = useCurrency()
  const { status } = useAuth()
  const isAuthed = status === "authenticated"
  const destination = isAuthed ? "/projects" : "/register"

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

  return (
    <section id="milestone-composer" className="relative w-full bg-base border-b border-border/40 py-20 sm:py-28 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Continuous Spine Line */}
        <div className="relative pl-6 sm:pl-10">
          <div
            className="pointer-events-none absolute left-0 top-2 bottom-0 w-[2px] bg-gradient-to-b from-emerald-500 via-purple-500 to-blue-500"
            aria-hidden
          />

          {/* Node on Spine */}
          <div className="absolute -left-[11px] top-0 flex h-6 w-6 items-center justify-center rounded-full border border-purple-400 bg-base text-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.5)]">
            <FiLayers className="h-3 w-3" />
          </div>

          <div className="max-w-3xl mb-12">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">
              Milestone Composer
            </span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              Scope your project in minutes.
            </h2>
            <p className="mt-4 text-base text-muted">
              Select your technical domain and scope size to estimate milestone stages and escrow deposits.
            </p>
          </div>

          {/* GitHub Issue / Milestone Composer Grid */}
          <div className="grid gap-6 lg:grid-cols-12 items-start">
            {/* Left: Configuration Window */}
            <div className="lg:col-span-7 overflow-hidden rounded-xl border border-border-strong bg-[#0d1117]">
              <div className="border-b border-border bg-[#161b22] px-5 py-3 text-xs font-mono text-muted flex items-center justify-between">
                <span>New Milestone Specification</span>
                <span className="text-subtle">Draft</span>
              </div>

              <div className="p-5 sm:p-6 space-y-6">
                {/* Category Picker */}
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-subtle mb-3">
                    1. Deliverable Category
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
                            "flex items-center gap-3 rounded-lg border p-3 text-left transition-all cursor-pointer",
                            isSelected
                              ? "border-emerald-500 bg-emerald-500/10"
                              : "border-border bg-[#161b22]/50 hover:bg-[#161b22]",
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border",
                              isSelected
                                ? "bg-[#238636] text-white border-emerald-400"
                                : "bg-base text-muted border-border",
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="text-xs font-bold text-foreground">{opt.label}</p>
                            <p className="text-[10px] text-subtle font-mono">Base: ${opt.baseUSD}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Scope Tier Picker */}
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-subtle mb-3">
                    2. Complexity &amp; Test Coverage
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
                            "flex flex-col justify-between rounded-lg border p-3.5 text-left transition-all cursor-pointer",
                            isSelected
                              ? "border-emerald-500 bg-emerald-500/10"
                              : "border-border bg-[#161b22]/50 hover:bg-[#161b22]",
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className={cn("text-xs font-bold", isSelected ? "text-emerald-400" : "text-foreground")}>
                              {data.label}
                            </span>
                            {isSelected && <FiCheck className="h-3.5 w-3.5 text-emerald-400" />}
                          </div>
                          <p className="mt-1.5 text-[11px] text-subtle leading-snug">{data.desc}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Summary Sidebar (GitHub PR Sidebar Style) */}
            <div className="lg:col-span-5 overflow-hidden rounded-xl border border-border-strong bg-[#0d1117] p-6">
              <div className="border-b border-border pb-3 flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-foreground">Escrow Summary</span>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono text-emerald-400">
                  0% Fee
                </span>
              </div>

              <div className="mt-5 rounded-lg border border-border bg-[#161b22] p-4 text-center">
                <span className="text-[10px] font-mono uppercase tracking-wider text-subtle">
                  Estimated Escrow Deposit
                </span>
                <div className="mt-1 text-3xl font-extrabold text-foreground font-mono">
                  {formatAmount(estimatedUSD * 100)}
                </div>
                <span className="text-[11px] text-muted font-mono">
                  ≈ {estimatedUSD} USDC committed in contract
                </span>
              </div>

              <div className="mt-5 space-y-2.5 font-mono text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-border/60">
                  <span className="text-subtle">Milestones</span>
                  <span className="text-foreground font-bold">{calculatedMilestones} checkpoints</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-border/60">
                  <span className="text-subtle flex items-center gap-1">
                    <FiClock className="h-3 w-3" /> Turnaround
                  </span>
                  <span className="text-foreground font-bold">~{estimatedDays} days</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-border/60">
                  <span className="text-subtle">Platform Deduction</span>
                  <span className="text-emerald-400 font-bold">$0.00 (0%)</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-subtle">Creator Payout</span>
                  <span className="text-emerald-400 font-bold">100% of Escrow</span>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  to={destination}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#238636] hover:bg-[#2ea043] px-5 text-xs font-bold text-white transition-colors"
                >
                  <span>Create milestone brief</span>
                  <FiArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
