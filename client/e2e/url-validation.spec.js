//for testing typed URLs
import { test, expect } from "@playwright/test"
import { createPlanViaApi, joinViaApi, actAsMember } from "./helpers.js"

test.describe("URLs typed by hand", () => {
  test("a stale member id does not cause a redirect loop", async ({ page, request }) => {
    test.setTimeout(10000)
    const code = await createPlanViaApi(request)
    const host = await joinViaApi(request, code, "Host")
    await joinViaApi(request, code, "Friend")
    await request.post(`/api/plans/${code}/start`, { data: { memberId: host } })
    await actAsMember(page, code, "0000000000000000000000ff")   // not in this plan

    let navigations = 0
    page.on("framenavigated", f => { if (f === page.mainFrame()) navigations++ })
    await page.goto(`/plan/${code}`)
    await expect(page.getByText(/too late/i)).toBeVisible()
    expect(navigations).toBeLessThan(4)
  })

  test("a fake plan code says Plan not found", async ({ page }) => {
    test.setTimeout(10000)
    await page.goto("/plan/999999")
    await expect(page.getByText(/plan not found|couldn.t find/i)).toBeVisible()
  })

  test("the journey page explains why there is no route yet", async ({ page, request }) => {
    test.setTimeout(10000)
    const code = await createPlanViaApi(request)
    const me = await joinViaApi(request, code, "Aisha")
    await actAsMember(page, code, me)
    await page.goto(`/plan/${code}/journey`)
    await expect(page.getByText(/hasn.t picked a centre yet/i)).toBeVisible()
  })

  test("leaving the swipe page does not pull you back", async ({ page, request }) => {
    test.setTimeout(10000)
    const code = await createPlanViaApi(request)
    const host = await joinViaApi(request, code, "Host")
    await joinViaApi(request, code, "Friend")
    await request.post(`/api/plans/${code}/start`, { data: { memberId: host } })
    await page.route("**/cards**", async r => { await new Promise(s => setTimeout(s, 800)); await r.continue() })

    await page.goto(`/plan/${code}/swipe`)         // not a member -> sent to the lobby
    await page.getByRole("link", { name: /centres/i }).first().click()
    await expect(page).toHaveURL(/\/centres$/)
    await page.waitForTimeout(6000)                 // the old 5 s timer would fire here
    await expect(page).toHaveURL(/\/centres$/)
  })
})