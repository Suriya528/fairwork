import { Link } from "react-router-dom"
import { FiArrowRight } from "react-icons/fi"

export interface SectionHeadingProps {
  id?: string
  title: string
  description?: string
  actionLabel?: string
  actionTo?: string
}

/**
 * Consistent heading row for dashboard panels: a title/description on the
 * left and an optional "view all" link on the right.
 */
export function SectionHeading({
  id,
  title,
  description,
  actionLabel,
  actionTo,
}: SectionHeadingProps) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="flex flex-col gap-0.5">
        <h2
          id={id}
          className="text-base font-semibold tracking-tight text-foreground"
        >
          {title}
        </h2>
        {description && <p className="text-sm text-muted">{description}</p>}
      </div>
      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="inline-flex shrink-0 items-center gap-1 rounded text-sm font-medium text-primary transition-colors hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {actionLabel}
          <FiArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      )}
    </div>
  )
}
