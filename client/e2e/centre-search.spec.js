//pnpm exec playwright test e2e/centre-search.spec.js

import { test, expect } from "@playwright/test"
import { futureDate, createPlanViaApi, joinViaApi, actAsMember } from "./helpers.js"

// helpers
//the host creates a plan on the website and joins it as memberName; returns the 6-digit code
async function createPlanAndJoin(page, memberName) {
  await page.goto("/")
  await page.getByRole("link", { name: /start a makan plan/i }).first().click()
  await page.getByRole("textbox", { name: /plan name/i }).fill("centre search lunch")
  await page.getByRole("textbox", { name: /date/i }).fill(futureDate())
  await page.getByRole("textbox", { name: /time/i }).fill("12:30")
  await page.getByRole("button", { name: /create plan/i }).click()

  await expect(page.getByText(/your makan plan code is/i)).toBeVisible()
  const code = (await page.getByTestId("plan-code").textContent()).trim()
  expect(code).toMatch(/^\d{6}$/)

  await page.getByRole("button", { name: /go to plan lobby/i }).click()
  await joinInLobby(page, memberName)
  return code
}

//someone already on the lobby page fills in the form: their name, a pin on the map, a budget
async function joinInLobby(page, memberName) {
  await page.getByRole("textbox", { name: /your name/i }).fill(memberName)

  await expect(page.locator("#map")).toBeVisible()
  await page.locator("#map").click({
    position: { x: 150, y: 150 }
  })
  await expect(page.getByText(/location set/i)).toBeVisible()

  await page.getByRole("spinbutton", { name: /budget/i }).fill("20")
  await page.getByRole("button", { name: /i'm in/i }).click()
  await expect(page.getByText(/you're in/i)).toBeVisible()
}

// finding and adding a centre
test("a member finds a centre from the lobby and a friend sees it picked", async ({ browser }) => {
  //separate contexts so each has its own localStorage, like two different people
  test.setTimeout(90000)   //two people join through the website, same as makan-plan.spec.js
  const hostContext = await browser.newContext()
  const friendContext = await browser.newContext()
  const hostPage = await hostContext.newPage()
  const friendPage = await friendContext.newPage()

  try {
    // 1. the host creates a plan on the website and joins it (first to join = host)
    const code = await createPlanAndJoin(hostPage, "Aisha")

    // 2. a friend opens the lobby link in another browser and joins too
    await friendPage.goto(`/plan/${code}/lobby`)
    await joinInLobby(friendPage, "Ben")

    // 3. the host taps "Find a centre" and lands on Centre Search
    await hostPage.getByRole("button", { name: /find a centre/i }).click()
    await expect(hostPage).toHaveURL(`/centre-search?plan=${code}`)

    // 4. the nearest centre opens by itself, the host adds it
    const centreName = (await hostPage.locator(".centre-name").textContent()).trim()
    await hostPage.getByRole("button", { name: /add to picks/i }).first().click()
    await expect(hostPage.getByRole("button", { name: /picked/i }).first()).toBeVisible()
    await expect(hostPage.getByRole("button", { name: /picked/i }).first()).toBeDisabled()   //can't add it twice

    // 5. the friend opens Centre Search and sees a tick, but not who picked it
    await friendPage.goto(`/centre-search?plan=${code}`)
    await expect(friendPage.getByLabel(/which centre/i).locator("option", { hasText: centreName }).first()).toContainText("✅")
    await expect(friendPage.getByLabel(/which centre/i)).not.toContainText("Aisha")
  } finally {
    //close both browsers even if a check above fails
    await hostContext.close()
    await friendContext.close()
  }
})

test("a friend's pick shows up without reloading", async ({ browser, request }) => {
  test.setTimeout(30000)
  const hostContext = await browser.newContext()
  const friendContext = await browser.newContext()
  const hostPage = await hostContext.newPage()
  const friendPage = await friendContext.newPage()

  try {
    // 1. both people are on Centre Search, looking at the same centre
    const code = await createPlanViaApi(request)
    const hostId = await joinViaApi(request, code, "Aisha")
    const friendId = await joinViaApi(request, code, "Ben")
    await actAsMember(hostPage, code, hostId)
    await actAsMember(friendPage, code, friendId)
    await hostPage.goto(`/centre-search?plan=${code}`)
    await friendPage.goto(`/centre-search?plan=${code}`)

    // 2. the friend adds the centre
    await friendPage.getByRole("button", { name: /add to picks/i }).first().click()
    await expect(friendPage.getByRole("button", { name: /picked/i }).first()).toBeVisible()

    // 3. the host's page checks every 5 seconds, so within 10 it shows as picked
    await expect(hostPage.getByRole("button", { name: /picked/i }).first()).toBeVisible({ timeout: 10000 })
  } finally {
    await hostContext.close()
    await friendContext.close()
  }
})

// getting to the page
test("without a plan code, the page explains it's part of a Makan Plan", async ({ page }) => {
  await page.goto("/centre-search")
  await expect(page.getByRole("heading", { name: /part of your makan plan/i })).toBeVisible()
  await expect(page.getByRole("main").getByRole("link", { name: /join a plan/i })).toBeVisible()
})

test("a plan code that doesn't exist shows an error", async ({ page }) => {
  await page.goto("/centre-search?plan=000000")
  await expect(page.getByText(/plan not found|no plan/i)).toBeVisible()
  await expect(page.getByRole("heading", { name: /page not found/i })).toBeVisible()
})

test("a broken plan link (with a slash) still shows an error", async ({ page }) => {
  await page.goto("/centre-search?plan=1/2")
  await expect(page.getByText(/couldn't load|can't reach/i)).toBeVisible()
  await expect(page.getByRole("heading", { name: /page not found/i })).toBeVisible()
})

test("if the server can't be reached, the page says so", async ({ page }) => {
  //pretend the server is down for this test only
  await page.route("**/api/plans/**", route => route.abort())
  await page.goto("/centre-search?plan=123456")
  await expect(page.getByText(/couldn't load|can't reach/i)).toBeVisible()
})

test("the back button returns to the plan lobby", async ({ page, request }) => {
  const code = await createPlanViaApi(request)
  const me = await joinViaApi(request, code, "Aisha")
  await actAsMember(page, code, me)
  await page.goto(`/centre-search?plan=${code}`)

  await page.getByRole("link", { name: /back to plan lobby/i }).click()
  await expect(page).toHaveURL(`/plan/${code}/lobby`)
})

// choosing a centre and filtering
test("typing part of a centre's name lists it to tap", async ({ page, request }) => {
  const code = await createPlanViaApi(request)
  const me = await joinViaApi(request, code, "Aisha")
  await actAsMember(page, code, me)
  await page.goto(`/centre-search?plan=${code}`)

  // 1. use the centre that opened by itself
  const centreName = (await page.locator(".centre-name").textContent()).trim()

  // 2. type its name and tap it in the list (the list only shows 6, so type the whole name)
  await page.getByRole("searchbox", { name: /type a centre name/i }).fill(centreName)
  await page.getByRole("button", { name: centreName }).first().click()

  // 3. the box empties and the centre stays chosen
  await expect(page.getByRole("searchbox", { name: /type a centre name/i })).toHaveValue("")
  await expect(page.locator(".centre-name")).toHaveText(centreName)
})

test("a centre name that matches nothing says so", async ({ page, request }) => {
  const code = await createPlanViaApi(request)
  const me = await joinViaApi(request, code, "Aisha")
  await actAsMember(page, code, me)
  await page.goto(`/centre-search?plan=${code}`)

  await page.getByRole("searchbox", { name: /type a centre name/i }).fill("zzz")
  await expect(page.getByText(/no open centre matches "zzz"/i)).toBeVisible()
})

test("a dish nobody sells says no dishes match", async ({ page, request }) => {
  const code = await createPlanViaApi(request)
  const me = await joinViaApi(request, code, "Aisha")
  await actAsMember(page, code, me)
  await page.goto(`/centre-search?plan=${code}`)

  await page.getByLabel("Dish name").fill("zzzz")
  await expect(page.getByText(/no dishes match your filters/i)).toBeVisible()
})

test("a max price over $100 shows an error", async ({ page, request }) => {
  const code = await createPlanViaApi(request)
  const me = await joinViaApi(request, code, "Aisha")
  await actAsMember(page, code, me)
  await page.goto(`/centre-search?plan=${code}`)

  await page.getByLabel("Max price in dollars").fill("200")
  await expect(page.getByText(/max price must be between/i)).toBeVisible()
})

// phones
test("on a phone, the Add bar at the bottom works", async ({ page, request }) => {
  await page.setViewportSize({ width: 375, height: 667 })   //iPhone 6 size
  const code = await createPlanViaApi(request)
  const me = await joinViaApi(request, code, "Aisha")
  await actAsMember(page, code, me)
  await page.goto(`/centre-search?plan=${code}`)

  // the big laptop button is hidden on phones, so this is the bar's button
  const addBar = page.locator(".add-bar").getByRole("button")
  await expect(addBar).toHaveText(/add to picks/i)
  await addBar.click()
  await expect(addBar).toHaveText(/picked/i)
})

// when swiping starts
test("members still on Centre Search are sent to swiping when the host starts", async ({ page, request }) => {
  test.setTimeout(30000)
  const code = await createPlanViaApi(request)
  const hostId = await joinViaApi(request, code, "Aisha")
  const friendId = await joinViaApi(request, code, "Ben")

  // 1. the friend is on Centre Search
  await actAsMember(page, code, friendId)
  await page.goto(`/centre-search?plan=${code}`)
  await expect(page.getByRole("searchbox", { name: /type a centre name/i })).toBeVisible()

  // 2. the host starts swiping
  const start = await request.post(`/api/plans/${code}/start`, { data: { memberId: hostId } })
  expect(start.ok()).toBeTruthy()

  // 3. the page checks every 5 seconds, so allow up to 10
  await expect(page).toHaveURL(`/plan/${code}/swipe`, { timeout: 10000 })
})

test("someone who never joined is sent to the plan page once swiping has started", async ({ page, request }) => {
  test.setTimeout(30000)
  const code = await createPlanViaApi(request)
  const hostId = await joinViaApi(request, code, "Aisha")
  await joinViaApi(request, code, "Ben")
  const start = await request.post(`/api/plans/${code}/start`, { data: { memberId: hostId } })
  expect(start.ok()).toBeTruthy()

  await page.goto(`/centre-search?plan=${code}`)
  await expect(page).toHaveURL(`/plan/${code}`)
})

// the server's rules for adding
test("the server refuses strangers, duplicates and late picks", async ({ request }) => {
  test.setTimeout(30000)
  const code = await createPlanViaApi(request)
  const hostId = await joinViaApi(request, code, "Aisha")
  await joinViaApi(request, code, "Ben")

  // an open centre on the plan's date
  const list = await (await request.get(`/api/centre-search/centres?date=${futureDate()}`)).json()
  const open = list.centres.filter(c => c.is_open)
  expect(open.length).toBeGreaterThan(1)   //needs 2 open centres in the test database
  const pick = { serialNo: String(open[0].serialNo), added_by: "Aisha", member_id: hostId }

  // 1. someone who hasn't joined can't add (403)
  const stranger = await request.post(`/api/plans/${code}/shortlist`, {
    data: { ...pick, member_id: "000000000000000000000000" }
  })
  expect(stranger.status()).toBe(403)

  // 2. the same centre can't be added twice (409)
  expect((await request.post(`/api/plans/${code}/shortlist`, { data: pick })).ok()).toBeTruthy()
  expect((await request.post(`/api/plans/${code}/shortlist`, { data: pick })).status()).toBe(409)

  // 3. nothing can be added after swiping starts (400)
  const start = await request.post(`/api/plans/${code}/start`, { data: { memberId: hostId } })
  expect(start.ok()).toBeTruthy()
  const late = await request.post(`/api/plans/${code}/shortlist`, {
    data: { ...pick, serialNo: String(open[1].serialNo) }
  })
  expect(late.status()).toBe(400)
})