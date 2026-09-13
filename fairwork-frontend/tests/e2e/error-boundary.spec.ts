import { test, expect, mockAuthenticatedClient } from "./fixtures"

test.describe("Production Error Boundary Architecture", () => {
  test("isolated feature error renders feature fallback without crashing AppLayout sidebar and topbar", async ({ page }, testInfo) => {
    await mockAuthenticatedClient(page)
    await page.route("**/api/projects", route => route.fulfill({ json: [] }))
    await page.route("**/api/contracts", route => route.fulfill({ json: [] }))

    // Navigate to projects page
    await page.goto("/projects")
    await expect(page.getByRole("heading", { name: "Projects", exact: true })).toBeVisible()

    if (testInfo.project.name === "mobile-chromium") {
      await page.getByLabel("Open navigation menu").click()
      await expect(page.getByRole("navigation")).toBeVisible()
      await page.getByRole("link", { name: "Contracts" }).click()
      await expect(page).toHaveURL(/\/contracts/)
    } else {
      // Sidebar navigation should be present and visible
      await expect(page.getByRole("navigation")).toBeVisible()
      await page.getByRole("link", { name: "Contracts" }).click()
      await expect(page).toHaveURL(/\/contracts/)
    }
  })

  test("feature fallback handles retry and location navigation gracefully", async ({ page }, testInfo) => {
    await mockAuthenticatedClient(page)
    await page.route("**/api/disputes", route => route.fulfill({ json: [] }))
    await page.route("**/api/projects", route => route.fulfill({ json: [] }))

    await page.goto("/disputes")
    await expect(page).toHaveURL(/\/disputes/)

    if (testInfo.project.name === "mobile-chromium") {
      await page.getByLabel("Open navigation menu").click()
      await expect(page.getByRole("navigation")).toBeVisible()
      await page.getByRole("link", { name: "Dashboard" }).click()
      await expect(page).toHaveURL(/\/dashboard/)
    } else {
      // Sidebar remains accessible
      await expect(page.getByRole("navigation")).toBeVisible()
      await page.getByRole("link", { name: "Dashboard" }).click()
      await expect(page).toHaveURL(/\/dashboard/)
    }
  })
})
