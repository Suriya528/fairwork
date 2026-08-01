import { useNavigate } from "react-router-dom"
import { FiClock, FiUser } from "react-icons/fi"
import { Badge } from "@/components/ui/Badge"
import { StatusBadge } from "@/components/common/StatusBadge"
import { Progress } from "@/components/ui/Progress"
import { cn } from "@/lib/utils"
import { formatCurrency, formatDate } from "@/lib/format"
import { getEscrowProgress, getUserName } from "./helpers"
import type { Project } from "@/types"
 
/** List-view project summary row. Used in Browse Projects and My Projects. */
export function ProjectRow({ project }: { project: Project }) {
  const navigate = useNavigate()
  const progress = getEscrowProgress(project)
  const clientName = getUserName(project.clientId)
  const goToProject = () => navigate(`/projects/${project.id}`)
 
  return (
    <article
      className={cn(
        "group flex items-center gap-4 rounded-xl border border-border bg-surface px-5 py-4",
        "cursor-pointer transition-all duration-150",
        "hover:border-border-strong hover:bg-surface-hover",
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
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-info">
          {project.title}
        </span>
        <span className="flex items-center gap-1 text-xs text-subtle">
          <FiUser className="h-3 w-3 shrink-0" />
          {clientName}
        </span>
      </div>
 
      <div className="hidden items-center gap-1.5 md:flex">
        {project.tags.slice(0, 2).map((tag) => (
          <Badge key={tag} tone="neutral">
            {tag}
          </Badge>
        ))}
      </div>
 
      <div className="hidden w-28 lg:block">
        <div className="mb-1 flex justify-between text-xs text-subtle">
          <span>Escrow</span>
          <span>{progress}%</span>
        </div>
        <Progress value={progress} tone={progress >= 100 ? "success" : "primary"} />
      </div>
 
      <div className="shrink-0 text-sm font-semibold text-foreground">
        {formatCurrency(project.budget)}
      </div>
 
      <div className="hidden shrink-0 items-center gap-1 text-xs text-subtle sm:flex">
        <FiClock className="h-3 w-3" />
        {formatDate(project.dueDate)}
      </div>
 
      <StatusBadge status={project.status} />
    </article>
  )
}