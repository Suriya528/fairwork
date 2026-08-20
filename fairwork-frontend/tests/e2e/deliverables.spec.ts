import { test, expect, mockAuthenticatedFreelancer, project } from "./fixtures"

test.describe("Deliverables & Milestone Work System", () => {
  test("clicking Submit Work opens the unified submission modal with file attachment and notes", async ({ page }) => {
    const data = project({ status: "in_progress" })
    await mockAuthenticatedFreelancer(page)
    await page.route("**/api/projects/project-1/applications", route => route.fulfill({ json: [] }))
    await page.route("**/api/projects/project-1/files", route => route.fulfill({ json: [] }))
    await page.route("**/api/projects/project-1/reference-files", route => route.fulfill({ json: [] }))
    await page.route("**/api/projects/project-1", route => route.fulfill({ json: data }))

    await page.goto("/projects/project-1")
    await page.getByRole("tab", { name: /Milestones/ }).click()

    // Click Submit Work button
    const submitBtn = page.getByRole("button", { name: "Submit Work" }).first()
    await expect(submitBtn).toBeVisible()
    await submitBtn.click()

    // Modal opens with Submit Work title, Choose Files button, and Submission Notes
    await expect(page.getByRole("dialog")).toBeVisible()
    await expect(page.getByText("Submit Work for Milestone")).toBeVisible()
    await expect(page.getByText("Choose Files")).toBeVisible()
    await expect(page.getByLabel("Submission Notes")).toBeVisible()

    // Cancel closes modal
    await page.getByRole("button", { name: "Cancel" }).click()
    await expect(page.getByRole("dialog")).toHaveCount(0)
  })
})
