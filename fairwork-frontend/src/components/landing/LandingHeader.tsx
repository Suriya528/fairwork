import { useEffect, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { FiMenu, FiX, FiArrowRight, FiGlobe, FiSearch } from "react-icons/fi"
import { ThemeToggle } from "@/components/common/ThemeToggle"
import { Logo } from "@/components/common/Logo"
import { useAuth } from "@/context/AuthContext"
import { useCurrency } from "@/context/CurrencyContext"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "Escrow Pipeline", href: "/#workflow-pipeline" },
  { label: "Specialists", href: "/#verified-specialists" },
  { label: "Milestone Studio", href: "/#milestone-composer" },
  { label: "Buyer Protection", href: "/#security-guardrails" },
  { label: "Explore Projects", href: "/projects", isRoute: true },
] as const

export function LandingHeader() {
  const { status } = useAuth()
  const { currency, setCurrency } = useCurrency()
  const location = useLocation()
  const navigate = useNavigate()
  const isAuthed = status === "authenticated"
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [quickSearch, setQuickSearch] = useState("")

  const isLoginActive = location.pathname === "/login"

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12)
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

  function handleHeaderSearch(e: React.FormEvent) {
    e.preventDefault()
    if (quickSearch.trim()) {
      navigate(`/projects?search=${encodeURIComponent(quickSearch.trim())}`)
    } else {
      navigate("/projects")
    }
  }

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 w-full transition-all duration-200",
        scrolled
          ? "border-b border-border bg-base/95 backdrop-blur-md shadow-sm"
          : "border-b border-border/40 bg-base/80 backdrop-blur-sm",
      )}
    >
      <nav
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
        aria-label="Global"
      >
        {/* Left: Brand & Nav Links */}
        <div className="flex items-center gap-7">
          <Link to="/" aria-label="FairWork Home" className="flex items-center gap-2">
            <Logo size="md" showWordmark={true} />
          </Link>

          <div className="hidden lg:flex items-center gap-6">
            {navItems.map((item) =>
              "isRoute" in item && item.isRoute ? (
                <Link
                  key={item.label}
                  to={item.href}
                  className="text-xs font-medium text-muted hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-xs font-medium text-muted hover:text-foreground transition-colors"
                >
                  {item.label}
                </a>
              ),
            )}
          </div>
        </div>

        {/* Right: Search + Currency Switcher + Theme Toggle + Auth Controls */}
        <div className="hidden md:flex items-center gap-3">
          <form onSubmit={handleHeaderSearch} className="relative flex items-center">
            <FiSearch className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-subtle" />
            <input
              type="search"
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              placeholder="Search deliverables, skills..."
              className="h-8 w-48 rounded-lg border border-border bg-surface/90 pl-8 pr-7 text-xs text-foreground placeholder:text-subtle focus:w-60 focus:border-primary focus:outline-none transition-all"
              aria-label="Search or jump to"
            />
            <kbd className="pointer-events-none absolute right-2 flex h-4 w-4 items-center justify-center rounded border border-border-strong bg-base text-[10px] font-mono text-subtle">
              /
            </kbd>
          </form>

          {/* Currency Switcher */}
          <button
            type="button"
            onClick={() => setCurrency(currency === "USD" ? "INR" : "USD")}
            title="Switch currency"
            className="flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-mono font-medium text-muted hover:border-border-strong hover:text-foreground transition-colors"
          >
            <FiGlobe className="h-3 w-3" />
            <span>{currency}</span>
          </button>

          <ThemeToggle />

          {isAuthed ? (
            <Link
              to="/dashboard"
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3.5 text-xs font-semibold text-white transition-colors shadow-xs"
            >
              <span>Dashboard</span>
              <FiArrowRight className="h-3 w-3" />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className={cn(
                  "h-8 px-3 text-xs font-semibold text-muted hover:text-foreground transition-colors flex items-center",
                  isLoginActive && "text-foreground",
                )}
              >
                Sign in
              </Link>

              <Link
                to="/register"
                className="inline-flex h-8 items-center justify-center rounded-lg bg-primary hover:bg-primary-hover px-3.5 text-xs font-semibold text-white transition-all shadow-xs"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Controls */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface text-muted hover:text-foreground"
            aria-label="Open menu"
          >
            <FiMenu className="h-4 w-4" />
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden pointer-events-auto">
          <div
            className="absolute inset-0 bg-overlay"
            onClick={() => setMobileOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="absolute inset-y-0 right-0 flex w-72 max-w-[85%] flex-col border-l border-border bg-surface shadow-2xl"
          >
            <div className="flex h-16 items-center justify-between border-b border-border px-5">
              <span className="text-sm font-bold text-foreground font-mono">FairWork</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:text-foreground"
                aria-label="Close menu"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-4">
              {navItems.map((item) =>
                "isRoute" in item && item.isRoute ? (
                  <Link
                    key={item.label}
                    to={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-md px-3 py-2 text-xs font-semibold text-muted hover:bg-elevated hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-md px-3 py-2 text-xs font-semibold text-muted hover:bg-elevated hover:text-foreground"
                  >
                    {item.label}
                  </a>
                ),
              )}
            </div>

            <div className="flex flex-col gap-2 border-t border-border p-4">
              {isAuthed ? (
                <Link
                  to="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex h-9 w-full items-center justify-center rounded-md bg-emerald-600 font-semibold text-white text-xs"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex h-9 w-full items-center justify-center rounded-md bg-emerald-600 font-semibold text-white text-xs"
                  >
                    Sign up for FairWork
                  </Link>
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex h-9 w-full items-center justify-center rounded-md border border-border bg-base text-foreground font-semibold text-xs"
                  >
                    Sign in
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
