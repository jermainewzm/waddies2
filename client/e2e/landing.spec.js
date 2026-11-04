// Landing page E2E tests: the two main buttons, the live centre status link
// Run from client/:  pnpm exec playwright test e2e/landing.spec.js

import { test, expect } from "@playwright/test"

// the main buttons
test("Start a Makan Plan goes to the create page", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("link", { name: /start a makan plan/i }).first().click()
  await expect(page).toHaveURL("/plan/new")
})

test("Join with a code goes to the join page", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("link", { name: /join with a code/i }).first().click()
  await expect(page).toHaveURL("/plan/join")
})

// live centre status
test("the live centre status section links to all centres", async ({ page }) => {
  // 1. the section is on the landing page
  await page.goto("/")
  await expect(page.getByRole("heading", { name: /live centre status/i })).toBeVisible()

  // 2. its button opens the full list of centres
  await page.getByRole("link", { name: /see all .*centres/i }).click()
  await expect(page).toHaveURL("/centres")
})


