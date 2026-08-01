import { useMemo, useState } from "react"
import { FiChevronDown, FiHelpCircle, FiMail } from "react-icons/fi"
import { PageHeader } from "@/components/common/PageHeader"
import { SearchBar } from "@/components/common/SearchBar"
import { Card, CardContent } from "@/components/ui/Card"
import { cn } from "@/lib/utils"
import { getHelpCategories, helpArticles } from "@/data/help"

export function HelpCenterPage() {
  const [search, setSearch] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const categories = getHelpCategories()

  const filtered = useMemo(() => {
    if (!search.trim()) return helpArticles
    const q = search.toLowerCase()
    return helpArticles.filter(
      (a) => a.question.toLowerCase().includes(q) || a.answer.toLowerCase().includes(q),
    )
  }, [search])

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <PageHeader
          title="Help Center"
          description="Answers to common questions about escrow, contracts, and disputes."
        />

        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search for an answer…"
          containerClassName="max-w-md"
        />

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
            <FiHelpCircle className="mb-3 h-6 w-6 text-subtle" />
            <p className="text-sm font-medium text-foreground">No results for "{search}"</p>
            <p className="mt-1 max-w-xs text-xs text-muted">
              Try a different search term, or reach out below.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {categories.map((category) => {
              const items = filtered.filter((a) => a.category === category)
              if (items.length === 0) return null
              return (
                <div key={category} className="flex flex-col gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-subtle">
                    {category}
                  </h3>
                  <div className="flex flex-col gap-2">
                    {items.map((article) => {
                      const isExpanded = expandedId === article.id
                      return (
                        <div
                          key={article.id}
                          className="rounded-xl border border-border bg-surface"
                        >
                          <button
                            type="button"
                            onClick={() => setExpandedId(isExpanded ? null : article.id)}
                            aria-expanded={isExpanded}
                            className="flex w-full items-center justify-between gap-3 p-4 text-left"
                          >
                            <span className="text-sm font-medium text-foreground">
                              {article.question}
                            </span>
                            <FiChevronDown
                              className={cn(
                                "h-4 w-4 shrink-0 text-subtle transition-transform",
                                isExpanded && "rotate-180",
                              )}
                            />
                          </button>
                          {isExpanded && (
                            <div className="border-t border-border p-4">
                              <p className="text-sm leading-relaxed text-muted">
                                {article.answer}
                              </p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
            <FiMail className="h-5 w-5 text-subtle" />
            <p className="text-sm text-foreground">Still need help?</p>
            <p className="text-xs text-muted">support@fairwork.io</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}