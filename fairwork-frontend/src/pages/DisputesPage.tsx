import { useState } from "react"
import { FiAlertTriangle, FiFile } from "react-icons/fi"
import { Link, useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/Button"
import { Textarea } from "@/components/ui/Textarea"
import { EmptyState } from "@/components/feedback/EmptyState"
import { MetricCard } from "@/components/common/MetricCard"
import { PageHeader } from "@/components/common/PageHeader"
import { useAuth } from "@/context/AuthContext"
import { useDisputeSummary } from "@/context/DisputeSummaryContext"
import { raiseDispute } from "@/services/disputesApi"

export function DisputesPage() {
  const { token } = useAuth()
  const [searchParams] = useSearchParams()
  const { projects, disputes, openDisputeCount, error, refresh } = useDisputeSummary()
  const [reason, setReason] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState("")
  const listed = searchParams.get("escrow") === "open"
    ? projects.filter((project) => project.escrowDisputed)
    : projects.filter((project) => project.status === "disputed")

  const raise = async (projectId: string) => {
    if (!token || !reason[projectId]?.trim()) return

    setSubmitError("")
    try {
      await raiseDispute(projectId, reason[projectId], token)
      setReason((value) => ({ ...value, [projectId]: "" }))
      await refresh()
    } catch (cause) {
      setSubmitError(cause instanceof Error ? cause.message : "Unable to raise dispute.")
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <PageHeader title="Disputes" description="Raise and review disputes on your projects." />
        <div className="grid gap-4 sm:grid-cols-2">
          <MetricCard label="Open" value={String(openDisputeCount)} icon={FiAlertTriangle} />
          <MetricCard label="Resolved" value={String(disputes.filter((dispute) => dispute.status === "resolved").length)} icon={FiFile} />
        </div>

        {(error || submitError) && <p className="text-sm text-danger">{submitError || error}</p>}

        <div className="flex flex-col gap-4">
          {listed.map((project) => {
            const dispute = disputes.find((item) => item.projectId === project.id)
            return (
              <div key={project.id} className="rounded-xl border border-border bg-surface p-5">
                <Link to={`/projects/${project.id}`} className="font-semibold hover:text-info">{project.title}</Link>
                {dispute ? (
                  <div className="mt-3 space-y-3">
                    <p className="text-sm text-muted">{dispute.reason}</p>
                    <p className="text-xs text-subtle">
                      {dispute.status === "resolved" ? "Resolved" : "Pending"} · Client votes: {dispute.clientVotes} · Freelancer votes: {dispute.freelancerVotes}
                    </p>
                    {dispute.evidence.map((evidence) => <p key={evidence} className="rounded bg-elevated p-2 text-xs text-muted">{evidence}</p>)}
                    <p className="text-xs text-muted">Voting and resolution are intentionally unavailable pending access-control and escrow-resolution decisions.</p>
                  </div>
                ) : <p className="mt-2 text-sm text-muted">Loading dispute details…</p>}
              </div>
            )
          })}
        </div>

        {projects.filter((project) => project.status !== "disputed").map((project) => (
          <div key={project.id} className="rounded-xl border border-border p-4">
            <p className="font-medium">{project.title}</p>
            <Textarea className="mt-3" value={reason[project.id] ?? ""} onChange={(event) => setReason((value) => ({ ...value, [project.id]: event.target.value }))} placeholder="Explain the dispute" />
            <Button className="mt-3" size="sm" disabled={!reason[project.id]?.trim()} onClick={() => raise(project.id)}>Raise dispute</Button>
          </div>
        ))}

        {!projects.length && <EmptyState icon={FiAlertTriangle} title="No projects" description="Disputes can be raised from your projects." />}
      </div>
    </div>
  )
}
