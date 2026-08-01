import { useMemo, useState } from "react"
import {
  FiBriefcase,
  FiCheckCircle,
  FiDollarSign,
  FiFolder,
  FiPlus,
} from "react-icons/fi"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/Button"
import { PageHeader } from "@/components/common/PageHeader"
import { MetricCard } from "@/components/common/MetricCard"
import { Tabs, type TabItem } from "@/components/ui/Tabs"
import { ProjectCard } from "@/components/projects/ProjectCard"
import { getMilestonesForProject, projects } from "@/data/projects"
import { users } from "@/data/users"
import { formatCurrency } from "@/lib/format"
import type { ProjectStatus } from "@/types"
 
// TODO: replace with the real authenticated user once session/auth
// context exists (only services/authApi.ts is wired up so far).
const CURRENT_USER_ID = "usr_client_01"
 
type FilterTab = "active" | "completed" | "all"
 
const ACTIVE_STATUSES: ProjectStatus[] = [
  "draft",
  "funding",
  "active",
  "in_review",
  "disputed",
]
const COMPLETED_STATUSES: ProjectStatus[] = ["completed", "cancelled"]
 
export function MyProjectsPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<FilterTab>("active")
 
  const currentUser = users.find((u) => u.id === CURRENT_USER_ID)
  const isClient = currentUser?.role === "client"
 
  const myProjects = useMemo(() => {
    if (!currentUser) return []
    return projects.filter((p) =>
      isClient ? p.clientId === currentUser.id : p.freelancerId === currentUser.id,
    )
  }, [currentUser, isClient])
 
  const activeProjects = myProjects.filter((p) => ACTIVE_STATUSES.includes(p.status))
  const completedProjects = myProjects.filter((p) => COMPLETED_STATUSES.includes(p.status))
 
  const visibleProjects =
    tab === "active" ? activeProjects : tab === "completed" ? completedProjects : myProjects
 
  // Sum of released milestone amounts across every one of my projects —
  // "earned" for a freelancer, "spent" for a client.
  const totalReleased = useMemo(() => {
    return myProjects.reduce((sum, project) => {
      const milestones = getMilestonesForProject(project.id)
      const released = milestones
        .filter((m) => m.status === "released")
        .reduce((s, m) => s + m.amount, 0)
      return sum + released
    }, 0)
  }, [myProjects])
 
  const tabItems: TabItem[] = [
    { label: "Active", value: "active", count: activeProjects.length },
    { label: "Completed", value: "completed", count: completedProjects.length },
    { label: "All", value: "all", count: myProjects.length },
  ]
 
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <PageHeader
          title="My projects"
          description={
            isClient
              ? "Projects you've posted and their current status."
              : "Projects you're currently working on."
          }
          actions={
            isClient && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<FiPlus className="h-4 w-4" />}
                onClick={() => navigate("/projects/new")}
              >
                Post project
              </Button>
            )
          }
        />
 
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MetricCard label="Active" value={String(activeProjects.length)} icon={FiFolder} />
          <MetricCard
            label="Completed"
            value={String(completedProjects.length)}
            icon={FiCheckCircle}
          />
          <MetricCard
            label={isClient ? "Total spent" : "Total earned"}
            value={formatCurrency(totalReleased)}
            icon={isClient ? FiDollarSign : FiBriefcase}
          />
        </div>
 
        <Tabs items={tabItems} value={tab} onChange={(v) => setTab(v as FilterTab)} />
 
        {visibleProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
            <FiFolder className="mb-3 h-6 w-6 text-subtle" />
            <p className="text-sm font-medium text-foreground">
              {tab === "active" ? "No active projects" : tab === "completed" ? "No completed projects yet" : "No projects yet"}
            </p>
            {isClient && tab !== "completed" && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                leftIcon={<FiPlus className="h-4 w-4" />}
                onClick={() => navigate("/projects/new")}
              >
                Post a project
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}