import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  FiCheckCircle,
  FiChevronDown,
  FiClock,
  FiFileText,
  FiFolder,
  FiHexagon,
} from "react-icons/fi"
import { PageHeader } from "@/components/common/PageHeader"
import { StatusBadge } from "@/components/common/StatusBadge"
import { WalletAddress } from "@/components/common/WalletAddress"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/format"
import { getProjectById } from "@/data/projects"
import { contracts } from "@/data/contracts"
import { users } from "@/data/users"

// TODO: replace with the real authenticated user once session/auth
// context exists (only services/authApi.ts is wired up so far).
const CURRENT_USER_ID = "usr_client_01"

function SignatureStatus({ signed, name, signedAt }: { signed: boolean; name: string; signedAt: string | null }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {signed ? (
        <FiCheckCircle className="h-3.5 w-3.5 text-success" />
      ) : (
        <FiClock className="h-3.5 w-3.5 text-subtle" />
      )}
      <span className={signed ? "text-muted" : "text-subtle"}>
        {name} {signed && signedAt ? `signed ${formatDate(signedAt)}` : "hasn't signed yet"}
      </span>
    </div>
  )
}

export function ContractsPage() {
  const navigate = useNavigate()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const currentUser = users.find((u) => u.id === CURRENT_USER_ID)
  const isClient = currentUser?.role === "client"

  const myContracts = useMemo(() => {
    if (!currentUser) return []
    return contracts
      .map((contract) => ({ contract, project: getProjectById(contract.projectId) }))
      .filter(({ project }) => {
        if (!project) return false
        return isClient ? project.clientId === currentUser.id : project.freelancerId === currentUser.id
      })
  }, [currentUser, isClient])

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <PageHeader
          title="Contracts"
          description="Every agreement generated for your projects, and its signature status."
        />

        {myContracts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
            <FiFileText className="mb-3 h-6 w-6 text-subtle" />
            <p className="text-sm font-medium text-foreground">No contracts yet</p>
            <p className="mt-1 max-w-xs text-xs text-muted">
              A contract is generated automatically once a project is created.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {myContracts.map(({ contract, project }) => {
              const isExpanded = expandedId === contract.id
              return (
                <div
                  key={contract.id}
                  className="flex flex-col rounded-2xl border border-border bg-surface"
                >
                  <div className="flex flex-col gap-4 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-semibold text-foreground">
                          {contract.title}
                        </span>
                        {project && (
                          <button
                            type="button"
                            onClick={() => navigate(`/projects/${project.id}`)}
                            className="flex items-center gap-1.5 text-xs text-subtle transition-colors hover:text-info"
                          >
                            <FiFolder className="h-3 w-3" />
                            {project.title}
                          </button>
                        )}
                      </div>
                      <StatusBadge status={contract.status} />
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <SignatureStatus
                        signed={contract.clientSigned}
                        name="Client"
                        signedAt={contract.clientSignedAt}
                      />
                      <SignatureStatus
                        signed={contract.freelancerSigned}
                        name="Freelancer"
                        signedAt={contract.freelancerSignedAt}
                      />
                    </div>

                    {contract.blockchainHash && (
                      <div className="flex items-center justify-between rounded-xl bg-elevated px-3 py-2">
                        <span className="flex items-center gap-1.5 text-xs text-subtle">
                          <FiHexagon className="h-3 w-3" />
                          Anchored on-chain
                        </span>
                        <WalletAddress address={contract.blockchainHash} chars={6} />
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : contract.id)}
                      className="flex items-center gap-1.5 self-start text-xs font-medium text-info transition-colors hover:text-primary"
                    >
                      {isExpanded ? "Hide contract text" : "View full contract"}
                      <FiChevronDown
                        className={cn("h-3.5 w-3.5 transition-transform", isExpanded && "rotate-180")}
                      />
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-border p-5">
                      <p className="text-sm leading-relaxed text-muted">{contract.content}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}