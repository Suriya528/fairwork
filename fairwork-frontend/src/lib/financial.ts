import type { ApiProject } from "@/services/projectsApi"

/**
 * Authoritative Financial Utility Module for FairWork
 *
 * Enforces single-writer financial semantics:
 *  - Total Budget: Agreed monetary value of project (project.budget)
 *  - Paid / Released: SUM(milestone.amount WHERE milestone.paymentReleased === true)
 *  - Unreleased: SUM(milestone.amount WHERE milestone.paymentReleased !== true)
 *  - Completed Work Value: SUM(milestone.amount WHERE milestone.status === "completed")
 *  - Pending Payout: SUM(milestone.amount WHERE milestone.status === "completed" && !milestone.paymentReleased)
 */

/** Returns total agreed project budget. */
export function getProjectBudget(project: ApiProject): number {
  return project.budget || 0
}

/** Returns total milestone allocated amount. */
export function getMilestoneAllocatedAmount(project: ApiProject): number {
  return (project.milestones || []).reduce((sum, m) => sum + (m.amount || 0), 0)
}

/** Returns total released payment amount (paymentReleased === true). */
export function getReleasedAmount(project: ApiProject): number {
  return (project.milestones || [])
    .filter((m) => Boolean(m && m.paymentReleased))
    .reduce((sum, m) => sum + (m.amount || 0), 0)
}

/** Returns total unreleased payment amount (paymentReleased !== true). */
export function getUnreleasedAmount(project: ApiProject): number {
  return (project.milestones || [])
    .filter((m) => Boolean(m && !m.paymentReleased))
    .reduce((sum, m) => sum + (m.amount || 0), 0)
}

/** Returns monetary value of completed work (status === "completed"). */
export function getCompletedWorkAmount(project: ApiProject): number {
  return (project.milestones || [])
    .filter((m) => Boolean(m && m.status === "completed"))
    .reduce((sum, m) => sum + (m.amount || 0), 0)
}

/** Returns approved but unpaid milestone payment amount (status === "completed" && !paymentReleased). */
export function getPendingPayoutAmount(project: ApiProject): number {
  return (project.milestones || [])
    .filter((m) => Boolean(m && m.status === "completed" && !m.paymentReleased))
    .reduce((sum, m) => sum + (m.amount || 0), 0)
}

/** Returns comprehensive financial metrics object for a project. */
export function getProjectFinancialMetrics(project: ApiProject) {
  const budget = getProjectBudget(project)
  const allocated = getMilestoneAllocatedAmount(project)
  const released = getReleasedAmount(project)
  const unreleased = getUnreleasedAmount(project)
  const completedWork = getCompletedWorkAmount(project)
  const pendingPayout = getPendingPayoutAmount(project)

  return {
    budget,
    allocated,
    released,
    unreleased,
    completedWork,
    pendingPayout,
    isFullyFunded: Boolean(project.escrowFunded),
    isFullyReleased: Boolean(
      project.escrowCompleted ||
        (project.milestones.length > 0 && project.milestones.every((m) => m.paymentReleased)),
    ),
  }
}
