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
 * Public landing page combining Amazon discovery, Stripe escrow transparency,
 * and Linear precision typography:
 * - Centered hero banner with universal search and interactive escrow studio
 * - 4-stage automated milestone settlement pipeline
 * - Curated deliverable package cards with verified specialists
 * - Real-time milestone & budget configurator
 * - Shipped deliverable showcases with verified settlement proofs
 * - Non-custodial security guardrails & closing call-to-action
 */
export function LandingPage() {
  return (
    <div className="min-h-screen bg-base text-foreground scroll-smooth">
      <LandingHeader />

      <main>
        {/* Hero Banner with Universal Search & Interactive Escrow Studio */}
        <HeroSection />

        {/* 4-Stage Automated Milestone Settlement Pipeline */}
        <EscrowFlowBlueprint />

        {/* Curated Deliverable Package Cards */}
        <CuratedSpecialists />

        {/* Real-time Milestone & Budget Configurator */}
        <ProjectCalculator />

        {/* Shipped Deliverable Showcases & Settlement Proofs */}
        <VerifiedProjectShowcase />

        {/* Non-Custodial Escrow Security Guardrails */}
        <EscrowAssurance />

        {/* Closing Call-to-Action */}
        <MarketplaceCTA />
      </main>

      <LandingFooter />
    </div>
  )
}
