import type { IconType } from "react-icons"
import {
  FiPlusCircle,
  FiSearch,
  FiCreditCard,
  FiFileText,
  FiAlertTriangle,
  FiShield,
  FiTrendingUp,
  FiFolder,
  FiCheckCircle,
  FiClock,
} from "react-icons/fi"
import type { DonutDatum } from "@/components/charts/DonutChart"

/* ------------------------------------------------------------------ */
/* Header greeting                                                     */
/* ------------------------------------------------------------------ */

/** Time-of-day aware greeting, e.g. "Good morning". */
export function getGreeting(date = new Date()): string {
  const hour = date.getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

/* ------------------------------------------------------------------ */
/* Quick actions                                                       */
/* ------------------------------------------------------------------ */

export interface QuickAction {
  id: string
  title: string
  description: string
  icon: IconType
  to: string
}

export const quickActions: QuickAction[] = [
  {
    id: "create-project",
    title: "Create project",
    description: "Draft a new escrow-backed contract",
    icon: FiPlusCircle,
    to: "/projects",
  },
  {
    id: "browse-projects",
    title: "Browse projects",
    description: "Explore open work and proposals",
    icon: FiSearch,
    to: "/projects",
  },
  {
    id: "open-wallet",
    title: "Open wallet",
    description: "Review escrow balances & releases",
    icon: FiCreditCard,
    to: "/escrow",
  },
  {
    id: "view-contracts",
    title: "View contracts",
    description: "Track milestones and deliverables",
    icon: FiFileText,
    to: "/milestones",
  },
  {
    id: "open-disputes",
    title: "Open disputes",
    description: "Resolve flagged milestones",
    icon: FiAlertTriangle,
    to: "/disputes",
  },
]

/* ------------------------------------------------------------------ */
/* KPI statistics                                                      */
/* ------------------------------------------------------------------ */

export interface KpiStat {
  id: string
  label: string
  value: string
  change: number
  hint: string
  icon: IconType
}

export const kpiStats: KpiStat[] = [
  {
    id: "escrow-balance",
    label: "Escrow balance",
    value: "₹1,65,000",
    change: 12.4,
    hint: "Locked across 3 active contracts",
    icon: FiShield,
  },
  {
    id: "total-earnings",
    label: "Total earnings",
    value: "₹4,72,500",
    change: 18.2,
    hint: "Released to date",
    icon: FiTrendingUp,
  },
  {
    id: "active-contracts",
    label: "Active contracts",
    value: "3",
    change: 6.1,
    hint: "2 as client, 1 as freelancer",
    icon: FiFileText,
  },
  {
    id: "open-projects",
    label: "Open projects",
    value: "2",
    change: 0,
    hint: "Awaiting funding or kickoff",
    icon: FiFolder,
  },
  {
    id: "completed-projects",
    label: "Completed projects",
    value: "8",
    change: 14.3,
    hint: "Delivered & released",
    icon: FiCheckCircle,
  },
  {
    id: "pending-milestones",
    label: "Pending milestones",
    value: "4",
    change: -3.5,
    hint: "Awaiting review or delivery",
    icon: FiClock,
  },
]

/* ------------------------------------------------------------------ */
/* Analytics — chart series                                            */
/* ------------------------------------------------------------------ */

/** Monthly earnings vs. amount held in escrow (area chart). */
export const monthlyEarningsSeries = [
  { month: "Feb", earnings: 21000, escrow: 42000 },
  { month: "Mar", earnings: 54000, escrow: 68000 },
  { month: "Apr", earnings: 50000, escrow: 90000 },
  { month: "May", earnings: 74000, escrow: 74000 },
  { month: "Jun", earnings: 45000, escrow: 125000 },
  { month: "Jul", earnings: 86000, escrow: 165000 },
]

/** Contract status distribution (pie/donut). */
export const contractStatusBreakdown: DonutDatum[] = [
  { label: "Active", value: 5, color: "var(--color-info)" },
  { label: "Funding", value: 2, color: "var(--color-warning)" },
  { label: "Completed", value: 8, color: "var(--color-success)" },
  { label: "Disputed", value: 1, color: "var(--color-danger)" },
]

/** Milestones submitted vs. released each month (bar chart). */
export const milestoneProgressSeries = [
  { month: "Mar", submitted: 3, released: 2 },
  { month: "Apr", submitted: 4, released: 3 },
  { month: "May", submitted: 2, released: 4 },
  { month: "Jun", submitted: 5, released: 3 },
  { month: "Jul", submitted: 3, released: 2 },
]
