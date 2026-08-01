import { FiChevronLeft, FiChevronRight } from "react-icons/fi"
import { cn } from "@/lib/utils"

export interface PaginationProps {
  page: number
  pageCount: number
  onPageChange: (page: number) => void
  /** Max number of numbered buttons to show. Defaults to 5. */
  siblingCount?: number
  className?: string
}

/** Build a page list with ellipsis gaps, e.g. [1, "…", 4, 5, 6, "…", 12]. */
function getPageRange(
  page: number,
  pageCount: number,
  maxButtons: number,
): (number | "ellipsis")[] {
  if (pageCount <= maxButtons) {
    return Array.from({ length: pageCount }, (_, i) => i + 1)
  }

  const pages: (number | "ellipsis")[] = [1]
  const inner = maxButtons - 2
  let start = Math.max(2, page - Math.floor((inner - 1) / 2))
  const end = Math.min(pageCount - 1, start + inner - 1)
  start = Math.max(2, end - inner + 1)

  if (start > 2) pages.push("ellipsis")
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < pageCount - 1) pages.push("ellipsis")

  pages.push(pageCount)
  return pages
}

/** Numbered pagination control with prev/next and ellipsis collapsing. */
export function Pagination({
  page,
  pageCount,
  onPageChange,
  siblingCount = 5,
  className,
}: PaginationProps) {
  if (pageCount <= 1) return null

  const range = getPageRange(page, pageCount, Math.max(5, siblingCount))
  const canPrev = page > 1
  const canNext = page < pageCount

  const navClass =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-border px-2 text-sm font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground disabled:pointer-events-none disabled:opacity-40"

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className={cn("flex items-center gap-1.5", className)}
    >
      <button
        type="button"
        className={navClass}
        onClick={() => canPrev && onPageChange(page - 1)}
        disabled={!canPrev}
        aria-label="Previous page"
      >
        <FiChevronLeft className="h-4 w-4" aria-hidden />
      </button>

      {range.map((item, i) =>
        item === "ellipsis" ? (
          <span
            key={`e-${i}`}
            className="inline-flex h-9 min-w-9 items-center justify-center text-sm text-subtle"
            aria-hidden
          >
            &hellip;
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            aria-current={item === page ? "page" : undefined}
            className={cn(
              "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-sm font-medium tabular-nums transition-colors",
              item === page
                ? "border-primary bg-primary/15 text-info"
                : "border-border text-muted hover:bg-surface-hover hover:text-foreground",
            )}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        className={navClass}
        onClick={() => canNext && onPageChange(page + 1)}
        disabled={!canNext}
        aria-label="Next page"
      >
        <FiChevronRight className="h-4 w-4" aria-hidden />
      </button>
    </nav>
  )
}
