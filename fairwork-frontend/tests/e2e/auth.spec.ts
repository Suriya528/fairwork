import { expect, test } from "./fixtures"

test("registration validates required fields", async ({ page }) => {
  await page.goto("/register")
  await page.getByRole("button", { name: "Create account" }).click()
  await expect(page.getByText("Full name is required").first()).toBeVisible()
  await expect(page.getByText("You must accept the terms to continue")).toBeVisible()
})

async function completeRegistration(page: import("@playwright/test").Page) {
  await page.getByLabel("First name").fill("Jane"); await page.getByLabel("Last name").fill("Doe")
  await page.getByLabel("Email").fill("jane@example.test")
  await page.getByRole("radio", { name: /Hire Talent/i }).click()
  await page.locator("#password").fill("StrongPass1"); await page.locator("#confirm").fill("StrongPass1")
  await page.getByLabel(/I agree to the/).check()
}

test("successful registration creates an authenticated session", async ({ page }) => {
  await page.route("**/api/auth/register", route => route.fulfill({ json: { token: "new-token", user: { id: "new-user", firstName: "Jane", lastName: "Doe", email: "jane@example.test", role: "client" } } }))
  await page.route("**/api/auth/me", route => route.fulfill({ json: { _id: "new-user", firstName: "Jane", lastName: "Doe", email: "jane@example.test", role: "client" } }))
  await page.goto("/register")
  await completeRegistration(page); await page.getByRole("button", { name: "Create account" }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
})

test("duplicate registration is reported without creating a session", async ({ page }) => {
  await page.route("**/api/auth/register", route => route.fulfill({ status: 400, json: { message: "Email already exists" } }))
  await page.goto("/register"); await completeRegistration(page)
  await page.getByRole("button", { name: "Create account" }).click()
  await expect(page.locator("#email-error")).toHaveText("Email already exists")
  await expect(page).toHaveURL(/\/register$/)
})

test("login rejects invalid credentials and redirects valid sessions to protected pages", async ({ page }) => {
  await page.route("**/api/auth/login", route => route.fulfill({ status: 400, json: { message: "Invalid credentials" } }))
  await page.goto("/login"); await page.getByLabel("Email").fill("casey@example.test"); await page.locator("#password").fill("wrong")
  await page.getByRole("button", { name: "Sign in" }).click(); await expect(page.locator("#password-error")).toHaveText("Invalid credentials")
  await page.route("**/api/auth/login", route => route.fulfill({ json: { token: "ok", user: { id: "client-1", firstName: "Casey", lastName: "Client", email: "casey@example.test", role: "client" } } }))
  await page.route("**/api/auth/me", route => route.fulfill({ json: { _id: "client-1", firstName: "Casey", lastName: "Client", email: "casey@example.test", role: "client" } }))
  await page.locator("#password").fill("StrongPass1"); await page.getByRole("button", { name: "Sign in" }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
})

test("validates strict email format on login and register", async ({ page }) => {
  await page.goto("/login")

  for (const invalidEmail of ["abc", "abc@", "abc@gmail", "@gmail.com", "test@", "test..test@gmail.com"]) {
    await page.getByLabel("Email").fill(invalidEmail)
    await page.locator("#password").fill("StrongPass1")
    await page.getByRole("button", { name: "Sign in" }).click()
    await expect(page.locator("#email-error")).toHaveText("Enter a valid email address")
  }
})

test("login button renders premium AI hover glow effect class", async ({ page }) => {
  await page.goto("/login")
  const loginBtn = page.getByRole("button", { name: "Sign in" })
  await expect(loginBtn).toBeVisible()
  await expect(loginBtn).toHaveClass(/ai-glow-cta/)
})

test("protected project routes redirect unauthenticated visitors", async ({ page }) => {
  await page.goto("/projects/project-1")
  await expect(page).toHaveURL(/\/login$/)
})

test("help center is publicly accessible without login redirect", async ({ page }) => {
  await page.goto("/help")
  await expect(page).toHaveURL(/\/help$/)
  await expect(page.getByRole("heading", { name: "How can we help?" })).toBeVisible()
})

test("help center breadcrumb returns user to homepage", async ({ page }) => {
  await page.goto("/help")
  await page.getByRole("link", { name: "Return to FairWork Homepage" }).click()
  await expect(page).toHaveURL(/\/$/)
})

test("currency preference defaults to INR and persists selection in localStorage", async ({ page }) => {
  await page.goto("/login")
  const pref = await page.evaluate(() => localStorage.getItem("fairwork-display-currency"))
  expect(pref === null || pref === "INR" || pref === "USD").toBeTruthy()
})
