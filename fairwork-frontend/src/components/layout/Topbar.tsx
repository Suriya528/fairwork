import { useState, useEffect, useRef } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
  FiSearch,
  FiMenu,
  FiCheckCircle,
  FiShieldOff,
  FiX,
  FiFolder,
  FiUser,
  FiShield,
  FiNavigation,
  FiCornerDownLeft,
  FiLoader,
  FiArrowRight,
} from "react-icons/fi"
import { Badge } from "@/components/ui/Badge"
import { ThemeToggle } from "@/components/common/ThemeToggle"
import { FlagIndia, FlagUSA } from "@/components/common/FlagIcons"
import { AccountMenu } from "./AccountMenu"
import { useAuth } from "@/context/AuthContext"
import { useWallet } from "@/context/WalletContext"
import { useCurrency } from "@/context/CurrencyContext"
import { searchGlobal, type GlobalSearchResponse } from "@/services/searchApi"

interface TopbarProps {
  onOpenMobileNav: () => void
}

/** Sticky top bar with interactive live search input bar, autocomplete popover dropdown, wallet status, theme toggle, currency selector, and user account menu. */
export function Topbar({ onOpenMobileNav }: TopbarProps) {
  const { user, token } = useAuth()
  const { isVerified, connectedAccount } = useWallet()
  const { currency, setCurrency, formatAmount } = useCurrency()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [query, setQuery] = useState(searchParams.get("search") || "")
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<GlobalSearchResponse | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isUserVerified = isVerified || Boolean(user?.walletAddress)

  // Sync input value if URL search param changes
  useEffect(() => {
    const urlQuery = searchParams.get("search")
    if (urlQuery !== null) {
      setQuery(urlQuery)
    }
  }, [searchParams])

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Debounced search fetching
  useEffect(() => {
    const q = query.trim()
    if (!q || !token) {
      setResults(null)
      setLoading(false)
      return
    }

    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const data = await searchGlobal(q, token)
        setResults(data)
        setIsOpen(true)
      } catch (err) {
        console.error("Live topbar search error:", err)
      } finally {
        setLoading(false)
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [query, token])

  const handleSelect = (path: string) => {
    setIsOpen(false)
    navigate(path)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && query.trim()) {
      e.preventDefault()
      setIsOpen(false)
      navigate(`/projects?search=${encodeURIComponent(query.trim())}`)
    } else if (e.key === "Escape") {
      setIsOpen(false)
    }
  }

  const hasProjects = Boolean(results?.projects?.length)
  const hasUsers = Boolean(results?.users?.length)
  const hasWallets = Boolean(results?.wallets?.length)
  const hasPages = Boolean(results?.pages?.length)
  const hasAnyResults = hasProjects || hasUsers || hasWallets || hasPages

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-surface/80 px-4 backdrop-blur-md lg:px-8">
      <button
        type="button"
        onClick={onOpenMobileNav}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-elevated hover:text-foreground lg:hidden"
        aria-label="Open navigation menu"
      >
        <FiMenu className="h-5 w-5" aria-hidden />
      </button>

      {/* Interactive Topbar Search Input Bar */}
      <div ref={containerRef} className="relative flex-1 max-w-md hidden sm:block">
        <div className="relative flex items-center">
          <FiSearch
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle"
            aria-hidden
          />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onFocus={() => {
              if (query.trim()) setIsOpen(true)
            }}
            onChange={(e) => {
              setQuery(e.target.value)
              if (!isOpen) setIsOpen(true)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search projects, freelancers, wallets..."
            className="h-9 w-full rounded-lg border border-border bg-base pl-9 pr-8 text-sm text-foreground placeholder:text-subtle outline-none transition-colors focus:border-border-strong focus:ring-2 focus:ring-ring/40"
            aria-label="Search platform"
          />
          {loading ? (
            <FiLoader className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary animate-spin" />
          ) : query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("")
                setResults(null)
                setIsOpen(false)
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-subtle hover:text-foreground p-0.5 rounded-sm"
            >
              <FiX className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        {/* Live Search Autocomplete Popover Dropdown */}
        {isOpen && query.trim() && (
          <div className="absolute left-0 top-full mt-2 w-full min-w-[340px] max-w-xl rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden z-50 animate-fade-in backdrop-blur-md">
            <div className="max-h-[65vh] overflow-y-auto p-3 space-y-3 divide-y divide-border/40 text-xs">
              {!loading && !hasAnyResults && (
                <div className="py-6 text-center text-subtle">
                  No matching projects, users, or wallets for &ldquo;{query}&rdquo;.
                </div>
              )}

              {/* Projects Section */}
              {hasProjects && (
                <div className="pt-1 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-[11px] text-subtle uppercase tracking-wider px-2 pb-1">
                    <FiFolder className="h-3.5 w-3.5 text-primary" />
                    <span>Projects ({results?.projects.length})</span>
                  </div>
                  {results?.projects.slice(0, 4).map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleSelect(`/projects/${p.id}`)}
                      className="group flex items-center justify-between p-2 rounded-xl hover:bg-elevated cursor-pointer transition-all border border-transparent hover:border-border/60"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {p.title}
                        </p>
                        <p className="text-[11px] text-subtle truncate mt-0.5">
                          {p.category} &bull; {formatAmount(p.budget)} &bull; {p.clientName}
                        </p>
                      </div>
                      <FiArrowRight className="h-3.5 w-3.5 text-subtle group-hover:text-primary shrink-0 ml-2" />
                    </div>
                  ))}
                </div>
              )}

              {/* Users & Freelancers Section */}
              {hasUsers && (
                <div className="pt-2.5 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-[11px] text-subtle uppercase tracking-wider px-2 pb-1">
                    <FiUser className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Freelancers &amp; Clients</span>
                  </div>
                  {results?.users.slice(0, 3).map((u) => (
                    <div
                      key={u.id}
                      onClick={() => handleSelect(`/profile`)}
                      className="group flex items-center justify-between p-2 rounded-xl hover:bg-elevated cursor-pointer transition-all border border-transparent hover:border-border/60"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground truncate group-hover:text-emerald-400 transition-colors">
                          {u.name}
                        </p>
                        <p className="text-[11px] text-subtle truncate mt-0.5">
                          {u.role} &bull; {u.email}
                        </p>
                      </div>
                      <FiArrowRight className="h-3.5 w-3.5 text-subtle group-hover:text-emerald-400 shrink-0 ml-2" />
                    </div>
                  ))}
                </div>
              )}

              {/* Web3 Contracts & Wallets */}
              {hasWallets && (
                <div className="pt-2.5 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-[11px] text-subtle uppercase tracking-wider px-2 pb-1">
                    <FiShield className="h-3.5 w-3.5 text-amber-400" />
                    <span>Contracts &amp; Wallets</span>
                  </div>
                  {results?.wallets.slice(0, 3).map((w) => (
                    <div
                      key={w.id}
                      onClick={() => handleSelect(`/settings`)}
                      className="group flex items-center justify-between p-2 rounded-xl hover:bg-elevated cursor-pointer transition-all border border-transparent hover:border-border/60"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground truncate group-hover:text-amber-400 transition-colors">
                          {w.name}
                        </p>
                        <p className="font-mono text-[10px] text-subtle truncate mt-0.5">
                          {w.address}
                        </p>
                      </div>
                      <FiArrowRight className="h-3.5 w-3.5 text-subtle group-hover:text-amber-400 shrink-0 ml-2" />
                    </div>
                  ))}
                </div>
              )}

              {/* Navigation Shortcuts */}
              {hasPages && (
                <div className="pt-2.5 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-[11px] text-subtle uppercase tracking-wider px-2 pb-1">
                    <FiNavigation className="h-3.5 w-3.5 text-sky-400" />
                    <span>Quick Navigation</span>
                  </div>
                  {results?.pages.slice(0, 3).map((pg) => (
                    <div
                      key={pg.id}
                      onClick={() => handleSelect(pg.path)}
                      className="group flex items-center justify-between p-2 rounded-xl hover:bg-elevated cursor-pointer transition-all border border-transparent hover:border-border/60"
                    >
                      <span className="font-semibold text-foreground truncate group-hover:text-sky-400">
                        {pg.title}
                      </span>
                      <FiCornerDownLeft className="h-3.5 w-3.5 text-subtle group-hover:text-sky-400 shrink-0 ml-2" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Dropdown Footer Action */}
            <div
              onClick={() => handleSelect(`/projects?search=${encodeURIComponent(query.trim())}`)}
              className="flex items-center justify-between px-3 py-2 border-t border-border bg-surface-hover/80 text-[11px] text-primary font-semibold cursor-pointer hover:bg-elevated transition-colors"
            >
              <span>View all project results for &ldquo;{query}&rdquo;</span>
              <FiArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        {/* Compact Wallet Status Badge */}
        {isUserVerified ? (
          <Badge tone="success" className="hidden md:inline-flex items-center gap-1 font-medium">
            <FiCheckCircle className="h-3 w-3" />
            Wallet Verified ✓
          </Badge>
        ) : connectedAccount ? (
          <Badge tone="warning" className="hidden md:inline-flex items-center gap-1 font-medium">
            <FiShieldOff className="h-3 w-3" />
            Wallet Connected
          </Badge>
        ) : (
          <Badge tone="neutral" className="hidden md:inline-flex">
            Not Connected
          </Badge>
        )}

        <button
          type="button"
          onClick={() => setCurrency(currency === "INR" ? "USD" : "INR")}
          title={`Switch currency preference (Current: ${currency})`}
          aria-label={`Current display currency: ${currency}. Click to switch to ${currency === "INR" ? "USD" : "INR"}`}
          className="group relative flex h-9 items-center gap-1.5 rounded-lg border border-border bg-base px-2.5 text-xs font-mono font-bold text-muted transition-all duration-200 hover:border-border-strong hover:bg-elevated hover:text-foreground"
        >
          {currency === "INR" ? (
            <>
              <FlagIndia className="h-3.5 w-5 transition-transform duration-200 group-hover:scale-125" />
              <span>₹ INR</span>
            </>
          ) : (
            <>
              <FlagUSA className="h-3.5 w-5 transition-transform duration-200 group-hover:scale-125" />
              <span>$ USD</span>
            </>
          )}
        </button>
        <ThemeToggle />
        <AccountMenu />
      </div>
    </header>
  )
}
