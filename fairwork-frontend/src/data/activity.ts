import type { ActivityItem } from "@/types"

export const activityFeed: ActivityItem[] = [
  {
    id: "act_01",
    type: "milestone_submitted",
    actorId: "usr_free_01",
    projectId: "prj_01",
    message: "Marcus Reyes submitted \u201cCore component library\u201d for review.",
    createdAt: "2026-07-20T16:30:00Z",
    read: false,
  },
  {
    id: "act_02",
    type: "escrow_funded",
    actorId: "usr_client_01",
    projectId: "prj_02",
    message: "Escrow deposit of 3.1 ETH is pending confirmation.",
    createdAt: "2026-07-20T15:00:00Z",
    read: false,
  },
  {
    id: "act_03",
    type: "dispute_opened",
    actorId: "usr_client_02",
    projectId: "prj_03",
    message: "A dispute was opened on \u201cMobile App Onboarding\u201d.",
    createdAt: "2026-07-06T08:00:00Z",
    read: true,
  },
  {
    id: "act_04",
    type: "funds_released",
    actorId: "usr_client_01",
    projectId: "prj_01",
    message: "2,500 USDC released to Marcus Reyes for \u201cDiscovery & audit\u201d.",
    createdAt: "2026-06-19T09:05:00Z",
    read: true,
  },
]

/**
 * Chart-ready series for dashboard visualizations (Recharts).
 * Kept here so charts have realistic shapes to render against.
 */
export const escrowVolumeSeries = [
  { month: "Feb", deposited: 4200, released: 2100 },
  { month: "Mar", deposited: 6800, released: 5400 },
  { month: "Apr", deposited: 9000, released: 5000 },
  { month: "May", deposited: 7400, released: 7400 },
  { month: "Jun", deposited: 12500, released: 4500 },
  { month: "Jul", deposited: 12500, released: 2500 },
]

export const milestoneStatusBreakdown = [
  { label: "Released", value: 6, color: "var(--color-success)" },
  { label: "In review", value: 2, color: "var(--color-info)" },
  { label: "In progress", value: 3, color: "var(--color-warning)" },
  { label: "Disputed", value: 1, color: "var(--color-danger)" },
]

export interface DashboardMetric {
  id: string
  label: string
  value: string
  change: number
  hint: string
}

export const dashboardMetrics: DashboardMetric[] = [
  {
    id: "locked",
    label: "In escrow",
    value: "$16,500",
    change: 12.4,
    hint: "Locked across 3 active projects",
  },
  {
    id: "released",
    label: "Released this month",
    value: "$2,500",
    change: -8.1,
    hint: "1 milestone released",
  },
  {
    id: "active",
    label: "Active projects",
    value: "3",
    change: 0,
    hint: "2 as client, 1 as freelancer",
  },
  {
    id: "disputes",
    label: "Open disputes",
    value: "1",
    change: 0,
    hint: "Awaiting evidence review",
  },
]
