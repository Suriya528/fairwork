/**
 * Canonical Project Category taxonomy across the FairWork platform.
 * Used for project creation, category discovery, project cards, and marketplace filtering.
 */
export const PROJECT_CATEGORIES = [
  "Web Development",
  "Mobile Development",
  "UI/UX Design",
  "Backend & API Systems",
  "AI & Machine Learning",
  "Cloud & DevOps",
  "Web3 & Smart Contracts",
  "Technical Writing & Docs",
  "Graphic Design",
  "Digital Marketing",
  "Video & Animation",
  "Other",
] as const

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number]
