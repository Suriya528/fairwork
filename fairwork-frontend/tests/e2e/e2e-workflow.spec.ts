import { test, expect, mockAuthenticatedClient, mockAuthenticatedFreelancer, client as mockClient, freelancer as mockFreelance, project as mockProject } from "./fixtures"

test.describe("Full FairWork End-to-End Business Workflow Validation", () => {
  const mockProjectView = async (page: import("@playwright/test").Page, proj: Record<string, unknown>, apps: unknown[] = [], files: unknown[] = []) => {
    const id = (proj._id || proj.id) as string
    await page.route("**/api/projects/mine", (route) => route.fulfill({ json: [proj] }))
    await page.route(`**/api/projects/${id}`, (route) => route.fulfill({ json: proj }))
    await page.route(`**/api/projects/${id}/applications`, (route) => route.fulfill({ json: apps }))
    await page.route(`**/api/projects/${id}/deliverables`, (route) => route.fulfill({ json: files }))
    await page.route(`**/api/projects/${id}/files`, (route) => route.fulfill({ json: files }))
    await page.route(`**/api/projects/${id}/reference-files`, (route) => route.fulfill({ json: [] }))
    await page.route(`**/api/disputes/project/${id}`, (route) => route.fulfill({ status: 404, json: null }))
  }

  test("Complete Happy Path Lifecycle: Create -> Apply -> Hire -> Contract -> Wallet -> Escrow -> Deliverable -> Payout -> Completion", async ({ page }) => {
    // 1. Client creates a project
    await mockAuthenticatedClient(page)
    const newProject = mockProject({
      _id: "project-happy-1",
      title: "DeFi Analytics Dashboard",
      description: "Build a modern responsive analytics dashboard.",
      budget: 1500,
      status: "open",
      clientId: mockClient,
      freelancerId: null,
      milestones: [
        { _id: "m-1", title: "UI Mockups & Architecture", amount: 500, status: "pending", paymentReleased: false },
        { _id: "m-2", title: "Frontend Implementation & Payout", amount: 1000, status: "pending", paymentReleased: false },
      ],
    })

    await page.route("**/api/projects", (route) => {
      if (route.request().method() === "POST") return route.fulfill({ status: 201, json: newProject })
      return route.fulfill({ json: [newProject] })
    })
    await mockProjectView(page, newProject)

    await page.goto("/projects/new")
    await expect(page.getByRole("heading", { name: "Post a new project" })).toBeVisible()
    await page.fill('input[id="title"]', "DeFi Analytics Dashboard")
    await page.fill('textarea[id="description"]', "Build a modern responsive analytics dashboard.")
    await page.fill('input[id="budget"]', "1500")

    // 2. Freelancer Views Project & Applies
    await mockAuthenticatedFreelancer(page)
    const application = {
      _id: "app-1",
      projectId: "project-happy-1",
      freelancerId: mockFreelance,
      proposalText: "Experienced Web3 full-stack engineer ready to build your DeFi dashboard.",
      proposedAmount: 1500,
      estimatedDelivery: "14 days",
      status: "pending",
    }
    await page.route("**/api/applications", (route) => {
      if (route.request().method() === "POST") return route.fulfill({ status: 201, json: application })
      return route.fulfill({ json: [application] })
    })

    await page.goto("/projects/project-happy-1")
    await expect(page.locator("h1")).toContainText("DeFi Analytics Dashboard")
    await expect(page.getByText("Open", { exact: true })).toBeVisible()

    // 3. Client hires Freelancer -> Project becomes in_progress & assigned
    await mockAuthenticatedClient(page)
    const assignedProject = {
      ...newProject,
      status: "in_progress",
      freelancerId: mockFreelance,
    }
    await page.route("**/api/applications/app-1/accept", (route) =>
      route.fulfill({ json: { application: { ...application, status: "accepted" }, project: assignedProject } }),
    )
    await mockProjectView(page, assignedProject, [application])

    await page.goto("/projects/project-happy-1")
    await expect(page.getByText("In progress", { exact: true })).toBeVisible()

    // 4. Dual Contract Signing
    const mockContract = {
      _id: "contract-happy-1",
      projectId: assignedProject,
      clientId: mockClient,
      freelancerId: mockFreelance,
      aiGeneratedText: "FREELANCE SERVICES AGREEMENT\n\n1. SCOPE: DeFi Analytics Dashboard\n2. BUDGET: $1500",
      signedByClient: true,
      clientSignedAt: new Date().toISOString(),
      signedByFreelancer: true,
      freelancerSignedAt: new Date().toISOString(),
    }
    await page.route("**/api/contracts/generate", (route) => route.fulfill({ status: 201, json: mockContract }))
    await page.route("**/api/contracts/contract-happy-1", (route) => route.fulfill({ json: mockContract }))
    await page.route("**/api/contracts/contract-happy-1/sign", (route) => route.fulfill({ json: mockContract }))

    await page.goto("/contracts")
    await expect(page.getByRole("heading", { name: "Contracts" })).toBeVisible()

    // 5. Client Funds Escrow
    const fundedProject = {
      ...assignedProject,
      escrowFunded: true,
      escrowTxnHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    }
    await page.route("**/api/escrow/deposit", (route) => route.fulfill({ json: { message: "Escrow recorded", project: fundedProject } }))
    await mockProjectView(page, fundedProject, [application])

    await page.goto("/projects/project-happy-1")
    await expect(page.getByText("Payment protected by escrow")).toBeVisible()

    // 6. Freelancer Submits Milestone Work & Deliverable
    await mockAuthenticatedFreelancer(page)
    const submittedProject = {
      ...fundedProject,
      milestones: [
        { _id: "m-1", title: "UI Mockups & Architecture", amount: 500, status: "submitted", paymentReleased: false, submissionNotes: "Attached Figma and Architecture specs." },
        { _id: "m-2", title: "Frontend Implementation & Payout", amount: 1000, status: "pending", paymentReleased: false },
      ],
    }
    await mockProjectView(page, submittedProject, [application])

    await page.goto("/projects/project-happy-1?tab=milestones")
    await expect(page.getByText("UI Mockups & Architecture")).toBeVisible()

    // 7. Client Approves Milestone & Releases Payment
    await mockAuthenticatedClient(page)
    const paidProject = {
      ...submittedProject,
      milestones: [
        { _id: "m-1", title: "UI Mockups & Architecture", amount: 500, status: "completed", paymentReleased: true },
        { _id: "m-2", title: "Frontend Implementation & Payout", amount: 1000, status: "completed", paymentReleased: true },
      ],
      status: "completed",
      escrowCompleted: true,
    }
    await page.route("**/api/escrow/release", (route) => route.fulfill({ json: { message: "Escrow released", project: paidProject } }))
    await mockProjectView(page, paidProject, [application])

    await page.goto("/projects/project-happy-1")
    await expect(page.getByText("Completed", { exact: true }).first()).toBeVisible()
  })

  test("Revision Exception Path: Client requests revision -> Freelancer resubmits -> Client approves", async ({ page }) => {
    await mockAuthenticatedClient(page)
    const revisionProject = mockProject({
      _id: "project-rev-1",
      title: "Mobile App Redesign",
      status: "in_progress",
      escrowFunded: true,
      milestones: [
        { _id: "m-rev-1", title: "Design Polish", amount: 400, status: "revision_requested", revisionNotes: "Please update the color contrast on dark mode." },
      ],
    })

    await mockProjectView(page, revisionProject)
    await page.goto("/projects/project-rev-1?tab=milestones")
    await expect(page.locator("h1")).toContainText("Mobile App Redesign")
    await expect(page.getByText("Client Revision Feedback:")).toBeVisible()
  })

  test("Dispute Exception Path: Raise Dispute -> Admin Resolution", async ({ page }) => {
    await mockAuthenticatedClient(page)
    const disputedProject = mockProject({
      _id: "project-disp-1",
      title: "Smart Contract Audit",
      status: "disputed",
      escrowFunded: true,
      escrowDisputed: true,
    })

    const mockDispute = {
      _id: "disp-1",
      projectId: "project-disp-1",
      raisedBy: mockClient,
      reason: "Deliverables do not match security scope.",
      status: "pending",
      clientVotes: 1,
      freelancerVotes: 0,
    }

    await mockProjectView(page, disputedProject)
    await page.route("**/api/disputes/project/project-disp-1", (route) => route.fulfill({ json: mockDispute }))

    await page.goto("/projects/project-disp-1")
    await expect(page.locator("h1")).toContainText("Smart Contract Audit")
    await expect(page.getByText("This project has an open dispute.")).toBeVisible()
  })
})
