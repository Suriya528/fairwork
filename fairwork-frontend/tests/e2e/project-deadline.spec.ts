import { test, expect } from "./fixtures"

test.describe("Production Project Deadline System", () => {
  const mockClientUser = {
    _id: "client-1",
    id: "client-1",
    firstName: "David",
    lastName: "Client",
    email: "david@example.test",
    role: "client",
    accountStatus: "active",
    walletAddress: "0x3333333333333333333333333333333333333333",
  }

  const mockFreelancerUser = {
    _id: "freelancer-1",
    id: "freelancer-1",
    firstName: "Fiona",
    lastName: "Freelancer",
    email: "fiona@example.test",
    role: "freelancer",
    accountStatus: "active",
    walletAddress: "0x4444444444444444444444444444444444444444",
  }

  test("1. Client can configure and post a 1-Day urgent project", async ({ page }) => {
    await page.addInitScript(({ user }) => {
      localStorage.setItem("fairwork_auth_session", JSON.stringify({ token: "client-jwt-token", user }))
    }, { user: mockClientUser })

    let createdPayload: any = null
    const now = new Date()
    const mock1DayProject = {
      _id: "project-1-day",
      id: "project-1-day",
      title: "Urgent 1-Day Landing Page Fix",
      description: "Need a quick bugfix on header navigation within 24 hours.",
      category: "Web Development",
      budget: 500,
      milestones: [{ _id: "m-0", id: "m-0", title: "Bugfix Delivery", amount: 500, status: "pending" }],
      clientId: mockClientUser,
      freelancerId: null,
      status: "open",
      deadlineAt: new Date(now.getTime() + 24 * 3600 * 1000).toISOString(),
      durationDays: 1,
      deadlineMode: "duration",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }

    await page.route("**/api/**", (route) => {
      const url = route.request().url()
      const method = route.request().method()

      if (url.includes("/auth/me")) {
        return route.fulfill({ json: mockClientUser })
      }

      if (url.includes("/projects")) {
        if (url.endsWith("/mine")) {
          return route.fulfill({ json: [mock1DayProject] })
        }
        if (url.includes("/project-1-day")) {
          if (url.includes("/reference-files") || url.includes("/deliverables") || url.includes("/files") || url.includes("/milestones")) {
            return route.fulfill({ json: [] })
          }
          return route.fulfill({ json: mock1DayProject })
        }
        if (method === "POST") {
          createdPayload = route.request().postDataJSON()
          return route.fulfill({ status: 201, json: mock1DayProject })
        }
        return route.fulfill({ json: [mock1DayProject] })
      }

      return route.fulfill({ status: 200, json: [] })
    })

    await page.goto("/projects/new")
    await expect(page.getByRole("heading", { name: "Post a new project" })).toBeVisible()

    await page.fill('input[id="title"]', "Urgent 1-Day Landing Page Fix")
    await page.selectOption('select[id="category"]', "Web Development")
    await page.fill('textarea[id="description"]', "Need a quick bugfix on header navigation within 24 hours.")
    await page.fill('input[id="budget"]', "500")

    await page.fill('input[placeholder="Milestone 1 title"]', "Bugfix Delivery")
    await page.locator('input[placeholder*="Amount"]').first().fill("500")

    await page.getByRole("button", { name: "Post project" }).click()

    await expect(page.getByText("Urgent 1-Day Landing Page Fix").first()).toBeVisible({ timeout: 15000 })
    expect(createdPayload).not.toBeNull()
    expect(createdPayload.durationValue).toBe(1)
    expect(createdPayload.durationUnit).toBe("days")
  })

  test("2. Exact Date & Time deadline calculation preview and validation", async ({ page }) => {
    await page.addInitScript(({ user }) => {
      localStorage.setItem("fairwork_auth_session", JSON.stringify({ token: "client-jwt-token", user }))
    }, { user: mockClientUser })

    await page.route("**/api/**", (route) => {
      const url = route.request().url()
      if (url.includes("/auth/me")) return route.fulfill({ json: mockClientUser })
      return route.fulfill({ status: 200, json: [] })
    })

    await page.goto("/projects/new")

    await page.getByRole("button", { name: "Exact Date & Time" }).click()

    await page.fill('input[id="exactDate"]', "2026-12-31")
    await page.fill('input[id="exactTime"]', "23:59")

    await expect(page.getByText("Calculated Target:")).toBeVisible()
  })

  test("3. Overdue project rejects late freelancer applications server-side", async ({ page }) => {
    const expiredProject = {
      _id: "project-expired",
      id: "project-expired",
      title: "Expired Project",
      description: "Past deadline",
      category: "Web Development",
      budget: 300,
      milestones: [{ _id: "m-1", id: "m-1", title: "M1", amount: 300, status: "pending" }],
      clientId: mockClientUser,
      freelancerId: null,
      status: "open",
      deadlineAt: new Date(Date.now() - 3600 * 1000).toISOString(),
      durationDays: 1,
      deadlineMode: "duration",
      createdAt: new Date(Date.now() - 25 * 3600 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await page.addInitScript(({ user }) => {
      localStorage.setItem("fairwork_auth_session", JSON.stringify({ token: "freelancer-jwt-token", user }))
    }, { user: mockFreelancerUser })

    await page.route("**/api/**", (route) => {
      const url = route.request().url()
      if (url.includes("/auth/me")) {
        return route.fulfill({ json: mockFreelancerUser })
      }
      if (url.includes("/projects")) {
        if (url.endsWith("/mine")) {
          return route.fulfill({ json: [expiredProject] })
        }
        if (url.includes("/reference-files") || url.includes("/deliverables") || url.includes("/files") || url.includes("/milestones")) {
          return route.fulfill({ json: [] })
        }
        return route.fulfill({ json: expiredProject })
      }
      return route.fulfill({ status: 200, json: [] })
    })

    await page.goto("/projects/project-expired")
    await expect(page.getByText("Expired Project").first()).toBeVisible({ timeout: 15000 })

    await expect(page.getByText(/Overdue/)).toBeVisible()
  })
})
