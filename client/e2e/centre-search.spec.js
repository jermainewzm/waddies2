// E2E tests for Centre Search (Angel)
//
// What these cover (the Centre Search user journey):
//   1. getting to the page: no plan, a fake plan, a broken link
//   2. choosing a centre: typed search, no match
//   3. filters: dish name, max price
//   4. adding a centre to the group's picks (laptop button + phone bar), real-time for friends
//   5. leaving: back to the lobby, sent to swiping when the host starts
//   6. the server's rules for adding (join first, no duplicates, locked after swiping starts)
//
// How they stay repeatable:
//   - every test makes its OWN plan and members through the API (no old codes, no order between tests)
//   - the centre is picked from whatever the server says is open on the plan's date (no hard-coded centre)
//   - no fixed waits: every check waits for something to appear (expect / toPass)
//
// Needs: the server running on a TEST database (tests create plans), then `pnpm test:e2e`.

import { test, expect } from "@playwright/test"
import { futureDate } from "./helpers.js"   //shared helpers (30 days ahead, so tests never expire)

const PLAN_DATE = futureDate()   //30 days from today, from the shared helpers.js
const HOME = { lat: 1.2803, lng: 103.8451 } //near Tanjong Pagar, lots of centres around

// ---------------------------------------------------------------- helpers (arrange)

//one person joins a plan, the same data the lobby form sends; returns their member id
async function addMember(request, code, name) {
  const response = await request.post(`/api/plans/${code}/members`, {
    data: { name, ...HOME, diet: "any", budget: 10 }
  })
  expect(response.ok(), `joining as ${name}`).toBeTruthy()
  const plan = await response.json()
  return plan.members[plan.members.length - 1]._id
}

//a fresh plan with a host and a friend (swiping needs 2+ people)
async function makePlan(request) {
  const response = await request.post("/api/plans", {
    data: { name: "e2e centre search", date: PLAN_DATE, time: "12:30" }
  })
  expect(response.ok(), "creating the plan").toBeTruthy()
  const plan = await response.json()
  const hostId = await addMember(request, plan.code, "Angel")
  const friendId = await addMember(request, plan.code, "Zhe Ming")
  return { code: plan.code, hostId, friendId }
}

//a centre the server says is open on the plan's date (so the test doesn't depend on one centre)
async function findOpenCentre(request) {
  const response = await request.get(`/api/centre-search/centres?date=${PLAN_DATE}`)
  expect(response.ok()).toBeTruthy()
  const { centres } = await response.json()
  const open = centres.filter(centre => centre.is_open)
  expect(open.length, "at least one open centre in the test database").toBeGreaterThan(0)
  return open[0]
}

//this browser acts as a member who already joined (PlanLobby saves the same key)
async function actAs(page, code, memberId) {
  await page.addInitScript(([key, value]) => {
    localStorage.setItem(key, value)
  }, [`memberId-${code}`, memberId])
}

//the search box, the way a user (or screen reader) finds it: by its label
function searchBox(page) {
  return page.getByRole("searchbox", { name: /type a centre name/i })
}

//types the first letters of a centre's name and taps it in the list underneath
async function chooseByTyping(page, centre) {
  await searchBox(page).fill(centre.name.slice(0, 4))
  await page.getByRole("button", { name: centre.name }).first().click()
  await expect(page.locator("#centre-select option:checked")).toContainText(centre.name)
}

//the Add button that's showing: the big one on laptops, the bottom bar on phones
function addButton(page) {
  return page.getByRole("button", { name: /add to/i }).filter({ visible: true }).first()
}

//the "already picked" button ("✓ Picked" on laptop and phone)
function pickedButton(page) {
  return page.getByRole("button", { name: /picked/i }).filter({ visible: true }).first()
}

//asks the server for the plan's shortlist
async function shortlistOf(request, code) {
  const plan = await (await request.get(`/api/plans/${code}`)).json()
  return plan.shortlist.map(pick => String(pick.serialNo))
}

// ---------------------------------------------------------------- 1. getting to the page

test.describe("Centre Search: opening the page", () => {
  test("CS-01 without a plan code, explains it's part of a Makan Plan", async ({ page }) => {
    await page.goto("/centre-search")
    await expect(page.getByRole("heading", { name: /part of your makan plan/i })).toBeVisible()
    //scoped to the page body: the header also has a "Start a plan" link
    const main = page.getByRole("main")
    await expect(main.getByRole("link", { name: /join a plan/i })).toBeVisible()
    await expect(main.getByRole("link", { name: /start a plan/i })).toBeVisible()
  })

  test("CS-02 a plan code that doesn't exist shows an error, not a blank page", async ({ page }) => {
    await page.goto("/centre-search?plan=000000")
    await expect(page.getByText(/plan not found|no plan/i)).toBeVisible()
    await expect(page.getByRole("heading", { name: /page not found/i })).toBeVisible()   //the team's Not Found page
  })

  test("CS-03 a broken plan link (with a slash) still shows an error", async ({ page }) => {
    //instructors edit URLs by hand; this used to give a blank page
    await page.goto("/centre-search?plan=1/2")
    await expect(page.getByText(/couldn't load|can't reach/i)).toBeVisible()
    await expect(page.getByRole("heading", { name: /page not found/i })).toBeVisible()
  })

  test("CS-04 the back button returns to the plan lobby", async ({ page, request }) => {
    const { code, hostId } = await makePlan(request)
    await actAs(page, code, hostId)
    await page.goto(`/centre-search?plan=${code}`)

    await page.getByRole("link", { name: /back to plan lobby/i }).click()
    await expect(page).toHaveURL(new RegExp(`/plan/${code}/lobby$`))
  })
})

// ---------------------------------------------------------------- 2 + 3. choosing a centre and filtering

test.describe("Centre Search: choosing a centre", () => {
  let plan

  test.beforeEach(async ({ page, request }) => {
    plan = await makePlan(request)
    await actAs(page, plan.code, plan.hostId)
    await page.goto(`/centre-search?plan=${plan.code}`)
  })

  test("CS-05 typing part of a name lists matching centres to tap", async ({ page, request }) => {
    const centre = await findOpenCentre(request)

    await chooseByTyping(page, centre)

    //the box empties after choosing, ready for the next search
    await expect(searchBox(page)).toHaveValue("")
  })

  test("CS-06 a name that matches nothing says so", async ({ page }) => {
    await searchBox(page).fill("zzz")
    await expect(page.getByText(/no open centre matches "zzz"/i)).toBeVisible()
  })

  test("CS-07 a dish nobody sells says no dishes match", async ({ page }) => {
    await page.getByLabel("Dish name").fill("zzzz")
    await expect(page.getByText(/no dishes match your filters/i)).toBeVisible()
  })

  test("CS-08 an impossible max price is caught before anything is sent", async ({ page }) => {
    await page.getByLabel("Max price in dollars").fill("200")
    await expect(page.getByText(/max price must be between/i)).toBeVisible()
  })
})

// ---------------------------------------------------------------- 4. adding a centre

test.describe("Centre Search: adding to the group's picks", () => {
  test("CS-09 a member adds a centre and the server saves it", async ({ page, request }) => {
    const { code, hostId } = await makePlan(request)
    const centre = await findOpenCentre(request)
    await actAs(page, code, hostId)
    await page.goto(`/centre-search?plan=${code}`)

    await test.step("choose the centre and press Add", async () => {
      await chooseByTyping(page, centre)
      await addButton(page).click()
    })

    await test.step("the button changes to picked and can't be pressed again", async () => {
      await expect(pickedButton(page)).toBeVisible()
      await expect(pickedButton(page)).toBeDisabled()
    })

    await test.step("the server has it on the shortlist", async () => {
      await expect(async () => {
        expect(await shortlistOf(request, code)).toContain(String(centre.serialNo))
      }).toPass({ timeout: 5000 })
    })
  })

  test("CS-10 a friend's pick shows up on my screen without reloading", async ({ page, request }) => {
    const { code, hostId, friendId } = await makePlan(request)
    const centre = await findOpenCentre(request)

    //I'm looking at the centre...
    await actAs(page, code, hostId)
    await page.goto(`/centre-search?plan=${code}`)
    await chooseByTyping(page, centre)
    await expect(addButton(page)).toBeEnabled()

    //...when my friend adds it from their phone
    const response = await request.post(`/api/plans/${code}/shortlist`, {
      data: { serialNo: String(centre.serialNo), added_by: "Zhe Ming", member_id: friendId }
    })
    expect(response.ok()).toBeTruthy()

    //the page refreshes every 5 seconds, so within 10 it shows as picked
    await expect(pickedButton(page)).toBeVisible({ timeout: 10000 })
  })

  test.describe("on a phone (iPhone 6 size)", () => {
    test.use({ viewport: { width: 375, height: 667 } })

    test("CS-11 the Add bar at the bottom of the screen works", async ({ page, request }) => {
      const { code, hostId } = await makePlan(request)
      const centre = await findOpenCentre(request)
      await actAs(page, code, hostId)
      await page.goto(`/centre-search?plan=${code}`)

      await chooseByTyping(page, centre)
      await expect(addButton(page)).toHaveText(/add to picks/i) //the phone bar's wording
      await addButton(page).click()

      await expect(pickedButton(page)).toBeVisible()
      await expect(async () => {
        expect(await shortlistOf(request, code)).toContain(String(centre.serialNo))
      }).toPass({ timeout: 5000 })
    })
  })
})

// ---------------------------------------------------------------- 5. when swiping starts

test.describe("Centre Search: when the host starts swiping", () => {
  test("CS-12 members still on Centre Search are sent to the swipe page", async ({ page, request }) => {
    const { code, hostId, friendId } = await makePlan(request)
    await actAs(page, code, friendId)
    await page.goto(`/centre-search?plan=${code}`)
    await expect(searchBox(page)).toBeVisible()

    const start = await request.post(`/api/plans/${code}/start`, { data: { memberId: hostId } })
    expect(start.ok()).toBeTruthy()

    //the page checks every 5 seconds, so allow up to 10
    await expect(page).toHaveURL(new RegExp(`/plan/${code}/swipe`), { timeout: 10000 })
  })
})

test.describe("Centre Search: picks and closed plans", () => {
  test("CS-16 a picked centre gets a ✅ in the dropdown, without saying who added it", async ({ page, request }) => {
    const { code, hostId, friendId } = await makePlan(request)
    const centre = await findOpenCentre(request)
    const added = await request.post(`/api/plans/${code}/shortlist`, {
      data: { serialNo: String(centre.serialNo), added_by: "Zhe Ming", member_id: friendId }
    })
    expect(added.ok()).toBeTruthy()

    await actAs(page, code, hostId)
    await page.goto(`/centre-search?plan=${code}`)

    //the centre can be in both "Suggested" and "All open centres", so check every copy of it
    const options = page.locator(`#centre-select option[value="${centre.serialNo}"]`)
    await expect(options.first()).toContainText(`✅`)
    await expect(options.last()).toContainText(`✅`)
    await expect(page.locator("#centre-select")).not.toContainText("Zhe Ming")   //picks stay anonymous, so nobody is biased
  })

  test("CS-17 someone who isn't a member is sent to the plan page once swiping has started", async ({ page, request }) => {
    const { code, hostId } = await makePlan(request)
    const start = await request.post(`/api/plans/${code}/start`, { data: { memberId: hostId } })
    expect(start.ok()).toBeTruthy()

    //this browser never joined, so it goes to the plan page (which says "Too late!"), not the swipe page
    await page.goto(`/centre-search?plan=${code}`)
    await expect(page).toHaveURL(new RegExp(`/plan/${code}$`))
  })
})

// ---------------------------------------------------------------- 6. the server's rules (API level)

test.describe("Adding a centre: server rules", () => {
  test("CS-13 someone who hasn't joined can't add a centre (403)", async ({ request }) => {
    const { code } = await makePlan(request)
    const centre = await findOpenCentre(request)
    const response = await request.post(`/api/plans/${code}/shortlist`, {
      data: { serialNo: String(centre.serialNo), added_by: "Stranger", member_id: "000000000000000000000000" }
    })
    expect(response.status()).toBe(403)
  })

  test("CS-14 the same centre can't be added twice (409)", async ({ request }) => {
    const { code, hostId } = await makePlan(request)
    const centre = await findOpenCentre(request)
    const pick = { serialNo: String(centre.serialNo), added_by: "Angel", member_id: hostId }

    const first = await request.post(`/api/plans/${code}/shortlist`, { data: pick })
    expect(first.ok()).toBeTruthy()

    const second = await request.post(`/api/plans/${code}/shortlist`, { data: pick })
    expect(second.status()).toBe(409)
    expect((await second.json()).error).toMatch(/already on the shortlist/i)
  })

  test("CS-15 centres can't be added after swiping starts (400)", async ({ request }) => {
    const { code, hostId } = await makePlan(request)
    const centre = await findOpenCentre(request)
    const start = await request.post(`/api/plans/${code}/start`, { data: { memberId: hostId } })
    expect(start.ok()).toBeTruthy()

    const response = await request.post(`/api/plans/${code}/shortlist`, {
      data: { serialNo: String(centre.serialNo), added_by: "Angel", member_id: hostId }
    })
    expect(response.status()).toBe(400)
  })
})
