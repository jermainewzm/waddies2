import { expect, test, describe } from "vitest"
import { getMidPoint, getDistance, canMemberEat, canEveryoneEat, isCentreOpen } from "../utils/shortlist-helper"

describe("getMidPoint", () => {
  test("two members gives the point halfway between them", () => {
    const members = [
      { lat: 1.3, lng: 103.8 },
      { lat: 1.5, lng: 104.0 }
    ]
    expect(getMidPoint(members)).toEqual({ lat: 1.4, lng: 103.9 })
  })

  test("three members locations are averaged among the 3", () => {
  const members = [
    { lat: 1.3, lng: 103.8 },
    { lat: 1.4, lng: 103.9 },
    { lat: 1.5, lng: 104.0 }
  ]
  const midpoint = getMidPoint(members)

  expect(midpoint.lat).toBeCloseTo(1.4)
  expect(midpoint.lng).toBeCloseTo(103.9)
})
})

describe("canMemberEat", () => {
  test("a member who eats anything can eat a dish within budget", () => {
    const member = { diet: "any", budget: 10 }
    const dish = { price: 5, tags: [] }
    expect(canMemberEat(member, dish)).toBe(true)
  })

  test("a member who cant eat pork can eat a halal dish", () => {
    const member = { diet: "no_pork", budget: 10 }
    const dish = { price: 5, tags: ["halal"] }
    expect(canMemberEat(member, dish)).toBe(true)
  })

  test("a member who cant eat beef cannot eat a halal dish", () => {
    const member = { diet: "no_beef", budget: 10 }
    const dish = { price: 5, tags: ["halal"] }
    expect(canMemberEat(member, dish)).toBe(false)
  })

  test("a dish over budget is rejected even when the diet matches", () => {
    const member = { diet: "vegetarian", budget: 5 }
    const dish = { price: 8, tags: ["vegetarian"] }
    expect(canMemberEat(member, dish)).toBe(false)
  })

  test("a vegetarian member cannot eat an untagged dish", () => {
    const member = { diet: "vegetarian", budget: 10 }
    const dish = { price: 5, tags: [] }
    expect(canMemberEat(member, dish)).toBe(false)
  })
})

describe("canEveryoneEat", () => {
  test("returns true when every member has at least one dish they can eat", () => {
    const members = [
      { diet: "halal", budget: 10 },
      { diet: "vegetarian", budget: 10 }
    ]
    const dishes = [
      { price: 5, tags: ["halal"] },
      { price: 4, tags: ["vegetarian"] }
    ]
    expect(canEveryoneEat(members, dishes)).toBe(true)
  })

  test("returns false when one member has nothing they can eat", () => {
    const members = [
      { diet: "halal", budget: 10 },
      { diet: "vegetarian", budget: 10 }
    ]
    const dishes = [
      { price: 5, tags: ["halal"] }
    ]
    expect(canEveryoneEat(members, dishes)).toBe(false)
  })

  test("returns false when one member's budget is too low", () => {
    const members = [
      { diet: "any", budget: 10 },
      { diet: "any", budget: 2 }
    ]
    const dishes = [
      { price: 5, tags: [] }
    ]
    expect(canEveryoneEat(members, dishes)).toBe(false)
  })

  test("returns false when there are no dishes at all", () => {
    const members = [{ diet: "any", budget: 10 }]
    expect(canEveryoneEat(members, [])).toBe(false)
  })
})

describe("isCentreOpen", () => {
  test("returns true when the centre has no closures", () => {
    const centre = { closures: [] }
    expect(isCentreOpen(centre, "2026-11-15")).toBe(true)
  })

  test("returns false when the plan date falls inside a closure", () => {
    const centre = {
      closures: [{ start: new Date("2026-11-10"), end: new Date("2026-11-20") }]
    }
    expect(isCentreOpen(centre, "2026-11-15")).toBe(false)
  })

  test("returns true when the plan date is after the closure ends", () => {
    const centre = {
      closures: [{ start: new Date("2026-11-10"), end: new Date("2026-11-20") }]
    }
    expect(isCentreOpen(centre, "2026-11-25")).toBe(true)
  })
})