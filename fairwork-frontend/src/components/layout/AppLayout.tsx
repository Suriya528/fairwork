import { useState } from "react"
import { Outlet } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { Topbar } from "./Topbar"
import { MobileNav } from "./MobileNav"
import { DisputeSummaryProvider } from "@/context/DisputeSummaryContext"
import { EmailVerificationBanner } from "@/components/auth/EmailVerificationBanner"

/**
 * Root application shell: fixed sidebar (desktop), sticky topbar,
 * slide-in drawer (mobile), and the routed page content.
 */
export function AppLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <DisputeSummaryProvider>
      <div className="min-h-screen bg-base text-foreground">
        <Sidebar />
        <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

        <div className="lg:pl-64">
          <Topbar onOpenMobileNav={() => setMobileNavOpen(true)} />
          <EmailVerificationBanner />
          <main className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8 lg:py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </DisputeSummaryProvider>
  )
}
