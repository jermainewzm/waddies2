// NEW FILE (Centre Search): replaces dish-search-controller.js
// Two routes:
//   GET /api/centre-search/centres?date=2026-10-30           -> every centre + is it open that day (for the dropdown)
//   GET /api/centre-search/plans/:code/centres/:serialNo     -> one centre's stalls + dishes, and who in the group can't eat there

const Plan = require("../models/plan-model")
const Centre = require("../models/centre-model")   // CHANGED: use the helpers in centre-model.js (like Plan.findByCode)
const Stall = require("../models/stall-model")
const Dish = require("../models/dish-model")
const CrowdReport = require("../models/crowd-report-model")
const { isCentreOpen, canMemberEat, getValidDishes } = require("../utils/shortlist-helper")
const { summariseCrowd } = require("./centres-controller")

const ONE_HOUR_MS = 60 * 60 * 1000

// today's date in Singapore as "YYYY-MM-DD" ("en-CA" gives that format, same as plan.date)
function getSingaporeToday() {
    return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Singapore" })
}

// "2026-10-30" -> "Friday"
function getWeekday(date) {
    return new Date(`${date}T00:00:00+08:00`).toLocaleDateString("en-SG", { weekday: "long", timeZone: "Asia/Singapore" })
}

// why a stall is NOT open on the plan's date. "" means it is open.
// Same rules as getValidDishes in shortlist-helper.js, but it also says WHY
function getClosedReason(stall, date) {
    const today = getSingaporeToday()
    const weekday = getWeekday(date)

    if (stall.status === "closed") {
        return "Closed by hawker"
    }
    if ((stall.rest_days || []).includes(weekday)) {
        return `Rest day on ${weekday}s`
    }

    // "sold out" and "closed early" only count if the plan is today AND the hawker set it today
    const updatedToday = stall.status_updated_at &&
        new Date(stall.status_updated_at).toLocaleDateString("en-CA", { timeZone: "Asia/Singapore" }) === today

    if (date === today && updatedToday && stall.status === "sold_out") {
        return "Sold out today"
    }
    if (date === today && updatedToday && stall.status === "closed_early") {
        return "Closed early today"
    }
    return ""
}

// GET /api/centre-search/centres?date=2026-10-30
// every centre (A-Z) with its location and whether it's open on that date.
// The page works out the distances, the 5 suggested centres and hides the closed ones
exports.getCentreList = async (req, res) => {
    const date = String(req.query.date || getSingaporeToday()).trim()

    // CHANGED: was a regex. Same check as createPlan: an impossible date gives NaN
    if (isNaN(new Date(`${date}T00:00:00+08:00`).getTime())) {
        return res.status(400).json({ error: "Please use a date like 2026-10-30." })
    }

    try {
        const centres = await Centre.findAllCentresSorted()   // CHANGED: helper in centre-model.js (A to Z)

        const list = centres.map(centre => ({
            serialNo: String(centre.serialNo),
            name: centre.name,
            lat: centre.lat,
            lng: centre.lng,
            is_open: isCentreOpen(centre, date)   // false = NEA cleaning / repairs that day
        }))

        res.json({ centres: list })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Could not load the centres." })
    }
}

// GET /api/centre-search/plans/:code/centres/:serialNo
// one centre's menu for THIS plan's date:
//   stalls       = open stalls with their dishes
//   closedStalls = stalls not open that day, with the reason
//   cannotEat    = members who have NOTHING here within their diet + budget (empty = everyone can eat)
exports.getCentreMenu = async (req, res) => {
    const code = req.params.code
    const serialNo = String(req.params.serialNo)

    try {
        const plan = await Plan.findByCode(code)
        if (!plan) {
            return res.status(404).json({ error: "Plan not found!" })
        }

        const centre = await Centre.findBySerial(serialNo)   // CHANGED: helper in centre-model.js
        if (!centre) {
            return res.status(404).json({ error: "Centre not found!" })
        }

        const date = plan.date
        const isToday = date === getSingaporeToday()

        // 1. split the centre's stalls into open and not open (stalls link to centres by serialNo)
        const stalls = await Stall.find({ centre_id: serialNo }).sort({ name: 1 })
        const openStalls = []
        const closedStalls = []

        for (const stall of stalls) {
            const reason = getClosedReason(stall, date)
            if (reason === "") {
                openStalls.push(stall)
            } else {
                closedStalls.push({ stall_id: stall._id, name: stall.name, unit_no: stall.unit_no, reason: reason })
            }
        }

        // 2. dishes of the open stalls, in ONE query ($in = any of these ids), cheapest first
        const openIds = openStalls.map(stall => stall._id)
        const dishes = await Dish.find({ stall_id: { $in: openIds } }).sort({ price: 1 })

        const stallList = []
        for (const stall of openStalls) {
            const stallDishes = dishes
                .filter(dish => String(dish.stall_id) === String(stall._id))
                .filter(dish => !isToday || dish.is_available)   // "not available" only matters for today's plans
                .map(dish => ({ dish_id: dish._id, name: dish.name, price: dish.price, tags: dish.tags }))

            if (stallDishes.length === 0) {
                closedStalls.push({ stall_id: stall._id, name: stall.name, unit_no: stall.unit_no, reason: "No dishes available" })
            } else {
                stallList.push({ stall_id: stall._id, name: stall.name, unit_no: stall.unit_no, dishes: stallDishes })
            }
        }

        // 3. who can't eat here? Uses getValidDishes + canMemberEat, the SAME rules addToShortlist checks
        const validDishes = await getValidDishes(centre, date)
        const cannotEat = []
        for (const member of plan.members) {
            const canEat = validDishes.some(dish => canMemberEat(member, dish))
            if (!canEat) {
                cannotEat.push({ name: member.name, diet: member.diet, budget: member.budget })
            }
        }

        // 4. crowd level only makes sense for a plan that's today (reports from the last hour)
        let crowd = null
        if (isToday) {
            const reports = await CrowdReport.find({
                centreId: serialNo,
                createdAt: { $gte: new Date(Date.now() - ONE_HOUR_MS) }
            })
            crowd = summariseCrowd(reports)
        }

        res.json({
            centre: {
                serialNo: serialNo,
                name: centre.name,
                address: centre.address || "",
                lat: centre.lat,
                lng: centre.lng,
                foodStalls: centre.foodStalls,
                is_open: isCentreOpen(centre, date),
                crowd: crowd
            },
            stalls: stallList,
            closedStalls: closedStalls,
            cannotEat: cannotEat
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Could not load this centre's menu." })
    }
}