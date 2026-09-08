import { LandingHeader } from "@/components/landing/LandingHeader"
import { LandingFooter } from "@/components/landing/LandingFooter"
import { FiShield, FiFileText } from "react-icons/fi"

export function TermsPage() {
  return (
    <div className="min-h-screen bg-base text-foreground flex flex-col justify-between">
      <LandingHeader />
      <main className="flex-1 pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <div className="space-y-4 border-b border-border/80 pb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <FiFileText className="h-3.5 w-3.5" />
            <span>Platform Governance &amp; Agreement</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Terms of Service
          </h1>
          <p className="text-sm text-muted">
            Last Updated: September 2026 &bull; FairWork Protocol v2.0
          </p>
        </div>

        <div className="mt-10 space-y-10 text-sm leading-relaxed text-muted">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 text-primary text-xs font-mono">1</span>
              Acceptance of Terms
            </h2>
            <p>
              By accessing, browsing, or connecting a Web3 wallet to FairWork (&quot;the Platform&quot;), you agree to be bound by these Terms of Service. If you do not agree to all terms and conditions, do not use the Platform or interact with its underlying smart contracts.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 text-primary text-xs font-mono">2</span>
              Smart Contract Escrows &amp; Non-Custodial Architecture
            </h2>
            <p>
              FairWork is a decentralized freelance collaboration protocol. Funds deposited for milestones are held directly within immutable, non-custodial smart contracts deployed on the Ethereum Virtual Machine (EVM). FairWork does not take custody of your cryptocurrency, private keys, or wallet seed phrases.
            </p>
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
              <FiShield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted leading-relaxed">
                Escrow agreements are enforced programmatically. When a client funds a project, ERC-20 tokens are locked in the escrow contract until released by the client, decided by arbitration, or timelocked for refund.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 text-primary text-xs font-mono">3</span>
              Milestones, Payment Releases &amp; 48-Hour Refund Timelock
            </h2>
            <p>
              Projects are structured into discrete, measurable milestones. Payments are released upon explicit approval by the client or through dispute resolution.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Client Milestone Release:</strong> Releasing a milestone executes an on-chain transfer directly from the escrow contract to the freelancer&apos;s verified wallet.
              </li>
              <li>
                <strong>48-Hour Refund Delay:</strong> To safeguard technical freelancers against unilateral payment clawbacks, clients may initiate a refund request via <code className="font-mono text-xs text-foreground bg-surface px-1.5 py-0.5 rounded">requestRefund()</code>. The protocol enforces a mandatory 48-hour timelock before funds can be withdrawn.
              </li>
              <li>
                <strong>Freelancer Dispute Window:</strong> If a freelancer has completed work in good faith, they may raise a dispute during the 48-hour timelock, automatically halting the refund and transferring settlement authority to arbitration.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 text-primary text-xs font-mono">4</span>
              Dispute Resolution &amp; Arbitration
            </h2>
            <p>
              In the event of an irreconcilable conflict between a client and freelancer, either party may trigger an on-chain dispute through the Dispute Contract.
            </p>
            <p>
              The designated Arbitrator (governed by designated multi-signature operational keys or community arbitration) holds programmatic authority to evaluate submitted evidence, deliverables, and communication logs. The Arbitrator&apos;s on-chain resolution is final and irreversible.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 text-primary text-xs font-mono">5</span>
              Wallet Verification &amp; Account Security
            </h2>
            <p>
              FairWork requires cryptographic EIP-712 wallet signatures to bind wallet addresses to verified accounts. You are solely responsible for maintaining the security of your private keys, hardware devices, and account passwords. FairWork is never liable for losses resulting from compromised credentials or phishing attacks.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 text-primary text-xs font-mono">6</span>
              Limitation of Liability &amp; Disclaimers
            </h2>
            <p>
              THE PROTOCOL AND PLATFORM ARE PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND. IN NO EVENT SHALL FAIRWORK, ITS CONTRIBUTORS, OR AFFILIATES BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES ARISING FROM SMART CONTRACT EXECUTION, BLOCKCHAIN REORGS, NETWORK CONGESTION, OR THIRD-PARTY TOKEN BEHAVIORS.
            </p>
          </section>
        </div>
      </main>
      <LandingFooter />
    </div>
  )
}
