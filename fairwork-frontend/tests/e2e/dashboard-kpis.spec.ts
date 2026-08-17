import { expect, mockAuthenticatedClient, mockAuthenticatedFreelancer, project, test } from "./fixtures"

async function mockMyProjects(page: import("@playwright/test").Page) {
  await page.route("**/api/projects/mine", route => route.fulfill({ json: [
    project({ _id: "active-project", status: "in_progress", escrowFunded: true }),
    project({ _id: "completed-project", status: "completed", escrowFunded: false }),
  ] }))
  await page.route("**/api/activity?*", route => route.fulfill({ json: { activities: [], pagination: { page: 1, limit: 20, total: 0, hasMore: false } } }))
}

test("client KPI opens its URL-filtered project list", async ({ page }) => {
  await mockAuthenticatedClient(page)
  await mockMyProjects(page)
  await page.goto("/dashboard")
  const activeProjectsLink = page.getByRole("link", { name: "View active projects" })
  await activeProjectsLink.scrollIntoViewIfNeeded()
  await activeProjectsLink.click({ force: true })
  await expect(page).toHaveURL(/\/projects\/mine\?filter=in_progress$/)
  await expect(page.getByText("Showing projects that are in progress.")).toBeVisible()
  await expect(page.getByText("Accessible landing page")).toHaveCount(1)
})

test("freelancer KPI opens its URL-filtered milestone list", async ({ page }) => {
  await mockAuthenticatedFreelancer(page)
  await mockMyProjects(page)
  await page.goto("/dashboard")
  const milestoneLink = page.getByRole("link", { name: "View unreleased milestones" })
  await milestoneLink.scrollIntoViewIfNeeded()
  await milestoneLink.click({ force: true })
  await expect(page).toHaveURL(/\/milestones\?payment=unreleased$/)
  await expect(page.getByText("Showing unreleased milestone payments.")).toBeVisible()
  await expect(page.getByText("Design").first()).toBeVisible()
  await expect(page.getByText("Build").first()).toBeVisible()
})
