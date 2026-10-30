import {
  describe,
  test,
  expect,
  vi,
  beforeEach
} from "vitest"

const Stall = require("../models/stall-model")

const {
  verifyExistingHawker
} = require("../controllers/hawker-controller")


describe("verifyExistingHawker", () => {

  beforeEach(() => {
    vi.restoreAllMocks()
  })


  test("returns 400 when hawker ID is missing", async () => {

    const req = {
      body: {
        stall_name: "Sunrise Chicken Rice"
      }
    }

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    }

    await verifyExistingHawker(req, res)

    expect(res.status).toHaveBeenCalledWith(400)

    expect(res.json).toHaveBeenCalledWith({
      message:
        "Hawker ID and stall name are required."
    })
  })


  test("returns 404 when hawker details are incorrect", async () => {

    vi.spyOn(Stall, "findOne")
      .mockResolvedValue(null)

    const req = {
      body: {
        owner_id: "HAWKER_001",
        stall_name: "Wrong Stall"
      }
    }

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    }

    await verifyExistingHawker(req, res)

    expect(res.status).toHaveBeenCalledWith(404)

    expect(res.json).toHaveBeenCalledWith({
      message:
        "Hawker ID or stall name is incorrect"
    })
  })


  test("returns 200 for a valid hawker", async () => {

    const fakeStall = {
      owner_id: "HAWKER_001",
      name: "Sunrise Chicken Rice"
    }

    vi.spyOn(Stall, "findOne")
      .mockResolvedValue(fakeStall)

    const req = {
      body: {
        owner_id: "hawker_001",
        stall_name: "Sunrise Chicken Rice"
      }
    }

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    }

    await verifyExistingHawker(req, res)

    expect(Stall.findOne)
      .toHaveBeenCalledWith({
        owner_id: "HAWKER_001",
        name: {
          $regex: "^Sunrise Chicken Rice$",
          $options: "i"
        }
      })

    expect(res.status)
      .toHaveBeenCalledWith(200)

    expect(res.json)
      .toHaveBeenCalledWith({
        message:
          "Hawker verified successfully.",
        stall: fakeStall
      })
  })

})