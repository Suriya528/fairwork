import { test, expect } from "./fixtures"

test.describe("Admin Account Suspension & Moderation System End-to-End Safety", () => {
  const mockAdminUser = {
    id: "admin-1",
    firstName: "Alice",
    lastName: "Admin",
    email: "admin@example.test",
    role: "admin",
    walletAddress: "0x1111111111111111111111111111111111111111",
  }

  const mockActiveUser = {
    id: "user-target-1",
    firstName: "Bob",
    lastName: "Target",
    email: "bob@example.test",
    role: "freelancer",
    walletAddress: "0x2222222222222222222222222222222222222222",
    reputationScore: 95,
    totalReviews: 10,
    isSuspended: false,
    suspendedAt: null,
    suspendedReason: "",
    projectCount: 3,
    applicationCount: 5,
    createdAt: new Date().toISOString(),
  }

  const mockSuspendedUser = {
    ...mockActiveUser,
    id: "user-target-2",
    firstName: "Charlie",
    lastName: "Suspended",
    email: "charlie@example.test",
    isSuspended: true,
    suspendedAt: new Date().toISOString(),
    suspendedReason: "Violated TOS regarding communication guidelines.",
  }

  const mockOverview = {
    totalUsers: 10,
    totalClients: 4,
    totalFreelancers: 5,
    totalAdmins: 1,
    activeUsers: 9,
    suspendedUsers: 1,
    totalProjects: 15,
    openProjects: 5,
    activeProjects: 7,
    completedProjects: 3,
    cancelledProjects: 0,
    totalApplications: 25,
    pendingApplications: 10,
    acceptedApplications: 12,
    rejectedApplications: 3,
    applicationConversionRate: 48,
    totalContracts: 12,
    fundedEscrows: 7,
    completedEscrows: 3,
    disputedEscrows: 1,
    openDisputes: 1,
    resolvedDisputes: 2,
    totalReports: 2,
    openReports: 1,
  }

  async function mockAdminDashboard(page: import("@playwright/test").Page, getUsersList: () => unknown[]) {
    await page.addInitScript(({ user }) => {
      localStorage.setItem("fairwork_auth_session", JSON.stringify({ token: "admin-jwt-token", user }))
    }, { user: mockAdminUser })

    await page.route("**/api/auth/me", (route) => route.fulfill({ json: mockAdminUser }))
    await page.route("**/api/admin/overview", (route) => route.fulfill({ json: mockOverview }))
    await page.route("**/api/admin/users*", (route) => {
      const url = route.request().url()
      if (url.includes("/suspend") || url.includes("/unsuspend")) {
        return route.fallback()
      }
      const list = getUsersList()
      return route.fulfill({ json: { items: list, total: list.length, page: 1, limit: 20, pageCount: 1 } })
    })
    await page.route("**/api/admin/system", (route) => route.fulfill({ json: { backend: "available" } }))
    await page.route("**/api/admin/integrity", (route) => route.fulfill({ json: { databaseConsistent: true, anomalies: [] } }))
  }

  test("1. Active user displays [Suspend] button and Suspended user displays [Unsuspend] button", async ({ page }) => {
    await mockAdminDashboard(page, () => [mockActiveUser, mockSuspendedUser])
    await page.goto("/admin/users")

    await expect(page.getByRole("heading", { name: "User Management" })).toBeVisible({ timeout: 15000 })

    const activeUserRow = page.locator("tr", { hasText: "bob@example.test" })
    await expect(activeUserRow.getByRole("button", { name: "Suspend" })).toBeVisible()

    const suspendedUserRow = page.locator("tr", { hasText: "charlie@example.test" })
    await expect(suspendedUserRow.getByRole("button", { name: "Unsuspend" })).toBeVisible()
  })

  test("2. Suspension confirmation modal states access restriction, data preservation, auditability, and reversibility", async ({ page }) => {
    await mockAdminDashboard(page, () => [mockActiveUser])
    await page.goto("/admin/users")

    await page.getByRole("button", { name: "Suspend" }).click()
    await expect(page.getByRole("heading", { name: "Suspend User Account" })).toBeVisible()

    const modalText = page.locator("p", { hasText: "restricts normal protected platform actions" })
    await expect(modalText).toBeVisible()
    await expect(modalText).toContainText("Historical user data, projects, contracts, and escrow records are preserved and not deleted.")
    await expect(modalText).toContainText("This moderation event is recorded in system audit logs and can be reversed by an authorized administrator at any time.")
  })

  test("3. Suspension requires a non-empty reason before confirmation", async ({ page }) => {
    await mockAdminDashboard(page, () => [mockActiveUser])
    await page.goto("/admin/users")

    await page.getByRole("button", { name: "Suspend" }).click()
    const confirmBtn = page.getByRole("button", { name: "Confirm Suspension" })
    await expect(confirmBtn).toBeDisabled()

    await page.fill('input[placeholder="Enter detailed reason for moderation action..."]', "  ")
    await expect(confirmBtn).toBeDisabled()

    await page.fill('input[placeholder="Enter detailed reason for moderation action..."]', "Repeated spamming")
    await expect(confirmBtn).toBeEnabled()
  })

  test("4. Full reversible workflow: Suspend -> Confirm -> Unsuspend -> Confirm", async ({ page }) => {
    let currentTarget = { ...mockActiveUser }

    await mockAdminDashboard(page, () => [currentTarget])
    await page.route("**/api/admin/users/user-target-1/suspend", (route) => {
      currentTarget = { ...currentTarget, isSuspended: true, suspendedReason: "Spam behavior" }
      return route.fulfill({ json: { message: "User suspended", user: currentTarget } })
    })

    await page.route("**/api/admin/users/user-target-1/unsuspend", (route) => {
      currentTarget = { ...currentTarget, isSuspended: false, suspendedReason: "" }
      return route.fulfill({ json: { message: "User reinstated", user: currentTarget } })
    })

    await page.goto("/admin/users")

    // Suspend active user
    await page.getByRole("button", { name: "Suspend" }).click()
    await page.fill('input[placeholder="Enter detailed reason for moderation action..."]', "Spam behavior")
    await page.getByRole("button", { name: "Confirm Suspension" }).click()

    // Verify row now shows Unsuspend button
    const userRow = page.locator("tr", { hasText: "bob@example.test" })
    await expect(userRow.getByRole("button", { name: "Unsuspend" })).toBeVisible()

    // Unsuspend target user
    await userRow.getByRole("button", { name: "Unsuspend" }).click()
    await expect(page.getByRole("heading", { name: "Unsuspend User Account" })).toBeVisible()
    await page.getByRole("button", { name: "Confirm Unsuspend" }).click()

    // Verify row shows Suspend button again
    await expect(userRow.getByRole("button", { name: "Suspend" })).toBeVisible()
  })

  test("5. Prevent admin self-suspension: Admin user row has no suspend button", async ({ page }) => {
    await mockAdminDashboard(page, () => [mockAdminUser, mockActiveUser])
    await page.goto("/admin/users")

    const adminRow = page.locator("tr", { hasText: "admin@example.test" })
    await expect(adminRow.getByRole("button", { name: "Suspend" })).toHaveCount(0)
    await expect(adminRow.getByRole("button", { name: "Unsuspend" })).toHaveCount(0)
  })
})
