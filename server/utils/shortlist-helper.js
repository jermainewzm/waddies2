const Stall = require("../models/stall-model")
const Dish = require("../models/dish-model")

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

console.log(exports.getMidPoint([
    { lat: 1.2979, lng: 103.8489 },   //  SMU
    { lat: 1.4377, lng: 103.7858 },   // Woodlands
    { lat: 1.3510, lng: 103.8485 }    // Bishan
]))

// { lat: 1.3621999999999999, lng: 103.82773333333334 }

/* straight line distance between 2 points in km.
 sg is small so we dont have to use the complext Haversine formula,
*/

//Step 2: Find the distance between 2 points in km
exports.getDistance = function(a,b) {
    const northToSouth = (b.lat - a.lat) * 111
    const eastToWest = (b.lng - a.lng) * 111

    return Math.sqrt(northToSouth ** 2 + eastToWest ** 2)

}

// TEMP TEST: Woodlands to Maxwell, should be about 18-19 km
console.log(exports.getDistance(
    { lat: 1.4377, lng: 103.7858 },   // Woodlands
    { lat: 1.2803, lng: 103.8448 }    // Maxwell
))

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

// TEMP TEST: a fake centre closed from 30 to 31 March 2026
const testCentre = {
    closures: [{ start: new Date("2026-03-30T00:00:00+08:00"), end: new Date("2026-03-31T00:00:00+08:00") }]
}
console.log(exports.isCentreOpen(testCentre, "2026-03-30"))  // false (closed)
console.log(exports.isCentreOpen(testCentre, "2026-03-31"))  // false (closed, last day)
console.log(exports.isCentreOpen(testCentre, "2026-04-01"))  // true  (open again)


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
    const stalls = await Stall.find({centre_id: String(centre._id)})
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


// last step: rank the candidates =====
// Sorts the nearest open centres into:
//   good:    everyone can eat (checked against real dishes)
//   unknown: no dishes in our data yet, so we can't check
// Centres where someone CAN'T eat are dropped.
// Returns good centres first, then unknown ones (each already nearest-first).