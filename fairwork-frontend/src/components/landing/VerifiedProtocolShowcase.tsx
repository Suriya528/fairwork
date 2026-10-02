import { FiCheck, FiShield, FiExternalLink } from "react-icons/fi"

interface VerifiedContract {
  id: string
  name: string
  address: string
  network: string
  role: string
  features: string[]
  etherscanUrl: string
}

const verifiedContracts: VerifiedContract[] = [
  {
    id: "escrow",
    name: "Milestone Escrow Contract",
    address: "0xc0d1b74a30a82d6fb846e446758a8c2ff391376c",
    network: "Ethereum Sepolia (11155111)",
    role: "Non-custodial multi-milestone lockbox with reentrancy protection and 48-hour refund timelock.",
    features: [
      "createEscrow & fund in ERC-20 USDC",
      "Client-gated atomic releaseMilestone",
      "requestRefund with 48h timelock safety",
    ],
    etherscanUrl: "https://sepolia.etherscan.io/address/0xc0d1b74a30a82d6fb846e446758a8c2ff391376c",
  },
  {
    id: "dispute",
    name: "Dispute Resolution Contract",
    address: "0x0423025a6a8c4bbbe1f9ecf0cb5d4542ac5b7193",
    network: "Ethereum Sepolia (11155111)",
    role: "Freezes escrow balances on dispute and resolves winner via arbitrator cryptographic relay.",
    features: [
      "freezeDispute links directly to Escrow",
      "resolveByArbitrator executes on-chain",
      "Mutual AI-consensus settlement relay",
    ],
    etherscanUrl: "https://sepolia.etherscan.io/address/0x0423025a6a8c4bbbe1f9ecf0cb5d4542ac5b7193",
  },
  {
    id: "reputation",
    name: "Reputation Accumulator",
    address: "0xfa25823ccf7343fdfd7fa20a785d996331e66674",
    network: "Ethereum Sepolia (11155111)",
    role: "O(1) accumulator recording permanent on-chain participant scores for completed projects.",
    features: [
      "submitRating for completed participants",
      "totalScore & ratingCount accumulator",
      "Immutable permanent proof of performance",
    ],
    etherscanUrl: "https://sepolia.etherscan.io/address/0xfa25823ccf7343fdfd7fa20a785d996331e66674",
  },
]

const projectLifecycleSteps = [
  {
    step: "01",
    title: "Brief & Milestone Scope",
    desc: "Client defines project requirements, budget, and structured milestone checkpoints.",
  },
  {
    step: "02",
    title: "Proposals & Hiring",
    desc: "Freelancers submit proposals. Client reviews profiles and hires the matching specialist.",
  },
  {
    step: "03",
    title: "AI Legal Agreement",
    desc: "Gemini generates a formal Freelance Services Agreement; both parties digitally sign.",
  },
  {
    step: "04",
    title: "Escrow Deposit",
    desc: "Client locks USDC into EscrowContract.sol. Funds are secured on-chain.",
  },
  {
    step: "05",
    title: "Deliverables & CI Verification",
    desc: "Freelancer submits assets and optional GitHub PR with verified automated CI test checks.",
  },
  {
    step: "06",
    title: "Instant Release & Rating",
    desc: "Client confirms signoff; 100% of funds transfer to creator + Sepolia rating recorded.",
  },
]

export function VerifiedProtocolShowcase() {
  return (
    <section id="protocol-contracts" className="relative w-full bg-base py-20 sm:py-28 overflow-hidden">
      {/* Subtle emerald/teal glow */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute left-1/3 bottom-10 h-[380px] w-[380px] rounded-full bg-emerald-500/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Centered Section Header */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-surface/80 px-3.5 py-1 text-xs font-mono text-muted mb-4 shadow-xs">
            <FiShield className="h-3.5 w-3.5 text-emerald-400" />
            <span className="font-medium text-foreground/90">Verifiable On-Chain Protocol</span>
          </div>

          <h2 className="text-3xl font-light tracking-tight text-foreground sm:text-5xl leading-[1.15]">
            Verified smart contracts.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-200 to-emerald-300 font-normal">
              Public on Sepolia.
            </span>
          </h2>

          <p className="mt-4 text-base font-light text-muted/90 sm:text-lg max-w-2xl leading-relaxed">
            Every escrow deposit, dispute resolution, and reputation score executes through audited, verified smart contracts on Ethereum Sepolia.
          </p>
        </div>

        {/* Verifiable Smart Contracts Registry */}
        <div className="max-w-6xl mx-auto grid gap-6 lg:grid-cols-3 mb-16">
          {verifiedContracts.map((contract) => (
            <div
              key={contract.id}
              className="flex flex-col justify-between rounded-2xl border border-border/80 bg-surface p-6 sm:p-7 shadow-lg transition-all duration-200 hover:border-cyan-500/40 hover:shadow-xl"
            >
              <div>
                {/* Header Bar */}
                <div className="flex items-center justify-between border-b border-border/80 pb-4">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-mono font-medium text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Verified &amp; Deployed
                  </span>

                  <span className="font-mono text-[11px] text-subtle">
                    Sepolia
                  </span>
                </div>

                <div className="mt-4">
                  <h3 className="text-base font-medium text-foreground leading-snug">
                    {contract.name}
                  </h3>
                  <p className="mt-2 text-xs font-light text-muted leading-relaxed">
                    {contract.role}
                  </p>
                </div>

                {/* Features Checklist */}
                <div className="mt-5 space-y-2">
                  <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-subtle block">
                    Verified Invariants:
                  </span>
                  <ul className="space-y-1.5 text-xs text-muted">
                    {contract.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2">
                        <FiCheck className="mt-0.5 h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span className="leading-relaxed text-foreground/85 font-light font-mono text-[11px]">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Address & Etherscan Link Footer */}
              <div className="mt-6 pt-4 border-t border-border/80 flex items-center justify-between font-mono text-[11px] text-subtle">
                <span className="truncate max-w-[170px]" title={contract.address}>
                  {contract.address.slice(0, 8)}...{contract.address.slice(-6)}
                </span>

                <a
                  href={contract.etherscanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1 font-sans text-xs shrink-0"
                >
                  View on Etherscan <FiExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Real Lifecycle Timeline */}
        <div className="max-w-6xl mx-auto rounded-2xl border border-border/80 bg-surface/80 p-6 sm:p-8 backdrop-blur-md">
          <div className="border-b border-border/70 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-medium text-foreground">The Complete Project Lifecycle</h3>
              <p className="text-xs text-muted font-light mt-0.5">
                From initial project brief to automated code verification and atomic on-chain settlement.
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-medium self-start sm:self-auto">
              0% Platform Fee · 100% Non-Custodial
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projectLifecycleSteps.map((step) => (
              <div key={step.step} className="rounded-xl border border-border/70 bg-elevated/40 p-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-cyan-400 font-medium">Step {step.step}</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/60" />
                </div>
                <h4 className="text-xs font-semibold text-foreground">{step.title}</h4>
                <p className="text-[11px] text-muted font-light leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
