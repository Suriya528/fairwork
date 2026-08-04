import { useEffect, useMemo, useState } from "react"
import { FiBriefcase, FiCheckCircle, FiDollarSign, FiFolder, FiPlus } from "react-icons/fi"
import { useNavigate } from "react-router-dom"
import { ApiProjectCard } from "@/components/projects/ApiProjectCard"
import { EmptyState } from "@/components/feedback/EmptyState"
import { MetricCard } from "@/components/common/MetricCard"
import { PageHeader } from "@/components/common/PageHeader"
import { Tabs, type TabItem } from "@/components/ui/Tabs"
import { Button } from "@/components/ui/Button"
import { useAuth } from "@/context/AuthContext"
import { getMyProjects, type ApiProject } from "@/services/projectsApi"
import { formatCurrency } from "@/lib/format"
type Tab = "active" | "completed" | "all"
export function MyProjectsPage() { const { user, token } = useAuth(); const navigate = useNavigate(); const [projects, setProjects] = useState<ApiProject[]>([]); const [tab, setTab] = useState<Tab>("active"); const [error, setError] = useState("")
  useEffect(() => { if (!token) return; getMyProjects(token).then(setProjects).catch((e: Error) => setError(e.message)) }, [token])
  const active = useMemo(() => projects.filter((p) => p.status === "open" || p.status === "in_progress" || p.status === "disputed"), [projects]); const complete = projects.filter((p) => p.status === "completed"); const visible = tab === "active" ? active : tab === "completed" ? complete : projects; const total = projects.flatMap((p) => p.milestones).filter((m) => m.status === "completed").reduce((sum, m) => sum + m.amount, 0); const isClient = user?.role === "client"; const tabs: TabItem[] = [{ label: "Active", value: "active", count: active.length }, { label: "Completed", value: "completed", count: complete.length }, { label: "All", value: "all", count: projects.length }]
  return <div className="p-4 sm:p-6 lg:p-8"><div className="mx-auto flex max-w-6xl flex-col gap-6"><PageHeader title="My projects" description={isClient ? "Projects you've posted and their current status." : "Projects you're currently working on."} actions={isClient ? <Button size="sm" leftIcon={<FiPlus />} onClick={() => navigate("/projects/new")}>Post project</Button> : undefined}/><div className="grid gap-4 sm:grid-cols-3"><MetricCard label="Active" value={String(active.length)} icon={FiFolder}/><MetricCard label="Completed" value={String(complete.length)} icon={FiCheckCircle}/><MetricCard label={isClient ? "Total spent" : "Total earned"} value={formatCurrency(total)} icon={isClient ? FiDollarSign : FiBriefcase}/></div><Tabs items={tabs} value={tab} onChange={(v) => setTab(v as Tab)}/>{error ? <p className="text-sm text-danger">{error}</p> : visible.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{visible.map((p) => <ApiProjectCard key={p.id} project={p}/>)}</div> : <EmptyState icon={FiFolder} title="No projects" description="Projects matching this filter will appear here."/>}</div></div> }
