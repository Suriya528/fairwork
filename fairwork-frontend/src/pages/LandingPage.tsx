import { LandingHeader } from "@/components/landing/LandingHeader"
import { HeroSection } from "@/components/landing/HeroSection"
import { CategoryGrid } from "@/components/landing/CategoryGrid"
import { GigShowcase } from "@/components/landing/GigShowcase"
import { FairWorkPro } from "@/components/landing/FairWorkPro"
import { TrustSection } from "@/components/landing/TrustSection"
import { HowItWorks } from "@/components/landing/HowItWorks"
import { TestimonialsSection } from "@/components/landing/TestimonialsSection"
import { MarketplaceCTA } from "@/components/landing/MarketplaceCTA"
import { LandingFooter } from "@/components/landing/LandingFooter"

/**
 * Public landing page inspired by Fiverr's modern marketplace UX.
 * Renders outside AppLayout with high-converting search hero, popular services,
 * Fiverr Pro tier, gig cards with live escrow pricing, and dual client/freelancer funnels.
 */
export function LandingPage() {
  return (
    <div className="min-h-screen bg-base text-foreground scroll-smooth">
      <LandingHeader />

      <main>
        {/* Fiverr-Style Hero with Integrated Search & Verified Talent Card */}
        <HeroSection />

        {/* Popular Services Visual Cards */}
        <CategoryGrid />

        {/* Fiverr-Style Gig Cards with Live Escrow Pricing */}
        <GigShowcase />

        {/* FairWork Pro Premium Tier */}
        <FairWorkPro />

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
