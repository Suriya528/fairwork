import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  FiArrowDownLeft,
  FiArrowUpRight,
  FiFolder,
  FiPercent,
  FiRepeat,
  FiShieldOff,
} from "react-icons/fi"
import type { ComponentType, SVGProps } from "react"
import { PageHeader } from "@/components/common/PageHeader"
import { StatusBadge } from "@/components/common/StatusBadge"
import { WalletAddress } from "@/components/common/WalletAddress"
import { Tabs, type TabItem } from "@/components/ui/Tabs"
import { getProjectById, projects } from "@/data/projects"
import { transactions } from "@/data/transactions"
import { users } from "@/data/users"
import { formatCrypto, formatDate } from "@/lib/format"
import type { TransactionType } from "@/types"

type IconType = ComponentType<SVGProps<SVGSVGElement>>
type FilterTab = "all" | "deposit" | "release" | "withdrawal" | "other"

// TODO: replace with the real authenticated user once session/auth
// context exists (only services/authApi.ts is wired up so far).
const CURRENT_USER_ID = "usr_client_01"

const TYPE_META: Record<TransactionType, { icon: IconType; label: string }> = {
  deposit: { icon: FiArrowDownLeft, label: "Deposit" },
  release: { icon: FiArrowUpRight, label: "Release" },
  withdrawal: { icon: FiArrowUpRight, label: "Withdrawal" },
  refund: { icon: FiRepeat, label: "Refund" },
  dispute_hold: { icon: FiShieldOff, label: "Dispute hold" },
  fee: { icon: FiPercent, label: "Protocol fee" },
}

export function TransactionsPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<FilterTab>("all")

  const currentUser = users.find((u) => u.id === CURRENT_USER_ID)
  const isClient = currentUser?.role === "client"

  const myTransactions = useMemo(() => {
    if (!currentUser) return []
    const myProjectIds = new Set(
      projects
        .filter((p) => (isClient ? p.clientId === currentUser.id : p.freelancerId === currentUser.id))
        .map((p) => p.id),
    )
    return transactions
      .filter((t) => myProjectIds.has(t.projectId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [currentUser, isClient])

  const visible = useMemo(() => {
    if (tab === "all") return myTransactions
    if (tab === "other") {
      return myTransactions.filter((t) => !["deposit", "release", "withdrawal"].includes(t.type))
    }
    return myTransactions.filter((t) => t.type === tab)
  }, [tab, myTransactions])

  const tabItems: TabItem[] = [
    { label: "All", value: "all", count: myTransactions.length },
    { label: "Deposits", value: "deposit", count: myTransactions.filter((t) => t.type === "deposit").length },
    { label: "Releases", value: "release", count: myTransactions.filter((t) => t.type === "release").length },
    {
      label: "Withdrawals",
      value: "withdrawal",
      count: myTransactions.filter((t) => t.type === "withdrawal").length,
    },
    {
      label: "Other",
      value: "other",
      count: myTransactions.filter((t) => !["deposit", "release", "withdrawal"].includes(t.type)).length,
    },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <PageHeader
          title="Transactions"
          description="Every deposit, release, and withdrawal across your projects."
        />

        <Tabs items={tabItems} value={tab} onChange={(v) => setTab(v as FilterTab)} />

        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
            <FiRepeat className="mb-3 h-6 w-6 text-subtle" />
            <p className="text-sm font-medium text-foreground">No transactions here</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {visible.map((t) => {
              const meta = TYPE_META[t.type]
              const project = getProjectById(t.projectId)
              return (
                <div
                  key={t.id}
                  className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-elevated text-muted">
                      <meta.icon className="h-4 w-4" />
                    </span>
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{meta.label}</span>
                        <StatusBadge status={t.status} />
                      </div>
                      {project && (
                        <button
                          type="button"
                          onClick={() => navigate(`/projects/${project.id}`)}
                          className="flex items-center gap-1 text-xs text-subtle transition-colors hover:text-info"
                        >
                          <FiFolder className="h-3 w-3" />
                          {project.title}
                        </button>
                      )}
                      <span className="text-xs text-subtle">{formatDate(t.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-1.5 sm:items-end">
                    <span className="text-sm font-semibold text-foreground">
                      {formatCrypto(t.amount, t.symbol)}
                    </span>
                    <WalletAddress address={t.hash} chars={6} />
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