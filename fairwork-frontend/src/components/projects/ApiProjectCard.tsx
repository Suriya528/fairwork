import { useNavigate } from "react-router-dom"
import { FiClock, FiLock, FiUser, FiArrowRight } from "react-icons/fi"
import { ProjectStatusBadge } from "@/components/common/ProjectStatusBadge"
import { Badge } from "@/components/ui/Badge"
import { useCurrency } from "@/context/CurrencyContext"
import { formatDeadlineCountdown } from "@/lib/format"
import { cn } from "@/lib/utils"
import { getDisplayCategory, type ApiProject } from "@/services/projectsApi"

/** Grid summary card with production hover lift, border glow, and interactive micro-animations. */
export function ApiProjectCard({ project }: { project: ApiProject }) {
  const navigate = useNavigate()
  const { formatAmount } = useCurrency()
  const goToProject = () => navigate(`/projects/${project.id}`)

  return (
    <article
      className={cn(
        "group flex min-h-[250px] cursor-pointer flex-col rounded-2xl border border-border bg-surface p-5",
        "transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 hover:bg-surface-hover active:scale-[0.99]",
      )}
      tabIndex={0}
      role="link"
      aria-label={`View project: ${project.title}`}
      onClick={goToProject}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          goToProject()
        }
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-bold text-foreground transition-colors duration-200 group-hover:text-primary">
            {project.title}
          </h2>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-subtle">
            <FiUser className="h-3 w-3 shrink-0 group-hover:text-primary transition-colors" />
            <span className="truncate">{project.clientName ?? "Unknown"}</span>
          </div>
        </div>
        <ProjectStatusBadge status={project.status} />
      </div>

      <p className="mt-4 line-clamp-3 text-xs leading-relaxed text-muted group-hover:text-foreground/90 transition-colors">
        {project.description}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge tone="neutral" className="group-hover:border-primary/30 transition-colors">
          {getDisplayCategory(project)}
        </Badge>
        <Badge tone={project.escrowTxnHash ? "success" : "neutral"}>
          <FiLock className="h-3 w-3" />
          {project.escrowTxnHash ? "Escrow funded" : "Not yet funded"}
        </Badge>
        <Badge tone="neutral">
          {project.milestones.length} milestone{project.milestones.length !== 1 ? "s" : ""}
        </Badge>
        {project.deadlineAt && (
          <Badge tone={formatDeadlineCountdown(project.deadlineAt).isUrgent ? "warning" : "neutral"}>
            <FiClock className="h-3 w-3" />
            {formatDeadlineCountdown(project.deadlineAt).text}
          </Badge>
        )}
      </div>

      <div className="mt-auto pt-4 flex items-center justify-between border-t border-border/50 text-xs">
        <div>
          <span className="text-[11px] uppercase tracking-wider text-subtle block">Budget</span>
          <span className="font-bold text-foreground font-mono group-hover:text-primary transition-colors">
            {formatAmount(project.budget)}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-1 group-hover:translate-x-0">
          <span>View Details</span>
          <FiArrowRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </article>
  )
}
