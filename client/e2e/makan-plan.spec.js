import { test, expect } from "@playwright/test"

test("two people can create a plan, join it and start swiping", async ({ browser }) => {
  //separate contexts so each has its own localStorage, like two different people
  test.setTimeout(90000)
  const hostContext = await browser.newContext()
  const friendContext = await browser.newContext()
  const hostPage = await hostContext.newPage()
  const friendPage = await friendContext.newPage()

  // 1. the host creates a plan
  await hostPage.goto("/")
  await hostPage.getByRole("link", { name: /start a makan plan/i }).first().click()
  await hostPage.getByRole("textbox", { name: /plan name/i }).fill("saturday lunch")
  await hostPage.getByRole("textbox", { name: /date/i }).fill("2026-12-26")
  await hostPage.getByRole("textbox", { name: /time/i }).fill("12:30")
  await hostPage.getByRole("button", { name: /create plan/i }).click()

  // 2. a 6-digit code comes back
  await expect(hostPage.getByText(/your makan plan code is/i)).toBeVisible()
  const code = (await hostPage.getByTestId("plan-code").textContent()).trim()
  expect(code).toMatch(/^\d{6}$/)

  // 3. the host joins their own plan, dropping a pin on the map
  await hostPage.getByRole("button", { name: /go to plan lobby/i }).click()
  await hostPage.getByRole("textbox", { name: /your name/i }).fill("Aisha")

  await expect(hostPage.locator("#map")).toBeVisible()
  await hostPage.locator("#map").click({
    position: { x: 150, y: 150 }
  })
  await expect(hostPage.getByText(/location set/i)).toBeVisible()

  await hostPage.getByRole("spinbutton", { name: /budget/i }).fill("20")
  await hostPage.getByRole("button", { name: /i'm in/i }).click()
  await expect(hostPage.getByText(/you're in/i)).toBeVisible()

  // 4. a friend joins with the code from another location
  await friendPage.goto(`/plan/${code}/lobby`)
  await friendPage.getByRole("textbox", { name: /your name/i }).fill("Ben")
  await friendPage.getByRole("textbox", { name: /postal code/i }).fill("520123")
  await friendPage.getByRole("button", { name: /find/i }).click()
  await expect(friendPage.getByText(/location set/i)).toBeVisible()

  await friendPage.getByRole("spinbutton", { name: /budget/i }).fill("15")
  await friendPage.getByRole("button", { name: /i'm in/i }).click()
  await expect(friendPage.getByText(/you're in/i)).toBeVisible()

  // 5. the host's lobby picks up the new member within 10s
  await expect(hostPage.getByText(/^ben$/i)).toBeVisible({ timeout: 10000 })

  // 6. only the host can start, and both land on the swipe page
  await hostPage.getByRole("button", { name: /start swiping/i }).click()
  await expect(friendPage.getByRole("button", { name: /start swiping/i })).not.toBeVisible()

  // check that both host and friend go to the swipe page for this plan.  
  await expect(hostPage).toHaveURL(`/plan/${code}/swipe`, {
    timeout: 30000
  })
  await expect(friendPage).toHaveURL(`/plan/${code}/swipe`, {
    timeout: 30000
  })

  await hostContext.close()
  await friendContext.close()
})
