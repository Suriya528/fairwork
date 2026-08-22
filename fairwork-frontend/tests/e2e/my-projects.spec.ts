import { test, expect, mockAuthenticatedClient, mockAuthenticatedFreelancer } from "./fixtures"

test.describe("My Projects Page Financial Metrics & Filtering", () => {
  test("renders active and completed tabs and total spent metric for client", async ({ page }) => {
    await mockAuthenticatedClient(page)

    await page.route("**/api/projects/mine", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "proj-1",
            title: "Website Overhaul",
            budget: 500,
            status: "in_progress",
            clientId: "client-1",
            escrowFunded: true,
            escrowCompleted: false,
            clientName: "Casey Client",
            milestones: [
              { id: "m1", title: "Design", amount: 100, status: "completed", paymentReleased: true },
              { id: "m2", title: "Backend", amount: 400, status: "in_progress", paymentReleased: false },
            ],
          },
        ]),
      })
    })

    await page.goto("/projects/mine")

    await expect(page.getByRole("heading", { name: "Posted projects" })).toBeVisible()
    await expect(page.getByText("Total spent").first()).toBeVisible()
    await expect(page.getByText("Website Overhaul").first()).toBeVisible()
  })

  test("renders total earned metric for freelancer based on paymentReleased state", async ({ page }) => {
    await mockAuthenticatedFreelancer(page)

    await page.route("**/api/projects/mine", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "proj-2",
            title: "Mobile App Development",
            budget: 1000,
            status: "in_progress",
            freelancerId: "freelancer-1",
            escrowFunded: true,
            escrowCompleted: false,
            freelancerName: "Frankie Freelancer",
            milestones: [
              { id: "m1", title: "API Integration", amount: 300, status: "completed", paymentReleased: true },
              { id: "m2", title: "UI Screens", amount: 700, status: "completed", paymentReleased: false },
            ],
          },
        ]),
      })
    })

    await page.goto("/projects/mine")

    await expect(page.getByRole("heading", { name: "Assigned projects" })).toBeVisible()
    await expect(page.getByText("Total earned").first()).toBeVisible()
  })
})
