import { Link } from "react-router-dom"
import { FiShield } from "react-icons/fi"
import { Card, CardBody } from "@/components/ui/Card"
import { Progress } from "@/components/ui/Progress"
import { StatusBadge } from "@/components/common/StatusBadge"
import { Skeleton } from "@/components/ui/Skeleton"
import { EmptyState } from "@/components/feedback/EmptyState"
import { SectionHeading } from "./SectionHeading"
import { projects, getMilestonesForProject } from "@/data/projects"
import { getUserById } from "@/data/users"
import { formatCrypto, toPercent } from "@/lib/format"

export interface ActiveContractsProps {
  loading?: boolean
}

const ACTIVE_STATUSES = new Set(["active", "funding", "in_review", "disputed"])

/** Cards for in-flight contracts: progress, escrow, and next milestone. */
export function ActiveContracts({ loading = false }: ActiveContractsProps) {
  const active = projects.filter((p) => ACTIVE_STATUSES.has(p.status))

  return (
    <section aria-labelledby="active-contracts-heading" className="flex flex-col gap-4">
      <SectionHeading
        id="active-contracts-heading"
        title="Active contracts"
        description="Escrow-funded work in progress"
        actionLabel="View escrow"
        actionTo="/escrow"
      />

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardBody className="flex flex-col gap-4">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-full" />
              </CardBody>
            </Card>
          ))}
        </div>
      ) : active.length === 0 ? (
        <EmptyState
          icon={FiShield}
          title="No active contracts"
          description="Once a project is funded and underway it will appear here."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {active.map((project) => {
            const milestones = getMilestonesForProject(project.id)
            const released = milestones.filter(
              (m) => m.status === "released",
            ).length
            const progress = toPercent(released, milestones.length)
            const nextMilestone = milestones.find(
              (m) => m.status !== "released",
            )
            const freelancer = project.freelancerId
              ? getUserById(project.freelancerId)
              : undefined

            return (
              <Card key={project.id} interactive className="group">
                <Link
                  to={`/projects?p=${project.id}`}
                  className="block rounded-2xl p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">
                        {project.title}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-subtle">
                        {freelancer ? freelancer.name : "Unassigned"}
                      </p>
                    </div>
                    <StatusBadge status={project.status} />
                  </div>

                  <div className="mt-4 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted">Progress</span>
                      <span className="tabular-nums text-muted">
                        {released}/{milestones.length} milestones
                      </span>
                    </div>
                    <Progress
                      value={progress}
                      tone={project.status === "disputed" ? "danger" : "primary"}
                    />
                  </div>

                  <div className="mt-4 flex items-end justify-between border-t border-border pt-4">
                    <div>
                      <p className="text-xs text-subtle">In escrow</p>
                      <p className="mt-0.5 font-semibold tabular-nums text-foreground">
                        {formatCrypto(project.escrowAmount, project.escrowSymbol)}
                      </p>
                    </div>
                    <div className="max-w-[55%] text-right">
                      <p className="text-xs text-subtle">Next milestone</p>
                      <p className="mt-0.5 truncate text-xs font-medium text-foreground">
                        {nextMilestone ? nextMilestone.title : "All complete"}
                      </p>
                    </div>
                  </div>
                </Link>
              </Card>
            )
          })}
        </div>
      )}
    </section>
  )
}
