import { useEffect, useState } from "react"
import { FiShield } from "react-icons/fi"
import { Link } from "react-router-dom"
import { EmptyState } from "@/components/feedback/EmptyState"
import { PageHeader } from "@/components/common/PageHeader"
import { ProjectStatusBadge } from "@/components/common/ProjectStatusBadge"
import { useAuth } from "@/context/AuthContext"
import { Web3WalletCard } from "@/components/wallet/Web3WalletCard"
import { getMyProjects, type ApiProject } from "@/services/projectsApi"

export function EscrowPage() {
  const { user, token } = useAuth()
  const [projects, setProjects] = useState<ApiProject[]>([])
  const [error, setError] = useState("")

  const isClient = user?.role === "client"

  useEffect(() => {
    if (token) getMyProjects(token).then(setProjects).catch((e: Error) => setError(e.message))
  }, [token])

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
        <Web3WalletCard
          title="Escrow Web3 Wallet Verification"
          description={
            isClient
              ? "Your connected wallet must be verified via EIP-712 to fund project escrows on Sepolia."
              : "Your connected wallet must be verified via EIP-712 to receive milestone payment releases."
          }
        />

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
