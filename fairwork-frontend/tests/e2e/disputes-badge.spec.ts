import { expect, mockAuthenticatedClient, project, test } from "./fixtures"

function dispute(projectId: string, status: "pending" | "resolved") {
  return {
    _id: `dispute-${projectId}`,
    projectId,
    raisedBy: "client-1",
    reason: "Work needs review.",
    evidence: [],
    status,
    winner: "none",
    clientVotes: 0,
    freelancerVotes: 0,
    blockchainTxn: "",
    createdAt: "2026-01-02T00:00:00.000Z",
  }
}

async function mockDisputes(page: Parameters<typeof mockAuthenticatedClient>[0], projects: ReturnType<typeof project>[], statuses: Record<string, "pending" | "resolved"> = {}) {
  await page.route("**/api/projects/mine", (route) => route.fulfill({ json: projects }))
  await page.route("**/api/disputes/*", (route) => {
    const projectId = route.request().url().split("/").pop() ?? ""
    const status = statuses[projectId]
    return route.fulfill({ json: status ? dispute(projectId, status) : null })
  })
}

test("disputes badge and Open metric use pending disputes from the same API data", async ({ page }) => {
  await mockAuthenticatedClient(page)
  await mockDisputes(page, [
    project({ _id: "project-pending-1", status: "disputed" }),
    project({ _id: "project-pending-2", status: "disputed" }),
    project({ _id: "project-resolved", status: "disputed" }),
  ], {
    "project-pending-1": "pending",
    "project-pending-2": "pending",
    "project-resolved": "resolved",
  })

  await page.goto("/disputes")
  await expect(page.getByText("Open", { exact: true })).toBeVisible()
  await expect(page.locator("main").getByText("2", { exact: true })).toBeVisible()
  await expect(page.locator('nav[aria-label="Primary"] a[href="/disputes"] span.bg-danger')).toHaveText("2")
})

test("disputes badge is absent for empty, resolved-only, and failed dispute summaries", async ({ page }) => {
  await mockAuthenticatedClient(page)
  await mockDisputes(page, [])
  await page.goto("/disputes")
  await expect(page.locator('nav[aria-label="Primary"] a[href="/disputes"] span.bg-danger')).toHaveCount(0)

  await page.unroute("**/api/projects/mine")
  await page.unroute("**/api/disputes/*")
  await mockDisputes(page, [project({ _id: "project-resolved", status: "disputed" })], { "project-resolved": "resolved" })
  await page.reload()
  await expect(page.locator('nav[aria-label="Primary"] a[href="/disputes"] span.bg-danger')).toHaveCount(0)

  await page.unroute("**/api/projects/mine")
  await page.route("**/api/projects/mine", (route) => route.fulfill({ status: 500, json: { message: "Unable to load disputes" } }))
  await page.reload()
  await expect(page.locator('nav[aria-label="Primary"] a[href="/disputes"] span.bg-danger')).toHaveCount(0)
})

test("mobile navigation displays the same pending-dispute badge", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "Mobile drawer is only visible at the mobile viewport.")
  await mockAuthenticatedClient(page)
  await mockDisputes(page, [project({ _id: "project-pending", status: "disputed" })], { "project-pending": "pending" })
  await page.goto("/disputes")
  await page.getByLabel("Open navigation menu").click()
  await expect(page.locator('nav[aria-label="Mobile"] a[href="/disputes"] span.bg-danger')).toHaveText("1")
})
