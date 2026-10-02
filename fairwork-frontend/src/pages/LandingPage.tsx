import { LandingHeader } from "@/components/landing/LandingHeader"
import { HeroSection } from "@/components/landing/HeroSection"
import { EscrowFlowBlueprint } from "@/components/landing/EscrowFlowBlueprint"
import { PlatformFeatures } from "@/components/landing/PlatformFeatures"
import { ProjectCalculator } from "@/components/landing/ProjectCalculator"
import { VerifiedProtocolShowcase } from "@/components/landing/VerifiedProtocolShowcase"
import { EscrowAssurance } from "@/components/landing/EscrowAssurance"
import { MarketplaceCTA } from "@/components/landing/MarketplaceCTA"
import { LandingFooter } from "@/components/landing/LandingFooter"

/**
 * Public landing page for FairWork:
 * - Centered hero banner with universal search and interactive escrow studio
 * - 4-stage automated milestone settlement pipeline
 * - Core platform capabilities (Escrow, AI Dispute Mediation, On-Chain Reputation, GitHub CI)
 * - Real-time milestone & budget configurator
 * - Verifiable Sepolia Smart Contract Registry & project lifecycle
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

        {/* Core Platform Capabilities: Escrow, AI Mediation, On-Chain Reputation, GitHub CI */}
        <PlatformFeatures />

        {/* Real-time Milestone & Budget Configurator */}
        <ProjectCalculator />

        {/* Verifiable Sepolia Smart Contract Registry & Project Lifecycle */}
        <VerifiedProtocolShowcase />

        {/* Non-Custodial Escrow Security Guardrails */}
        <EscrowAssurance />

        {/* Closing Call-to-Action */}
        <MarketplaceCTA />
      </main>

      <LandingFooter />
    </div>
  )
}
