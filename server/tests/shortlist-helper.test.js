import { expect, test, describe } from "vitest"
import { getMidPoint, getDistance, canMemberEat, canEveryoneEat, isCentreOpen, findCentreCandidates } from "../utils/shortlist-helper"

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

describe("getDistance", () => {
  test("the same point is zero km away from each other", () => {
    const point = { lat: 1.3, lng: 103.8 }
    expect(getDistance(point, point)).toBe(0)
  })

  test("0.1 degrees of latitude is about 11 km", () => {
    const a = { lat: 1.3, lng: 103.8 }
    const b = { lat: 1.4, lng: 103.8 }
    expect(getDistance(a, b)).toBeCloseTo(11.1, 1)
  })

  test("0.1 degrees of longitude is about 11 km", () => {
    const a = { lat: 1.3, lng: 103.8 }
    const b = { lat: 1.3, lng: 103.9 }
    expect(getDistance(a, b)).toBeCloseTo(11.1, 1)
  })

})

describe("findCentreCandidates", () => {
  //one member in Woodlands, one in Bedok: the midpoint lands around the centre of the island
  const plan = {
    date: "2026-11-15",
    members: [
      { lat: 1.4360, lng: 103.7860 },   // Woodlands
      { lat: 1.3240, lng: 103.9300 }    // Bedok
    ]
  }
  //midpoint is roughly 1.3800, 103.8580 (Upper Thomson / Bishan area)

  test("returns candidates sorted nearest to the group's midpoint", () => {
    const centres = [
        { name: "Taman Jurong Market and Food Centre", lat: 1.3340, lng: 103.7200, closures: [] },
        { name: "Bishan Market and Food Centre", lat: 1.3508, lng: 103.8485, closures: [] },
        { name: "Chomp Chomp Food Centre", lat: 1.3640, lng: 103.8680, closures: [] }
      ]
    const result = findCentreCandidates(centres, plan, 10)
    expect(result[0].centre.name).toBe("Chomp Chomp Food Centre")
    expect(result[1].centre.name).toBe("Bishan Market and Food Centre")
    expect(result[2].centre.name).toBe("Taman Jurong Market and Food Centre")
  })

  test("leaves out a centre closed on the plan's date", () => {
    const centres = [
      { name: "Chomp Chomp Food Centre", lat: 1.3640, lng: 103.8680,
        closures: [{ start: new Date("2026-11-10"), end: new Date("2026-11-20") }] },
      { name: "Bishan Market and Food Centre", lat: 1.3508, lng: 103.8485, closures: [] }
    ]
    const result = findCentreCandidates(centres, plan, 10)
    expect(result.length).toBe(1)
    expect(result[0].centre.name).toBe("Bishan Market and Food Centre")
  })

  test("works with three members spread across the island", () => {
    const threePersonPlan = {
      date: "2026-11-15",
      members: [
        { lat: 1.4360, lng: 103.7860 },   // Woodlands
        { lat: 1.3240, lng: 103.9300 },   // Bedok
        { lat: 1.2900, lng: 103.8500 }    // Tanjong Pagar
      ]
    }
    //midpoint is roughly 1.3500, 103.8553 (Bishan area)
     const centres = [
      { name: "Taman Jurong Market and Food Centre", lat: 1.3340, lng: 103.7200, closures: [] },
      { name: "Bishan Market and Food Centre", lat: 1.3508, lng: 103.8485, closures: [] },
      { name: "Chomp Chomp Food Centre", lat: 1.3640, lng: 103.8680, closures: [] },
      { name: "Maxwell Food Centre", lat: 1.2805, lng: 103.8444, closures: [] },
      { name: "Yishun Park Hawker Centre", lat: 1.4290, lng: 103.8350, closures: [] }
    ]
    const result = findCentreCandidates(centres, threePersonPlan, 10)
    expect(result[0].centre.name).toBe("Bishan Market and Food Centre")
    expect(result[1].centre.name).toBe("Chomp Chomp Food Centre")
    expect(result[2].centre.name).toBe("Maxwell Food Centre")
    expect(result[3].centre.name).toBe("Yishun Park Hawker Centre")
    expect(result[4].centre.name).toBe("Taman Jurong Market and Food Centre")
  })
})