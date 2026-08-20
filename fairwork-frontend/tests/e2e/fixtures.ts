import { expect, test } from "@playwright/test"
import type { Page } from "@playwright/test"

export const client = {
  _id: "client-1", firstName: "Casey", lastName: "Client", email: "casey@example.test", role: "client",
  walletAddress: "0x1111111111111111111111111111111111111111", avatarUrl: "", bio: "", reputationScore: 0, totalReviews: 0,
}
export const freelancer = {
  _id: "freelancer-1", firstName: "Frankie", lastName: "Freelancer", email: "frankie@example.test", role: "freelancer",
  walletAddress: "0x2222222222222222222222222222222222222222",
}

export function project(overrides: Record<string, unknown> = {}) {
  return {
    _id: "project-1", title: "Accessible landing page", description: "Build the agreed landing page.", budget: 300,
    status: "in_progress", clientId: client, freelancerId: freelancer, escrowTxnHash: "", contractId: null,
    milestones: [
      { _id: "milestone-1", title: "Design", amount: 100, status: "completed", paymentReleased: false },
      { _id: "milestone-2", title: "Build", amount: 200, status: "pending", paymentReleased: false },
    ],
    escrowFunded: false, escrowCompleted: false, escrowDisputed: false, escrowToken: "",
    createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z", ...overrides,
  }
}

export async function mockAuthenticatedClient(page: Page, walletAddressOverride?: string) {
  const walletAddress = walletAddressOverride !== undefined ? walletAddressOverride : client.walletAddress
  await page.addInitScript(({ user }) => {
    localStorage.setItem("fairwork_auth_session", JSON.stringify({ token: "e2e-token", user }))
  }, { user: { id: client._id, name: "Casey Client", email: client.email, role: "client", walletAddress, avatarUrl: "", bio: "", rating: 0, reviewCount: 0, createdAt: "" } })
  await page.route("**/api/auth/me", route => route.fulfill({ json: { ...client, walletAddress } }))
  await page.route("**/api/projects/mine", route => route.fulfill({ json: [] }))
  await page.route("**/api/disputes", route => route.fulfill({ json: [] }))
}

export async function mockAuthenticatedFreelancer(page: Page, walletAddressOverride?: string) {
  const walletAddress = walletAddressOverride !== undefined ? walletAddressOverride : freelancer.walletAddress
  await page.addInitScript(({ user }) => {
    localStorage.setItem("fairwork_auth_session", JSON.stringify({ token: "e2e-token", user }))
  }, { user: { id: freelancer._id, name: "Frankie Freelancer", email: freelancer.email, role: "freelancer", walletAddress, avatarUrl: "", bio: "", rating: 0, reviewCount: 0, createdAt: "" } })
  await page.route("**/api/auth/me", route => route.fulfill({ json: { ...freelancer, walletAddress } }))
  await page.route("**/api/projects/mine", route => route.fulfill({ json: [] }))
  await page.route("**/api/disputes", route => route.fulfill({ json: [] }))
}

export { expect, test }
