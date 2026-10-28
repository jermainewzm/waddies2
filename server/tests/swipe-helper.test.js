import { expect, test, describe } from "vitest"
import { getFinishedIds, getResults } from "../utils/swipe-helper"

describe("getFinishedIds", () => {
  test("returns one id per member who has swiped", () => {
    const plan = {
      swipes: [
        { memberId: "a", centreId: "72", liked: true },
        { memberId: "a", centreId: "32", liked: false },
        { memberId: "b", centreId: "72", liked: true }
      ]
    }
    expect(getFinishedIds(plan)).toEqual(["a", "b"])
  })

  test("returns an empty list when nobody has swiped", () => {
    expect(getFinishedIds({ swipes: [] })).toEqual([])
  })
})

describe("getResults", () => {
  //two members in the same place, so distances are easy to reason about
  const members = [
    { lat: 1.3, lng: 103.8 },
    { lat: 1.3, lng: 103.8 }
  ]

  const centresBySerial = {
    "72": { serialNo: "72", name: "Maxwell", address: "A", photoUrl: null, lat: 1.31, lng: 103.8 },
    "32": { serialNo: "32", name: "Chinatown", address: "B", photoUrl: null, lat: 1.35, lng: 103.8 }
  }

  test("sorts by likes, most first", () => {
    const plan = {
      members: members,
      shortlist: [{ serialNo: "72" }, { serialNo: "32" }],
      swipes: [
        { memberId: "a", centreId: "32", liked: true },
        { memberId: "b", centreId: "32", liked: true },
        { memberId: "a", centreId: "72", liked: true }
      ]
    }
    const results = getResults(plan, centresBySerial)
    expect(results[0].name).toBe("Chinatown")
    expect(results[0].likes).toBe(2)
    expect(results[1].likes).toBe(1)
  })

  test("breaks a tie on likes using total travel distance", () => {
    const plan = {
      members: members,
      shortlist: [{ serialNo: "32" }, { serialNo: "72" }],
      swipes: [
        { memberId: "a", centreId: "32", liked: true },
        { memberId: "a", centreId: "72", liked: true }
      ]
    }
    const results = getResults(plan, centresBySerial)
    //both have 1 like, but Maxwell is nearer the members
    expect(results[0].name).toBe("Maxwell")
  })

  test("skips a shortlisted centre that no longer exists", () => {
    const plan = {
      members: members,
      shortlist: [{ serialNo: "72" }, { serialNo: "999" }],
      swipes: []
    }
    const results = getResults(plan, centresBySerial)
    expect(results.length).toBe(1)
    expect(results[0].name).toBe("Maxwell")
  })

  test("a centre nobody liked still appears, with zero likes", () => {
    const plan = {
      members: members,
      shortlist: [{ serialNo: "72" }],
      swipes: [{ memberId: "a", centreId: "72", liked: false }]
    }
    const results = getResults(plan, centresBySerial)
    expect(results[0].likes).toBe(0)
  })
})