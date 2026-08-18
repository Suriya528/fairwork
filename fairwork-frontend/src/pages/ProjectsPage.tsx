import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  FiChevronDown,
  FiFilter,
  FiLayout,
  FiList,
  FiPlus,
} from "react-icons/fi"
import { Button } from "@/components/ui/Button"
import { EmptyState } from "@/components/feedback/EmptyState"
import { LoadingCards } from "@/components/feedback/LoadingState"
import { PageHeader } from "@/components/common/PageHeader"
import { SearchBar } from "@/components/common/SearchBar"
import { ApiProjectCard } from "@/components/projects/ApiProjectCard"
import { ApiProjectRow } from "@/components/projects/ApiProjectRow"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"
import { getProjects, type ApiProject } from "@/services/projectsApi"
import { PROJECT_CATEGORIES } from "@/data/categories"

type ViewMode = "grid" | "list"
type SortKey = "newest" | "oldest" | "budget_high" | "budget_low"

const SORT_OPTIONS: { label: string; value: SortKey }[] = [
  { label: "Newest first", value: "newest" },
  { label: "Oldest first", value: "oldest" },
  { label: "Budget: high to low", value: "budget_high" },
  { label: "Budget: low to high", value: "budget_low" },
]

function SortControl({ sort, onChange }: { sort: SortKey; onChange: (sort: SortKey) => void }) {
  const [open, setOpen] = useState(false)
  const currentSort = SORT_OPTIONS.find((option) => option.value === sort)

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-muted transition hover:border-border-strong hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <FiFilter className="h-3 w-3" />
        {currentSort?.label}
        <FiChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div role="listbox" className="absolute right-0 top-full z-20 mt-1 min-w-[160px] rounded-xl border border-border bg-surface py-1 shadow-xl shadow-black/30">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={sort === option.value}
              onClick={() => {
                onChange(option.value)
                setOpen(false)
              }}
              className={cn(
                "w-full px-3 py-2 text-left text-xs transition-colors",
                sort === option.value
                  ? "text-info font-medium"
                  : "text-muted hover:bg-elevated hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function ProjectsPage() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const [projects, setProjects] = useState<ApiProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [sort, setSort] = useState<SortKey>("newest")
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      return (localStorage.getItem("fairwork_projects_view_mode") as ViewMode) || "grid"
    } catch {
      return "grid"
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem("fairwork_projects_view_mode", viewMode)
    } catch {}
  }, [viewMode])

  useEffect(() => {
    if (!token) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await getProjects(token as string)
        if (!cancelled) setProjects(data)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Couldn't load projects.")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [token])

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase()
    let result = query
      ? projects.filter(
          (project) =>
            project.title.toLowerCase().includes(query) ||
            project.description.toLowerCase().includes(query) ||
            (project.category && project.category.toLowerCase().includes(query)) ||
            (project.customCategory && project.customCategory.toLowerCase().includes(query)),
        )
      : [...projects]

    if (selectedCategory) {
      result = result.filter((project) => project.category === selectedCategory)
    }

    result.sort((a, b) => {
      switch (sort) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case "budget_high":
          return b.budget - a.budget
        case "budget_low":
          return a.budget - b.budget
      }
    })

    return result
  }, [projects, search, selectedCategory, sort])

  const hasFilter = search.trim() !== "" || selectedCategory !== ""

  const clearFilters = () => {
    setSearch("")
    setSelectedCategory("")
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Projects"
        description="Browse open projects classified by discipline and secured by blockchain escrow."
        actions={
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-border bg-surface p-0.5">
              <button
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
                className={cn(
                  "rounded-md p-1.5 transition-colors",
                  viewMode === "grid" ? "bg-elevated text-foreground" : "text-subtle hover:text-muted",
                )}
              >
                <FiLayout className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                aria-label="List view"
                className={cn(
                  "rounded-md p-1.5 transition-colors",
                  viewMode === "list" ? "bg-elevated text-foreground" : "text-subtle hover:text-muted",
                )}
              >
                <FiList className="h-4 w-4" />
              </button>
            </div>
            {user?.role === "client" && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<FiPlus className="h-4 w-4" />}
                onClick={() => navigate("/projects/new")}
              >
                Post project
              </Button>
            )}
          </div>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by title, category, or description…"
          containerClassName="max-w-md flex-1"
        />
        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="Filter by category"
            className="h-9 rounded-lg border border-border bg-surface px-3 text-xs text-muted outline-none transition hover:border-border-strong focus:border-border-strong focus:ring-2 focus:ring-ring"
          >
            <option value="">All Categories</option>
            {PROJECT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <SortControl sort={sort} onChange={setSort} />
        </div>
      </div>

      {!loading && !error && (
        <div className="flex items-center justify-between text-xs text-subtle">
          <span>
            {filteredProjects.length === 0
              ? "No projects"
              : `${filteredProjects.length} project${filteredProjects.length !== 1 ? "s" : ""}`}
          </span>
          {hasFilter && (
            <button onClick={clearFilters} className="text-info transition-colors hover:text-primary">
              Clear filters
            </button>
          )}
        </div>
      )}

      {loading ? (
        <LoadingCards />
      ) : error ? (
        <div role="alert" className="rounded-xl border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
        </div>
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          title={hasFilter ? "No projects match your filter" : "No open projects yet"}
          description={
            hasFilter
              ? "Try adjusting your search or category filter to find more projects."
              : "New projects will appear here when they are posted."
          }
          action={
            hasFilter ? (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : (
              <Button variant="primary" size="sm" onClick={() => navigate("/projects/new")}>
                Post a project
              </Button>
            )
          }
        />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <ApiProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="hidden items-center gap-4 px-5 text-xs font-medium uppercase tracking-wide text-subtle lg:flex">
            <span className="flex-1">Project</span>
            <span className="w-28">Escrow</span>
            <span className="w-24 text-right">Budget</span>
            <span className="w-28">Created</span>
            <span className="w-24 text-right">Status</span>
          </div>
          {filteredProjects.map((project) => (
            <ApiProjectRow key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  )
}
