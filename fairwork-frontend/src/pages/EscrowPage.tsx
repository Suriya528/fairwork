import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { FiFolder, FiLock, FiShield, FiUnlock } from "react-icons/fi"
import { PageHeader } from "@/components/common/PageHeader"
import { MetricCard } from "@/components/common/MetricCard"
import { WalletAddress } from "@/components/common/WalletAddress"
import { Progress } from "@/components/ui/Progress"
import { StatusBadge } from "@/components/common/StatusBadge"
import { getProjectById } from "@/data/projects"
import { escrowAccounts } from "@/data/transactions"
import { users } from "@/data/users"
import { formatCrypto, formatCurrency, toPercent, toUsd } from "@/lib/format"

// TODO: replace with the real authenticated user once session/auth
// context exists (only services/authApi.ts is wired up so far).
const CURRENT_USER_ID = "usr_client_01"

export function EscrowPage() {
  const navigate = useNavigate()
  const currentUser = users.find((u) => u.id === CURRENT_USER_ID)
  const isClient = currentUser?.role === "client"

  const myAccounts = useMemo(() => {
    if (!currentUser) return []
    return escrowAccounts
      .map((account) => ({ account, project: getProjectById(account.projectId) }))
      .filter(({ project }) => {
        if (!project) return false
        return isClient ? project.clientId === currentUser.id : project.freelancerId === currentUser.id
      })
  }, [currentUser, isClient])

  const totalLockedUsd = myAccounts.reduce(
    (sum, { account }) => sum + toUsd(account.totalLocked, account.symbol),
    0,
  )
  const totalReleasedUsd = myAccounts.reduce(
    (sum, { account }) => sum + toUsd(account.totalReleased, account.symbol),
    0,
  )
  const totalDepositedUsd = myAccounts.reduce(
    (sum, { account }) => sum + toUsd(account.totalDeposited, account.symbol),
    0,
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <PageHeader
          title="Escrow"
          description="Smart contract balances securing every project you're part of."
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MetricCard
            label="Total deposited"
            value={formatCurrency(totalDepositedUsd)}
            icon={FiShield}
          />
          <MetricCard
            label="Currently locked"
            value={formatCurrency(totalLockedUsd)}
            icon={FiLock}
          />
          <MetricCard
            label="Released to date"
            value={formatCurrency(totalReleasedUsd)}
            icon={FiUnlock}
          />
        </div>

        {myAccounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
            <FiShield className="mb-3 h-6 w-6 text-subtle" />
            <p className="text-sm font-medium text-foreground">No escrow accounts yet</p>
            <p className="mt-1 max-w-xs text-xs text-muted">
              An escrow account is created automatically once a project's budget is funded.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {myAccounts.map(({ account, project }) => {
              if (!project) return null
              const percentReleased = toPercent(account.totalReleased, account.totalDeposited)

              return (
                <div
                  key={account.projectId}
                  className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => navigate(`/projects/${project.id}`)}
                      className="flex items-center gap-2 text-sm font-semibold text-foreground transition-colors hover:text-info"
                    >
                      <FiFolder className="h-4 w-4 text-subtle" />
                      {project.title}
                    </button>
                    <StatusBadge status={project.status} />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-subtle">Deposited</p>
                      <p className="text-sm font-semibold text-foreground">
                        {formatCrypto(account.totalDeposited, account.symbol)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-subtle">Released</p>
                      <p className="text-sm font-semibold text-success">
                        {formatCrypto(account.totalReleased, account.symbol)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-subtle">Locked</p>
                      <p className="text-sm font-semibold text-foreground">
                        {formatCrypto(account.totalLocked, account.symbol)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-xs text-subtle">
                      <span>Released</span>
                      <span>{percentReleased}%</span>
                    </div>
                    <Progress
                      value={percentReleased}
                      tone={percentReleased === 100 ? "success" : "primary"}
                    />
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <span className="text-xs text-subtle">Contract address</span>
                    <WalletAddress address={account.contractAddress} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}