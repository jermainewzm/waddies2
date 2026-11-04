// Centre Search E2E tests. Needs the server running on a TEST database (each test makes its own plan).
// Run from client/:  pnpm exec playwright test e2e/centre-search.spec.js

import { test, expect } from "@playwright/test"
import { futureDate, createPlanViaApi, joinViaApi, actAsMember } from "./helpers.js"

// finding and adding a centre
test("a member finds a centre from the lobby and a friend sees it picked", async ({ browser, request }) => {
  //separate contexts so each has its own localStorage, like two different people
  test.setTimeout(60000)
  const hostContext = await browser.newContext()
  const friendContext = await browser.newContext()
  const hostPage = await hostContext.newPage()
  const friendPage = await friendContext.newPage()

  // 1. a new plan
  const code = await createPlanViaApi(request, "centre search lunch")

  // 2. the host joins first in the lobby by tapping the map (first to join = host)
  await hostPage.goto(`/plan/${code}/lobby`)
  await hostPage.getByRole("textbox", { name: /your name/i }).fill("Aisha")
  await expect(hostPage.locator("#map")).toBeVisible()
  await hostPage.locator("#map").click({ position: { x: 150, y: 150 } })
  await expect(hostPage.getByText(/location set/i)).toBeVisible()
  await hostPage.getByRole("spinbutton", { name: /budget/i }).fill("20")
  await hostPage.getByRole("button", { name: /i'm in/i }).click()
  await expect(hostPage.getByText(/you're in/i)).toBeVisible()
  const friendId = await joinViaApi(request, code, "Ben")   //a friend joins after the host

  // 3. the host taps "Find a centre" and lands on Centre Search
  await hostPage.getByRole("button", { name: /find a centre/i }).click()
  await expect(hostPage).toHaveURL(`/centre-search?plan=${code}`)

  // 4. the nearest centre opens by itself, the host adds it
  const centreName = (await hostPage.locator(".centre-name").textContent()).trim()
  await hostPage.getByRole("button", { name: /add to picks/i }).first().click()
  await expect(hostPage.getByRole("button", { name: /picked/i }).first()).toBeVisible()
  await expect(hostPage.getByRole("button", { name: /picked/i }).first()).toBeDisabled()   //can't add it twice

  // the server saved it on the plan's shortlist
  const plan = await (await request.get(`/api/plans/${code}`)).json()
  expect(plan.shortlist).toHaveLength(1)

  // 5. the friend opens Centre Search on their own phone and sees a tick, but not who picked it
  await actAsMember(friendPage, code, friendId)
  await friendPage.goto(`/centre-search?plan=${code}`)
  await expect(friendPage.getByLabel(/which centre/i).locator("option", { hasText: centreName }).first()).toContainText("✅")
  await expect(friendPage.getByLabel(/which centre/i)).not.toContainText("Aisha")

  await hostContext.close()
  await friendContext.close()
})

test("a friend's pick shows up without reloading", async ({ browser, request }) => {
  test.setTimeout(30000)
  const hostContext = await browser.newContext()
  const friendContext = await browser.newContext()
  const hostPage = await hostContext.newPage()
  const friendPage = await friendContext.newPage()

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

  await hostContext.close()
  await friendContext.close()
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
