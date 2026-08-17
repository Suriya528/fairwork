import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { FiSearch, FiBriefcase, FiUsers, FiTrendingUp } from "react-icons/fi"
import { Button } from "@/components/ui/Button"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"

export function MarketplaceSearch() {
  const [query, setQuery] = useState("")
  const [mode, setMode] = useState<"talent" | "projects">("talent")
  const { status } = useAuth()
  const navigate = useNavigate()
  const isAuthed = status === "authenticated"
  const destination = isAuthed ? "/projects" : "/register"

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    // Navigates safely to real routes
    navigate(destination)
  }

  return (
    <section className="relative z-20 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8">
      <div className="rounded-2xl border border-border-strong bg-surface p-3 sm:p-4 shadow-xl shadow-black/40 backdrop-blur-md">
        {/* Search mode toggle buttons */}
        <div className="mb-3 flex items-center justify-between border-b border-border pb-3 px-1">
          <div className="flex items-center gap-1 rounded-lg bg-base p-1 border border-border">
            <button
              type="button"
              onClick={() => setMode("talent")}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold transition-all",
                mode === "talent"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted hover:text-foreground",
              )}
            >
              <FiUsers className="h-3.5 w-3.5" />
              Find Freelancers
            </button>
            <button
              type="button"
              onClick={() => setMode("projects")}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold transition-all",
                mode === "projects"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted hover:text-foreground",
              )}
            >
              <FiBriefcase className="h-3.5 w-3.5" />
              Find Projects
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-subtle font-mono">
            <FiTrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            <span>Escrow Settlement Guarantee</span>
          </div>
        </div>

        {/* Search Input Bar */}
        <form onSubmit={handleSearch} className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <FiSearch
              className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-subtle"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                mode === "talent"
                  ? "Search by skill (e.g. Smart Contracts, React, UI Systems)..."
                  : "Search open project briefs by tag or keyword..."
              }
              className="h-12 w-full rounded-xl border border-input-border bg-input pl-11 pr-4 text-sm text-foreground placeholder:text-subtle outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              aria-label="Search marketplace"
            />
          </div>

          <Button type="submit" size="lg" className="h-12 px-7 text-sm font-semibold rounded-xl shrink-0">
            Search Marketplace
          </Button>
        </form>

        {/* Popular Category Shortcuts */}
        <div className="mt-3.5 flex flex-wrap items-center gap-2 pt-2 text-xs text-muted">
          <span className="font-semibold text-subtle">Trending Skills:</span>
          {[
            "Solidity / Web3",
            "Full-Stack React",
            "Figma Design Systems",
            "Python AI / ML",
            "Node.js APIs",
            "DevOps & AWS",
          ].map((tag) => (
            <Link
              key={tag}
              to={destination}
              className="rounded-full border border-border bg-base/80 px-3 py-1 text-xs text-muted transition-colors hover:border-border-strong hover:bg-elevated hover:text-foreground"
            >
              {tag}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
