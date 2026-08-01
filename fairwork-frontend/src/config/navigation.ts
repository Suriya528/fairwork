import type { IconType } from "react-icons"
import {
  FiActivity,
  FiAlertTriangle,
  FiBell,
  FiCheckSquare,
  FiCreditCard,
  FiFileText,
  FiFolder,
  FiGrid,
  FiHelpCircle,
  FiList,
  FiMessageSquare,
  FiPlusCircle,
  FiRepeat,
  FiSettings,
  FiShield,
  FiTool,
  FiTrendingUp,
  FiUser,
} from "react-icons/fi"

export interface NavItem {
  label: string
  path: string
  icon: IconType
  /** Optional badge count shown in the sidebar. */
  badge?: number
}

export interface NavSection {
  title: string
  items: NavItem[]
}

/**
 * Single source of truth for app navigation.
 * Both the sidebar and mobile nav render from this config so they never drift.
 */
export const navSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", path: "/", icon: FiGrid },
      { label: "Activity", path: "/activity", icon: FiActivity },
      { label: "Analytics", path: "/analytics", icon: FiTrendingUp },
    ],
  },
  {
    title: "Projects",
    items: [
      { label: "Browse Projects", path: "/projects", icon: FiFolder },
      { label: "Create Project", path: "/projects/new", icon: FiPlusCircle },
      { label: "My Projects", path: "/projects/mine", icon: FiList },
    ],
  },
  {
    title: "Contracts",
    items: [
      { label: "Contracts", path: "/contracts", icon: FiFileText },
      { label: "Escrow", path: "/escrow", icon: FiShield },
      { label: "Milestones", path: "/milestones", icon: FiCheckSquare },
      { label: "Disputes", path: "/disputes", icon: FiAlertTriangle, badge: 1 },
    ],
  },
  {
    title: "Finance",
    items: [
      { label: "Wallet", path: "/wallet", icon: FiCreditCard },
      { label: "Transactions", path: "/transactions", icon: FiRepeat },
    ],
  },
  {
    title: "Communication",
    items: [
      { label: "Chat", path: "/chat", icon: FiMessageSquare },
      { label: "Notifications", path: "/notifications", icon: FiBell },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Profile", path: "/profile", icon: FiUser },
      { label: "Settings", path: "/settings", icon: FiSettings },
      { label: "Help Center", path: "/help", icon: FiHelpCircle },
    ],
  },
  {
    title: "Administration",
    items: [{ label: "Admin Dashboard", path: "/admin", icon: FiTool }],
  },
]

/** Flattened list, handy for routing and breadcrumb lookups. */
export const flatNavItems: NavItem[] = navSections.flatMap((s) => s.items)