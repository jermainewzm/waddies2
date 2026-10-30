import {
  describe,
  test,
  expect,
  vi,
  beforeEach
} from "vitest"

const Stall = require("../models/stall-model")

const {
  updateMyStallStatus,
  updateMyStallRestDays
} = require("../controllers/stall-controller")


describe("updateMyStallStatus", () => {

  beforeEach(() => {
    vi.restoreAllMocks()
  })


  test("rejects an invalid stall status", async () => {

    const req = {
      body: {
        status: "busy"
      },
      stall: {
        _id: "stall123"
      }
    }

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    }

    await updateMyStallStatus(req, res)

    expect(res.status)
      .toHaveBeenCalledWith(400)

    expect(res.json)
      .toHaveBeenCalledWith({
        message: "Invalid stall status"
      })
  })


  test("updates a valid stall status", async () => {

    const updatedStall = {
      _id: "stall123",
      status: "sold_out"
    }

    vi.spyOn(
      Stall,
      "findOneAndUpdate"
    ).mockResolvedValue(updatedStall)

    const req = {
      body: {
        status: "sold_out"
      },
      stall: {
        _id: "stall123"
      }
    }

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    }

    await updateMyStallStatus(req, res)

    expect(Stall.findOneAndUpdate)
      .toHaveBeenCalled()

    expect(res.status)
      .toHaveBeenCalledWith(200)

    expect(res.json)
      .toHaveBeenCalledWith(updatedStall)
  })

})

describe("updateMyStallRestDays", () => {

  beforeEach(() => {
    vi.restoreAllMocks()
  })


  test("rejects rest_days when it is not an array", async () => {

    const req = {
      body: {
        rest_days: "Monday"
      },
      stall: {
        _id: "stall123"
      }
    }

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    }

    await updateMyStallRestDays(req, res)

    expect(res.status)
      .toHaveBeenCalledWith(400)

    expect(res.json)
      .toHaveBeenCalledWith({
        message:
          "rest_days must be an array"
      })
  })


  test("rejects an invalid rest day", async () => {

    const req = {
      body: {
        rest_days: [
          "Monday",
          "Funday"
        ]
      },
      stall: {
        _id: "stall123"
      }
    }

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    }

    await updateMyStallRestDays(req, res)

    expect(res.status)
      .toHaveBeenCalledWith(400)

    expect(res.json)
      .toHaveBeenCalledWith({
        message:
          "Invalid rest day: Funday"
      })
  })


  test("updates valid rest days", async () => {

    const updatedStall = {
      _id: "stall123",
      rest_days: [
        "Monday",
        "Tuesday"
      ]
    }

    vi.spyOn(
      Stall,
      "findOneAndUpdate"
    ).mockResolvedValue(updatedStall)

    const req = {
      body: {
        rest_days: [
          "Monday",
          "Tuesday"
        ]
      },
      stall: {
        _id: "stall123"
      }
    }

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    }

    await updateMyStallRestDays(req, res)

    expect(res.status)
      .toHaveBeenCalledWith(200)

    expect(res.json)
      .toHaveBeenCalledWith(updatedStall)
  })

})