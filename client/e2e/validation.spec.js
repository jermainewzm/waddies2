import { test, expect } from "@playwright/test"
import { futureDate } from "./helpers.js"

test("an unknown page shows the NotFoundView.vue page", async ({ page }) => {
  // 1. go to a page that doesn't exist
  await page.goto("/this-page-does-not-exist")

  // 2. the 404 page shows
  await expect(page.getByRole("heading", { name: /page not found/i })).toBeVisible()

  // 3. the button takes you back home
  await page.getByRole("link", { name: /back to home/i }).click()
  await expect(page).toHaveURL("/")
})

test("a code that isn't 6 digits will be invalid", async ({ page }) => {
  // 1. type a code that's too short
  await page.goto("/plan/join")
  await page.getByRole("textbox", { name: /plan code/i }).fill("123")
  await page.getByRole("button", { name: /join plan/i }).click()

  // 2. the error shows and we stay on the join page
  await expect(page.getByText(/please enter the 6-digit code/i)).toBeVisible()
  await expect(page).toHaveURL("/plan/join")
})

test("a 6-digit code that doesn't exist shows an error", async ({ page }) => {
  await page.goto("/plan/join")
  await page.getByRole("textbox", { name: /plan code/i }).fill("999999")
  await page.getByRole("button", { name: /join plan/i }).click()

  //the server says no such plan
  await expect(page.getByText(/plan not found/i)).toBeVisible()
  await expect(page).toHaveURL("/plan/join")
})

test("visiting a lobby for a plan that doesn't exist shows an error", async ({ page }) => {
  // 1. open the lobby of a plan that doesn't exist
  await page.goto("/plan/999999/lobby")

  // 2. the lobby explains what went wrong
  await expect(page.getByRole("heading", { name: /couldn't load your plan/i })).toBeVisible()
  await expect(page.getByText(/couldn't find a plan with that code/i)).toBeVisible()

  // 3. the button takes you to enter another code
  await page.getByRole("link", { name: /enter another code/i }).click()
  await expect(page).toHaveURL("/plan/join")
})

test("a budget under $5 shows an error in the lobby", async ({ page }) => {
  // 1. create a plan 
  await page.goto("/")
  await page.getByRole("link", { name: /start a makan plan/i }).first().click()
  await page.getByRole("textbox", { name: /plan name/i }).fill("saturday lunch")
  await page.getByRole("textbox", { name: /date/i }).fill(futureDate())
  await page.getByRole("textbox", { name: /time/i }).fill("12:30")
  await page.getByRole("button", { name: /create plan/i }).click()

  await expect(page.getByTestId("plan-code")).toBeVisible()

  // 2. open the lobby
  await page.getByRole("button", { name: /go to plan lobby/i }).click()

  // 3. type a budget below the minimum
  await page.getByRole("spinbutton", { name: /budget/i }).fill("3")

  // 4. error message should be visible
  await expect(page.getByText(/budget must be between \$5 and \$100/i)).toBeVisible()

  // 5. the join button stays disabled
  await expect(page.getByRole("button", { name: /i'm in/i })).toBeDisabled()
})

