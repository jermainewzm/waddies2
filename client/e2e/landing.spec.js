// ANGEL — landing page: the two calls to action and the live centre preview
import { test, expect } from "@playwright/test"

test.describe("Landing page", () => {
  test("Start a Makan Plan goes to the create page", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("link", { name: /start a makan plan/i }).first().click()
    await expect(page).toHaveURL(/\/plan\/new$/)
  })

  test("Join with a code goes to the join page", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("link", { name: /join with a code/i }).first().click()
    await expect(page).toHaveURL(/\/plan\/join$/)
  })

  test("the live centre status section links to all centres", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByRole("heading", { name: /live centre status/i })).toBeVisible()
    await page.getByRole("link", { name: /see all .*centres/i }).click()
    await expect(page).toHaveURL(/\/centres$/)
  })

  test("no sideways scrolling on an iPhone-sized screen", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto("/")
    const overflow = await page.evaluate(() => document.scrollingElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(0)
  })
})
