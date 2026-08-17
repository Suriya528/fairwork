import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { FiPlus } from "react-icons/fi"
import { Breadcrumb } from "@/components/common/Breadcrumb"
import { PageHeader } from "@/components/common/PageHeader"
import { Button } from "@/components/ui/Button"
import { ActiveContracts } from "@/components/dashboard/ActiveContracts"
import { ProfileSummary } from "@/components/dashboard/ProfileSummary"
import { QuickActions } from "@/components/dashboard/QuickActions"
import { RecentActivity } from "@/components/dashboard/RecentActivity"
import { RecentProjects } from "@/components/dashboard/RecentProjects"
import { StatsGrid } from "@/components/dashboard/StatsGrid"
import { useAuth } from "@/context/AuthContext"
import { getMyProjects, type ApiProject } from "@/services/projectsApi"
import { getGreeting } from "@/data/dashboard"

export function DashboardPage() {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const role = user?.role === "freelancer" ? "freelancer" : "client"
  const [projects, setProjects] = useState<ApiProject[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [projectError, setProjectError] = useState<string | null>(null)

  const loadProjects = useCallback(async () => {
    if (!token) return
    setLoadingProjects(true)
    setProjectError(null)
    try { setProjects(await getMyProjects(token)) }
    catch (error) { setProjectError(error instanceof Error ? error.message : "Unable to load projects.") }
    finally { setLoadingProjects(false) }
  }, [token])

  useEffect(() => { void loadProjects() }, [loadProjects])
  const isClient = role === "client"

  return <div className="flex flex-col gap-8 animate-fade-in">
    <div className="flex flex-col gap-4"><Breadcrumb items={[{ label: "Home", to: "/dashboard" }, { label: "Dashboard" }]} /><PageHeader title={`${getGreeting()}, ${user?.name.split(" ")[0] ?? ""}`} description={isClient ? "Monitor projects you created, their escrow state, and recent activity." : "Monitor projects assigned to you, milestone releases, and recent activity."} actions={isClient ? <Button leftIcon={<FiPlus />} onClick={() => navigate("/projects/new")}>Create project</Button> : undefined} /></div>
    <StatsGrid projects={projects} loading={loadingProjects} error={projectError} onRetry={() => void loadProjects()} role={role} />
    <QuickActions role={role} />
    <div className="grid gap-8 xl:grid-cols-3"><div className="flex flex-col gap-8 xl:col-span-2"><div className="border-t border-border" /> <RecentProjects projects={projects} loading={loadingProjects} error={projectError} role={role} />{!projectError && <ActiveContracts projects={projects} role={role} />}</div><div className="flex flex-col gap-8"><ProfileSummary /><RecentActivity /></div></div>
  </div>
}
