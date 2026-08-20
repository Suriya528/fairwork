import { test, expect, mockAuthenticatedClient, mockAuthenticatedFreelancer } from "./fixtures"

test.describe("Production Wallet Connection & Verification Flow", () => {
  test("Settings page renders Web3WalletCard with disconnected status for new user", async ({ page }) => {
    await mockAuthenticatedClient(page, "")
    await page.goto("/settings")

    await expect(page.getByText("Connected Web3 Wallet & EIP-712 Ownership Verification")).toBeVisible()
    await expect(page.getByText("Not Connected")).toBeVisible()
    await expect(page.getByRole("button", { name: /Connect & Verify Wallet/i })).toBeVisible()
  })

  test("Wallet page renders Web3WalletCard with Sepolia test network information", async ({ page }) => {
    await mockAuthenticatedFreelancer(page, "")
    await page.goto("/wallet")

    await expect(page.getByText("Web3 Payout & Escrow Wallet")).toBeVisible()
    await expect(page.getByText("Not Connected")).toBeVisible()
  })

  test("Escrow page renders wallet verification guidance", async ({ page }) => {
    await mockAuthenticatedClient(page)
    await page.route("**/api/projects/mine", route => route.fulfill({ json: [] }))
    await page.goto("/escrow")

    await expect(page.getByText("Escrow Web3 Wallet Verification")).toBeVisible()
    await expect(page.getByText(/Your connected wallet must be verified via EIP-712/i)).toBeVisible()
  })
})
