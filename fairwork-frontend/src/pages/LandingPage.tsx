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
 * Public landing page designed with bespoke architectural craftsmanship:
 * - Editorial typographic hero with command-line search and interactive milestone console
 * - Technical 4-stage smart contract settlement blueprint with code viewer
 * - Curated specialist dossiers with verified deliverables and tech stacks
 * - Interactive milestone studio for scope & turnaround calculation
 * - Shipped project case studies with deliverable highlights and on-chain hashes
 * - Engineering security assurance architecture (non-custodial, 48h timelock, 0% fee)
 * - Dual client/creator conversion funnels
 */
export function LandingPage() {
  return (
    <div className="min-h-screen bg-base text-foreground scroll-smooth">
      <LandingHeader />

      <main>
        {/* Typographic Hero with Interactive Milestone Console */}
        <HeroSection />

        {/* Technical 4-Stage Escrow Flow Blueprint */}
        <EscrowFlowBlueprint />

        {/* Curated Specialist Dossiers with Real Deliverable Specs */}
        <CuratedSpecialists />

        {/* Interactive Milestone Studio & Turnaround Estimator */}
        <ProjectCalculator />

        {/* Shipped Project Case Studies with Milestone Proofs */}
        <VerifiedProjectShowcase />

        {/* Escrow Assurance & Security Architecture */}
        <EscrowAssurance />

        {/* Dual Conversion Funnels */}
        <MarketplaceCTA />
      </main>

      {/* Directory Footer */}
      <LandingFooter />
    </div>
  )
}
