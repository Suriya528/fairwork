import { users } from "@/data/users"
import type { Project } from "@/types"
 
/**
 * Shared read-model helpers for displaying Project entities.
 * Used by ProjectCard/ProjectRow and any page that lists projects
 * (Browse Projects, My Projects, and future Analytics/Contracts views).
 */
 
export function getUserName(userId: string): string {
  const user = users.find((u) => u.id === userId)
  return user?.name ?? "Unknown"
}
 
export function getEscrowProgress(project: Project): number {
  if (project.budget === 0) return 0
  const escrowUsd =
    project.escrowSymbol === "USDC"
      ? project.escrowAmount
      : project.escrowAmount * 2800
  return Math.min(Math.round((escrowUsd / project.budget) * 100), 100)
}