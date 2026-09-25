import { useEffect, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import {
  FiMenu,
  FiX,
  FiArrowRight,
  FiGithub,
  FiStar,
} from "react-icons/fi"
import { ThemeToggle } from "@/components/common/ThemeToggle"
import { Logo } from "@/components/common/Logo"
import { useAuth } from "@/context/AuthContext"
import { useCurrency } from "@/context/CurrencyContext"
import { cn } from "@/lib/utils"

const subCategories = [
  { label: "Web3 & Smart Contracts", filter: "web3" },
  { label: "Programming & Tech", filter: "dev" },
  { label: "UI/UX & Product Design", filter: "design" },
  { label: "AI Services & Agents", filter: "ai" },
  { label: "Mobile Apps", filter: "mobile" },
  { label: "DevOps & Cloud", filter: "devops" },
  { label: "Security & Auditing", filter: "security" },
  { label: "Technical Writing", filter: "writing" },
] as const

export function LandingHeader() {
  const { status } = useAuth()
  const { currency, setCurrency } = useCurrency()
  const location = useLocation()
  const isAuthed = status === "authenticated"
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const isLoginActive = location.pathname === "/login"
  const isRegisterActive = location.pathname === "/register"

  // Track scroll position for background styling
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (!mobileOpen) return
    const original = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = original
    }
  }, [mobileOpen])

  // Close on Escape
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
        "fixed inset-x-0 top-0 z-50 w-full transition-all duration-200",
        scrolled
          ? "border-b border-border/80 bg-base/95 backdrop-blur-md shadow-md shadow-black/10"
          : "bg-base/80 backdrop-blur-sm border-b border-border/40",
      )}
    >
      {/* Top Main Navigation Bar */}
      <nav
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
        aria-label="Fiverr Style Main Navigation"
      >
        {/* Left: Brand Logo & Fiverr Pro Badge */}
        <div className="flex items-center gap-4">
          <Link to="/" aria-label="FairWork Home" className="flex items-center gap-1 group">
            <Logo size="md" showWordmark={true} />
            <span className="h-2 w-2 rounded-full bg-emerald-500 -ml-1.5 mb-1 group-hover:scale-125 transition-transform" />
          </Link>

          {/* FairWork Pro Tag (Fiverr Pro style) */}
          <Link
            to="/projects"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
          >
            <FiStar className="h-3 w-3 fill-emerald-400" />
            <span>FairWork Pro</span>
          </Link>
        </div>

        {/* Center/Desktop Navigation Links */}
        <div className="hidden lg:flex items-center gap-6">
          <a
            href="#how-it-works"
            className="text-xs font-semibold text-muted hover:text-foreground transition-colors"
          >
            How It Works
          </a>
          <a
            href="#pro-services"
            className="text-xs font-semibold text-muted hover:text-foreground transition-colors"
          >
            Fiverr-Style Gigs
          </a>
          <a
            href="#trust-guarantee"
            className="text-xs font-semibold text-muted hover:text-foreground transition-colors"
          >
            Escrow Protection
          </a>
          <Link
            to="/projects"
            className="text-xs font-semibold text-muted hover:text-foreground transition-colors"
          >
            Explore Projects
          </Link>
        </div>

        {/* Right: Currency Toggle, Theme Toggle & Auth CTAs */}
        <div className="hidden md:flex items-center gap-3">
          {/* Currency Switcher */}
          <button
            type="button"
            onClick={() => setCurrency(currency === "USD" ? "INR" : "USD")}
            title="Switch display currency"
            className="flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-mono font-semibold text-muted hover:border-border-strong hover:text-foreground transition-colors"
          >
            <span>{currency === "USD" ? "$ USD" : "₹ INR"}</span>
          </button>

          {/* GitHub link */}
          <a
            href="https://github.com/Suriya528/fairwork"
            target="_blank"
            rel="noopener noreferrer"
            title="Open Source Repository on GitHub"
            aria-label="GitHub Repository"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-muted transition-colors hover:border-border-strong hover:bg-elevated hover:text-foreground"
          >
            <FiGithub className="h-4 w-4" aria-hidden />
          </a>

          <ThemeToggle />

          {isAuthed ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-150 active:scale-[0.98] bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 h-9 px-4 text-xs gap-1.5"
            >
              Go to Dashboard
              <FiArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <>
              {/* Become a Freelancer / Seller */}
              <Link
                to="/register"
                className="text-xs font-semibold text-muted hover:text-foreground px-2 py-1 transition-colors"
              >
                Become a Seller
              </Link>

              {/* Sign In */}
              <Link
                to="/login"
                className={cn(
                  "h-9 px-3.5 text-xs font-semibold rounded-xl text-muted hover:text-foreground transition-colors flex items-center",
                  isLoginActive && "text-foreground font-bold bg-surface-hover border border-border",
                )}
              >
                Sign In
              </Link>

              {/* Join Button (Fiverr signature outline / pill button) */}
              <Link
                to="/register"
                className={cn(
                  "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-150 active:scale-[0.98] border-2 border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-white h-9 px-4 text-xs gap-1.5 shadow-sm",
                  isRegisterActive && "bg-emerald-500 text-white",
                )}
              >
                <span>Join</span>
                <FiArrowRight className="h-3 w-3" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile Action Controls */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={() => setCurrency(currency === "USD" ? "INR" : "USD")}
            className="flex items-center rounded-lg border border-border bg-surface px-2 py-1 text-[11px] font-mono font-semibold text-muted"
          >
            {currency}
          </button>
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-muted hover:bg-elevated hover:text-foreground"
            aria-label="Open menu"
          >
            <FiMenu className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </nav>

      {/* Fiverr-Style Sub-Navigation Category Bar (Desktop) */}
      <div className="hidden border-t border-border/50 bg-surface/50 backdrop-blur-sm md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 overflow-x-auto no-scrollbar py-2 text-xs">
          {subCategories.map(({ label, filter }) => (
            <Link
              key={filter}
              to={`/projects?category=${filter}`}
              className="whitespace-nowrap px-2.5 py-1 text-xs text-muted hover:text-emerald-400 font-medium transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile Drawer */}
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
              <span className="text-sm font-bold text-foreground">Menu</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-muted hover:bg-elevated hover:text-foreground"
                aria-label="Close menu"
              >
                <FiX className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-4">
              <div className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wider text-subtle font-mono">
                Explore Categories
              </div>
              {subCategories.map(({ label, filter }) => (
                <Link
                  key={filter}
                  to={`/projects?category=${filter}`}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2 text-xs font-medium text-muted hover:bg-elevated hover:text-foreground transition-colors"
                >
                  {label}
                </Link>
              ))}

              <div className="mt-4 mb-2 border-t border-border pt-4 px-2 text-[11px] font-bold uppercase tracking-wider text-subtle font-mono">
                Platform
              </div>
              <a
                href="#how-it-works"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2 text-xs font-medium text-muted hover:bg-elevated hover:text-foreground"
              >
                How It Works
              </a>
              <a
                href="#trust-guarantee"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2 text-xs font-medium text-muted hover:bg-elevated hover:text-foreground"
              >
                Escrow Protection
              </a>
              <Link
                to="/help"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2 text-xs font-medium text-muted hover:bg-elevated hover:text-foreground"
              >
                Help Center
              </Link>
            </div>

            <div className="flex flex-col gap-2 border-t border-border p-4">
              {isAuthed ? (
                <Link
                  to="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-emerald-600 font-semibold text-white shadow-md hover:bg-emerald-500 gap-2 text-xs"
                >
                  Go to Dashboard
                  <FiArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-emerald-600 font-semibold text-white shadow-md hover:bg-emerald-500 gap-2 text-xs"
                  >
                    <span>Join FairWork</span>
                    <FiArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-border bg-base text-foreground font-semibold hover:bg-elevated text-xs"
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
