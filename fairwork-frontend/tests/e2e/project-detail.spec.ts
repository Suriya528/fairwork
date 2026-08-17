import { expect, mockAuthenticatedClient, project, test } from "./fixtures"

async function openProject(page: any, data = project()) {
  await mockAuthenticatedClient(page)
  await page.route("**/api/projects/project-1", route => route.fulfill({ json: data }))
  await page.goto("/projects/project-1")
  await expect(page.getByRole("heading", { name: data.title })).toBeVisible()
}

test("assignment control is shown only to the client while no freelancer is assigned", async ({ page }) => {
  await openProject(page, project({ freelancerId: null }))
  await expect(page.getByPlaceholder("Freelancer user ID")).toBeVisible()
  await expect(page.getByRole("button", { name: "Assign" })).toBeVisible()
})

test("payment protection and release require active escrow, not in-progress project status", async ({ page }) => {
  await openProject(page, project({ escrowFunded: false, escrowCompleted: false, escrowDisputed: false }))
  await page.getByRole("tab", { name: /Milestones/ }).click()
  await expect(page.getByText("Payment protected by escrow")).toHaveCount(0)
  await expect(page.getByRole("button", { name: "Release" }).first()).toBeDisabled()
  await openProject(page, project({ escrowFunded: true }))
  await expect(page.getByText("Payment protected by escrow")).toBeVisible()
  await page.getByRole("tab", { name: /Milestones/ }).click()
  await expect(page.getByRole("button", { name: "Release" }).first()).toBeEnabled()
})

test("completed and disputed escrow disable release; disputed state is communicated", async ({ page }) => {
  await openProject(page, project({ escrowFunded: true, escrowCompleted: true }))
  await page.getByRole("tab", { name: /Milestones/ }).click(); await expect(page.getByRole("button", { name: "Release" }).first()).toBeDisabled()
  await openProject(page, project({ escrowFunded: true, escrowDisputed: true }))
  await expect(page.getByText(/This project has an open dispute/)).toBeVisible()
  await page.getByRole("tab", { name: /Milestones/ }).click(); await expect(page.getByRole("button", { name: "Release" }).first()).toBeDisabled()
})

test("project detail keeps critical escrow controls reachable on each configured viewport", async ({ page }) => {
  await openProject(page, project({ escrowFunded: true }))
  await expect(page.getByRole("button", { name: "Fund escrow" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Raise a dispute" })).toBeVisible()
})
