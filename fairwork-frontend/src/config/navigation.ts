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
 * Default fallback app navigation.
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

/**
 * Dynamically tailored navigation sections based on the authenticated user's role.
 */
export function getNavSectionsForRole(role?: string): NavSection[] {
  if (role === "admin") {
    return navSections.filter((section) => section.title === "Administration")
  }

  const isFreelancer = role === "freelancer"

  return [
    {
      title: "Overview",
      items: [
        { label: "Dashboard", path: "/dashboard", icon: FiGrid },
        { label: "Activity", path: "/activity", icon: FiActivity },
        {
          label: isFreelancer ? "Earnings Analytics" : "Spend Analytics",
          path: "/analytics",
          icon: FiTrendingUp,
        },
      ],
    },
    {
      title: "Projects",
      items: isFreelancer
        ? [
            { label: "Browse Projects", path: "/projects", icon: FiFolder },
            { label: "Assigned Projects", path: "/projects/mine", icon: FiList },
            { label: "My Applications", path: "/applications", icon: FiFileText },
          ]
        : [
            { label: "Posted Projects", path: "/projects/mine", icon: FiList },
            { label: "Create Project", path: "/projects/new", icon: FiPlusCircle },
            { label: "Browse Marketplace", path: "/projects", icon: FiFolder },
          ],
    },
    {
      title: "Contracts & Escrow",
      items: isFreelancer
        ? [
            { label: "Contracts", path: "/contracts", icon: FiFileText },
            { label: "Milestones & Payouts", path: "/milestones", icon: FiCheckSquare },
            { label: "Escrow Protection", path: "/escrow", icon: FiShield },
            { label: "Disputes", path: "/disputes", icon: FiAlertTriangle },
          ]
        : [
            { label: "Contracts", path: "/contracts", icon: FiFileText },
            { label: "Escrow & Funding", path: "/escrow", icon: FiShield },
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
  ]
}

/** Flattened list, handy for routing and breadcrumb lookups. */
export const flatNavItems: NavItem[] = navSections.flatMap((s) => s.items)
