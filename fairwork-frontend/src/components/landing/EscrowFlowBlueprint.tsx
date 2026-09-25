import { useState } from "react"
import { FiCheck, FiGitBranch, FiTerminal } from "react-icons/fi"
import { cn } from "@/lib/utils"

interface WorkflowStage {
  id: string
  name: string
  jobFile: string
  executionTime: string
  status: "completed" | "in_progress" | "pending"
  summary: string
  logs: string[]
  codeSnippet: string
}

const workflowStages: WorkflowStage[] = [
  {
    id: "scope",
    name: "1. Scope Milestone",
    jobFile: ".github/workflows/milestone-init.yml",
    executionTime: "0.8s",
    status: "completed",
    summary: "Milestone scope, acceptance tests, and budget committed to smart contract.",
    logs: [
      "✓ Parsed deliverable specifications",
      "✓ Milestone amount verified: 1,500 USDC",
      "✓ Project participants initialized",
    ],
    codeSnippet: `// Initialize project and commit milestone values
function createProject(string calldata projectId, uint256[] calldata milestoneAmounts) external {
    require(milestoneAmounts.length > 0, "NO_MILESTONES");
    // State committed directly on-chain
}`,
  },
  {
    id: "deposit",
    name: "2. Lock Escrow",
    jobFile: ".github/workflows/escrow-deposit.yml",
    executionTime: "1.2s",
    status: "completed",
    summary: "Milestone funds transferred directly into non-custodial smart contract lockbox.",
    logs: [
      "✓ Verified client wallet balance",
      "✓ Transfer authorized to EscrowContract",
      "✓ 48-hour mutual timelock enabled",
    ],
    codeSnippet: `// Non-custodial escrow deposit
IERC20(token).safeTransferFrom(msg.sender, address(this), totalAmount);
escrow.isFunded = true;
emit EscrowFunded(projectId, msg.sender, totalAmount);`,
  },
  {
    id: "verify",
    name: "3. Deliverable Review",
    jobFile: ".github/workflows/review-inspection.yml",
    executionTime: "Live",
    status: "in_progress",
    summary: "Engineer submits completed code, Figma tokens, or audits for client signoff.",
    logs: [
      "✓ Pull request linked to Milestone 02",
      "✓ Automated test suite passed: 100% green",
      "⏳ Client review window open",
    ],
    codeSnippet: `// Link deliverable artifact
emit DeliverableSubmitted(projectId, milestoneIndex, proofHash);
// Client review window active (unilateral cancellation locked)`,
  },
  {
    id: "settle",
    name: "4. Atomic Release",
    jobFile: ".github/workflows/payout-settle.yml",
    executionTime: "0.4s",
    status: "pending",
    summary: "Client signs milestone release; contract sends 100% of payment directly to creator.",
    logs: [
      "⏳ Awaiting client signature",
      "✓ 0% platform fee deduction",
      "✓ Direct wallet transfer ready",
    ],
    codeSnippet: `// Instant settlement directly to recipient
e.milestones[index].released = true;
IERC20(e.token).safeTransfer(e.freelancer, m.amount);
emit MilestoneReleased(projectId, index, e.freelancer, m.amount);`,
  },
]

export function EscrowFlowBlueprint() {
  const [activeStageId, setActiveStageId] = useState<string>("verify")
  const currentStage = workflowStages.find((s) => s.id === activeStageId) || workflowStages[2]

  return (
    <section id="workflow-pipeline" className="relative w-full bg-base border-b border-border/40 py-20 sm:py-28 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Continuous GitHub Vertical Spine Container */}
        <div className="relative pl-6 sm:pl-10">
          <div
            className="pointer-events-none absolute left-0 top-2 bottom-0 w-[2px] bg-gradient-to-b from-blue-500 via-emerald-500 to-purple-500"
            aria-hidden
          />

          {/* Node on Spine */}
          <div className="absolute -left-[11px] top-0 flex h-6 w-6 items-center justify-center rounded-full border border-emerald-400 bg-base text-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]">
            <FiGitBranch className="h-3 w-3" />
          </div>

          {/* Header */}
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">
              Automated Workflow
            </span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              Accelerate every milestone from brief to payout.
            </h2>
            <p className="mt-4 text-base text-muted sm:text-lg">
              Every deliverable is verified through clear repository checkpoints and settled on-chain without human middlemen.
            </p>
          </div>

          {/* GitHub Actions Pipeline Visualizer */}
          <div className="overflow-hidden rounded-xl border border-border-strong bg-[#0d1117] shadow-xl">
            {/* Top Pipeline Flow Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 border-b border-border bg-[#161b22]">
              {workflowStages.map((stage) => {
                const isSelected = activeStageId === stage.id
                return (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={() => setActiveStageId(stage.id)}
                    className={cn(
                      "flex flex-col p-4 text-left border-r border-border last:border-r-0 transition-colors cursor-pointer",
                      isSelected ? "bg-[#0d1117]" : "hover:bg-[#161b22]/70",
                    )}
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className={cn("font-bold", isSelected ? "text-emerald-400" : "text-muted")}>
                        {stage.name}
                      </span>
                      {stage.status === "completed" ? (
                        <FiCheck className="h-3.5 w-3.5 text-emerald-400" />
                      ) : stage.status === "in_progress" ? (
                        <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-subtle" />
                      )}
                    </div>
                    <span className="mt-1 text-[11px] font-mono text-subtle truncate">
                      {stage.executionTime}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Workflow Stage Details Workspace */}
            <div className="grid gap-6 md:grid-cols-12 p-5 sm:p-7">
              {/* Left Column: Job Spec & Console Logs */}
              <div className="md:col-span-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 font-mono text-xs text-subtle mb-3">
                    <FiTerminal className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{currentStage.jobFile}</span>
                  </div>

                  <h3 className="text-base font-bold text-foreground">
                    {currentStage.name}
                  </h3>
                  <p className="mt-2 text-xs text-muted leading-relaxed">
                    {currentStage.summary}
                  </p>

                  <div className="mt-5 rounded-lg border border-border bg-[#161b22] p-3.5 font-mono text-xs">
                    <span className="text-[10px] text-subtle uppercase tracking-wider block mb-2 font-bold">
                      Execution Telemetry:
                    </span>
                    <ul className="space-y-1.5 text-[11px]">
                      {currentStage.logs.map((log) => (
                        <li key={log} className="text-muted">
                          {log}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-border flex items-center justify-between text-xs font-mono text-subtle">
                  <span>Status: Deterministic</span>
                  <span className="text-emerald-400 font-semibold">0% Take-Rate</span>
                </div>
              </div>

              {/* Right Column: Solidity Contract Execution Logic */}
              <div className="md:col-span-7">
                <div className="rounded-lg border border-border bg-[#161b22] p-4 font-mono text-xs overflow-x-auto text-muted">
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-border/60 text-[10px] text-subtle">
                    <span>contracts/EscrowSettlement.sol</span>
                    <span className="text-emerald-400">Smart Contract Verifiable</span>
                  </div>
                  <pre className="text-foreground/90 leading-relaxed text-[11px]">
                    <code>{currentStage.codeSnippet}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
