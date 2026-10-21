import { useCallback, useEffect, useState } from "react"
import { FiShield } from "react-icons/fi"
import { Link, useNavigate } from "react-router-dom"
import { EmptyState } from "@/components/feedback/EmptyState"
import { PageHeader } from "@/components/common/PageHeader"
import { ProjectStatusBadge } from "@/components/common/ProjectStatusBadge"
import { useAuth } from "@/context/AuthContext"
import { Web3WalletCard } from "@/components/wallet/Web3WalletCard"
import { getMyProjects, type ApiProject } from "@/services/projectsApi"
import { connectChat } from "@/services/chatApi"

export function EscrowPage() {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<ApiProject[]>([])
  const [error, setError] = useState("")

  const isClient = user?.role === "client"

  useEffect(() => {
    if (user?.role === "admin") {
      navigate("/admin/escrows", { replace: true })
    }
  }, [user?.role, navigate])

  const loadProjects = useCallback(async () => {
    if (token) {
      try {
        const data = await getMyProjects(token)
        setProjects(data)
      } catch (e: any) {
        setError(e.message)
      }
    }
  }, [token])

  useEffect(() => {
    void loadProjects()
  }, [loadProjects])

  // Real-time synchronization via WebSockets + tab focus auto-refresh
  useEffect(() => {
    if (!token) return
    const socket = connectChat(token)
    const handleUpdate = () => {
      void loadProjects()
    }
    socket.on("project_updated", handleUpdate)
    socket.on("notification", handleUpdate)

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void loadProjects()
      }
    }
    document.addEventListener("visibilitychange", handleVisibility)

    return () => {
      socket.off("project_updated", handleUpdate)
      socket.off("notification", handleUpdate)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [token, loadProjects])

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <PageHeader
          title={isClient ? "Escrow Funding" : "Escrow Protection"}
          description={
            isClient
              ? "Track project deposit funding status across projects you created."
              : "Track smart contract payment protection backing your assigned projects."
          }
        />

        {/* Visual Escrow Pipeline Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-surface p-4">
            <span className="text-[10px] font-mono font-bold text-subtle uppercase block">Stage 1</span>
            <p className="text-xs font-bold text-foreground mt-1">Non-Custodial Deposit</p>
            <p className="text-[11px] text-muted mt-1 leading-relaxed">
              Funds locked directly in smart contract storage. FairWork never holds your balance.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <span className="text-[10px] font-mono font-bold text-subtle uppercase block">Stage 2</span>
            <p className="text-xs font-bold text-foreground mt-1">Mutual Review Window</p>
            <p className="text-[11px] text-muted mt-1 leading-relaxed">
              Built-in contract timelocks prevent unilateral withdrawals during deliverable review.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase block">Stage 3</span>
            <p className="text-xs font-bold text-foreground mt-1">Instant Direct Release</p>
            <p className="text-[11px] text-muted mt-1 leading-relaxed">
              Client signs approval; funds transfer immediately to creator wallet with $0 platform fee.
            </p>
          </div>
        </div>
        {user?.role !== "admin" && (
          <Web3WalletCard
            title="Escrow Web3 Wallet Verification"
            description={
              isClient
                ? "Your connected wallet must be verified via EIP-712 to fund project escrows on Sepolia."
                : "Your connected wallet must be verified via EIP-712 to receive milestone payment releases."
            }
          />
        )}

        {error && <p className="text-sm text-danger">{error}</p>}
        {projects.length ? (
          <div className="flex flex-col gap-3">
            {projects.map((p) => (
              <Link
                key={p.id}
                to={`/projects/${p.id}`}
                className="flex items-center justify-between rounded-xl border border-border bg-surface p-4 transition-colors hover:border-border-strong hover:bg-surface-hover"
              >
                <div>
                  <p className="font-medium text-foreground">{p.title}</p>
                  <p className="text-xs text-muted">
                    {p.escrowFunded
                      ? isClient
                        ? "Escrow deposit funded"
                        : "Payment protected by escrow"
                      : isClient
                        ? "Escrow unfunded — ready to deposit"
                        : "Awaiting client escrow deposit"}
                  </p>
                </div>
                <ProjectStatusBadge status={p.status} />
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FiShield}
            title="No projects"
            description={
              isClient
                ? "Your created project escrow statuses will appear here."
                : "Escrow payment protections for assigned projects will appear here."
            }
          />
        )}
        <p className="text-xs text-muted">
          Escrow deposits and payment releases are enforced directly by Smart Contract Escrow logic.
        </p>
      </div>
    </div>
  )
}
