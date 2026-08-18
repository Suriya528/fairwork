import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { FiCheckCircle, FiClock, FiFileText, FiXCircle } from "react-icons/fi"
import { PageHeader } from "@/components/common/PageHeader"
import { Card, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { EmptyState } from "@/components/feedback/EmptyState"
import { getMyApplications, withdrawApplication, type ApiApplication } from "@/services/applicationsApi"
import { useAuth } from "@/context/AuthContext"
import { formatCurrency, formatDate } from "@/lib/format"

export function MyApplicationsPage() {
  const { token } = useAuth()
  const [applications, setApplications] = useState<ApiApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = async () => {
    if (!token) return
    setLoading(true)
    try {
      const data = await getMyApplications(token)
      setApplications(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load applications.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [token])

  const handleWithdraw = async (id: string) => {
    if (!token) return
    setBusyId(id)
    try {
      await withdrawApplication(id, token)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to withdraw application.")
    } finally {
      setBusyId(null)
    }
  }

  const getStatusBadge = (status: ApiApplication["status"]) => {
    switch (status) {
      case "accepted":
        return <Badge tone="success">Accepted ✓</Badge>
      case "rejected":
        return <Badge tone="danger">Rejected</Badge>
      case "withdrawn":
        return <Badge tone="neutral">Withdrawn</Badge>
      default:
        return <Badge tone="warning">Pending Review</Badge>
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <PageHeader
          title="My Applications"
          description="Track status and terms for proposals you've submitted to clients."
        />

        {error && <p className="text-sm text-danger">{error}</p>}

        {loading ? (
          <div className="py-12 text-center text-xs text-muted">Loading applications...</div>
        ) : applications.length === 0 ? (
          <EmptyState
            icon={FiFileText}
            title="No applications submitted yet"
            description="Explore open marketplace projects to find opportunities and submit proposals."
            action={
              <Link
                to="/projects"
                className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-xs font-medium text-primary-foreground hover:bg-primary-hover transition-colors"
              >
                Browse Marketplace
              </Link>
            }
          />
        ) : (
          <div className="flex flex-col gap-4">
            {applications.map((app) => (
              <Card key={app.id}>
                <CardContent className="flex flex-col gap-4 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Link
                        to={`/projects/${app.projectId}`}
                        className="text-base font-semibold text-foreground hover:text-primary transition-colors"
                      >
                        {app.project?.title || "Project Application"}
                      </Link>
                      <p className="mt-1 text-xs text-muted">
                        Submitted {formatDate(app.createdAt)} · Client: {app.project?.clientId?.firstName || " Hirer"}{" "}
                        {app.project?.clientId?.lastName || ""}
                      </p>
                    </div>
                    {getStatusBadge(app.status)}
                  </div>

                  <p className="rounded-xl border border-border bg-base p-4 text-xs leading-relaxed text-muted whitespace-pre-wrap">
                    {app.proposalText}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted pt-2 border-t border-border">
                    <div className="flex items-center gap-4">
                      <span>
                        Proposed: <strong className="text-foreground font-semibold">{formatCurrency(app.proposedAmount)}</strong>
                      </span>
                      <span>
                        Est. Delivery: <strong className="text-foreground font-semibold">{app.estimatedDelivery}</strong>
                      </span>
                    </div>

                    {app.status === "pending" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        loading={busyId === app.id}
                        onClick={() => handleWithdraw(app.id)}
                      >
                        Withdraw proposal
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
