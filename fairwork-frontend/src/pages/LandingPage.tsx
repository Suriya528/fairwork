import { LandingHeader } from "@/components/landing/LandingHeader"
import { HeroSection } from "@/components/landing/HeroSection"
import { MarketplaceSearch } from "@/components/landing/MarketplaceSearch"
import { CategoryGrid } from "@/components/landing/CategoryGrid"
import { HowItWorks } from "@/components/landing/HowItWorks"
import { TrustSection } from "@/components/landing/TrustSection"
import { PlatformBenefits } from "@/components/landing/PlatformBenefits"
import { MarketplaceCTA } from "@/components/landing/MarketplaceCTA"
import { LandingFooter } from "@/components/landing/LandingFooter"

/**
 * Public landing page for unauthenticated visitors.
 * Renders outside AppLayout — has its own header and footer.
 * Does NOT use any authenticated API data.
 * All sections use static content or truthful empty states.
 */
export function LandingPage() {
  return (
    <div className="min-h-screen bg-base text-foreground scroll-smooth">
      <LandingHeader />

      <main>
        <HeroSection />
        <MarketplaceSearch />
        <CategoryGrid />
        <HowItWorks />
        <TrustSection />
        <PlatformBenefits />
        <MarketplaceCTA />
      </main>

      <LandingFooter />
    </div>
  )
}
