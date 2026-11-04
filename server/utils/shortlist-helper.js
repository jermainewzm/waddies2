const Stall = require("../models/stall-model")
const Dish = require("../models/dish-model")
const CrowdReport = require("../models/crowd-report-model")
const {summariseCrowd} = require("../controllers/centres-controller")


/* extra "km" for how crowded a centre is right now.
Full is worth 1.5km of extra travel
*/
const CROWD_PENALTY_KM = {
    plenty: 0,
    few: 0.5,
    full: 1.5
}

const RECENT_REPORT_MS = 60 * 60 * 1000 // only reports from the last hour
const PLAN_SOON_MS = 2 * 60 * 60 * 1000 //crowd only matters if the plan starts within 2hrs

//Step 1: Find middle of everyone's location
exports.getMidPoint = function(members) {
    let totalLat = 0
    let totalLng = 0

     for (const member of members) {
        totalLat += member.lat
        totalLng += member.lng
    }
     return {
        lat: totalLat / members.length,
        lng: totalLng / members.length
    }
}

/* console.log(exports.getMidPoint([
//     { lat: 1.2979, lng: 103.8489 },   //  SMU
//     { lat: 1.4377, lng: 103.7858 },   // Woodlands
//     { lat: 1.3510, lng: 103.8485 }    // Bishan
// ]))

 { lat: 1.3621999999999999, lng: 103.82773333333334 } */

/* straight line distance between 2 points in km.
 sg is small so we dont have to use the complext Haversine formula,
*/

//Step 2: Find the distance between 2 points in km
exports.getDistance = function(a,b) {
    const northToSouth = (b.lat - a.lat) * 111
    const eastToWest = (b.lng - a.lng) * 111

    return Math.sqrt(northToSouth ** 2 + eastToWest ** 2)
}

// console.log(exports.getDistance(
//     { lat: 1.4377, lng: 103.7858 },   // Woodlands
//     { lat: 1.2803, lng: 103.8448 }    // Maxwell
// ))

//Step 3: Is the centre even open on the plan's date?

exports.isCentreOpen = function(centre, planDate) {
    const day = new Date(`${planDate}T00:00:00+08:00`)

    for (const closure of centre.closures) {
        if (day >= closure.start && day <= closure.end) {
            return false
        }
    }

    return true
}

// // TEMP TEST: a fake centre closed from 30 to 31 March 2026
// const testCentre = {
//     closures: [{ start: new Date("2026-03-30T00:00:00+08:00"), end: new Date("2026-03-31T00:00:00+08:00") }]
// }
// console.log(exports.isCentreOpen(testCentre, "2026-03-30"))  // false (closed)
// console.log(exports.isCentreOpen(testCentre, "2026-03-31"))  // false (closed, last day)
// console.log(exports.isCentreOpen(testCentre, "2026-04-01"))  // true  (open again)


//Step 4:  Check if everyone can eat at that hawker centre

const DIET_TAGS = {
    any: null,
    halal: ['halal'],
    vegetarian: ["vegetarian"],
    no_pork: ["no_pork", "halal", "vegetarian"],   // halal and vegetarian have no pork
    no_beef: ["no_beef", "vegetarian"]             // halal food can contain beef
}

function canMemberEat(member,dish) {
    if (dish.price > member.budget) {
        return false
    }
    const safe = DIET_TAGS[member.diet]
    if (!safe) {                                    // no diet restriction
        return true
    }
    for (const tag of dish.tags) {
        if (safe.includes(tag)) {                   // has at least 1 safe tag
            return true
        }
    }
    return false
}

exports.canMemberEat = canMemberEat     //for swiping (to check a person against a dish)

//Step 5: Does this centre have dishes that every member can eat?
exports.canEveryoneEat = function (members, dishes) {
    for (const member of members) {
        let foundOneDish = false
    
        for (const dish of dishes) {
            if (canMemberEat(member,dish)) {
                foundOneDish = true
                break
            }
        }
        if (!foundOneDish) {
            return false
        }
    }
    return true
}

exports.findCentreCandidates = function (centres, plan, count) {
    const midpoint = exports.getMidPoint(plan.members) 
    const candidates = []
    for (const centre of centres) {
        if (exports.isCentreOpen(centre,plan.date)) {
            candidates.push({
                centre: centre,
                distance: exports.getDistance(midpoint,centre)
            })
        }
    }
    candidates.sort((a,b) => a.distance - b.distance)

    return candidates.slice(0,count)
}

exports.getValidDishes = async function (centre, planDate) {
    // "en-CA" formats dates as YYYY-MM-DD, the same as plan.date
    const today = new Date().toLocaleDateString("en-CA", {timeZone: 'Asia/Singapore'})
    const isPlanToday = planDate === today

    // the plan day of the week, eg Tuesday.
    const planDay = new Date(`${planDate}T00:00:00+08:00`).toLocaleDateString("en-SG", { weekday: "long", timeZone: "Asia/Singapore" })

    //find this centre's stalls
    const stalls = await Stall.find({serialNo: String(centre.serialNo)})
    const openStallIds = []

    for (const stall of stalls) {
        if (stall.status === 'closed') {
            continue
        }
        let restThatDay = false
        for (const restDay of stall.rest_days) {
            if (restDay === planDay) {  //is this rest day on the plan's day?
                restThatDay = true
            }
        }
        if (restThatDay) {
            continue
        }
        // 'sold out' or 'closed early' only matter if the plan is today and they were set today
        const updatedToday = stall.status_updated_at && stall.status_updated_at.toLocaleDateString("en-CA", {timeZone: "Asia/Singapore"}) === today

        if (isPlanToday && updatedToday && (stall.status === "sold_out" || stall.status === "closed_early")) {
            continue
        }
        openStallIds.push(stall._id)
}
     // 3. Get the dishes of all the open stalls, in one search ($in = "any of these IDs")
    const dishes = await Dish.find({stall_id : {$in: openStallIds}})

    const validDishes = []

    for (const dish of dishes) {
        if (isPlanToday && !dish.is_available) {
            continue
        }
        validDishes.push(dish)
    }

    return validDishes

}

 function isPlanSoon(plan) {
    const planTime = new Date(`${plan.date}T${plan.time}:00+08:00`) 
    const timeRemaining =  planTime.getTime() - Date.now()

    return timeRemaining <= PLAN_SOON_MS
}

/* Final step, where we rank the candidate centres into:
good: everyone can eat
unknown: this is for not seeded stalls (not included in demo)
bad: someone cant eat there, or no stall is open that day */

const CANDIDATE_CENTRES = 15 

exports.rankCentres = async function (plan,centres) {
    const candidates = exports.findCentreCandidates(centres,plan, CANDIDATE_CENTRES)
    const goodCandidates = []

    for (const candidate of candidates) {
        const dishes = await exports.getValidDishes(candidate.centre, plan.date)

        if (dishes.length > 0 && exports.canEveryoneEat(plan.members, dishes)) {
            goodCandidates.push(candidate)
        }
    }
    if (isPlanSoon(plan)) {
        const serialNo = []
        for (const candidate of goodCandidates) {
            serialNo.push(String(candidate.centre.serialNo))
        }

        const timeSince = new Date(Date.now() - RECENT_REPORT_MS)
        const reports = await CrowdReport.find({
            centreId: {$in: serialNo},
            createdAt: {$gte: timeSince}
        })

        for (const candidate of goodCandidates) {
            const centreReports = [] //this centre's reports only
            for (const report of reports) {
                if (report.centreId === String(candidate.centre.serialNo)) {
                    centreReports.push(report)
                }
            }
            let penalty = 0
            if (centreReports.length > 0) {
                penalty = CROWD_PENALTY_KM[summariseCrowd(centreReports).level]
            }
            candidate.score = candidate.distance + penalty
        }
        goodCandidates.sort((a,b) => a.score - b.score)
    }
    const goodCentres = []
    for (const candidate of goodCandidates) {
        goodCentres.push(candidate.centre)
    }
    return goodCentres
}

//chooses the best few centres for the whole group
// pickedCentres = centres members picked in Centre Search (up to 10)
// rankedCentres = nearby centres from rankCentres (everyone can eat there)
// LOWER score = better. Score in "km" so everything can be added together:
//   distance from the group's midpoint
// + price  (0 = very cheap for everyone, up to PRICE_WEIGHT_KM = right at everyone's budget)
// + crowd  (only if the plan starts within 2 hours, same as rankCentres)
const PRICE_WEIGHT_KM = 2

exports.pickBestCentres = async function (plan, pickedCentres, rankedCentres, count) {
    const midpoint = exports.getMidPoint(plan.members)

    const pickedIds = []
    for (const centre of pickedCentres) {
        pickedIds.push(String(centre.serialNo))
    }

    // 1. put both lists together, without duplicates
    const allCentres = []
    const seenIds = []
    for (const centre of [...pickedCentres, ...rankedCentres]) {
        if (!seenIds.includes(String(centre.serialNo))) {
            seenIds.push(String(centre.serialNo))
            allCentres.push(centre)
        }
    }

    // 2. crowd reports for all of them in ONE search (only if the plan is soon)
    let reports = []
    if (isPlanSoon(plan)) {
        const serialNos = []
        for (const centre of allCentres) {
            serialNos.push(String(centre.serialNo))
        }
        reports = await CrowdReport.find({
            centreId: {$in: serialNos},
            createdAt: {$gte: new Date(Date.now() - RECENT_REPORT_MS)}
        })
    }

    // 3. score every centre
    // every centre must be open on the plan's date
    const openCentres = allCentres.filter(centre => exports.isCentreOpen(centre, plan.date))
    // look up every centre's dishes at the same time instead of one by one (same order as openCentres)
    const dishesPerCentre = await Promise.all(
        openCentres.map(centre => exports.getValidDishes(centre, plan.date))
    )

    const scored = []
    for (let i = 0; i < openCentres.length; i++) {
        const centre = openCentres[i]
        const dishes = dishesPerCentre[i]
        // nearby centres must suit everyone, but centre that is manually added is always kept
        if (!pickedIds.includes(String(centre.serialNo)) && !exports.canEveryoneEat(plan.members, dishes)) {
            continue
        }

        const distance = exports.getDistance(midpoint, centre)

        // price: for each member, how much of their budget their cheapest dish uses (0 to 1), then the average
        let priceTotal = 0
        for (const member of plan.members) {
            let cheapest = member.budget
            for (const dish of dishes) {
                if (canMemberEat(member, dish) && dish.price < cheapest) {
                    cheapest = dish.price
                }
            }
            priceTotal += cheapest / member.budget
        }
        const pricePenalty = (priceTotal / plan.members.length) * PRICE_WEIGHT_KM

        // crowd: same penalty as rankCentres
        const centreReports = []
        for (const report of reports) {
            if (report.centreId === String(centre.serialNo)) {
                centreReports.push(report)
            }
        }
        let crowdPenalty = 0
        if (centreReports.length > 0) {
            crowdPenalty = CROWD_PENALTY_KM[summariseCrowd(centreReports).level]
        }

        scored.push({
            centre: centre,
            score: distance + pricePenalty + crowdPenalty
        })
    }

    // 4. the group's picks go first, then the backend's own best nearby centres.
    // A pick that is also one of the best nearby centres is shown once (as a pick)
    // and does NOT make the backend add the next best centre in its place.
    const rankedSerials = []
    for (const centre of rankedCentres) {
        rankedSerials.push(String(centre.serialNo))
    }

    const pickedScored = []
    const nearbyScored = []
    for (const item of scored) {
        const serialNo = String(item.centre.serialNo)
        if (pickedIds.includes(serialNo)) {
            pickedScored.push(item)
        }
        if (rankedSerials.includes(serialNo)) {   // a centre can be in both lists
            nearbyScored.push(item)
        }
    }
    pickedScored.sort((a, b) => a.score - b.score)
    nearbyScored.sort((a, b) => a.score - b.score)

    const best = []
    for (const item of pickedScored) {
        best.push(item.centre)
    }
    // the backend's top `count`, skipping the ones that are already picks
    for (const item of nearbyScored.slice(0, count)) {
        if (!pickedIds.includes(String(item.centre.serialNo))) {
            best.push(item.centre)
        }
    }
    return best
}