import { useEffect, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { FiMenu, FiX, FiArrowRight, FiGithub, FiGlobe } from "react-icons/fi"
import { ThemeToggle } from "@/components/common/ThemeToggle"
import { Logo } from "@/components/common/Logo"
import { useAuth } from "@/context/AuthContext"
import { useCurrency } from "@/context/CurrencyContext"
import { cn } from "@/lib/utils"

const specializations = [
  { label: "Smart Contracts & Protocol", filter: "web3" },
  { label: "Frontend & Web dApps", filter: "dev" },
  { label: "UI/UX & Design Systems", filter: "design" },
  { label: "AI & Autonomous Systems", filter: "ai" },
  { label: "Mobile Engineering", filter: "mobile" },
  { label: "DevOps & Infrastructure", filter: "devops" },
] as const

export function LandingHeader() {
  const { status } = useAuth()
  const { currency, setCurrency } = useCurrency()
  const location = useLocation()
  const isAuthed = status === "authenticated"
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const isLoginActive = location.pathname === "/login"

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    if (!mobileOpen) return
    const original = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = original
    }
  }, [mobileOpen])

  useEffect(() => {
    if (!mobileOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [mobileOpen])

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "border-b border-border/80 bg-base/95 backdrop-blur-md shadow-sm"
          : "bg-base/70 backdrop-blur-sm border-b border-border/30",
      )}
    >
      {/* Top Navbar */}
      <nav
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
        aria-label="Main Navigation"
      >
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link to="/" aria-label="FairWork" className="flex items-center gap-2 group">
            <Logo size="md" showWordmark={true} />
            <span className="hidden sm:inline-flex items-center rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono font-medium text-emerald-400">
              Escrow V2
            </span>
          </Link>
        </div>

        {/* Center Nav Links */}
        <div className="hidden lg:flex items-center gap-7 text-xs font-medium text-muted">
          <a
            href="#escrow-blueprint"
            className="hover:text-foreground transition-colors"
          >
            How Escrow Works
          </a>
          <a
            href="#deliverable-dossiers"
            className="hover:text-foreground transition-colors"
          >
            Verified Talent
          </a>
          <a
            href="#project-studio"
            className="hover:text-foreground transition-colors"
          >
            Milestone Studio
          </a>
          <a
            href="#escrow-assurance"
            className="hover:text-foreground transition-colors"
          >
            Security Guarantees
          </a>
          <Link
            to="/projects"
            className="hover:text-foreground transition-colors"
          >
            Explore Projects
          </Link>
        </div>

        {/* Right Nav Utilities */}
        <div className="hidden md:flex items-center gap-3">
          {/* Currency Toggle */}
          <button
            type="button"
            onClick={() => setCurrency(currency === "USD" ? "INR" : "USD")}
            title="Switch display currency"
            className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-mono font-semibold text-muted hover:border-border-strong hover:text-foreground transition-colors"
          >
            <FiGlobe className="h-3 w-3" />
            <span>{currency === "USD" ? "USD" : "INR"}</span>
          </button>

          {/* GitHub Repo */}
          <a
            href="https://github.com/Suriya528/fairwork"
            target="_blank"
            rel="noopener noreferrer"
            title="Open Source Repository"
            aria-label="GitHub Repository"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-muted transition-colors hover:border-border-strong hover:bg-elevated hover:text-foreground"
          >
            <FiGithub className="h-4 w-4" aria-hidden />
          </a>

          <ThemeToggle />

          {isAuthed ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm h-8.5 px-4 text-xs gap-1.5 transition-all"
            >
              <span>Dashboard</span>
              <FiArrowRight className="h-3 w-3" />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className={cn(
                  "h-8.5 px-3.5 text-xs font-semibold rounded-lg text-muted hover:text-foreground transition-colors flex items-center",
                  isLoginActive && "text-foreground bg-surface-hover border border-border",
                )}
              >
                Sign In
              </Link>

              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-lg font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm h-8.5 px-4 text-xs gap-1.5 transition-all active:scale-[0.98]"
              >
                <span>Get Started</span>
                <FiArrowRight className="h-3 w-3" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-muted hover:bg-elevated hover:text-foreground"
            aria-label="Open menu"
          >
            <FiMenu className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </nav>

      {/* Sub-Navigation Specialization Strip */}
      <div className="hidden border-t border-border/40 bg-surface/40 backdrop-blur-sm md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 overflow-x-auto no-scrollbar py-2 text-xs">
          {specializations.map(({ label, filter }) => (
            <Link
              key={filter}
              to={`/projects?category=${filter}`}
              className="whitespace-nowrap px-3 py-1 text-xs text-muted hover:text-emerald-400 font-medium transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden pointer-events-auto">
          <div
            className="absolute inset-0 bg-overlay transition-opacity duration-200 opacity-100"
            onClick={() => setMobileOpen(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="absolute inset-y-0 right-0 flex w-72 max-w-[85%] flex-col border-l border-border bg-surface shadow-2xl transition-transform duration-200 translate-x-0"
          >
            <div className="flex h-16 items-center justify-between border-b border-border px-5">
              <span className="text-sm font-bold text-foreground">FairWork</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-elevated hover:text-foreground"
                aria-label="Close menu"
              >
                <FiX className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-4">
              <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-subtle font-mono">
                Disciplines
              </div>
              {specializations.map(({ label, filter }) => (
                <Link
                  key={filter}
                  to={`/projects?category=${filter}`}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2 text-xs font-medium text-muted hover:bg-elevated hover:text-foreground transition-colors"
                >
                  {label}
                </Link>
              ))}

              <div className="mt-4 mb-2 border-t border-border pt-4 px-2 text-[10px] font-bold uppercase tracking-wider text-subtle font-mono">
                Platform
              </div>
              <a
                href="#escrow-blueprint"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2 text-xs font-medium text-muted hover:bg-elevated hover:text-foreground"
              >
                How Escrow Works
              </a>
              <a
                href="#project-studio"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2 text-xs font-medium text-muted hover:bg-elevated hover:text-foreground"
              >
                Milestone Studio
              </a>
              <a
                href="#escrow-assurance"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2 text-xs font-medium text-muted hover:bg-elevated hover:text-foreground"
              >
                Security Guarantees
              </a>
            </div>

            <div className="flex flex-col gap-2 border-t border-border p-4">
              {isAuthed ? (
                <Link
                  to="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-emerald-600 font-semibold text-white shadow-sm gap-2 text-xs"
                >
                  Go to Dashboard
                  <FiArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-emerald-600 font-semibold text-white shadow-sm gap-2 text-xs"
                  >
                    <span>Get Started</span>
                    <FiArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-border bg-base text-foreground font-semibold text-xs"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
