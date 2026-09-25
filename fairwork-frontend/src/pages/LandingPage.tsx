import { LandingHeader } from "@/components/landing/LandingHeader"
import { HeroSection } from "@/components/landing/HeroSection"
import { MarketplaceStats } from "@/components/landing/MarketplaceStats"
import { CategoryGrid } from "@/components/landing/CategoryGrid"
import { GigShowcase } from "@/components/landing/GigShowcase"
import { FairWorkPro } from "@/components/landing/FairWorkPro"
import { ProjectCalculator } from "@/components/landing/ProjectCalculator"
import { PlatformComparison } from "@/components/landing/PlatformComparison"
import { TrustSection } from "@/components/landing/TrustSection"
import { HowItWorks } from "@/components/landing/HowItWorks"
import { TestimonialsSection } from "@/components/landing/TestimonialsSection"
import { MarketplaceCTA } from "@/components/landing/MarketplaceCTA"
import { LandingFooter } from "@/components/landing/LandingFooter"

/**
 * Public landing page inspired by Fiverr's modern marketplace UX,
 * enhanced with unique interactive designs:
 * - Dynamic Hero with Search & Verified Talent
 * - Live Ecosystem Stats Ticker
 * - Popular Services & Filterable Gig Cards
 * - FairWork Pro VIP Enterprise Tier
 * - Interactive Project Cost & Escrow Savings Calculator
 * - FairWork vs Legacy Platforms Comparison Matrix
 * - Trust Pillars & Live Milestone Settlement Simulator
 * - 4-Step Execution Workflow & Customer Testimonials
 * - High-Converting Dual Talent CTA & Multi-Column Mega Footer
 */
export function LandingPage() {
  return (
    <div className="min-h-screen bg-base text-foreground scroll-smooth">
      <LandingHeader />

      <main>
        {/* Fiverr-Style Hero with Integrated Search & Verified Talent Spotlight */}
        <HeroSection />

        {/* Ecosystem Impact Metrics & 0% Fee Banner */}
        <MarketplaceStats />

        {/* Popular Services Visual Cards */}
        <CategoryGrid />

        {/* Fiverr-Style Gig Cards with Live Escrow Pricing & Category Tabs */}
        <GigShowcase />

        {/* FairWork Pro Enterprise Tier */}
        <FairWorkPro />

        {/* UNIQUE DESIGN: Interactive Project Cost & Escrow Estimator */}
        <ProjectCalculator />

        {/* UNIQUE DESIGN: FairWork vs. Traditional Platforms Comparison Table */}
        <PlatformComparison />

        {/* "A whole world of freelance talent at your fingertips" with Live Milestone Card */}
        <TrustSection />

        {/* 4-Step How It Works Workflow */}
        <HowItWorks />

        {/* Customer & Freelancer Testimonials */}
        <TestimonialsSection />

        {/* Closing Dual-Talent CTA ("Suddenly it's all so doable") */}
        <MarketplaceCTA />
      </main>

      {/* Fiverr-Style Comprehensive Directory Footer */}
      <LandingFooter />
    </div>
  )
}
