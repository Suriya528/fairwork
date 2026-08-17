import { FiShield } from "react-icons/fi"
import { Card, CardBody } from "@/components/ui/Card"
import { Progress } from "@/components/ui/Progress"
import { EmptyState } from "@/components/feedback/EmptyState"
import { ProjectStatusBadge } from "@/components/common/ProjectStatusBadge"
import { Badge, type BadgeTone } from "@/components/ui/Badge"
import { SectionHeading } from "./SectionHeading"
import type { ApiProject } from "@/services/projectsApi"

const escrowTone = (project: ApiProject): BadgeTone => {
  if (project.escrowDisputed) return "danger"
  if (project.escrowCompleted) return "success"
  if (project.escrowFunded) return "info"
  return "neutral"
}

const escrowLabel = (project: ApiProject): string => {
  if (project.escrowDisputed) return "Escrow disputed"
  if (project.escrowCompleted) return "Escrow completed"
  if (project.escrowFunded) return "Escrow funded"
  return "Escrow not funded"
}

export function ActiveContracts({ projects, role }: { projects: ApiProject[]; role: "client" | "freelancer" }) {
  const active = projects.filter((project) => project.status === "in_progress" || project.status === "disputed")
  return <section className="flex flex-col gap-4"><SectionHeading id="active-contracts-heading" title="Active projects" description={role === "client" ? "Projects currently underway" : "Assigned work currently underway"} actionLabel="View projects" actionTo="/projects/mine" />{active.length ? <div className="grid gap-4 md:grid-cols-2">{active.map((project) => { const released = project.milestones.filter((milestone) => milestone.paymentReleased).length; const progress = project.milestones.length ? released / project.milestones.length * 100 : 0; return <Card key={project.id} interactive><CardBody className="space-y-4 p-5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-semibold">{project.title}</p><p className="truncate text-xs text-subtle">{role === "client" ? project.freelancerName ?? "Freelancer not assigned" : project.clientName ?? "Client unavailable"}</p></div><ProjectStatusBadge status={project.status} /></div><div className="space-y-2"><div className="flex justify-between text-xs text-muted"><span>Released milestones</span><span>{released}/{project.milestones.length}</span></div><Progress className="mt-1.5" value={progress} tone={project.escrowDisputed ? "danger" : "primary"} /></div><Badge tone={escrowTone(project)} dot>{escrowLabel(project)}</Badge></CardBody></Card> })}</div> : <EmptyState icon={FiShield} title="No active projects" description={role === "client" ? "Projects in progress will appear here." : "Projects assigned to you will appear here."} />}</section>
}
