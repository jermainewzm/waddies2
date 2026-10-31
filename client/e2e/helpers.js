// e2e/helpers.js — shared setup so every test makes its own data (repeatable, order-independent)
import { expect } from "@playwright/test"

// a date 30 days from today, so the tests never "expire"
export function futureDate(days = 30) {
  const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  return d.toISOString().slice(0, 10)
}

// create a plan through the API (fast) and return its 6-digit code
export async function createPlanViaApi(request, name = "e2e lunch") {
  const res = await request.post("/api/plans", { data: { name, date: futureDate(), time: "12:30" } })
  expect(res.ok()).toBeTruthy()
  return (await res.json()).code
}

// add a member through the API and return their member _id
export async function joinViaApi(request, code, name, extra = {}) {
  const res = await request.post(`/api/plans/${code}/members`, {
    data: { name, lat: 1.3, lng: 103.85, diet: "any", budget: 20, ...extra }
  })
  expect(res.ok()).toBeTruthy()
  const plan = await res.json()
  return plan.members[plan.members.length - 1]._id
}

// open a page "as" a member: the app reads memberId-CODE from localStorage
export async function actAsMember(page, code, memberId) {
  await page.addInitScript(([k, v]) => localStorage.setItem(k, v), [`memberId-${code}`, memberId])
}
