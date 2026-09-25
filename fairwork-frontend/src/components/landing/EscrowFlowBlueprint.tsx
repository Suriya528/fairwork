import { useState } from "react"
import { FiCheck, FiShield, FiLock, FiCheckCircle, FiZap, FiLayers } from "react-icons/fi"
import { cn } from "@/lib/utils"

interface WorkflowStage {
  id: string
  step: string
  name: string
  badge: string
  executionTime: string
  status: "completed" | "in_progress" | "pending"
  summary: string
  telemetry: string[]
  contractAction: string
  codeSnippet: string
}

const workflowStages: WorkflowStage[] = [
  {
    id: "scope",
    step: "01",
    name: "Milestone Specification",
    badge: "Criteria Defined",
    executionTime: "0.8s",
    status: "completed",
    summary: "Milestone scope, acceptance criteria, and budget are formalized into smart contract storage.",
    telemetry: [
      "✓ Parsed deliverable acceptance criteria",
      "✓ Verified milestone valuation: 1,800 USDC",
      "✓ Project creator & client wallets bound",
    ],
    contractAction: "Escrow Contract Initialization",
    codeSnippet: `// Initialize escrow agreement and lock milestone criteria
function createEscrow(
    string calldata projectId,
    address freelancer,
    address token,
    uint256[] calldata milestoneAmounts
) external whenNotPaused {
    require(milestoneAmounts.length > 0, "Milestones required");
    // Direct on-chain storage commitment
}`,
  },
  {
    id: "deposit",
    step: "02",
    name: "Non-Custodial Lockbox",
    badge: "Escrow Secured",
    executionTime: "1.2s",
    status: "completed",
    summary: "Milestone funds are transferred directly into an immutable smart contract lockbox. Zero custodial intermediary.",
    telemetry: [
      "✓ Verified client wallet balance",
      "✓ Transfer authorized to Smart Contract Lockbox",
      "✓ 48-hour mutual timelock active",
    ],
    contractAction: "Token Deposit & State Lock",
    codeSnippet: `// Non-custodial escrow deposit
function fund(string calldata projectId) external nonReentrant whenNotPaused {
    e.isFunded = true;
    IERC20(e.token).safeTransferFrom(msg.sender, address(this), e.totalAmount);
    emit EscrowFunded(projectId, msg.sender, e.totalAmount);
}`,
  },
  {
    id: "verify",
    step: "03",
    name: "Deliverable Inspection",
    badge: "Active Review",
    executionTime: "Live",
    status: "in_progress",
    summary: "Specialist submits completed deliverables. Client inspects work in staging with clear criteria signoff.",
    telemetry: [
      "✓ Milestone deliverable submitted by creator",
      "✓ Automated test suites & staging preview verified",
      "⏳ Client inspection window open",
    ],
    contractAction: "Milestone Deliverable Submitted",
    codeSnippet: `// Deliverable submitted for client staging inspection
// Mutual 48-hour timelock active:
// Prevents unilateral withdrawals while review is open
emit DeliverableSubmitted(projectId, milestoneIndex, proofHash);`,
  },
  {
    id: "settle",
    step: "04",
    name: "Instant Direct Release",
    badge: "Atomic Payout",
    executionTime: "0.4s",
    status: "pending",
    summary: "Client signs approval. The smart contract immediately sends 100% of milestone funds straight to creator wallet.",
    telemetry: [
      "⏳ Awaiting client signature",
      "✓ 0% platform fee deduction",
      "✓ Direct wallet-to-wallet transfer ready",
    ],
    contractAction: "Atomic Settlement Transfer",
    codeSnippet: `// Instant atomic milestone settlement directly to creator wallet
function releaseMilestone(string calldata projectId, uint256 index) external nonReentrant {
    e.milestones[index].released = true;
    IERC20(e.token).safeTransfer(e.freelancer, m.amount);
    emit MilestoneReleased(projectId, index, e.freelancer, m.amount);
}`,
  },
]

export function EscrowFlowBlueprint() {
  const [activeStageId, setActiveStageId] = useState<string>("verify")
  const currentStage = workflowStages.find((s) => s.id === activeStageId) || workflowStages[2]

  return (
    <section id="workflow-pipeline" className="relative w-full bg-surface/30 border-y border-border/60 py-20 sm:py-28 overflow-hidden">
      {/* Subtle architectural accent light */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute left-1/4 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-teal-500/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Left-to-Right Section Header spanning full width */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 w-full text-left">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-surface/80 px-3.5 py-1 text-xs font-mono text-muted mb-4 shadow-xs">
              <FiShield className="h-3.5 w-3.5 text-emerald-400" />
              <span className="font-medium text-foreground/90">Escrow Lifecycle</span>
            </div>

            <h2 className="text-3xl font-light tracking-tight text-foreground sm:text-5xl leading-[1.15]">
              Accelerate every deliverable{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-200 to-emerald-300 font-normal">
                from brief to payout.
              </span>
            </h2>
          </div>

          <p className="text-base font-light text-muted/90 sm:text-lg max-w-md leading-relaxed pb-1 text-left">
            Every deliverable is verified against transparent milestone specifications and settled on-chain without human middlemen or hidden deductions.
          </p>
        </div>

        {/* 4-Stage Interactive Pipeline Card spanning full width (left end to right end) */}
        <div className="w-full overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-2xl">
          {/* Top Pipeline Stepper Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 border-b border-border/80 bg-elevated/30">
            {workflowStages.map((stage) => {
              const isSelected = activeStageId === stage.id
              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => setActiveStageId(stage.id)}
                  className={cn(
                    "flex flex-col p-4 sm:p-5 text-left border-r border-border/80 last:border-r-0 transition-colors cursor-pointer",
                    isSelected ? "bg-surface shadow-xs" : "hover:bg-elevated/60",
                  )}
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-subtle font-normal">{stage.step}</span>
                    {stage.status === "completed" ? (
                      <FiCheck className="h-4 w-4 text-emerald-400" />
                    ) : stage.status === "in_progress" ? (
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-subtle" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "mt-2 text-xs font-medium leading-tight",
                      isSelected ? "text-cyan-400" : "text-foreground/90",
                    )}
                  >
                    {stage.name}
                  </span>
                  <span className="mt-1 text-[11px] font-mono text-subtle font-normal">
                    {stage.badge}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Workflow Stage Details Workspace */}
          <div className="grid gap-6 md:grid-cols-12 p-6 sm:p-8">
            {/* Left Column: Stage Spec & Telemetry */}
            <div className="md:col-span-6 flex flex-col justify-between space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 rounded-md border border-border/80 bg-elevated/60 px-2.5 py-1 font-mono text-xs text-subtle mb-3">
                  <FiLock className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-foreground/90 font-medium">{currentStage.contractAction}</span>
                </div>

                <h3 className="text-lg font-normal text-foreground">
                  {currentStage.name}
                </h3>
                <p className="mt-2 text-xs font-light text-muted leading-relaxed">
                  {currentStage.summary}
                </p>

                <div className="mt-5 rounded-xl border border-border/80 bg-elevated/40 p-4 font-mono text-xs">
                  <span className="text-[10px] text-subtle uppercase tracking-wider block mb-2.5 font-medium">
                    Verification Telemetry:
                  </span>
                  <ul className="space-y-2 text-[11px] font-normal">
                    {currentStage.telemetry.map((log) => (
                      <li key={log} className="text-foreground/85 flex items-center gap-1.5">
                        {log}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-border/80 flex items-center justify-between text-xs font-mono text-subtle">
                <span className="flex items-center gap-1.5 font-normal">
                  <FiZap className="h-3.5 w-3.5 text-emerald-400" />
                  Finality: {currentStage.executionTime}
                </span>
                <span className="text-emerald-400 font-medium">0% Platform Fee</span>
              </div>
            </div>

            {/* Right Column: Smart Contract Verifiable Execution */}
            <div className="md:col-span-6">
              <div className="h-full flex flex-col justify-between rounded-xl border border-border/80 bg-elevated/50 p-5 font-mono text-xs overflow-x-auto text-muted">
                <div>
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/60 text-[11px] text-subtle">
                    <span className="flex items-center gap-1.5">
                      <FiLayers className="h-3.5 w-3.5 text-cyan-400" />
                      Smart Contract Verification
                    </span>
                    <span className="text-emerald-400 font-medium">Deterministic</span>
                  </div>
                  <pre className="text-foreground/85 leading-relaxed text-[11px] font-normal">
                    <code>{currentStage.codeSnippet}</code>
                  </pre>
                </div>

                <div className="mt-6 pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-subtle">
                  <span>Settlement Security: High</span>
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                    <FiCheckCircle className="h-3 w-3" /> Non-Custodial
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
