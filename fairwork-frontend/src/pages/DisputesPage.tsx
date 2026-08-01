import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { FiAlertTriangle, FiFile, FiFolder, FiPaperclip } from "react-icons/fi"
import { PageHeader } from "@/components/common/PageHeader"
import { MetricCard } from "@/components/common/MetricCard"
import { StatusBadge } from "@/components/common/StatusBadge"
import { Avatar } from "@/components/ui/Avatar"
import { getProjectById, getMilestonesForProject } from "@/data/projects"
import { disputes } from "@/data/transactions"
import { users } from "@/data/users"
import { formatDate } from "@/lib/format"
 
// TODO: replace with the real authenticated user once session/auth
// context exists (only services/authApi.ts is wired up so far).
const CURRENT_USER_ID = "usr_client_01"
 
function getUserName(userId: string): string {
  return users.find((u) => u.id === userId)?.name ?? "Unknown"
}
 
export function DisputesPage() {
  const navigate = useNavigate()
  const currentUser = users.find((u) => u.id === CURRENT_USER_ID)
  const isClient = currentUser?.role === "client"
 
  const myDisputes = useMemo(() => {
    if (!currentUser) return []
    return disputes
      .map((dispute) => {
        const project = getProjectById(dispute.projectId)
        const milestone = project
          ? getMilestonesForProject(project.id).find((m) => m.id === dispute.milestoneId)
          : undefined
        return { dispute, project, milestone }
      })
      .filter(({ project }) => {
        if (!project) return false
        return isClient ? project.clientId === currentUser.id : project.freelancerId === currentUser.id
      })
  }, [currentUser, isClient])
 
  const openCount = myDisputes.filter(
    ({ dispute }) => dispute.status !== "resolved" && dispute.status !== "closed",
  ).length
  const resolvedCount = myDisputes.filter(
    ({ dispute }) => dispute.status === "resolved" || dispute.status === "closed",
  ).length
 
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <PageHeader
          title="Disputes"
          description="Open disagreements on your projects and their evidence trail."
        />
 
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <MetricCard label="Open" value={String(openCount)} icon={FiAlertTriangle} />
          <MetricCard label="Resolved" value={String(resolvedCount)} icon={FiFile} />
        </div>
 
        {myDisputes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
            <FiAlertTriangle className="mb-3 h-6 w-6 text-subtle" />
            <p className="text-sm font-medium text-foreground">No disputes</p>
            <p className="mt-1 max-w-xs text-xs text-muted">
              Nothing here — disputes appear if a project's outcome is contested.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {myDisputes.map(({ dispute, project, milestone }) => (
              <div
                key={dispute.id}
                className="flex flex-col gap-4 rounded-2xl border border-danger/20 bg-surface p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => project && navigate(`/projects/${project.id}`)}
                      className="flex items-center gap-2 text-sm font-semibold text-foreground transition-colors hover:text-info"
                    >
                      <FiFolder className="h-4 w-4 text-subtle" />
                      {project?.title ?? "Unknown project"}
                    </button>
                    {milestone && (
                      <span className="text-xs text-subtle">
                        Milestone: {milestone.title}
                      </span>
                    )}
                  </div>
                  <StatusBadge status={dispute.status} />
                </div>
 
                <div className="rounded-xl bg-elevated p-4">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-subtle">
                    Reason
                  </p>
                  <p className="text-sm leading-relaxed text-muted">{dispute.reason}</p>
                </div>
 
                {dispute.evidence.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-subtle">
                      Evidence ({dispute.evidence.length})
                    </p>
                    {dispute.evidence.map((ev) => (
                      <div
                        key={ev.id}
                        className="flex gap-3 rounded-xl border border-border bg-background/40 p-3"
                      >
                        <Avatar name={getUserName(ev.submittedById)} size="sm" />
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-medium text-foreground">
                              {getUserName(ev.submittedById)}
                            </span>
                            <span className="text-xs text-subtle">
                              {formatDate(ev.submittedAt)}
                            </span>
                          </div>
                          <p className="text-xs leading-relaxed text-muted">{ev.note}</p>
                          {ev.attachments.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-2">
                              {ev.attachments.map((a) => (
                                <a
                                  key={a.id}
                                  href={a.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 rounded-md border border-border bg-elevated px-2 py-1 text-xs text-muted transition-colors hover:text-foreground"
                                >
                                  <FiPaperclip className="h-3 w-3" />
                                  {a.name}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
