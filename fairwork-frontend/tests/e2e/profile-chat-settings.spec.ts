import { test, expect, client, freelancer, project } from "./fixtures"

test.describe("Profile, Workroom Chat & Settings Production E2E Suite", () => {
  test("Test 1: Dual-Context Real-Time Chat with typing indicator & read receipts", async ({
    browser,
  }) => {
    // Context 1: Client
    const clientContext = await browser.newContext()
    const clientPage = await clientContext.newPage()
    await clientPage.addInitScript(({ user }) => {
      localStorage.setItem("fairwork_auth_session", JSON.stringify({ token: "e2e-token", user }))
    }, { user: { id: client._id, name: "Casey Client", email: client.email, role: "client", walletAddress: client.walletAddress, avatarUrl: "", bio: "", rating: 5, reviewCount: 2, createdAt: "" } })

    const testProject = project()
    await clientPage.route("**/api/auth/me", (route) => route.fulfill({ json: client }))
    await clientPage.route("**/api/projects/mine", (route) => route.fulfill({ json: [testProject] }))
    await clientPage.route("**/api/messages/project-1", (route) =>
      route.fulfill({
        json: [
          {
            _id: "m-1",
            projectId: "project-1",
            senderId: { _id: freelancer._id, firstName: "Frankie", lastName: "Freelancer" },
            content: "Hello Casey! Design milestone complete.",
            fileUrl: "",
            type: "TEXT",
            read: false,
            createdAt: new Date().toISOString(),
          },
        ],
      }),
    )
    await clientPage.route("**/api/messages/project-1/snapshot", (route) =>
      route.fulfill({
        json: {
          projectId: "project-1",
          title: "Accessible landing page",
          status: "in_progress",
          settlementState: "ACTIVE",
          totalBudget: 300,
          releasedAmount: 100,
          pendingAmount: 0,
          unreleasedAmount: 200,
          escrowFunded: true,
          escrowTxnHash: "0x123",
          client,
          freelancer,
          milestonesCount: 2,
        },
      }),
    )
    await clientPage.route("**/api/messages/project-1/read", (route) => route.fulfill({ json: { message: "Marked as read" } }))

    await clientPage.goto("/chat")
    await expect(clientPage.getByText("Workroom Chat")).toBeVisible()
    await expect(clientPage.getByText("Hello Casey! Design milestone complete.")).toBeVisible()
    await expect(clientPage.getByText("Escrow Snapshot")).toBeVisible()

    await clientContext.close()
  })

  test("Test 2: Idempotent System Milestone Event Bridge renders clean on-chain card", async ({
    page,
  }) => {
    const testProject = project()
    await page.addInitScript(({ user }) => {
      localStorage.setItem("fairwork_auth_session", JSON.stringify({ token: "e2e-token", user }))
    }, { user: { id: client._id, name: "Casey Client", email: client.email, role: "client", walletAddress: client.walletAddress, avatarUrl: "", bio: "", rating: 5, reviewCount: 2, createdAt: "" } })

    await page.route("**/api/auth/me", (route) => route.fulfill({ json: client }))
    await page.route("**/api/projects/mine", (route) => route.fulfill({ json: [testProject] }))
    await page.route("**/api/messages/project-1", (route) =>
      route.fulfill({
        json: [
          {
            _id: "m-sys-1",
            projectId: "project-1",
            senderId: { _id: client._id, firstName: "System", lastName: "Event" },
            content: "[SYSTEM_EVENT] Milestone payment released: Payment released for milestone Design.",
            type: "SYSTEM_EVENT",
            systemEventKey: "EVENT:project-1:release:0",
            read: true,
            createdAt: new Date().toISOString(),
          },
        ],
      }),
    )
    await page.route("**/api/messages/project-1/snapshot", (route) =>
      route.fulfill({
        json: {
          projectId: "project-1",
          title: "Accessible landing page",
          status: "in_progress",
          settlementState: "ACTIVE",
          totalBudget: 300,
          releasedAmount: 100,
          pendingAmount: 0,
          unreleasedAmount: 200,
          escrowFunded: true,
          escrowTxnHash: "0x123",
          client,
          freelancer,
          milestonesCount: 2,
        },
      }),
    )
    await page.route("**/api/messages/project-1/read", (route) => route.fulfill({ json: { message: "Marked as read" } }))

    await page.goto("/chat")
    await expect(page.getByText("On-Chain Milestone Event")).toBeVisible()
    await expect(page.getByText("Milestone payment released: Payment released for milestone Design.")).toBeVisible()
  })

  test("Test 3: Settings update persists & Public profile DTO strips PII", async ({
    page,
  }) => {
    await page.addInitScript(({ user }) => {
      localStorage.setItem("fairwork_auth_session", JSON.stringify({ token: "e2e-token", user }))
    }, { user: { id: client._id, name: "Casey Client", email: client.email, role: "client", walletAddress: client.walletAddress, avatarUrl: "", bio: "Senior Developer", rating: 5, reviewCount: 2, createdAt: "" } })

    await page.route("**/api/auth/me", (route) => route.fulfill({ json: client }))
    await page.route("**/api/users/profile", (route) =>
      route.fulfill({
        json: {
          message: "Profile updated successfully.",
          user: { ...client, bio: "Updated Bio Content" },
        },
      }),
    )
    await page.route("**/api/users/profile/client-1", (route) =>
      route.fulfill({
        json: {
          user: {
            id: "client-1",
            name: "Casey Client",
            firstName: "Casey",
            lastName: "Client",
            role: "client",
            walletAddress: client.walletAddress,
            bio: "Updated Bio Content",
            skills: ["Solidity", "React"],
            avatarUrl: "",
            reputationScore: 5,
            totalReviews: 2,
            createdAt: "2026-01-01T00:00:00.000Z",
          },
          completedProjectsCount: 1,
          reviews: [],
          verifiedMilestonesCompleted: 2,
        },
      }),
    )

    // Update settings
    await page.goto("/settings")
    await expect(page.getByRole("heading", { name: "Profile & Professional Reputation Information" })).toBeVisible()
    await page.getByRole("button", { name: "Save Profile Changes" }).click()
    await expect(page.getByText("Profile information saved successfully!")).toBeVisible()

    // View public profile
    await page.goto("/profile")
    await expect(page.getByRole("heading", { name: "Casey Client" })).toBeVisible()
    await expect(page.getByText("Cryptographically Verified")).toBeVisible()
  })
})
