import { useMemo, useState } from "react"
import { FiChevronDown, FiHelpCircle, FiMail, FiShield, FiFileText, FiDollarSign, FiUser, FiArrowRight } from "react-icons/fi"
import { Link } from "react-router-dom"
import { PageHeader } from "@/components/common/PageHeader"
import { SearchBar } from "@/components/common/SearchBar"
import { Card, CardContent } from "@/components/ui/Card"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"
import { getHelpCategories, helpArticles } from "@/data/help"

const categoryIcons: Record<string, typeof FiHelpCircle> = {
  "Getting Started": FiHelpCircle,
  "Escrow & Payments": FiDollarSign,
  Disputes: FiShield,
  Contracts: FiFileText,
  Account: FiUser,
}

export function HelpCenterPage() {
  const { status } = useAuth()
  const isAuthenticated = status === "authenticated"
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const categories = getHelpCategories()

  const filtered = useMemo(() => {
    let result = helpArticles
    if (selectedCategory) {
      result = result.filter((a) => a.category === selectedCategory)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (a) => a.question.toLowerCase().includes(q) || a.answer.toLowerCase().includes(q),
      )
    }
    return result
  }, [search, selectedCategory])

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Hero / Page Header */}
      <div className="flex flex-col gap-4 text-center sm:text-left">
        <PageHeader
          title="How can we help?"
          description="Find answers about projects, milestones, payments, escrow, disputes, and your FairWork account."
        />

        {/* Search Bar */}
        <div className="pt-2">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search for an answer or keyword…"
            containerClassName="w-full max-w-xl"
          />
        </div>
      </div>

      {/* Quick Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSelectedCategory(null)}
          className={cn(
            "rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            selectedCategory === null
              ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
              : "border border-border bg-surface text-muted hover:border-border-strong hover:text-foreground",
          )}
        >
          All Topics ({helpArticles.length})
        </button>
        {categories.map((cat) => {
          const Icon = categoryIcons[cat] || FiHelpCircle
          const count = helpArticles.filter((a) => a.category === cat).length
          const isSelected = selectedCategory === cat
          return (
            <button
              type="button"
              key={cat}
              onClick={() => setSelectedCategory(isSelected ? null : cat)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isSelected
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                  : "border border-border bg-surface text-muted hover:border-border-strong hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              <span>{cat}</span>
              <span className="opacity-70 font-mono text-[11px]">({count})</span>
            </button>
          )
        })}
      </div>

      {/* FAQ Article List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center bg-surface/50">
          <FiHelpCircle className="mb-3 h-8 w-8 text-subtle" aria-hidden />
          <p className="text-sm font-semibold text-foreground">No matching articles found</p>
          <p className="mt-1 max-w-sm text-xs text-muted">
            We couldn&apos;t find anything matching &quot;{search}&quot;. Try adjusting your search term or select another topic.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch("")
              setSelectedCategory(null)
            }}
            className="mt-4 rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground hover:bg-elevated transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {categories.map((category) => {
            const items = filtered.filter((a) => a.category === category)
            if (items.length === 0) return null
            const CategoryIcon = categoryIcons[category] || FiHelpCircle

            return (
              <section key={category} className="flex flex-col gap-3" aria-labelledby={`cat-${category}`}>
                <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                  <CategoryIcon className="h-4 w-4 text-primary shrink-0" aria-hidden />
                  <h2 id={`cat-${category}`} className="text-xs font-bold uppercase tracking-wider text-foreground font-mono">
                    {category}
                  </h2>
                </div>

                <div className="flex flex-col gap-2.5">
                  {items.map((article) => {
                    const isExpanded = expandedId === article.id
                    const answerId = `answer-${article.id}`
                    return (
                      <div
                        key={article.id}
                        className={cn(
                          "rounded-2xl border transition-all duration-150 bg-surface",
                          isExpanded ? "border-primary/50 shadow-md shadow-primary/5" : "border-border hover:border-border-strong",
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : article.id)}
                          aria-expanded={isExpanded}
                          aria-controls={answerId}
                          className="flex w-full items-center justify-between gap-4 p-4 sm:p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl"
                        >
                          <span className="text-sm font-semibold text-foreground leading-snug">
                            {article.question}
                          </span>
                          <FiChevronDown
                            className={cn(
                              "h-4 w-4 shrink-0 text-muted transition-transform duration-200",
                              isExpanded && "rotate-180 text-primary",
                            )}
                            aria-hidden
                          />
                        </button>
                        {isExpanded && (
                          <div id={answerId} className="border-t border-border/80 p-4 sm:p-5 bg-elevated/20 rounded-b-2xl">
                            <p className="text-xs sm:text-sm leading-relaxed text-muted">
                              {article.answer}
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      )}

      {/* Support & Contact Card */}
      <Card className="border-border bg-surface shadow-md">
        <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FiMail className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Still have questions?</p>
              <p className="text-xs text-muted">
                Reach out directly or explore FairWork support services.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <a
                href="mailto:support@fairwork.io"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary-hover transition-colors"
              >
                Contact Support
                <FiMail className="h-3.5 w-3.5" aria-hidden />
              </a>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-elevated transition-colors"
              >
                Sign In for Direct Support
                <FiArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}