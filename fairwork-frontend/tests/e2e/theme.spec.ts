import { test, expect } from "@playwright/test"

test.describe("Theme System (Dark / Light Mode)", () => {
  test("defaults to dark theme and toggles to light theme with persistence", async ({ page }) => {
    await page.goto("/")

    // Initial load should have data-theme="dark" and dark class on html
    const html = page.locator("html")
    await expect(html).toHaveAttribute("data-theme", "dark")
    await expect(html).toHaveClass(/dark/)

    // Click theme toggle button in header
    const toggleBtn = page.getByRole("button", { name: /switch to light theme/i }).first()
    await expect(toggleBtn).toBeVisible()
    await toggleBtn.click()

    // Root html should now have data-theme="light" and light class
    await expect(html).toHaveAttribute("data-theme", "light")
    await expect(html).toHaveClass(/light/)

    // Reload page to test localStorage persistence & zero-flash startup
    await page.reload()
    await expect(html).toHaveAttribute("data-theme", "light")
    await expect(html).toHaveClass(/light/)

    // Toggle back to dark theme
    const darkToggleBtn = page.getByRole("button", { name: /switch to dark theme/i }).first()
    await darkToggleBtn.click()
    await expect(html).toHaveAttribute("data-theme", "dark")
    await expect(html).toHaveClass(/dark/)
  })
})
