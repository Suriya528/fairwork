import { useState } from "react"
import { FiCheckCircle } from "react-icons/fi"
import { cn } from "@/lib/utils"

const blueprintSteps = [
  {
    id: 1,
    title: "1. Scope & Milestone Codification",
    summary: "Deliverables, acceptance criteria, and milestone values are agreed upon and recorded.",
    contractAction: "Escrow.createMilestone(projectId, amount, deadline)",
    details: [
      "Explicit deliverable definitions with code review criteria",
      "Staged release milestones with independent values",
      "Zero hidden platform commission deducted at any stage",
    ],
    codeSnippet: `// Step 1: Milestone definition codified
EscrowMilestone memory m = EscrowMilestone({
    amount: 1500 * 1e6, // 1,500 USDC
    released: false,
    deliverableHash: bytes32(0)
});`,
  },
  {
    id: 2,
    title: "2. Non-Custodial Deposit",
    summary: "Client commits milestone funds directly into the verified smart contract.",
    contractAction: "IERC20(usdc).safeTransferFrom(client, address(escrow), totalAmount)",
    details: [
      "Funds are held by code on Ethereum/EVM, never corporate bank accounts",
      "Freelancer can commence work with 100% deposit certainty",
      "48-hour mutual timelock protects against unilateral clawbacks",
    ],
    codeSnippet: `// Step 2: Locked in non-custodial contract
require(msg.value >= milestoneAmount, "INSUFFICIENT_DEPOSIT");
escrows[projectId].isFunded = true;
emit EscrowFunded(projectId, msg.sender, totalAmount);`,
  },
  {
    id: 3,
    title: "3. Deliverable Inspection Window",
    summary: "Engineer submits completed artifacts for client testing and verification.",
    contractAction: "Deliverable.submitArtifact(projectId, milestoneIndex, proofURI)",
    details: [
      "Full review window for code quality, test runs, and security audits",
      "Direct revision loop if deliverables require fine-tuning",
      "Objective evidence trail preserved for potential arbitration",
    ],
    codeSnippet: `// Step 3: Verified deliverable submitted
emit DeliverableSubmitted(projectId, milestoneIndex, proofHash);
// Client review window active (unilateral cancellation locked)`,
  },
  {
    id: 4,
    title: "4. One-Click Atomic Settlement",
    summary: "Client approves deliverables and funds transfer directly to creator wallet.",
    contractAction: "Escrow.releaseMilestone(projectId, milestoneIndex)",
    details: [
      "Direct peer-to-peer payout with sub-minute blockchain finality",
      "Zero platform fee hold (freelancer receives 100% of milestone)",
      "Permanent on-chain reputation credit minted to freelancer address",
    ],
    codeSnippet: `// Step 4: Atomic release directly to freelancer
e.milestones[index].released = true;
IERC20(e.token).safeTransfer(e.freelancer, m.amount);
emit MilestoneReleased(projectId, index, e.freelancer, m.amount);`,
  },
]

export function EscrowFlowBlueprint() {
  const [activeStep, setActiveStep] = useState<number>(2)
  const currentStep = blueprintSteps.find(s => s.id === activeStep) || blueprintSteps[1]

  return (
    <section id="escrow-blueprint" className="w-full bg-surface border-b border-border/40 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">
            Escrow Architecture
          </span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            How funds move with cryptographic certainty
          </h2>
          <p className="mt-4 text-base text-muted">
            Inspect the verifiable, 4-stage smart contract settlement cycle engineered for high-stakes software engineering and design.
          </p>
        </div>

        {/* Interactive Blueprint Workspace */}
        <div className="grid gap-8 lg:grid-cols-12 items-stretch">
          {/* Step Selector Column */}
          <div className="lg:col-span-5 flex flex-col gap-3 justify-center">
            {blueprintSteps.map((step) => {
              const isSelected = activeStep === step.id
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setActiveStep(step.id)}
                  className={cn(
                    "flex flex-col rounded-2xl border p-5 text-left transition-all cursor-pointer",
                    isSelected
                      ? "border-emerald-500/80 bg-base shadow-lg"
                      : "border-border/80 bg-base/40 hover:bg-base/80 hover:border-border-strong",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className={cn("text-xs font-mono font-bold", isSelected ? "text-emerald-400" : "text-subtle")}>
                      STAGE 0{step.id}
                    </span>
                    {isSelected && (
                      <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                  </div>
                  <h3 className="mt-1 text-sm sm:text-base font-bold text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-xs text-muted leading-relaxed">
                    {step.summary}
                  </p>
                </button>
              )
            })}
          </div>

          {/* Interactive Code & Verification Visualizer */}
          <div className="lg:col-span-7 flex flex-col justify-between rounded-2xl border border-border bg-base p-6 sm:p-8 shadow-xl">
            <div>
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4 gap-2">
                <div>
                  <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold tracking-wider">
                    Smart Contract Execution
                  </span>
                  <h4 className="text-base font-bold text-foreground">
                    {currentStep.title}
                  </h4>
                </div>
                <span className="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-mono text-muted">
                  Solidity ^0.8.28
                </span>
              </div>

              {/* Protocol Spec Code Block */}
              <div className="mt-5 rounded-xl border border-border bg-surface/90 p-4 font-mono text-xs leading-relaxed overflow-x-auto text-muted">
                <div className="flex items-center justify-between text-[10px] text-subtle border-b border-border/60 pb-2 mb-3">
                  <span>Method: {currentStep.contractAction}</span>
                  <span>Non-Custodial</span>
                </div>
                <pre className="text-foreground/90">
                  <code>{currentStep.codeSnippet}</code>
                </pre>
              </div>

              {/* Verification Checklist */}
              <div className="mt-6">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-subtle">
                  Guaranteed Safety Rules:
                </span>
                <ul className="mt-3 flex flex-col gap-2.5" role="list">
                  {currentStep.details.map((detail) => (
                    <li key={detail} className="flex items-start gap-2.5 text-xs text-muted leading-relaxed">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                        <FiCheckCircle className="h-3 w-3" />
                      </span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Bottom Finality Note */}
            <div className="mt-8 pt-4 border-t border-border flex items-center justify-between text-xs font-mono text-subtle">
              <span>Settlement Engine</span>
              <span className="text-emerald-400 font-semibold">100% Verifiable On-Chain</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
