import { describe, test, expect } from "vitest"

const {
    getSingaporeDate,
    getSingaporeDayRange
} = require("../controllers/shoutout-controller")


describe("Singapore shout-out date", () => {

    test("returns a Singapore date in YYYY-MM-DD format", () => {
        const date = getSingaporeDate()

        expect(date).toMatch(
            /^\d{4}-\d{2}-\d{2}$/
        )
    })


    test("creates a full Singapore day range", () => {
        const {
            startOfToday,
            endOfToday
        } = getSingaporeDayRange()

        expect(startOfToday).toBeInstanceOf(Date)
        expect(endOfToday).toBeInstanceOf(Date)

        expect(
            endOfToday.getTime()
        ).toBeGreaterThan(
            startOfToday.getTime()
        )
    })


    test("Singapore day range is about 24 hours", () => {
        const {
            startOfToday,
            endOfToday
        } = getSingaporeDayRange()

        const difference =
            endOfToday.getTime() -
            startOfToday.getTime()

        expect(difference)
            .toBe(86399999)
    })

})