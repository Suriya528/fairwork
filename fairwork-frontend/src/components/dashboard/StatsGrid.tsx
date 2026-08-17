import { FiAlertTriangle, FiCheckCircle, FiClock, FiFolder, FiShield, FiUnlock } from "react-icons/fi"
import { MetricCard } from "@/components/common/MetricCard"
import { ErrorState } from "@/components/feedback/ErrorState"
import { LoadingCards } from "@/components/feedback/LoadingState"
import type { ApiProject } from "@/services/projectsApi"

export function StatsGrid({ projects, loading, error, onRetry, role }: { projects: ApiProject[]; loading: boolean; error: string | null; onRetry: () => void; role: "client" | "freelancer" }) {
  if (loading) return <LoadingCards count={4} />
  if (error) return <ErrorState title="Unable to load project metrics" description={error} onRetry={onRetry} />
  const active = projects.filter((project) => project.status === "in_progress").length
  const completed = projects.filter((project) => project.status === "completed").length
  const funded = projects.filter((project) => project.escrowFunded).length
  const disputed = projects.filter((project) => project.escrowDisputed).length
  const pendingMilestones = projects.reduce((count, project) => count + project.milestones.filter((milestone) => !milestone.paymentReleased).length, 0)
  const releasedMilestones = projects.reduce((count, project) => count + project.milestones.filter((milestone) => milestone.paymentReleased).length, 0)

  return <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-label={`${role} project metrics`}>
    <MetricCard label={role === "client" ? "Your projects" : "Assigned projects"} value={String(projects.length)} icon={FiFolder} to="/projects/mine?filter=all" />
    <MetricCard label="Active projects" value={String(active)} icon={FiClock} to="/projects/mine?filter=in_progress" />
    <MetricCard label="Completed projects" value={String(completed)} icon={FiCheckCircle} to="/projects/mine?filter=completed" />
    <MetricCard label="Funded escrows" value={String(funded)} icon={FiShield} to="/projects/mine?filter=escrow_funded" />
    <MetricCard label="Disputed projects" value={String(disputed)} icon={FiAlertTriangle} to="/disputes?escrow=open" />
    <MetricCard label="Unreleased milestones" value={String(pendingMilestones)} hint="Not yet released on-chain" icon={FiClock} to="/milestones?payment=unreleased" />
    <MetricCard label="Released milestones" value={String(releasedMilestones)} icon={FiUnlock} to="/milestones?payment=released" />
  </section>
}
