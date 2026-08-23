import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import {
  FiSearch,
  FiX,
  FiFolder,
  FiUser,
  FiShield,
  FiNavigation,
  FiCornerDownLeft,
  FiLoader,
  FiArrowRight,
} from "react-icons/fi"
import { useAuth } from "@/context/AuthContext"
import { useCurrency } from "@/context/CurrencyContext"
import { searchGlobal, type GlobalSearchResponse } from "@/services/searchApi"

interface GlobalSearchModalProps {
  open: boolean
  onClose: () => void
}

export function GlobalSearchModal({ open, onClose }: GlobalSearchModalProps) {
  const { token } = useAuth()
  const { formatAmount } = useCurrency()
  const navigate = useNavigate()

  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<GlobalSearchResponse | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input on mount/open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery("")
      setResults(null)
    }
  }, [open])

  // Debounced search query
  useEffect(() => {
    if (!open || !token) return
    const q = query.trim()
    if (!q) {
      setResults(null)
      setLoading(false)
      return
    }

    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const data = await searchGlobal(q, token)
        setResults(data)
      } catch (err) {
        console.error("Global search error:", err)
      } finally {
        setLoading(false)
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [query, open, token])

  if (!open) return null

  const handleSelect = (path: string) => {
    onClose()
    navigate(path)
  }

  const hasProjects = Boolean(results?.projects?.length)
  const hasUsers = Boolean(results?.users?.length)
  const hasWallets = Boolean(results?.wallets?.length)
  const hasPages = Boolean(results?.pages?.length)
  const hasAnyResults = hasProjects || hasUsers || hasWallets || hasPages

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden z-10 space-y-0">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border bg-surface/90">
          <FiSearch className="h-5 w-5 text-subtle shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, freelancers, clients, wallets, or pages... (Ctrl+K)"
            className="flex-1 bg-transparent text-sm font-medium text-foreground placeholder:text-subtle outline-none"
          />
          {loading ? (
            <FiLoader className="h-4 w-4 text-primary animate-spin shrink-0" />
          ) : query ? (
            <button
              onClick={() => setQuery("")}
              className="text-subtle hover:text-foreground p-1 rounded-md transition-colors"
            >
              <FiX className="h-4 w-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-1 rounded bg-elevated px-2 py-0.5 text-[11px] font-mono text-subtle border border-border">
              ESC
            </kbd>
          )}
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4 divide-y divide-border/40">
          {!query.trim() && (
            <div className="py-8 text-center text-xs text-subtle space-y-2">
              <p className="font-semibold text-muted">Global FairWork Search</p>
              <p>Type keywords to search live across Projects, Freelancers, Wallets, and Platform Navigation.</p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => setQuery("React")}
                  className="px-2.5 py-1 rounded-lg bg-elevated border border-border text-subtle hover:text-foreground text-[11px] transition-colors"
                >
                  React
                </button>
                <button
                  onClick={() => setQuery("Escrow")}
                  className="px-2.5 py-1 rounded-lg bg-elevated border border-border text-subtle hover:text-foreground text-[11px] transition-colors"
                >
                  Escrow
                </button>
                <button
                  onClick={() => setQuery("Web Development")}
                  className="px-2.5 py-1 rounded-lg bg-elevated border border-border text-subtle hover:text-foreground text-[11px] transition-colors"
                >
                  Web Development
                </button>
              </div>
            </div>
          )}

          {query.trim() && !loading && !hasAnyResults && (
            <div className="py-10 text-center text-xs text-subtle">
              No matching projects, users, wallets, or pages found for &ldquo;{query}&rdquo;.
            </div>
          )}

          {/* 1. Projects Section */}
          {hasProjects && (
            <div className="pt-2 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-subtle uppercase tracking-wider px-2 pb-1">
                <FiFolder className="h-3.5 w-3.5 text-primary" />
                <span>Projects ({results?.projects.length})</span>
              </div>
              {results?.projects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleSelect(`/projects/${p.id}`)}
                  className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-elevated cursor-pointer transition-all border border-transparent hover:border-border/60"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {p.title}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 shrink-0">
                        {p.category}
                      </span>
                    </div>
                    <p className="text-xs text-subtle truncate mt-0.5">
                      Client: {p.clientName} &bull; Budget: {formatAmount(p.budget)}
                    </p>
                  </div>
                  <FiArrowRight className="h-4 w-4 text-subtle group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                </div>
              ))}
            </div>
          )}

          {/* 2. Users & Freelancers Section */}
          {hasUsers && (
            <div className="pt-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-subtle uppercase tracking-wider px-2 pb-1">
                <FiUser className="h-3.5 w-3.5 text-emerald-400" />
                <span>Freelancers &amp; Clients ({results?.users.length})</span>
              </div>
              {results?.users.map((u) => (
                <div
                  key={u.id}
                  onClick={() => handleSelect(`/profile`)}
                  className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-elevated cursor-pointer transition-all border border-transparent hover:border-border/60"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground truncate group-hover:text-emerald-400 transition-colors">
                        {u.name}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold capitalize bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                        {u.role}
                      </span>
                    </div>
                    <p className="text-xs text-subtle truncate mt-0.5">
                      {u.email} {u.skills?.length ? `• ${u.skills.slice(0, 3).join(", ")}` : ""}
                    </p>
                  </div>
                  <FiArrowRight className="h-4 w-4 text-subtle group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                </div>
              ))}
            </div>
          )}

          {/* 3. Smart Contracts & Wallets */}
          {hasWallets && (
            <div className="pt-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-subtle uppercase tracking-wider px-2 pb-1">
                <FiShield className="h-3.5 w-3.5 text-amber-400" />
                <span>Web3 Contracts &amp; Wallets ({results?.wallets.length})</span>
              </div>
              {results?.wallets.map((w) => (
                <div
                  key={w.id}
                  onClick={() => handleSelect(`/settings`)}
                  className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-elevated cursor-pointer transition-all border border-transparent hover:border-border/60"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground truncate group-hover:text-amber-400 transition-colors">
                        {w.name}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                        {w.type}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-subtle truncate mt-0.5">
                      {w.address} ({w.network})
                    </p>
                  </div>
                  <FiArrowRight className="h-4 w-4 text-subtle group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                </div>
              ))}
            </div>
          )}

          {/* 4. Quick Navigation Pages */}
          {hasPages && (
            <div className="pt-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-subtle uppercase tracking-wider px-2 pb-1">
                <FiNavigation className="h-3.5 w-3.5 text-sky-400" />
                <span>Pages &amp; Shortcuts</span>
              </div>
              {results?.pages.map((pg) => (
                <div
                  key={pg.id}
                  onClick={() => handleSelect(pg.path)}
                  className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-elevated cursor-pointer transition-all border border-transparent hover:border-border/60"
                >
                  <span className="text-sm font-semibold text-foreground truncate group-hover:text-sky-400 transition-colors">
                    {pg.title}
                  </span>
                  <FiCornerDownLeft className="h-4 w-4 text-subtle group-hover:text-sky-400 transition-colors shrink-0 ml-2" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-surface/90 text-[11px] text-subtle">
          <span>Search FairWork Platform</span>
          <div className="flex items-center gap-3">
            <span>Press <kbd className="font-mono bg-elevated px-1.5 py-0.5 rounded text-subtle border border-border">Ctrl+K</kbd> to open anytime</span>
          </div>
        </div>
      </div>
    </div>
  )
}
