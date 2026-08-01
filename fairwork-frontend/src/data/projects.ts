import type { Milestone, Project } from "@/types"

export const milestones: Milestone[] = [
  // Project 1 — Design system (active)
  {
    id: "ms_01",
    projectId: "prj_01",
    title: "Discovery & audit",
    description:
      "Audit existing UI, define design principles, and deliver a component inventory.",
    status: "released",
    amount: 2500,
    order: 1,
    dueDate: "2026-06-20T00:00:00Z",
    submittedAt: "2026-06-18T12:00:00Z",
    approvedAt: "2026-06-19T09:00:00Z",
    releasedAt: "2026-06-19T09:05:00Z",
    deliverables: [
      {
        id: "dl_01",
        name: "audit-report.pdf",
        type: "file",
        url: "#",
        size: "4.2 MB",
        uploadedAt: "2026-06-18T12:00:00Z",
      },
    ],
  },
  {
    id: "ms_02",
    projectId: "prj_01",
    title: "Core component library",
    description:
      "Design and document 24 base components with light/dark variants.",
    status: "submitted",
    amount: 4000,
    order: 2,
    dueDate: "2026-07-25T00:00:00Z",
    submittedAt: "2026-07-20T16:30:00Z",
    approvedAt: null,
    releasedAt: null,
    deliverables: [
      {
        id: "dl_02",
        name: "Figma — Component Library",
        type: "link",
        url: "#",
        uploadedAt: "2026-07-20T16:30:00Z",
      },
    ],
  },
  {
    id: "ms_03",
    projectId: "prj_01",
    title: "Handoff & tokens",
    description: "Export design tokens and deliver an engineering handoff guide.",
    status: "in_progress",
    amount: 2500,
    order: 3,
    dueDate: "2026-08-15T00:00:00Z",
    submittedAt: null,
    approvedAt: null,
    releasedAt: null,
    deliverables: [],
  },

  // Project 2 — Marketing site (funding)
  {
    id: "ms_04",
    projectId: "prj_02",
    title: "Wireframes & copy",
    description: "Low-fidelity wireframes and marketing copy for 5 pages.",
    status: "pending",
    amount: 3000,
    order: 1,
    dueDate: "2026-08-01T00:00:00Z",
    submittedAt: null,
    approvedAt: null,
    releasedAt: null,
    deliverables: [],
  },
  {
    id: "ms_05",
    projectId: "prj_02",
    title: "Development",
    description: "Build responsive marketing site with CMS integration.",
    status: "pending",
    amount: 6000,
    order: 2,
    dueDate: "2026-09-10T00:00:00Z",
    submittedAt: null,
    approvedAt: null,
    releasedAt: null,
    deliverables: [],
  },

  // Project 3 — Mobile app (disputed)
  {
    id: "ms_06",
    projectId: "prj_03",
    title: "Onboarding flow",
    description: "Implement the 4-screen onboarding with animations.",
    status: "disputed",
    amount: 3500,
    order: 1,
    dueDate: "2026-07-05T00:00:00Z",
    submittedAt: "2026-07-04T18:00:00Z",
    approvedAt: null,
    releasedAt: null,
    deliverables: [
      {
        id: "dl_03",
        name: "onboarding-build.zip",
        type: "file",
        url: "#",
        size: "18.7 MB",
        uploadedAt: "2026-07-04T18:00:00Z",
      },
    ],
  },
]

export const projects: Project[] = [
  {
    id: "prj_01",
    title: "Design System Overhaul",
    description:
      "Rebuild Northwind's product design system with a documented component library and engineering-ready tokens.",
    status: "active",
    clientId: "usr_client_01",
    freelancerId: "usr_free_01",
    budget: 9000,
    currency: "USD",
    escrowSymbol: "USDC",
    escrowAmount: 9000,
    milestoneIds: ["ms_01", "ms_02", "ms_03"],
    tags: ["Design", "Design System", "Figma"],
    createdAt: "2026-06-10T10:00:00Z",
    dueDate: "2026-08-15T00:00:00Z",
  },
  {
    id: "prj_02",
    title: "Marketing Website Rebuild",
    description:
      "New responsive marketing site with CMS, built for performance and SEO.",
    status: "funding",
    clientId: "usr_client_01",
    freelancerId: "usr_free_02",
    budget: 9000,
    currency: "USD",
    escrowSymbol: "ETH",
    escrowAmount: 3.1,
    milestoneIds: ["ms_04", "ms_05"],
    tags: ["Web", "Next.js", "CMS"],
    createdAt: "2026-07-12T09:00:00Z",
    dueDate: "2026-09-10T00:00:00Z",
  },
  {
    id: "prj_03",
    title: "Mobile App Onboarding",
    description:
      "Design and build an animated onboarding experience for the iOS app.",
    status: "disputed",
    clientId: "usr_client_02",
    freelancerId: "usr_free_01",
    budget: 3500,
    currency: "USD",
    escrowSymbol: "USDC",
    escrowAmount: 3500,
    milestoneIds: ["ms_06"],
    tags: ["Mobile", "iOS", "Animation"],
    createdAt: "2026-06-25T11:00:00Z",
    dueDate: "2026-07-05T00:00:00Z",
  },
  {
    id: "prj_04",
    title: "API Integration Sprint",
    description:
      "Completed integration of payments and notifications microservices.",
    status: "completed",
    clientId: "usr_client_01",
    freelancerId: "usr_free_02",
    budget: 5000,
    currency: "USD",
    escrowSymbol: "USDC",
    escrowAmount: 5000,
    milestoneIds: [],
    tags: ["Backend", "API", "Integration"],
    createdAt: "2026-04-01T10:00:00Z",
    dueDate: "2026-05-15T00:00:00Z",
  },
]

export function getProjectById(id: string): Project | undefined {
  return projects.find((p) => p.id === id)
}

export function getMilestonesForProject(projectId: string): Milestone[] {
  return milestones
    .filter((m) => m.projectId === projectId)
    .sort((a, b) => a.order - b.order)
}
