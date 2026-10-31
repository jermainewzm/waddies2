// Unit tests for addToShortlist (server/controllers/plan-controller.js): every rule for adding a centre in Centre Search
// The database is never touched: model functions are replaced with vi.spyOn (same style as the hawker and stall tests).
import { describe, test, expect, vi, beforeEach } from "vitest"

const Plan = require("../models/plan-model")
const Centre = require("../models/centre-model")
const { addToShortlist } = require("../controllers/plan-controller")

//a date 30 days ahead, so the tests never expire
const PLAN_DATE = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

//a fake Express response: res.status(...).json(...) both get recorded
function fakeRes() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn() }
}

//a plan that's still joining, with one member (Angel) and no picks yet
function joiningPlan(changes = {}) {
  return {
    code: "123456",
    date: PLAN_DATE,
    status: "joining",
    members: [{ _id: "m1", name: "Angel" }],
    shortlist: [],
    ...changes
  }
}

const openCentre = { serialNo: "72", name: "Maxwell Food Centre", closures: [] }

//Angel adds Maxwell (serialNo 72)
function addRequest(body = {}) {
  return { params: { code: "123456" }, body: { serialNo: "72", added_by: " Angel ", member_id: "m1", ...body } }
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.spyOn(console, "error").mockImplementation(() => {})
})

describe("addToShortlist", () => {
  test("no centre picked gives 400", async () => {
    const res = fakeRes()
    await addToShortlist(addRequest({ serialNo: "" }), res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: "Please pick a centre." })
  })

  test("a plan that doesn't exist gives 404", async () => {
    vi.spyOn(Plan, "findByCode").mockResolvedValue(null)
    const res = fakeRes()
    await addToShortlist(addRequest(), res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  test("a plan that has started swiping gives 400", async () => {
    vi.spyOn(Plan, "findByCode").mockResolvedValue(joiningPlan({ status: "swiping" }))
    const res = fakeRes()
    await addToShortlist(addRequest(), res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: "This plan has already started swiping." })
  })

  test("someone who isn't a member gives 403", async () => {
    vi.spyOn(Plan, "findByCode").mockResolvedValue(joiningPlan())
    const res = fakeRes()
    await addToShortlist(addRequest({ member_id: "stranger" }), res)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ error: "Join the plan before adding centres." })
  })

  test("a centre that doesn't exist gives 404", async () => {
    vi.spyOn(Plan, "findByCode").mockResolvedValue(joiningPlan())
    vi.spyOn(Centre, "findBySerial").mockResolvedValue(null)
    const res = fakeRes()
    await addToShortlist(addRequest(), res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ error: "Centre not found!" })
  })

  test("a centre closed for NEA cleaning on the plan's date gives 400", async () => {
    vi.spyOn(Plan, "findByCode").mockResolvedValue(joiningPlan())
    vi.spyOn(Centre, "findBySerial").mockResolvedValue({
      ...openCentre,
      closures: [{ start: new Date(`${PLAN_DATE}T00:00:00+08:00`), end: new Date(`${PLAN_DATE}T23:59:00+08:00`) }]
    })
    const res = fakeRes()
    await addToShortlist(addRequest(), res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: "This centre is closed on your plan's date." })
  })

  test("a centre that's already picked gives 409", async () => {
    vi.spyOn(Plan, "findByCode").mockResolvedValue(joiningPlan({ shortlist: [{ serialNo: "72", added_by: "Zhe Ming" }] }))
    vi.spyOn(Centre, "findBySerial").mockResolvedValue(openCentre)
    const res = fakeRes()
    await addToShortlist(addRequest(), res)

    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json).toHaveBeenCalledWith({ error: "This centre is already on the shortlist." })
  })

  test("an 11th pick gives 400 (max 10)", async () => {
    const tenPicks = Array.from({ length: 10 }, (_, i) => ({ serialNo: String(100 + i), added_by: "Angel" }))
    vi.spyOn(Plan, "findByCode").mockResolvedValue(joiningPlan({ shortlist: tenPicks }))
    vi.spyOn(Centre, "findBySerial").mockResolvedValue(openCentre)
    const res = fakeRes()
    await addToShortlist(addRequest(), res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: "Your group has picked 10 centres already (max)." })
  })

  test("a valid pick is saved with who added it, and the updated plan is sent back", async () => {
    const updated = joiningPlan({ shortlist: [{ serialNo: "72", added_by: "Angel", added_by_id: "m1" }] })
    vi.spyOn(Plan, "findByCode").mockResolvedValue(joiningPlan())
    vi.spyOn(Centre, "findBySerial").mockResolvedValue(openCentre)
    const save = vi.spyOn(Plan, "addToShortlist").mockResolvedValue(updated)
    const res = fakeRes()
    await addToShortlist(addRequest(), res)

    expect(save).toHaveBeenCalledWith("123456", { serialNo: "72", added_by: "Angel", added_by_id: "m1" })   //name trimmed
    expect(res.json).toHaveBeenCalledWith(updated)
  })
})
