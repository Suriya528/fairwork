import { useEffect, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { FiMenu, FiX, FiArrowRight, FiGithub } from "react-icons/fi"
import { ThemeToggle } from "@/components/common/ThemeToggle"
import { Logo } from "@/components/common/Logo"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"

const btnBase =
  "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]"
const btnPrimary = "bg-primary text-primary-foreground hover:bg-primary-hover shadow-md shadow-primary/20"
const btnOutline =
  "border border-border-strong bg-surface/80 text-foreground hover:bg-surface-hover hover:border-subtle"
const btnGhost = "text-muted hover:text-foreground hover:bg-surface-hover"

const navLinks = [
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Categories", href: "/#categories" },
] as const

export function LandingHeader() {
  const { status } = useAuth()
  const location = useLocation()
  const isAuthed = status === "authenticated"
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const isLoginActive = location.pathname === "/login"
  const isRegisterActive = location.pathname === "/register"

  // Track scroll position for background treatment
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 16)
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
          ? "border-b border-border/80 bg-base/90 backdrop-blur-md shadow-lg shadow-black/20"
          : "bg-transparent",
      )}
    >
      <nav
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
        aria-label="Landing"
      >
        {/* Brand Logo */}
        <Link to="/" aria-label="FairWork Home">
          <Logo size="md" />
        </Link>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="text-xs font-semibold text-muted transition-colors hover:text-foreground uppercase tracking-wider font-mono"
            >
              {label}
            </a>
          ))}
        </div>

        {/* Desktop auth CTA & Theme Toggle */}
        <div className="hidden items-center gap-3 md:flex">
          <a
            href="https://github.com/Suriya528/fairwork"
            target="_blank"
            rel="noopener noreferrer"
            title="Open Source Repository on GitHub"
            aria-label="GitHub Repository"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-muted transition-all duration-200 hover:border-border-strong hover:bg-elevated hover:text-foreground"
          >
            <FiGithub className="h-4 w-4" aria-hidden />
          </a>
          <ThemeToggle />
          {isAuthed ? (
            <Link
              to="/dashboard"
              className={cn(btnBase, btnPrimary, "h-9 px-4 text-xs gap-1.5")}
            >
              Go to Dashboard
              <FiArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className={cn(
                  btnBase,
                  btnGhost,
                  "h-9 px-3.5 text-xs font-semibold",
                  isLoginActive && "text-foreground font-bold border border-primary/40 bg-surface-hover",
                )}
              >
                Log In
              </Link>
              <Link
                to="/register"
                className={cn(
                  btnBase,
                  btnPrimary,
                  "h-9 px-4 text-xs",
                  isRegisterActive && "ring-2 ring-ring ring-offset-2 ring-offset-background",
                )}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <a
            href="https://github.com/Suriya528/fairwork"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub Repository"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-muted hover:bg-elevated hover:text-foreground"
          >
            <FiGithub className="h-4 w-4" aria-hidden />
          </a>
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

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden pointer-events-auto"
          aria-hidden={!mobileOpen}
        >
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-overlay transition-opacity duration-200 opacity-100"
            onClick={() => setMobileOpen(false)}
          />

          {/* Panel */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="absolute inset-y-0 right-0 flex w-72 max-w-[85%] flex-col border-l border-border bg-surface shadow-2xl transition-transform duration-200 translate-x-0"
          >
            <div className="flex h-16 items-center justify-between border-b border-border px-5">
              <span className="text-sm font-bold text-foreground uppercase tracking-wider font-mono">
                Menu
              </span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-muted hover:bg-elevated hover:text-foreground"
                aria-label="Close menu"
              >
                <FiX className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-5">
              {navLinks.map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-3.5 py-3 text-xs font-semibold text-muted transition-colors hover:bg-elevated hover:text-foreground uppercase tracking-wider font-mono"
                >
                  {label}
                </a>
              ))}
            </div>

            <div className="flex flex-col gap-2 border-t border-border p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <ThemeToggle showLabel className="w-full justify-center py-2" />
              </div>
              {isAuthed ? (
                <Link
                  to="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className={cn(btnBase, btnPrimary, "h-11 w-full px-4 text-xs font-bold gap-2")}
                >
                  Go to Dashboard
                  <FiArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className={cn(btnBase, btnPrimary, "h-11 w-full px-4 text-xs font-bold")}
                  >
                    Sign Up
                  </Link>
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className={cn(btnBase, btnOutline, "h-11 w-full px-4 text-xs font-bold")}
                  >
                    Log In
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
