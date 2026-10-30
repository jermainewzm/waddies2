import { expect, test, describe } from "vitest"

import {
  normalizeHawkerId,
  isValidStatus,
  areValidRestDays,
  getNextHawkerId
} from "../utils/hawker-helper"


describe("normalizeHawkerId", () => {

  test("converts hawker ID to uppercase", () => {
    expect(
      normalizeHawkerId("hawker_001")
    ).toBe("HAWKER_001")
  })

  test("removes spaces around hawker ID", () => {
    expect(
      normalizeHawkerId("  HAWKER_001  ")
    ).toBe("HAWKER_001")
  })

})


describe("isValidStatus", () => {

  test("accepts a valid stall status", () => {
    expect(
      isValidStatus("sold_out")
    ).toBe(true)
  })

  test("rejects an invalid stall status", () => {
    expect(
      isValidStatus("busy")
    ).toBe(false)
  })

})


describe("areValidRestDays", () => {

  test("accepts valid rest days", () => {
    expect(
      areValidRestDays([
        "Monday",
        "Tuesday"
      ])
    ).toBe(true)
  })

  test("rejects an invalid day", () => {
    expect(
      areValidRestDays([
        "Monday",
        "Funday"
      ])
    ).toBe(false)
  })

  test("rejects a non-array value", () => {
    expect(
      areValidRestDays("Monday")
    ).toBe(false)
  })

})


describe("getNextHawkerId", () => {

  test("returns the next hawker ID", () => {
    const ids = [
      "HAWKER_001",
      "HAWKER_002",
      "HAWKER_005"
    ]

    expect(
      getNextHawkerId(ids)
    ).toBe("HAWKER_006")
  })

  test("starts from HAWKER_001 when no IDs exist", () => {
    expect(
      getNextHawkerId([])
    ).toBe("HAWKER_001")
  })

  test("handles IDs above 999", () => {
    const ids = [
      "HAWKER_998",
      "HAWKER_999",
      "HAWKER_1000"
    ]

    expect(
      getNextHawkerId(ids)
    ).toBe("HAWKER_1001")
  })

})