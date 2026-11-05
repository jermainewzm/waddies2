//pnpm exec playwright test e2e/centre-search.spec.js

import { test, expect } from "@playwright/test"
import { futureDate } from "./helpers.js"

// finding and adding a centre
// quick check of the main path with one person (test 2 adds a friend)
test("a host creates a plan, joins and adds a centre to the picks", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("link", { name: "Start a Makan Plan" }).first().click()
  await page.getByRole("textbox", { name: "Plan name" }).click()
  await page.getByRole("textbox", { name: "Plan name" }).fill("centre search lunch")
  await page.getByRole("textbox", { name: "Date" }).fill(futureDate())
  await page.getByRole("textbox", { name: "Time" }).fill("12:30")
  await page.getByRole("button", { name: "Create plan" }).click()
  await page.getByRole("button", { name: "Go to plan lobby" }).click()
  await page.getByRole("textbox", { name: "Your name" }).click()
  await page.getByRole("textbox", { name: "Your name" }).fill("Aisha")
  await page.getByRole("textbox", { name: "Postal code" }).fill("520123")
  await page.getByRole("button", { name: "Find", exact: true }).click()
  await expect(page.getByText("Location set")).toBeVisible()
  await page.getByRole("spinbutton", { name: "Max budget per person ($)" }).fill("20")
  await page.getByRole("button", { name: "I'm in" }).click()
  await expect(page.getByText("You're in")).toBeVisible()
  await page.getByRole("button", { name: "Find a centre" }).click()
  await page.getByRole("button", { name: "+ Add to picks" }).first().click()
  await expect(page.getByRole("button", { name: "✓ Picked" }).first()).toBeVisible()
})

test("a member adds a centre and a friend sees it picked", async ({ browser }) => {
  //separate contexts so each has its own localStorage, like two different people
  test.setTimeout(90000)
  const hostContext = await browser.newContext()
  const friendContext = await browser.newContext()
  const hostPage = await hostContext.newPage()
  const friendPage = await friendContext.newPage()

  // 1. the host creates a plan and joins it
  await hostPage.goto("/")
  await hostPage.getByRole("link", { name: "Start a Makan Plan" }).first().click()
  await hostPage.getByRole("textbox", { name: "Plan name" }).fill("centre search lunch")
  await hostPage.getByRole("textbox", { name: "Date" }).fill(futureDate())
  await hostPage.getByRole("textbox", { name: "Time" }).fill("12:30")
  await hostPage.getByRole("button", { name: "Create plan" }).click()
  await expect(hostPage.getByText("Your Makan Plan code is")).toBeVisible()
  const code = (await hostPage.getByTestId("plan-code").textContent()).trim()
  await hostPage.getByRole("button", { name: "Go to plan lobby" }).click()
  await hostPage.getByRole("textbox", { name: "Your name" }).fill("Aisha")
  await hostPage.getByRole("textbox", { name: "Postal code" }).fill("520123")
  await hostPage.getByRole("button", { name: "Find", exact: true }).click()
  await expect(hostPage.getByText("Location set")).toBeVisible()
  await hostPage.getByRole("spinbutton", { name: "Max budget per person ($)" }).fill("20")
  await hostPage.getByRole("button", { name: "I'm in" }).click()
  await expect(hostPage.getByText("You're in")).toBeVisible()

  // 2. a friend joins from another browser
  await friendPage.goto(`/plan/${code}/lobby`)
  await friendPage.getByRole("textbox", { name: "Your name" }).fill("Ben")
  await friendPage.getByRole("textbox", { name: "Postal code" }).fill("520123")
  await friendPage.getByRole("button", { name: "Find", exact: true }).click()
  await expect(friendPage.getByText("Location set")).toBeVisible()
  await friendPage.getByRole("spinbutton", { name: "Max budget per person ($)" }).fill("20")
  await friendPage.getByRole("button", { name: "I'm in" }).click()
  await expect(friendPage.getByText("You're in")).toBeVisible()

  // 3. the host opens Centre Search and adds the centre that's showing
  await hostPage.getByRole("button", { name: "Find a centre" }).click()
  await expect(hostPage).toHaveURL(`/centre-search?plan=${code}`)
  const centreName = (await hostPage.locator(".centre-name").textContent()).trim()
  await hostPage.getByRole("button", { name: "+ Add to picks" }).first().click()
  await expect(hostPage.getByRole("button", { name: "✓ Picked" }).first()).toBeVisible()
  await expect(hostPage.getByRole("button", { name: "✓ Picked" }).first()).toBeDisabled()   //can't add it twice

  // 4. the friend sees a tick on that centre, but not who picked it
  await friendPage.goto(`/centre-search?plan=${code}`)
  await expect(friendPage.getByLabel("Which centre?").locator("option", { hasText: centreName }).first()).toContainText("✅")
  await expect(friendPage.getByLabel("Which centre?")).not.toContainText("Aisha")

  await hostContext.close()
  await friendContext.close()
})

test("a friend's pick shows up without reloading", async ({ browser }) => {
  test.setTimeout(90000)
  const hostContext = await browser.newContext()
  const friendContext = await browser.newContext()
  const hostPage = await hostContext.newPage()
  const friendPage = await friendContext.newPage()

  // 1. the host creates a plan and joins it
  await hostPage.goto("/")
  await hostPage.getByRole("link", { name: "Start a Makan Plan" }).first().click()
  await hostPage.getByRole("textbox", { name: "Plan name" }).fill("centre search lunch")
  await hostPage.getByRole("textbox", { name: "Date" }).fill(futureDate())
  await hostPage.getByRole("textbox", { name: "Time" }).fill("12:30")
  await hostPage.getByRole("button", { name: "Create plan" }).click()
  await expect(hostPage.getByText("Your Makan Plan code is")).toBeVisible()
  const code = (await hostPage.getByTestId("plan-code").textContent()).trim()
  await hostPage.getByRole("button", { name: "Go to plan lobby" }).click()
  await hostPage.getByRole("textbox", { name: "Your name" }).fill("Aisha")
  await hostPage.getByRole("textbox", { name: "Postal code" }).fill("520123")
  await hostPage.getByRole("button", { name: "Find", exact: true }).click()
  await expect(hostPage.getByText("Location set")).toBeVisible()
  await hostPage.getByRole("spinbutton", { name: "Max budget per person ($)" }).fill("20")
  await hostPage.getByRole("button", { name: "I'm in" }).click()
  await expect(hostPage.getByText("You're in")).toBeVisible()

  // 2. a friend joins from another browser
  await friendPage.goto(`/plan/${code}/lobby`)
  await friendPage.getByRole("textbox", { name: "Your name" }).fill("Ben")
  await friendPage.getByRole("textbox", { name: "Postal code" }).fill("520123")
  await friendPage.getByRole("button", { name: "Find", exact: true }).click()
  await expect(friendPage.getByText("Location set")).toBeVisible()
  await friendPage.getByRole("spinbutton", { name: "Max budget per person ($)" }).fill("20")
  await friendPage.getByRole("button", { name: "I'm in" }).click()
  await expect(friendPage.getByText("You're in")).toBeVisible()

  // 3. both open Centre Search
  await hostPage.getByRole("button", { name: "Find a centre" }).click()
  await friendPage.getByRole("button", { name: "Find a centre" }).click()

  // 4. the friend adds the centre that's showing
  const centreName = (await friendPage.locator(".centre-name").textContent()).trim()
  await friendPage.getByRole("button", { name: "+ Add to picks" }).first().click()
  await expect(friendPage.getByRole("button", { name: "✓ Picked" }).first()).toBeVisible()

  // 5. check that the host sees the friend's pick without reloading
  await expect(hostPage.getByLabel("Which centre?").locator("option", { hasText: centreName }).first()).toContainText("✅", { timeout: 10000 })

  await hostContext.close()
  await friendContext.close()
})

// getting to the page
test("without a plan code, the page explains it's part of a Makan Plan", async ({ page }) => {
  await page.goto("/centre-search")
  await expect(page.getByRole("heading", { name: "Centre Search is part of your Makan Plan" })).toBeVisible()
  await expect(page.getByRole("main").getByRole("link", { name: "Join a plan" })).toBeVisible()
})

test("a plan code that doesn't exist shows an error", async ({ page }) => {
  await page.goto("/centre-search?plan=000000")
  await expect(page.getByText("Plan not found")).toBeVisible()
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible()
})

test("a broken plan link (with a slash) still shows an error", async ({ page }) => {
  await page.goto("/centre-search?plan=1/2")
  await expect(page.getByText("We couldn't load this plan")).toBeVisible()
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible()
})

test("if the server can't be reached, the page says so", async ({ page }) => {
  //pretend the server is down for this test only
  await page.route("**/api/plans/**", route => route.abort())
  await page.goto("/centre-search?plan=123456")
  await expect(page.getByText("We couldn't load this plan")).toBeVisible()
})

test("the back button returns to the plan lobby", async ({ page }) => {
  // 1. create a plan and join it
  await page.goto("/")
  await page.getByRole("link", { name: "Start a Makan Plan" }).first().click()
  await page.getByRole("textbox", { name: "Plan name" }).fill("centre search lunch")
  await page.getByRole("textbox", { name: "Date" }).fill(futureDate())
  await page.getByRole("textbox", { name: "Time" }).fill("12:30")
  await page.getByRole("button", { name: "Create plan" }).click()
  await expect(page.getByText("Your Makan Plan code is")).toBeVisible()
  const code = (await page.getByTestId("plan-code").textContent()).trim()
  await page.getByRole("button", { name: "Go to plan lobby" }).click()
  await page.getByRole("textbox", { name: "Your name" }).fill("Aisha")
  await page.getByRole("textbox", { name: "Postal code" }).fill("520123")
  await page.getByRole("button", { name: "Find", exact: true }).click()
  await expect(page.getByText("Location set")).toBeVisible()
  await page.getByRole("spinbutton", { name: "Max budget per person ($)" }).fill("20")
  await page.getByRole("button", { name: "I'm in" }).click()
  await expect(page.getByText("You're in")).toBeVisible()

  // 2. open Centre Search
  await page.getByRole("button", { name: "Find a centre" }).click()

  // 3. the back link goes to the lobby
  await page.getByRole("link", { name: "Back to plan lobby" }).click()
  await expect(page).toHaveURL(`/plan/${code}/lobby`)
})

// choosing a centre and filtering
test("typing a centre's name lists it to tap", async ({ page }) => {
  // 1. create a plan and join it
  await page.goto("/")
  await page.getByRole("link", { name: "Start a Makan Plan" }).first().click()
  await page.getByRole("textbox", { name: "Plan name" }).fill("centre search lunch")
  await page.getByRole("textbox", { name: "Date" }).fill(futureDate())
  await page.getByRole("textbox", { name: "Time" }).fill("12:30")
  await page.getByRole("button", { name: "Create plan" }).click()
  await expect(page.getByText("Your Makan Plan code is")).toBeVisible()
  await page.getByRole("button", { name: "Go to plan lobby" }).click()
  await page.getByRole("textbox", { name: "Your name" }).fill("Aisha")
  await page.getByRole("textbox", { name: "Postal code" }).fill("520123")
  await page.getByRole("button", { name: "Find", exact: true }).click()
  await expect(page.getByText("Location set")).toBeVisible()
  await page.getByRole("spinbutton", { name: "Max budget per person ($)" }).fill("20")
  await page.getByRole("button", { name: "I'm in" }).click()
  await expect(page.getByText("You're in")).toBeVisible()

  // 2. open Centre Search
  await page.getByRole("button", { name: "Find a centre" }).click()

  // 3. use the centre that opened by itself
  const centreName = (await page.locator(".centre-name").textContent()).trim()

  // 4. type its name and tap it in the list (the list only shows 6, so type the whole name)
  await page.getByRole("searchbox", { name: "Type a centre name" }).fill(centreName)
  await page.getByRole("button", { name: centreName }).first().click()

  // 5. the box empties and the centre stays chosen
  await expect(page.getByRole("searchbox", { name: "Type a centre name" })).toHaveValue("")
  await expect(page.locator(".centre-name")).toHaveText(centreName)
})

test("a centre name that matches nothing says so", async ({ page }) => {
  // 1. create a plan and join it
  await page.goto("/")
  await page.getByRole("link", { name: "Start a Makan Plan" }).first().click()
  await page.getByRole("textbox", { name: "Plan name" }).fill("centre search lunch")
  await page.getByRole("textbox", { name: "Date" }).fill(futureDate())
  await page.getByRole("textbox", { name: "Time" }).fill("12:30")
  await page.getByRole("button", { name: "Create plan" }).click()
  await expect(page.getByText("Your Makan Plan code is")).toBeVisible()
  await page.getByRole("button", { name: "Go to plan lobby" }).click()
  await page.getByRole("textbox", { name: "Your name" }).fill("Aisha")
  await page.getByRole("textbox", { name: "Postal code" }).fill("520123")
  await page.getByRole("button", { name: "Find", exact: true }).click()
  await expect(page.getByText("Location set")).toBeVisible()
  await page.getByRole("spinbutton", { name: "Max budget per person ($)" }).fill("20")
  await page.getByRole("button", { name: "I'm in" }).click()
  await expect(page.getByText("You're in")).toBeVisible()

  // 2. open Centre Search
  await page.getByRole("button", { name: "Find a centre" }).click()

  // 3. type a name no centre has
  await page.getByRole("searchbox", { name: "Type a centre name" }).fill("zzz")
  await expect(page.getByText('No open centre matches "zzz"')).toBeVisible()
})

test("a dish nobody sells says no dishes match", async ({ page }) => {
  // 1. create a plan and join it
  await page.goto("/")
  await page.getByRole("link", { name: "Start a Makan Plan" }).first().click()
  await page.getByRole("textbox", { name: "Plan name" }).fill("centre search lunch")
  await page.getByRole("textbox", { name: "Date" }).fill(futureDate())
  await page.getByRole("textbox", { name: "Time" }).fill("12:30")
  await page.getByRole("button", { name: "Create plan" }).click()
  await expect(page.getByText("Your Makan Plan code is")).toBeVisible()
  await page.getByRole("button", { name: "Go to plan lobby" }).click()
  await page.getByRole("textbox", { name: "Your name" }).fill("Aisha")
  await page.getByRole("textbox", { name: "Postal code" }).fill("520123")
  await page.getByRole("button", { name: "Find", exact: true }).click()
  await expect(page.getByText("Location set")).toBeVisible()
  await page.getByRole("spinbutton", { name: "Max budget per person ($)" }).fill("20")
  await page.getByRole("button", { name: "I'm in" }).click()
  await expect(page.getByText("You're in")).toBeVisible()

  // 2. open Centre Search
  await page.getByRole("button", { name: "Find a centre" }).click()

  // 3. search for a dish nobody sells
  await page.getByLabel("Dish name").fill("zzzz")
  await expect(page.getByText("No dishes match your filters")).toBeVisible()
})

test("a max price over $100 shows an error", async ({ page }) => {
  // 1. create a plan and join it
  await page.goto("/")
  await page.getByRole("link", { name: "Start a Makan Plan" }).first().click()
  await page.getByRole("textbox", { name: "Plan name" }).fill("centre search lunch")
  await page.getByRole("textbox", { name: "Date" }).fill(futureDate())
  await page.getByRole("textbox", { name: "Time" }).fill("12:30")
  await page.getByRole("button", { name: "Create plan" }).click()
  await expect(page.getByText("Your Makan Plan code is")).toBeVisible()
  await page.getByRole("button", { name: "Go to plan lobby" }).click()
  await page.getByRole("textbox", { name: "Your name" }).fill("Aisha")
  await page.getByRole("textbox", { name: "Postal code" }).fill("520123")
  await page.getByRole("button", { name: "Find", exact: true }).click()
  await expect(page.getByText("Location set")).toBeVisible()
  await page.getByRole("spinbutton", { name: "Max budget per person ($)" }).fill("20")
  await page.getByRole("button", { name: "I'm in" }).click()
  await expect(page.getByText("You're in")).toBeVisible()

  // 2. open Centre Search
  await page.getByRole("button", { name: "Find a centre" }).click()

  // 3. type a price over the $100 limit
  await page.getByLabel("Max price in dollars").fill("200")
  await expect(page.getByText("Max price must be between")).toBeVisible()
})