import type { IconType } from "react-icons"
import {
  FiActivity,
  FiAlertTriangle,
  FiCheckSquare,
  FiFileText,
  FiFolder,
  FiGrid,
  FiHelpCircle,
  FiList,
  FiMessageSquare,
  FiPlusCircle,
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
      { label: "Dashboard", path: "/dashboard", icon: FiGrid },
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
      { label: "Disputes", path: "/disputes", icon: FiAlertTriangle },
    ],
  },
  {
    title: "Communication",
    items: [
      { label: "Chat", path: "/chat", icon: FiMessageSquare },
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
    items: [
      { label: "Overview", path: "/admin", icon: FiTool },
      { label: "Users", path: "/admin/users", icon: FiUser },
      { label: "Projects", path: "/admin/projects", icon: FiFolder },
      { label: "Disputes", path: "/admin/disputes", icon: FiAlertTriangle },
      { label: "System health", path: "/admin/system", icon: FiActivity },
    ],
  },
]

/** Flattened list, handy for routing and breadcrumb lookups. */
export const flatNavItems: NavItem[] = navSections.flatMap((s) => s.items)
