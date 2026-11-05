//pnpm exec playwright test e2e/landing.spec.js

import { test, expect } from "@playwright/test"

// the two main links (they look like buttons)
test("Start a Makan Plan goes to the create page", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("link", { name: "Start a Makan Plan" }).first().click()
  await expect(page).toHaveURL("/plan/new")
})

test("Join with a code goes to the join page", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("link", { name: "Join with a code" }).first().click()
  await expect(page).toHaveURL("/plan/join")
})

// live centre status
test("the live centre status section links to all centres", async ({ page }) => {
  // 1. the section is on the landing page
  await page.goto("/")
  await expect(page.getByRole("heading", { name: "Live centre status" })).toBeVisible()

  // 2. its link opens the full list of centres (the number of open centres changes, so only "See all" is matched)
  await page.getByRole("link", { name: "See all" }).click()
  await expect(page).toHaveURL("/centres")
})
