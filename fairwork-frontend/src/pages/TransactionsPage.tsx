import { useEffect, useMemo, useState } from "react"
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
import { useAuth } from "@/context/AuthContext"
import { getMyProjects, type ApiProject } from "@/services/projectsApi"
import { formatCurrency, formatDate } from "@/lib/format"
import type { TransactionType } from "@/types"

type IconType = ComponentType<SVGProps<SVGSVGElement>>
type FilterTab = "all" | "deposit" | "release" | "withdrawal" | "other"

interface RealTransaction {
  id: string
  projectId: string
  projectTitle: string
  type: TransactionType
  amount: number
  status: "confirmed" | "pending" | "failed"
  createdAt: string
  hash: string
}

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
  const { user, token } = useAuth()
  const [tab, setTab] = useState<FilterTab>("all")
  const [projects, setProjects] = useState<ApiProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!token) return
    let cancelled = false
    setLoading(true)
    getMyProjects(token)
      .then((data) => {
        if (!cancelled) setProjects(data)
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  const myTransactions = useMemo<RealTransaction[]>(() => {
    const list: RealTransaction[] = []
    projects.forEach((p) => {
      if (p.escrowFunded) {
        list.push({
          id: `dep-${p.id}`,
          projectId: p.id,
          projectTitle: p.title,
          type: "deposit",
          amount: p.budget,
          status: "confirmed",
          createdAt: p.createdAt,
          hash: p.escrowTxnHash || `0x${p.id.slice(0, 10)}...`,
        })
      }
      p.milestones.forEach((m) => {
        if (m.paymentReleased) {
          list.push({
            id: `rel-${m.id}`,
            projectId: p.id,
            projectTitle: p.title,
            type: "release",
            amount: m.amount,
            status: "confirmed",
            createdAt: p.createdAt,
            hash: p.escrowTxnHash || `0x${m.id.slice(0, 10)}...`,
          })
        }
      })
    })
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [projects])

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

  if (!user) return null

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <PageHeader
          title="Transactions"
          description={
            user?.role === "freelancer"
              ? "Complete history of milestone payment releases, wallet withdrawals, and protocol fees."
              : "Complete history of project escrow deposits, milestone releases, and protocol fees."
          }
        />

        {error && <p className="text-sm text-danger">{error}</p>}

        <Tabs items={tabItems} value={tab} onChange={(v) => setTab(v as FilterTab)} />

        {loading ? (
          <div className="py-12 text-center text-sm text-muted">Loading transactions...</div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
            <FiRepeat className="mb-3 h-6 w-6 text-subtle" />
            <p className="text-sm font-medium text-foreground">No transactions found</p>
            <p className="mt-1 text-xs text-muted">Project escrow deposits and milestone payment releases will appear here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {visible.map((t) => {
              const meta = TYPE_META[t.type]
              return (
                <div
                  key={t.id}
                  className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-elevated text-muted border border-border">
                      <meta.icon className="h-4 w-4" />
                    </span>
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{meta.label}</span>
                        <StatusBadge status={t.status} />
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(`/projects/${t.projectId}`)}
                        className="flex items-center gap-1 text-xs text-subtle transition-colors hover:text-info"
                      >
                        <FiFolder className="h-3 w-3" />
                        {t.projectTitle}
                      </button>
                      <span className="text-xs text-subtle">{formatDate(t.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-1.5 sm:items-end">
                    <span className="text-sm font-semibold text-foreground">
                      {formatCurrency(t.amount)}
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