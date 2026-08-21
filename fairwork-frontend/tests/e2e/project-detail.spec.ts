import { expect, mockAuthenticatedClient, mockAuthenticatedFreelancer, project, test } from "./fixtures"

async function openProject(page: any, data = project()) {
  await mockAuthenticatedClient(page)
  await page.route("**/api/projects/mine", route => route.fulfill({ json: [data] }))
  await page.route("**/api/projects/project-1/applications", route => route.fulfill({ json: [] }))
  await page.route("**/api/projects/project-1/files", route => route.fulfill({ json: [] }))
  await page.route("**/api/projects/project-1/deliverables", route => route.fulfill({ json: [] }))
  await page.route("**/api/projects/project-1/reference-files", route => route.fulfill({ json: [] }))
  await page.route("**/api/disputes/project/project-1", route => route.fulfill({ status: 404, json: null }))
  await page.route("**/api/projects/project-1", route => route.fulfill({ json: data }))
  await page.goto("/projects/project-1")
  await expect(page.getByRole("heading", { name: data.title })).toBeVisible()
}

test.describe("Project Detail & Milestone Payment System", () => {
  test("Global header renders compact wallet badge instead of raw wallet address", async ({ page }) => {
    await openProject(page)
    await expect(page.getByText("Wallet Verified ✓")).toBeVisible()
    await expect(page.getByText("0x1f9a7C4b2E5d8A3f6B0c1D4e7F2a9B3c5D6e8F0a")).toHaveCount(0)
  })

  test("assignment status indicates no freelancer assigned when freelancerId is null", async ({ page }) => {
    await openProject(page, project({ freelancerId: null }))
    await expect(page.getByText("No freelancer hired yet")).toBeVisible()
  })

  test("Approved but unpaid milestone displays Completed & Approved and Payment Pending Release", async ({ page }) => {
    const proj = project({
      escrowFunded: true,
      milestones: [
        { _id: "m-1", title: "Milestone 1", amount: 500, status: "completed", paymentReleased: false },
      ],
    })
    await openProject(page, proj)
    await page.getByRole("tab", { name: /Milestones/ }).click()
    await expect(page.getByText("Completed & Approved ✓")).toBeVisible()
    await expect(page.getByText("Payment: Pending Release")).toBeVisible()
    await expect(page.getByRole("button", { name: "Release Escrow Payout" })).toBeVisible()
  })

  test("Released milestone displays Payment Released and hides release action button", async ({ page }) => {
    const proj = project({
      escrowFunded: true,
      milestones: [
        { _id: "m-1", title: "Milestone 1", amount: 500, status: "completed", paymentReleased: true },
      ],
    })
    await openProject(page, proj)
    await page.getByRole("tab", { name: /Milestones/ }).click()
    await expect(page.getByText("Completed & Approved ✓")).toBeVisible()
    await expect(page.getByText("Payment Released ✓")).toBeVisible()
    await expect(page.getByRole("button", { name: "Release Escrow Payout" })).toHaveCount(0)
  })

  test("Freelancer can view project and apply off-chain without misleading blockchain configuration error", async ({ page }) => {
    await mockAuthenticatedFreelancer(page)
    const openProj = project({ _id: "proj-open-1", title: "Web App UI Design", freelancerId: null, status: "open" })
    await page.route("**/api/projects/mine", route => route.fulfill({ json: [] }))
    await page.route("**/api/projects/proj-open-1/applications", route => route.fulfill({ json: [] }))
    await page.route("**/api/projects/proj-open-1/files", route => route.fulfill({ json: [] }))
    await page.route("**/api/projects/proj-open-1/deliverables", route => route.fulfill({ json: [] }))
    await page.route("**/api/projects/proj-open-1/reference-files", route => route.fulfill({ json: [] }))
    await page.route("**/api/disputes/project/proj-open-1", route => route.fulfill({ status: 404, json: null }))
    await page.route("**/api/projects/proj-open-1", route => route.fulfill({ json: openProj }))

    await page.goto("/projects/proj-open-1")
    await expect(page.getByRole("heading", { name: "Web App UI Design" })).toBeVisible()
    await expect(page.getByText("blockchain configuration is incomplete")).toHaveCount(0)
    await expect(page.getByRole("button", { name: "Apply to Project" })).toBeVisible()
  })
})
