import { Fragment } from "react"
import { Link } from "react-router-dom"
import { FiChevronRight, FiHome } from "react-icons/fi"
import { cn } from "@/lib/utils"

export interface BreadcrumbItem {
  label: string
  /** Optional route. Omit for the current (last) page. */
  to?: string
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

/**
 * Compact breadcrumb trail. The first crumb renders a home icon and every
 * item except the last is a link. Used at the top of pages inside AppLayout.
 */
export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn("min-w-0", className)}>
      <ol className="flex items-center gap-1.5 text-sm">
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <Fragment key={`${item.label}-${i}`}>
              <li className="flex items-center gap-1.5">
                {i === 0 && (
                  <FiHome className="h-3.5 w-3.5 text-subtle" aria-hidden />
                )}
                {item.to && !isLast ? (
                  <Link
                    to={item.to}
                    className="rounded text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className={cn(
                      "font-medium",
                      isLast ? "text-foreground" : "text-muted",
                    )}
                    aria-current={isLast ? "page" : undefined}
                  >
                    {item.label}
                  </span>
                )}
              </li>
              {!isLast && (
                <li aria-hidden className="flex items-center">
                  <FiChevronRight className="h-3.5 w-3.5 text-subtle" />
                </li>
              )}
            </Fragment>
          )
        })}
      </ol>
    </nav>
  )
}
