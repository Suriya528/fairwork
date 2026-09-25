import { LandingHeader } from "@/components/landing/LandingHeader"
import { HeroSection } from "@/components/landing/HeroSection"
import { EscrowFlowBlueprint } from "@/components/landing/EscrowFlowBlueprint"
import { CuratedSpecialists } from "@/components/landing/CuratedSpecialists"
import { ProjectCalculator } from "@/components/landing/ProjectCalculator"
import { VerifiedProjectShowcase } from "@/components/landing/VerifiedProjectShowcase"
import { EscrowAssurance } from "@/components/landing/EscrowAssurance"
import { MarketplaceCTA } from "@/components/landing/MarketplaceCTA"
import { LandingFooter } from "@/components/landing/LandingFooter"

/**
 * Public landing page designed in GitHub's signature visual architecture:
 * - Continuous vertical glowing timeline spine with section nodes
 * - GitHub Primer navigation with [/] search keycap
 * - Pull Request & Actions CI/CD milestone settlement window
 * - GitHub Actions workflow pipeline visualizer
 * - Pinned repository & verified contributor cards with language dots
 * - Interactive milestone issue composer
 * - Merged pull requests & settled milestones showcase
 * - Security guardrails & closing banner
 */
export function LandingPage() {
  return (
    <div className="min-h-screen bg-base text-foreground scroll-smooth">
      <LandingHeader />

      <main>
        {/* Node 1: Hero with Pull Request & Actions Checks Window */}
        <HeroSection />

        {/* Node 2: GitHub Actions Workflow Pipeline */}
        <EscrowFlowBlueprint />

        {/* Node 3: Pinned Repository & Verified Contributor Cards */}
        <CuratedSpecialists />

        {/* Node 4: Interactive Milestone Issue Composer */}
        <ProjectCalculator />

        {/* Node 5: Merged Pull Requests & Settled Milestones */}
        <VerifiedProjectShowcase />

        {/* Node 6: Security & Smart Contract Guardrails */}
        <EscrowAssurance />

        {/* Node 7: Spine Termination & Closing CTA */}
        <MarketplaceCTA />
      </main>

      <LandingFooter />
    </div>
  )
}
