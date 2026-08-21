import { test, expect, mockAuthenticatedClient, mockAuthenticatedFreelancer } from "./fixtures"

test.describe("Production Wallet Discovery & Verification Flow", () => {
  test("No wallet provider detected opens NoWalletModal with official MetaMask installation guidance", async ({ page }) => {
    await mockAuthenticatedClient(page, "")
    await page.goto("/settings")

    await expect(page.getByText("Connected Web3 Wallet & EIP-712 Ownership Verification")).toBeVisible()
    
    // Click Connect Wallet without an injected Web3 provider
    const connectButton = page.getByRole("button", { name: "Connect Wallet" })
    await expect(connectButton).toBeVisible()
    await connectButton.click()

    // NoWalletModal opens with accessible heading and guidance
    await expect(page.getByRole("heading", { name: "No compatible wallet detected" })).toBeVisible()
    await expect(page.getByText(/FairWork never asks for or stores private keys/i)).toBeVisible()
    await expect(page.getByText(/Create or import a wallet inside MetaMask/i)).toBeVisible()

    // Check official MetaMask link
    const installLink = page.getByRole("link", { name: /Install MetaMask/i }).first()
    await expect(installLink).toBeVisible()
    await expect(installLink).toHaveAttribute("href", "https://metamask.io/download/")
    await expect(installLink).toHaveAttribute("target", "_blank")

    // Test clicking "I've Installed MetaMask" button triggers re-detection and shows refresh fallback
    await page.getByRole("button", { name: /I've Installed MetaMask/i }).click()
    await expect(page.getByText(/MetaMask still isn't detected. If you just installed it, refresh this page/i)).toBeVisible()
    await expect(page.getByRole("button", { name: "Refresh Page" })).toBeVisible()
  })

  test("Injected Web3 EVM provider enables normal connection and network display", async ({ page }) => {
    // Inject mock EVM provider into page context
    await page.addInitScript(() => {
      ;(window as any).ethereum = {
        isMetaMask: true,
        request: async ({ method }: { method: string }) => {
          if (method === "eth_accounts") return ["0x1234567890abcdef1234567890abcdef12345678"]
          if (method === "eth_chainId") return "0xaa36a7" // Sepolia (11155111)
          if (method === "eth_requestAccounts") return ["0x1234567890abcdef1234567890abcdef12345678"]
          return null
        },
        on: () => {},
        removeListener: () => {},
      }
    })

    await mockAuthenticatedFreelancer(page, "")
    await page.goto("/wallet")

    await expect(page.getByText("Web3 Payout & Escrow Wallet")).toBeVisible()
    await expect(page.getByText("Sepolia (11155111)")).toBeVisible()
    await expect(page.getByText("Verification Required")).toBeVisible()
    await expect(page.getByRole("button", { name: /Sign EIP-712 Verification/i })).toBeVisible()
  })

  test("Escrow page renders wallet verification guidance", async ({ page }) => {
    await mockAuthenticatedClient(page)
    await page.route("**/api/projects/mine", (route) => route.fulfill({ json: [] }))
    await page.goto("/escrow")

    await expect(page.getByText("Escrow Web3 Wallet Verification")).toBeVisible()
    await expect(page.getByText(/Your connected wallet must be verified via EIP-712/i)).toBeVisible()
  })
})
