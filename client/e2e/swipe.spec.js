import { test, expect } from "@playwright/test"
import { futureDate } from "./helpers.js"

test("two people who both say yes to every centre see the same winner", async ({ browser }) => {
  //setup, swiping and the 5 second refreshes take longer than the default 30s
  test.setTimeout(150000)

  //separate contexts so each has its own localStorage, like two different people
  const hostContext = await browser.newContext()
  const friendContext = await browser.newContext()
  const hostPage = await hostContext.newPage()
  const friendPage = await friendContext.newPage()

  // 1. the host creates a plan
  await hostPage.goto("/")
  await hostPage.getByRole("link", { name: /start a makan plan/i }).first().click()
  await hostPage.getByRole("textbox", { name: /plan name/i }).fill("saturday lunch")
  await hostPage.getByRole("textbox", { name: /date/i }).fill(futureDate())
  await hostPage.getByRole("textbox", { name: /time/i }).fill("12:30")
  await hostPage.getByRole("button", { name: /create plan/i }).click()

  await expect(hostPage.getByText(/your makan plan code is/i)).toBeVisible()

  const code = (await hostPage.getByTestId("plan-code").textContent()).trim()
  expect(code).toMatch(/^\d{6}$/)

  // 2. the host joins their own plan, dropping a pin on the map
  await hostPage.getByRole("button", { name: /go to plan lobby/i }).click()
  await hostPage.getByRole("textbox", { name: /your name/i }).fill("Aisha")

  await expect(hostPage.locator("#map")).toBeVisible()
  await hostPage.locator("#map").click({ position: { x: 150, y: 150 } })
  await expect(hostPage.getByText(/location set/i)).toBeVisible()

  await hostPage.getByRole("spinbutton", { name: /budget/i }).fill("20")
  await hostPage.getByRole("button", { name: /i'm in/i }).click()
  await expect(hostPage.getByText(/you're in/i)).toBeVisible()

  // 3. a friend joins with the code, from somewhere else on the island
  await friendPage.goto("/plan/join")
  await friendPage.getByRole("textbox", { name: /code/i }).fill(code)
  await friendPage.getByRole("button", { name: /join/i }).click()
  await expect(friendPage).toHaveURL(`/plan/${code}/lobby`)
  
  await friendPage.getByRole("textbox", { name: /your name/i }).fill("Ben")
  await friendPage.getByRole("textbox", { name: /postal code/i }).fill("520123")
  await friendPage.getByRole("button", { name: /find/i }).click()
  await expect(friendPage.getByText(/location set/i)).toBeVisible()

  await friendPage.getByRole("spinbutton", { name: /budget/i }).fill("15")
  await friendPage.getByRole("button", { name: /i'm in/i }).click()
  await expect(friendPage.getByText(/you're in/i)).toBeVisible()

  // 4. the host starts once the friend shows up, and both land on the swipe page
  await expect(hostPage.getByText(/^ben$/i)).toBeVisible({ timeout: 10000 })
  await hostPage.getByRole("button", { name: /start swiping/i }).click()

  await expect(hostPage).toHaveURL(`/plan/${code}/swipe`, {
     timeout: 30000 
    })
  await expect(friendPage).toHaveURL(`/plan/${code}/swipe`, {
     timeout: 30000 
    })

  // 5. how many cards there are  for eg "Centre 1 of 5", which changes from plan to plan
  // \d+ matches 1 or more digit
  // (\d+/) is DIFFERENT from \d+/. without brackets we get 1 item only. with brackets, the digit comes back as a seperate item at [1]
  const hostCounter = hostPage.getByTestId("swipe-counter")
   await expect(hostCounter).toBeVisible({ timeout: 30000 })

  const total = Number((await hostCounter.textContent()).match(/of (\d+)/)[1])

  // 6. the host says yes to every centre, then waits for the friend
  for (let i = 1; i <= total; i++) {
    await expect(hostCounter).toHaveText(`Centre ${i} of ${total}`)
    await hostPage.getByRole("button", { name: /i'm in/i }).click()
  }

  await expect(hostPage.getByRole("heading", { name: /you're done/i })).toBeVisible()
  await expect(hostPage.getByText(/1 of 2 finished/i)).toBeVisible()

  // 7. the friend says yes to every centre too (same plan, so the same cards)
  const friendCounter = friendPage.getByTestId("swipe-counter")

  for (let i = 1; i <= total; i++) {
    await expect(friendCounter).toHaveText(`Centre ${i} of ${total}`)
    await friendPage.getByRole("button", { name: /i'm in/i }).click()
  }

  // 8. both see a winner that 2 of 2 said yes to (the host's page refreshes every 5s)
  await expect(hostPage.getByRole("heading", { name: /you're all heading to/i })).toBeVisible({ timeout: 10000 })
  await expect(friendPage.getByRole("heading", { name: /you're all heading to/i })).toBeVisible({ timeout: 10000 })
  await expect(hostPage.getByText("2 of 2", { exact: true })).toBeVisible()

  // 9. both are sent to the same centre
  const hostWinner = await hostPage
    .getByTestId("winner-name")
    .textContent()

  const friendWinner = await friendPage
    .getByTestId("winner-name")
    .textContent()

  expect(friendWinner).toBe(hostWinner)

  await hostPage.getByRole("button", { name: /take me there/i }).click()

  //10. Host goes to JourneyPage.vue for the winning centre
  await expect(hostPage).toHaveURL(`/plan/${code}/journey`)
  await expect(hostPage.getByRole("heading", { name: /journey summary/i })).toBeVisible()

  //11. OneMap loads the route for the host
  await expect(hostPage.getByText(/total travel time/i)).toBeVisible({ timeout: 20000 })
  await expect(hostPage.getByRole("button", { name: /public transport/i })).toBeVisible()
  await expect(hostPage.getByRole("button", { name: /driving/i })).toBeVisible()

  // 12. Host presses "See live seats", which opens the live status page for the winning centre
  await hostPage.getByRole("link", { name: /see live seats/i }).click()
  await expect(hostPage).toHaveURL(/\/centres\/\w+$/)
  await expect(hostPage.getByText(hostWinner.trim())).toBeVisible()

  // 13. the friend sees their own route too
  await friendPage.getByRole("button", { name: /take me there/i }).click()
  await expect(friendPage).toHaveURL(`/plan/${code}/journey`)
  await expect(friendPage.getByText(/total travel time/i)).toBeVisible({ timeout: 20000 })

  await hostContext.close()
  await friendContext.close()
})

test("two people who skip every centre will see no match", async ({ browser }) => {
  test.setTimeout(90000)

  const hostContext = await browser.newContext()
  const friendContext = await browser.newContext()
  const hostPage = await hostContext.newPage()
  const friendPage = await friendContext.newPage()

  // 1. the host creates a plan
  await hostPage.goto("/")
  await hostPage.getByRole("link", { name: /start a makan plan/i }).first().click()
  await hostPage.getByRole("textbox", { name: /plan name/i }).fill("saturday lunch")
  await hostPage.getByRole("textbox", { name: /date/i }).fill(futureDate())
  await hostPage.getByRole("textbox", { name: /time/i }).fill("12:30")
  await hostPage.getByRole("button", { name: /create plan/i }).click()

  await expect(hostPage.getByText(/your makan plan code is/i)).toBeVisible({ timeout: 15000 })

  const code = (await hostPage.getByTestId("plan-code").textContent()).trim()
  expect(code).toMatch(/^\d{6}$/)

  // 2. the host joins their own plan, dropping a pin on the map
  await hostPage.getByRole("button", { name: /go to plan lobby/i }).click()
  await hostPage.getByRole("textbox", { name: /your name/i }).fill("Aisha")

  await expect(hostPage.locator("#map")).toBeVisible()
  await hostPage.locator("#map").click({ position: { x: 150, y: 150 } })
  await expect(hostPage.getByText(/location set/i)).toBeVisible()

  await hostPage.getByRole("spinbutton", { name: /budget/i }).fill("20")
  await hostPage.getByRole("button", { name: /i'm in/i }).click()
  await expect(hostPage.getByText(/you're in/i)).toBeVisible()

  // 3. a friend joins with the code, from somewhere else on the island
  await friendPage.goto("/plan/join")
  await friendPage.getByRole("textbox", { name: /code/i }).fill(code)
  await friendPage.getByRole("button", { name: /join/i }).click()
  await expect(friendPage).toHaveURL(`/plan/${code}/lobby`)

  await friendPage.getByRole("textbox", { name: /your name/i }).fill("Ben")
  await friendPage.getByRole("textbox", { name: /postal code/i }).fill("520123")
  await friendPage.getByRole("button", { name: /find/i }).click()
  await expect(friendPage.getByText(/location set/i)).toBeVisible()

  await friendPage.getByRole("spinbutton", { name: /budget/i }).fill("15")
  await friendPage.getByRole("button", { name: /i'm in/i }).click()
  await expect(friendPage.getByText(/you're in/i)).toBeVisible()

  // 4. the host starts once the friend shows up, and both land on the swipe page
  await expect(hostPage.getByText(/^ben$/i)).toBeVisible({ timeout: 10000 }) //waits for Ben to join before host starts
  await hostPage.getByRole("button", { name: /start swiping/i }).click()

  await expect(hostPage).toHaveURL(`/plan/${code}/swipe`, {
    timeout: 30000
  })
  await expect(friendPage).toHaveURL(`/plan/${code}/swipe`, {
    timeout: 30000
  })

  // 5. how many cards there are, eg "Centre 1 of 5", which changes from plan to plan
  const hostCounter = hostPage.getByTestId("swipe-counter")
  await expect(hostCounter).toBeVisible()

  const total = Number((await hostCounter.textContent()).match(/of (\d+)/)[1])

  // 6. the host skips every centre, then waits for the friend
  for (let i = 1; i <= total; i++) {
    await expect(hostCounter).toHaveText(`Centre ${i} of ${total}`)
    await hostPage.getByRole("button", { name: /skip/i }).click()
  }

  await expect(hostPage.getByRole("heading", { name: /you're done/i })).toBeVisible()
  await expect(hostPage.getByText(/1 of 2 finished/i)).toBeVisible()

  // 7. the friend skips every centre too (same plan, so the same cards)
  const friendCounter = friendPage.getByTestId("swipe-counter")

  for (let i = 1; i <= total; i++) {
    await expect(friendCounter).toHaveText(`Centre ${i} of ${total}`)
    await friendPage.getByRole("button", { name: /skip/i }).click()
  }

  // 8. nobody said yes, so both see no match (the host's page refreshes every 5s)
  await expect(hostPage.getByRole("heading", { name: /no match this time/i })).toBeVisible({ timeout: 10000 })
  await expect(friendPage.getByRole("heading", { name: /no match this time/i })).toBeVisible({ timeout: 10000 })

  // 9. there's no winner to go to, so no "Take me there!" button
  await expect(hostPage.getByRole("button", { name: /take me there/i })).toBeHidden()

  await hostContext.close()
  await friendContext.close()
})