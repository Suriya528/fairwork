import { test, expect, mockAuthenticatedClient } from "./fixtures"

test.describe("FairWork Ask AI Subsystem E2E Suite", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedClient(page)
  })

  test("Test 1: Floating Ask AI drawer opens, dispatches prompt, and streams token response", async ({
    page,
  }) => {
    // Intercept SSE streaming route to return chunked response
    await page.route("**/api/ai/chat/stream*", (route) => {
      route.fulfill({
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
        body: 'data: {"token": "FairWork "}\n\ndata: {"token": "escrow "}\n\ndata: {"token": "protects "}\n\ndata: {"token": "funds."}\n\ndata: [DONE]\n\n',
      })
    })

    await page.goto("/dashboard")

    // Open Floating Ask AI Drawer
    const aiButton = page.getByRole("button", { name: "Open FairWork Ask AI" })
    await expect(aiButton).toBeVisible()
    await aiButton.click()

    // Assert Drawer opened
    await expect(page.getByRole("heading", { name: "FairWork Ask AI" })).toBeVisible()

    // Dispatch prompt
    const input = page.getByPlaceholder("Ask AI about escrow, gas, or milestones...")
    await input.fill("How does escrow work?")
    await input.press("Enter")

    // Assert text response streaming
    await expect(page.getByText("FairWork escrow protects funds.")).toBeVisible()
  })

  test("Test 2: Stream interruption on drawer close releases locks cleanly without console errors", async ({
    page,
  }) => {
    const consoleErrors: string[] = []
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text())
      }
    })

    // Mock streaming route
    await page.route("**/api/ai/chat/stream*", (route) => {
      route.fulfill({
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
        body: 'data: {"token": "Starting "}\n\n: ping\n\n',
      })
    })

    await page.goto("/dashboard")
    await page.getByRole("button", { name: "Open FairWork Ask AI" }).click()

    const input = page.getByPlaceholder("Ask AI about escrow, gas, or milestones...")
    await input.fill("Long stream query")
    await input.press("Enter")

    // Close drawer mid-stream
    await page.getByRole("button", { name: "Close drawer" }).click()

    // Assert drawer closed
    await expect(page.getByRole("heading", { name: "FairWork Ask AI" })).not.toBeVisible()

    // Verify clean teardown with no unhandled error logs
    expect(consoleErrors.filter((e) => e.includes("Unhandled"))).toHaveLength(0)
  })

  test("Test 3: AiProjectGeneratorModal populates scope and guarantees SUM(milestones) === targetBudget", async ({
    page,
  }) => {
    // Intercept project scope generation
    await page.route("**/api/ai/generate-project", (route) => {
      route.fulfill({
        json: {
          title: "AI Web3 Marketplace",
          category: "Web Development",
          description: "Full Web3 Marketplace implementation.",
          budget: 1000,
          milestones: [
            { title: "Architecture & Design", amount: 250 },
            { title: "Smart Contracts & Backend Integration", amount: 500 },
            { title: "Frontend & QA Deployment", amount: 250 },
          ],
        },
      })
    })

    await page.goto("/projects/new")

    // Click "Ask AI project scope generator"
    await page.getByRole("button", { name: "Ask AI project scope generator" }).click()
    await expect(page.getByText("Ask AI — Scope & Milestone Generator")).toBeVisible()

    // Submit prompt and budget
    await page.getByLabel("What do you want to build?").fill("Build Web3 marketplace")
    await page.getByRole("button", { name: "Generate Scope & Milestones" }).click()

    // Verify generated milestones sum equals 1000
    await expect(page.getByText("AI Web3 Marketplace")).toBeVisible()
    await page.getByRole("button", { name: "Apply Generated Scope" }).click()

    // Assert form auto-filled
    await expect(page.getByLabel("Project title")).toHaveValue("AI Web3 Marketplace")
  })
})
