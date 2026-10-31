// Unit tests for the Centre Search controller (server/controllers/centre-search-controller.js)
//   getClosedReason: why a stall isn't open on a plan's date
//   getCentreList:   the dropdown list of centres + whether each is open that day
//   getCentreMenu:   one centre's open stalls, closed stalls (with reasons) and who can't eat there
// The database is never touched: model functions are replaced with vi.spyOn (same style as the hawker and stall tests).
import { describe, test, expect, vi, beforeEach } from "vitest"

const Plan = require("../models/plan-model")
const Centre = require("../models/centre-model")
const Stall = require("../models/stall-model")
const Dish = require("../models/dish-model")
const { getClosedReason, getCentreList, getCentreMenu } = require("../controllers/centre-search-controller")

//today in Singapore as "YYYY-MM-DD", worked out the same way as the controller
const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Singapore" })

//the next Friday that isn't today, as "YYYY-MM-DD" (so the tests never expire)
function nextFriday() {
  const date = new Date()
  do {
    date.setDate(date.getDate() + 1)
  } while (date.toLocaleDateString("en-SG", { weekday: "long", timeZone: "Asia/Singapore" }) !== "Friday")
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Singapore" })
}
const FUTURE_FRIDAY = nextFriday()
const TWO_DAYS_AGO = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)

//a fake Express response: res.status(...).json(...) both get recorded
function fakeRes() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn() }
}

//a fake Mongoose query: can be awaited directly OR with .sort() (the controller uses both)
function fakeQuery(result) {
  const query = Promise.resolve(result)
  query.sort = () => Promise.resolve(result)
  return query
}

//NEA closure covering the given date (so isCentreOpen says closed)
function closedOn(date) {
  return [{ start: new Date(`${date}T00:00:00+08:00`), end: new Date(`${date}T23:59:00+08:00`) }]
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.spyOn(console, "error").mockImplementation(() => {})   //keep the test output clean for the 500 test
})

describe("getClosedReason", () => {
  test("an open stall with no rest days is open", () => {
    expect(getClosedReason({ status: "open", rest_days: [] }, FUTURE_FRIDAY)).toBe("")
  })

  test("a stall the hawker closed says so", () => {
    expect(getClosedReason({ status: "closed", rest_days: [] }, FUTURE_FRIDAY)).toBe("Closed by hawker")
  })

  test("a rest day on the plan's weekday closes the stall", () => {
    expect(getClosedReason({ status: "open", rest_days: ["Friday"] }, FUTURE_FRIDAY)).toBe("Rest day on Fridays")
  })

  test("a rest day on another weekday doesn't matter", () => {
    expect(getClosedReason({ status: "open", rest_days: ["Monday"] }, FUTURE_FRIDAY)).toBe("")
  })

  test("a stall with no rest_days field doesn't crash", () => {
    expect(getClosedReason({ status: "open" }, FUTURE_FRIDAY)).toBe("")
  })

  test("sold out today counts for a plan that's today", () => {
    const stall = { status: "sold_out", rest_days: [], status_updated_at: new Date() }
    expect(getClosedReason(stall, today)).toBe("Sold out today")
  })

  test("sold out today does NOT count for a future plan", () => {
    const stall = { status: "sold_out", rest_days: [], status_updated_at: new Date() }
    expect(getClosedReason(stall, FUTURE_FRIDAY)).toBe("")
  })

  test("sold out set two days ago doesn't count today", () => {
    const stall = { status: "sold_out", rest_days: [], status_updated_at: TWO_DAYS_AGO }
    expect(getClosedReason(stall, today)).toBe("")
  })

  test("closed early today counts for a plan that's today", () => {
    const stall = { status: "closed_early", rest_days: [], status_updated_at: new Date() }
    expect(getClosedReason(stall, today)).toBe("Closed early today")
  })
})

describe("getCentreList", () => {
  test("an impossible date gives 400", async () => {
    const res = fakeRes()
    await getCentreList({ query: { date: "2026-13-45" } }, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: "Please use a date like 2026-10-30." })
  })

  test("lists every centre with is_open for that date (closed for NEA cleaning = false)", async () => {
    vi.spyOn(Centre, "findAllCentresSorted").mockResolvedValue([
      { serialNo: 72, name: "Maxwell Food Centre", lat: 1.28, lng: 103.84, closures: [] },
      { serialNo: "5", name: "Amoy Street Food Centre", lat: 1.27, lng: 103.84, closures: closedOn(FUTURE_FRIDAY) }
    ])
    const res = fakeRes()
    await getCentreList({ query: { date: FUTURE_FRIDAY } }, res)

    expect(res.json).toHaveBeenCalledWith({
      centres: [
        { serialNo: "72", name: "Maxwell Food Centre", lat: 1.28, lng: 103.84, is_open: true },
        { serialNo: "5", name: "Amoy Street Food Centre", lat: 1.27, lng: 103.84, is_open: false }
      ]
    })
  })

  test("a database error gives 500", async () => {
    vi.spyOn(Centre, "findAllCentresSorted").mockRejectedValue(new Error("db down"))
    const res = fakeRes()
    await getCentreList({ query: { date: FUTURE_FRIDAY } }, res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ error: "Could not load the centres." })
  })
})

describe("getCentreMenu", () => {
  const plan = {
    code: "123456",
    date: FUTURE_FRIDAY,
    members: [
      { name: "Aisha", diet: "any", budget: 10 },
      { name: "Wei Jie", diet: "halal", budget: 3 }   //no halal dish at $3 or less
    ]
  }
  const centre = { serialNo: "72", name: "Maxwell Food Centre", address: "1 Kadayanallur St", lat: 1.28, lng: 103.84, foodStalls: 100, closures: [] }
  const req = { params: { code: "123456", serialNo: "72" } }

  test("a plan that doesn't exist gives 404", async () => {
    vi.spyOn(Plan, "findByCode").mockResolvedValue(null)
    const res = fakeRes()
    await getCentreMenu(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ error: "Plan not found!" })
  })

  test("a centre that doesn't exist gives 404", async () => {
    vi.spyOn(Plan, "findByCode").mockResolvedValue(plan)
    vi.spyOn(Centre, "findBySerial").mockResolvedValue(null)
    const res = fakeRes()
    await getCentreMenu(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ error: "Centre not found!" })
  })

  test("splits stalls into open (with dishes) and closed (with the reason)", async () => {
    vi.spyOn(Plan, "findByCode").mockResolvedValue(plan)
    vi.spyOn(Centre, "findBySerial").mockResolvedValue(centre)
    vi.spyOn(Stall, "find").mockReturnValue(fakeQuery([
      { _id: "s1", name: "Ali's Nasi Lemak", unit_no: "#01-90", status: "open", rest_days: [] },
      { _id: "s2", name: "Zhen Zhen Porridge", unit_no: "#01-54", status: "open", rest_days: ["Friday"] },
      { _id: "s3", name: "Empty Stall", unit_no: "#01-99", status: "open", rest_days: [] }
    ]))
    vi.spyOn(Dish, "find").mockReturnValue(fakeQuery([
      { _id: "d1", stall_id: "s1", name: "Nasi Lemak", price: 4.5, tags: ["halal"], is_available: true }
    ]))
    const res = fakeRes()
    await getCentreMenu(req, res)

    const body = res.json.mock.calls[0][0]
    expect(body.centre).toMatchObject({ serialNo: "72", name: "Maxwell Food Centre", is_open: true, crowd: null })
    expect(body.stalls).toEqual([
      { stall_id: "s1", name: "Ali's Nasi Lemak", unit_no: "#01-90", dishes: [{ dish_id: "d1", name: "Nasi Lemak", price: 4.5, tags: ["halal"] }] }
    ])
    expect(body.closedStalls).toEqual([
      { stall_id: "s2", name: "Zhen Zhen Porridge", unit_no: "#01-54", reason: "Rest day on Fridays" },
      { stall_id: "s3", name: "Empty Stall", unit_no: "#01-99", reason: "No dishes available" }
    ])
  })

  test("lists members who have nothing to eat within their diet and budget", async () => {
    vi.spyOn(Plan, "findByCode").mockResolvedValue(plan)
    vi.spyOn(Centre, "findBySerial").mockResolvedValue(centre)
    vi.spyOn(Stall, "find").mockReturnValue(fakeQuery([
      { _id: "s1", name: "Ali's Nasi Lemak", unit_no: "#01-90", status: "open", rest_days: [] }
    ]))
    vi.spyOn(Dish, "find").mockReturnValue(fakeQuery([
      { _id: "d1", stall_id: "s1", name: "Nasi Lemak", price: 4.5, tags: ["halal"], is_available: true }
    ]))
    const res = fakeRes()
    await getCentreMenu(req, res)

    //Aisha (any diet, $10) can eat; Wei Jie (halal, $3) can't afford the $4.50 dish
    expect(res.json.mock.calls[0][0].cannotEat).toEqual([{ name: "Wei Jie", diet: "halal", budget: 3 }])
  })
})
