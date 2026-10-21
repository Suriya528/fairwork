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
import { connectChat } from "@/services/chatApi"

export function DashboardPage() {
  const { user, token } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user?.role === "admin") {
      navigate("/admin", { replace: true })
    }
  }, [user?.role, navigate])

  const role = user?.role === "freelancer" ? "freelancer" : "client"
  const [projects, setProjects] = useState<ApiProject[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [projectError, setProjectError] = useState<string | null>(null)

  const loadProjects = useCallback(async (silent = false) => {
    if (!token) return
    if (!silent) setLoadingProjects(true)
    setProjectError(null)
    try {
      setProjects(await getMyProjects(token))
    } catch (error) {
      if (!silent) setProjectError(error instanceof Error ? error.message : "Unable to load projects.")
    } finally {
      if (!silent) setLoadingProjects(false)
    }
  }, [token])

  useEffect(() => {
    void loadProjects()
  }, [loadProjects])

  // Real-time synchronization via WebSockets + active tab focus auto-refresh
  useEffect(() => {
    if (!token) return
    const socket = connectChat(token)
    const handleUpdate = () => {
      void loadProjects(true)
    }
    socket.on("project_updated", handleUpdate)
    socket.on("notification", handleUpdate)

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void loadProjects(true)
      }
    }
    document.addEventListener("visibilitychange", handleVisibility)

    return () => {
      socket.off("project_updated", handleUpdate)
      socket.off("notification", handleUpdate)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [token, loadProjects])
  const isClient = role === "client"

  return <div className="flex flex-col gap-8 animate-fade-in">
    <div className="flex flex-col gap-4"><Breadcrumb items={[{ label: "Home", to: "/dashboard" }, { label: "Dashboard" }]} /><PageHeader title={`${getGreeting()}, ${user?.name.split(" ")[0] ?? ""}`} description={isClient ? "Monitor projects you created, their escrow state, and recent activity." : "Monitor projects assigned to you, milestone releases, and recent activity."} actions={isClient ? <Button leftIcon={<FiPlus />} onClick={() => navigate("/projects/new")}>Create project</Button> : undefined} /></div>
    <StatsGrid projects={projects} loading={loadingProjects} error={projectError} onRetry={() => void loadProjects()} role={role} />
    <QuickActions role={role} />
    <div className="grid gap-8 xl:grid-cols-3"><div className="flex flex-col gap-8 xl:col-span-2"><div className="border-t border-border" /> <RecentProjects projects={projects} loading={loadingProjects} error={projectError} role={role} />{!projectError && <ActiveContracts projects={projects} role={role} />}</div><div className="flex flex-col gap-8"><ProfileSummary /><RecentActivity /></div></div>
  </div>
}
