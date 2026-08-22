import { test, expect, mockAuthenticatedClient, mockAuthenticatedFreelancer } from "./fixtures"

test.describe("Profile Page Financial Metrics", () => {
  test("renders user profile info and total spent metric for client", async ({ page }) => {
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
            milestones: [
              { id: "m1", title: "Design", amount: 100, status: "completed", paymentReleased: true },
              { id: "m2", title: "Backend", amount: 400, status: "in_progress", paymentReleased: false },
            ],
          },
        ]),
      })
    })

    await page.goto("/profile")

    await expect(page.getByRole("heading", { name: "Casey Client" })).toBeVisible()
    await expect(page.getByText("Client", { exact: true }).first()).toBeVisible()
    await expect(page.getByText("Total spent").first()).toBeVisible()
  })

  test("renders total earned metric for freelancer on profile page", async ({ page }) => {
    await mockAuthenticatedFreelancer(page)

    await page.route("**/api/projects/mine", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "proj-2",
            title: "Mobile App",
            budget: 1000,
            status: "completed",
            milestones: [
              { id: "m1", title: "API Integration", amount: 300, status: "completed", paymentReleased: true },
            ],
          },
        ]),
      })
    })

    await page.goto("/profile")

    await expect(page.getByRole("heading", { name: "Frankie Freelancer" })).toBeVisible()
    await expect(page.getByText("Freelancer", { exact: true }).first()).toBeVisible()
    await expect(page.getByText("Total earned").first()).toBeVisible()
  })
})
