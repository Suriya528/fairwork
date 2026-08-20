import { test, expect } from "@playwright/test"

test.setTimeout(90000)

test("Contract generation, detailed legal document view, and dual signature flow", async ({ request, page }) => {
  const timestamp = Date.now()
  const clientEmail = `client_contract_${timestamp}@example.test`
  const freelancerEmail = `freelancer_contract_${timestamp}@example.test`
  const password = "Password123!"

  // 1. Register Client via API
  const regClient = await request.post("http://localhost:5000/api/auth/register", {
    data: {
      firstName: "Alice",
      lastName: "Client",
      email: clientEmail,
      password: password,
      role: "client",
    },
  })
  expect(regClient.status()).toBe(201)
  const clientData = await regClient.json()
  const clientToken = clientData.token

  // 2. Register Freelancer via API
  const regFreelancer = await request.post("http://localhost:5000/api/auth/register", {
    data: {
      firstName: "Bob",
      lastName: "Developer",
      email: freelancerEmail,
      password: password,
      role: "freelancer",
    },
  })
  expect(regFreelancer.status()).toBe(201)
  const freelancerData = await regFreelancer.json()
  const freelancerToken = freelancerData.token

  // 3. Create Project as Client
  const createProj = await request.post("http://localhost:5000/api/projects", {
    headers: { Authorization: `Bearer ${clientToken}` },
    data: {
      title: `E2E Contract Project ${timestamp}`,
      description: "Comprehensive legal agreement testing project scope.",
      budget: 1500,
      category: "web_development",
      milestones: [
        { order: 1, title: "Milestone 1 Core Development", amount: 1000 },
        { order: 2, title: "Milestone 2 QA & Delivery", amount: 500 },
      ],
    },
  })
  expect(createProj.status()).toBe(201)
  const proj = await createProj.json()

  // 4. Submit Proposal as Freelancer
  const apply = await request.post("http://localhost:5000/api/applications", {
    headers: { Authorization: `Bearer ${freelancerToken}` },
    data: {
      projectId: proj._id || proj.id,
      proposedAmount: 1500,
      estimatedDelivery: "7 days",
      proposalText: "Ready to build this with full quality.",
    },
  })
  expect(apply.status()).toBe(201)
  const appData = await apply.json()

  // 5. Client Accepts Application (Hires Freelancer)
  const hire = await request.post(`http://localhost:5000/api/applications/${appData._id || appData.id}/accept`, {
    headers: { Authorization: `Bearer ${clientToken}` },
  })
  expect(hire.status()).toBe(200)

  // 6. Client Generates Contract via API
  const genContract = await request.post("http://localhost:5000/api/contracts/generate", {
    headers: { Authorization: `Bearer ${clientToken}` },
    data: {
      projectId: proj._id || proj.id,
      freelancerId: freelancerData.user.id || freelancerData.user._id,
    },
  })
  expect(genContract.status()).toBe(201)
  const contract = await genContract.json()

  // 7. Client UI Login & Contract Document View Check
  await page.goto("/login")
  await page.getByLabel("Email").fill(clientEmail)
  await page.locator("#password").fill(password)
  await page.getByRole("button", { name: /Sign in/i }).click()
  await page.waitForURL("**/dashboard")

  await page.goto("/contracts")
  await expect(page.getByRole("heading", { name: `E2E Contract Project ${timestamp}` })).toBeVisible()
  await expect(page.getByRole("paragraph").filter({ hasText: "Alice Client" }).first()).toBeVisible()
  await expect(page.getByRole("paragraph").filter({ hasText: "Bob Developer" }).first()).toBeVisible()
  await expect(page.getByText("Ref ID:").first()).toBeVisible()

  // 8. Client Signs Contract in UI
  const signButton = page.getByRole("button", { name: /Sign Contract \(as Client\)/i })
  await expect(signButton).toBeVisible()
  await signButton.click()

  // 9. Instant Signature Update Verification
  await expect(page.getByText(/Your Signature Recorded/i)).toBeVisible()

  // 10. Freelancer Logs in and Signs Contract
  await page.evaluate(() => localStorage.clear())
  await page.goto("/login")
  await page.getByLabel("Email").fill(freelancerEmail)
  await page.locator("#password").fill(password)
  await page.getByRole("button", { name: /Sign in/i }).click()
  await page.waitForURL("**/dashboard")

  await page.goto("/contracts")
  const freelancerSignButton = page.getByRole("button", { name: /Sign Contract \(as Freelancer\)/i })
  await expect(freelancerSignButton).toBeVisible()
  await freelancerSignButton.click()

  // 11. Fully Executed Agreement Verification
  await expect(page.getByText("✓ BINDING LEGAL AGREEMENT")).toBeVisible()
  await expect(page.getByText(/Fully Executed Agreement/i)).toBeVisible()
})
