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
  FiDollarSign,
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
    description: "Production-grade React 19, Next.js, or full-stack web dApp with responsive UI.",
  },
  {
    id: "smart-contract",
    label: "Smart Contract & Audit",
    icon: FiShield,
    baseUSD: 1200,
    typicalDays: 10,
    milestones: 2,
    description: "Audited Solidity smart contracts, formal verification, and deployment scripts.",
  },
  {
    id: "ui-ux",
    label: "UI/UX & Product Design",
    icon: FiLayout,
    baseUSD: 500,
    typicalDays: 8,
    milestones: 2,
    description: "Figma design system, high-fidelity prototypes, and component design tokens.",
  },
  {
    id: "ai",
    label: "AI Agents & Automation",
    icon: FiCpu,
    baseUSD: 950,
    typicalDays: 12,
    milestones: 3,
    description: "Custom LLM integrations, autonomous agent workflows, and RAG pipelines.",
  },
  {
    id: "mobile",
    label: "Mobile App Development",
    icon: FiSmartphone,
    baseUSD: 1100,
    typicalDays: 18,
    milestones: 4,
    description: "Cross-platform iOS and Android app built with React Native and native bridges.",
  },
]

type ScopeTier = "starter" | "growth" | "enterprise"

const scopeMultipliers: Record<ScopeTier, { factor: number; label: string; desc: string }> = {
  starter: { factor: 1, label: "MVP / Starter", desc: "Core deliverables, standard turnaround" },
  growth: { factor: 1.8, label: "Growth / Custom", desc: "Extended features, testing, optimizations" },
  enterprise: { factor: 3.2, label: "Enterprise Scale", desc: "Full-scale architecture, high SLA & audit" },
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
  const estimatedDays = Math.round(selectedProject.typicalDays * (selectedScope === "starter" ? 1 : selectedScope === "growth" ? 1.5 : 2.2))
  const calculatedMilestones = selectedScope === "starter" ? selectedProject.milestones : selectedScope === "growth" ? selectedProject.milestones + 1 : selectedProject.milestones + 2

  // Traditional platforms take ~20%
  const traditionalFeesSaved = Math.round(estimatedUSD * 0.2)

  return (
    <section className="w-full bg-base border-b border-border/40 py-20 sm:py-28 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute -left-40 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 font-mono">
            Interactive Project Estimator
          </span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Estimate your project milestone budget
          </h2>
          <p className="mt-3 text-base text-muted">
            See how much you save with FairWork&apos;s 0% platform commission compared to legacy platforms.
          </p>
        </div>

        {/* Calculator Interactive Grid */}
        <div className="grid gap-8 lg:grid-cols-12 items-start">
          {/* Left Column: Project Type & Scope Selection */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Step 1: Select Project Discipline */}
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-md">
              <span className="text-xs font-bold uppercase tracking-wider text-subtle font-mono">
                1. Select Deliverable Category
              </span>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                          ? "border-emerald-500 bg-emerald-500/10 shadow-sm"
                          : "border-border bg-base/60 hover:bg-elevated/40 hover:border-border-strong",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
                          isSelected
                            ? "bg-emerald-500 text-white border-emerald-400"
                            : "bg-surface text-muted border-border",
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className={cn("text-xs font-bold", isSelected ? "text-foreground" : "text-muted")}>
                          {opt.label}
                        </p>
                        <p className="text-[11px] text-subtle font-mono">
                          from ${opt.baseUSD}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Step 2: Select Scope Tier */}
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-md">
              <span className="text-xs font-bold uppercase tracking-wider text-subtle font-mono">
                2. Select Project Scope Tier
              </span>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(["starter", "growth", "enterprise"] as ScopeTier[]).map((tier) => {
                  const isSelected = selectedScope === tier
                  const data = scopeMultipliers[tier]
                  return (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setSelectedScope(tier)}
                      className={cn(
                        "flex flex-col justify-between rounded-xl border p-4 text-left transition-all cursor-pointer",
                        isSelected
                          ? "border-emerald-500 bg-emerald-500/10 shadow-sm"
                          : "border-border bg-base/60 hover:bg-elevated/40 hover:border-border-strong",
                      )}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className={cn("text-xs font-bold", isSelected ? "text-emerald-400" : "text-foreground")}>
                            {data.label}
                          </span>
                          {isSelected && <FiCheck className="h-4 w-4 text-emerald-400" />}
                        </div>
                        <p className="mt-2 text-[11px] text-subtle leading-snug">
                          {data.desc}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Live Calculation Summary Card */}
          <div className="lg:col-span-5 w-full">
            <div className="sticky top-28 rounded-3xl border border-emerald-500/40 bg-gradient-to-b from-surface via-surface to-elevated p-7 shadow-2xl shadow-black/40">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <span className="text-[11px] font-mono text-emerald-400 uppercase font-bold tracking-wider">
                    Instant Calculation
                  </span>
                  <h3 className="text-base font-bold text-foreground">
                    Estimated Project Cost
                  </h3>
                </div>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-mono font-bold text-emerald-400">
                  0% Fee Model
                </span>
              </div>

              {/* Big Price Display */}
              <div className="mt-6 text-center rounded-2xl border border-border bg-base/80 p-5">
                <span className="text-xs text-subtle uppercase tracking-wider font-mono">
                  Recommended Total Escrow
                </span>
                <div className="mt-1 text-3xl sm:text-4xl font-extrabold text-foreground font-mono">
                  {formatAmount(estimatedUSD * 100)}
                </div>
                <p className="mt-1 text-xs text-muted">
                  ≈ {estimatedUSD} USDC deposited in smart contract
                </p>
              </div>

              {/* Breakdown metrics */}
              <div className="mt-5 flex flex-col gap-3 font-mono text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-border/60">
                  <span className="text-subtle flex items-center gap-1.5 font-sans">
                    <FiLayers className="h-3.5 w-3.5 text-primary" /> Recommended Milestones
                  </span>
                  <span className="font-bold text-foreground">
                    {calculatedMilestones} stages
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-border/60">
                  <span className="text-subtle flex items-center gap-1.5 font-sans">
                    <FiClock className="h-3.5 w-3.5 text-blue-400" /> Typical Delivery Time
                  </span>
                  <span className="font-bold text-foreground">
                    ~{estimatedDays} days
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-border/60">
                  <span className="text-subtle flex items-center gap-1.5 font-sans">
                    <FiDollarSign className="h-3.5 w-3.5 text-emerald-400" /> FairWork Platform Take
                  </span>
                  <span className="font-bold text-emerald-400">
                    $0.00 (0%)
                  </span>
                </div>

                {/* Savings Callout */}
                <div className="mt-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 flex items-center justify-between text-xs">
                  <span className="text-emerald-400 font-semibold font-sans">
                    Savings vs 20% Legacy Fee:
                  </span>
                  <span className="font-bold text-emerald-400 font-mono text-sm">
                    +{formatAmount(traditionalFeesSaved * 100)}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-6">
                <Link
                  to={destination}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 active:scale-[0.98] transition-all"
                >
                  <span>Post Brief with This Estimate</span>
                  <FiArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <p className="mt-3 text-center text-[11px] text-subtle">
                Funds remain in your control until milestones are verified.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
