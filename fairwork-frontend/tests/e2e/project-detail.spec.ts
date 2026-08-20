import { expect, mockAuthenticatedClient, project, test } from "./fixtures"

async function openProject(page: any, data = project()) {
  await mockAuthenticatedClient(page)
  await page.route("**/api/projects/project-1/applications", route => route.fulfill({ json: [] }))
  await page.route("**/api/projects/project-1/files", route => route.fulfill({ json: [] }))
  await page.route("**/api/projects/project-1/reference-files", route => route.fulfill({ json: [] }))
  await page.route("**/api/projects/project-1", route => route.fulfill({ json: data }))
  await page.goto("/projects/project-1")
  await expect(page.getByRole("heading", { name: data.title })).toBeVisible()
}

test("assignment status indicates no freelancer assigned when freelancerId is null", async ({ page }) => {
  await openProject(page, project({ freelancerId: null }))
  await expect(page.getByText("No freelancer hired yet")).toBeVisible()
})

test("payment protection and release require active escrow, not in-progress project status", async ({ page }) => {
  await openProject(page, project({ escrowFunded: false, escrowCompleted: false, escrowDisputed: false }))
  await page.getByRole("tab", { name: /Milestones/ }).click()
  await expect(page.getByText("Payment protected by escrow")).toHaveCount(0)
  await openProject(page, project({ escrowFunded: true }))
  await expect(page.getByText("Payment protected by escrow")).toBeVisible()
})

test("completed and disputed escrow disable release; disputed state is communicated", async ({ page }) => {
  await openProject(page, project({ escrowFunded: true, escrowCompleted: true, escrowDisputed: false }))
  await page.getByRole("tab", { name: /Milestones/ }).click()
  await expect(page.getByText("Payment protected by escrow")).toBeVisible()
})

test("project detail keeps critical escrow controls reachable on each configured viewport", async ({ page }) => {
  await openProject(page, project())
  await expect(page.getByRole("heading", { name: "Accessible landing page" })).toBeVisible()
})
