import { LandingHeader } from "@/components/landing/LandingHeader"
import { LandingFooter } from "@/components/landing/LandingFooter"
import { FiShield, FiEye } from "react-icons/fi"

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-base text-foreground flex flex-col justify-between">
      <LandingHeader />
      <main className="flex-1 pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <div className="space-y-4 border-b border-border/80 pb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
            <FiShield className="h-3.5 w-3.5" />
            <span>Data Privacy &amp; Cryptographic Security</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Privacy Policy
          </h1>
          <p className="text-sm text-muted">
            Last Updated: September 2026 &bull; FairWork Protocol v2.0
          </p>
        </div>

        <div className="mt-10 space-y-10 text-sm leading-relaxed text-muted">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-400 text-xs font-mono">1</span>
              Overview &amp; Philosophy
            </h2>
            <p>
              FairWork is committed to data minimization and user sovereignty. We do not sell user data, track users across third-party web properties, or harvest sensitive personal identity documents without explicit purpose.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-400 text-xs font-mono">2</span>
              Information We Collect
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Account Information:</strong> Name, verified email address, role (client or freelancer), bio, skills, and portfolio items.
              </li>
              <li>
                <strong>Cryptographic Identifiers:</strong> Public Ethereum/EVM wallet addresses verified via EIP-712 typed data signatures.
              </li>
              <li>
                <strong>Project &amp; Communication Data:</strong> Project descriptions, milestone deliverables, chat messages, and dispute submission attachments.
              </li>
              <li>
                <strong>OAuth Tokens &amp; Developer Profiles:</strong> When you connect GitHub or Google, we store minimal required authorization tokens and public developer metrics.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-400 text-xs font-mono">3</span>
              Blockchain Transparency &amp; Immutability Notice
            </h2>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-start gap-3">
              <FiEye className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs leading-relaxed text-muted">
                <p className="font-bold text-foreground">Public Ledger Immutability</p>
                <p>
                  Transactions executed through FairWork smart contracts (such as escrow creation, milestone releases, funding, and dispute votes) are recorded permanently on public decentralized blockchains. Once broadcast and validated, on-chain data cannot be deleted, modified, or restricted by FairWork or any third party.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-400 text-xs font-mono">4</span>
              Security &amp; Encryption Standards
            </h2>
            <p>
              Off-chain account credentials are secured using modern cryptographic best practices:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Passwords are hashed with salted Bcrypt.</li>
              <li>Password reset tokens are hashed with SHA-256 before storage in our database.</li>
              <li>Third-party OAuth access tokens are encrypted with AES-256-GCM.</li>
              <li>API requests are protected by rate limiting and strict CORS origin validation.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-400 text-xs font-mono">5</span>
              Third-Party Services
            </h2>
            <p>
              The platform integrates with trusted infrastructure providers to deliver services:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Cloudinary:</strong> For secure image and portfolio asset hosting.</li>
              <li><strong>Alchemy / RPC Nodes:</strong> For broadcasting and indexing smart contract state.</li>
              <li><strong>Transactional Email:</strong> For security notices, email verification, and password resets.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-400 text-xs font-mono">6</span>
              Contact &amp; Data Rights
            </h2>
            <p>
              You may request an export of your off-chain profile data or request account deletion through your account settings or by contacting the FairWork governance team.
            </p>
          </section>
        </div>
      </main>
      <LandingFooter />
    </div>
  )
}
