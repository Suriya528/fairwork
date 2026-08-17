import { expect, mockAuthenticatedClient, test } from "./fixtures"

const activity = { _id: "activity-1", type: "escrow_funded", title: "Escrow funded", message: "Escrow funding was confirmed on-chain.", projectId: "project-1", disputeId: null, milestoneIndex: null, read: false, createdAt: "2026-01-02T00:00:00.000Z" }

test("activity page renders authenticated API activity and navigates to its project", async ({ page }) => {
  await mockAuthenticatedClient(page)
  await page.route("**/api/activity?*", route => route.fulfill({ json: { activities: [activity], pagination: { page: 1, limit: 20, total: 1, hasMore: false } } }))
  await page.route("**/api/activity/read", route => route.fulfill({ json: { updated: 1 } }))
  await page.goto("/activity")
  await expect(page.getByText("Escrow funding was confirmed on-chain.")).toBeVisible()
  await page.getByText("Escrow funding was confirmed on-chain.").click()
  await expect(page).toHaveURL(/\/projects\/project-1$/)
})

test("activity page handles empty and failed API responses", async ({ page }) => {
  await mockAuthenticatedClient(page)
  await page.route("**/api/activity?*", route => route.fulfill({ json: { activities: [], pagination: { page: 1, limit: 20, total: 0, hasMore: false } } }))
  await page.goto("/activity"); await expect(page.getByText("No activity yet")).toBeVisible()
  await page.route("**/api/activity?*", route => route.fulfill({ status: 500, json: { message: "Unable to load activity" } }))
  await page.reload(); await expect(page.getByRole("alert")).toBeVisible()
})
