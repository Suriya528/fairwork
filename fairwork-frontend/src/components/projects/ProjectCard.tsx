import { useNavigate } from "react-router-dom"
import { FiCalendar, FiDollarSign, FiLock, FiTag, FiUser } from "react-icons/fi"
import { StatusBadge } from "@/components/common/StatusBadge"
import { Progress } from "@/components/ui/Progress"
import { cn } from "@/lib/utils"
import { formatCurrency, formatDate } from "@/lib/format"
import { getEscrowProgress, getUserName } from "./helpers"
import type { Project } from "@/types"
 
/** Grid-view project summary card. Used in Browse Projects and My Projects. */
export function ProjectCard({ project }: { project: Project }) {
  const navigate = useNavigate()
  const progress = getEscrowProgress(project)
  const clientName = getUserName(project.clientId)
  const goToProject = () => navigate(`/projects/${project.id}`)
 
  return (
    <article
      className={cn(
        "group relative flex flex-col rounded-2xl border border-border bg-surface p-5",
        "cursor-pointer transition-all duration-200",
        "hover:border-border-strong hover:bg-surface-hover hover:shadow-lg hover:shadow-black/20",
      )}
      tabIndex={0}
      role="link"
      aria-label={`View project: ${project.title}`}
      onClick={goToProject}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          goToProject()
        }
      }}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-info">
            {project.title}
          </h3>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-subtle">
            <FiUser className="h-3 w-3 shrink-0" />
            <span className="truncate">{clientName}</span>
          </div>
        </div>
        <StatusBadge status={project.status} />
      </div>
 
      <p className="mb-4 line-clamp-2 text-xs leading-relaxed text-muted">
        {project.description}
      </p>
 
      {project.tags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {project.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-elevated px-2 py-0.5 text-xs text-muted"
            >
              <FiTag className="h-2.5 w-2.5" />
              {tag}
            </span>
          ))}
          {project.tags.length > 3 && (
            <span className="rounded-full border border-border bg-elevated px-2 py-0.5 text-xs text-subtle">
              +{project.tags.length - 3}
            </span>
          )}
        </div>
      )}
 
      <div className="mb-4">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-subtle">
            <FiLock className="h-3 w-3" />
            Escrow funded
          </span>
          <span className="font-medium text-muted">{progress}%</span>
        </div>
        <Progress value={progress} tone={progress >= 100 ? "success" : "primary"} />
      </div>
 
      <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-1 text-sm font-semibold text-foreground">
          {formatCurrency(project.budget)}
        </div>
        <div className="flex items-center gap-1 text-xs text-subtle">
          <FiCalendar className="h-3 w-3" />
          {formatDate(project.dueDate)}
        </div>
      </div>
    </article>
  )
}