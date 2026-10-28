import { test, expect } from "@playwright/test"

test("Host can create a plan, get a 6-digit code and join using the map.", async ({ page }) => {
  await page.goto('/');
  await page.getByRole("link", { name: /start a makan plan/i }).first().click()
  await page.getByRole("textbox", { name: /plan name/i }).fill("saturday lunch")
  await page.getByRole("textbox", { name: /date/i }).fill("2026-12-26")
  await page.getByRole("textbox", { name: /time/i }).fill("12:30")
  await page.getByRole("button", { name: /create plan/i }).click()

  await expect(page.getByText(/your makan plan code is/i)).toBeVisible()

  await expect(page.locator(".alert-success strong")).toHaveText(/^\d{6}$/)

  await page.getByRole('button', { name: /go to plan lobby/i }).click();
  await page.getByRole("textbox", { name: /your name/i }).fill("Aisha")

  // Set location by clicking the Leaflet map instead of postal
  await expect(page.locator("#map")).toBeVisible()
  await page.locator("#map").click({ position: { x: 150, y: 150 } })

  // Check that the location has been set
  await expect(page.getByText(/location set/i)).toBeVisible()

  await page.getByRole('spinbutton', { name: 'Max budget per person ($)' }).fill('20')
  await page.getByRole('button', { name: /i'm in/i }).click()

  // Check that the host joined
  await expect(page.getByText(/you're in/i)).toBeVisible()
  await expect(page.getByText(/^aisha$/i)).toBeVisible()
})
