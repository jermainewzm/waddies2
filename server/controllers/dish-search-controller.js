const mongoose = require("mongoose")
const Dish = require("../models/dish-model")
const Stall = require("../models/stall-model") //also registers "Stall" so populate("stall_id") works
require("../models/centre-model") //NEW: registers the "Centre" model (that file only exports helper functions)
const Centre = mongoose.model("Centre") //NEW: so we can look up centres by serialNo and _id

//NEW: reuse my teammate's rules so Dish Search and the swipe shortlist always agree
const { isCentreOpen, canMemberEat } = require("../utils/shortlist-helper")

const DIET_OPTIONS = ["any", "halal", "vegetarian", "no_pork", "no_beef"]
//REMOVED: CLOSED_STATUSES - it hid "sold out" stalls forever. isStallOpenOn() below replaces it.

//makes the search text safe to use in a regex (eg. "chicken (rice)" won't break the search)
function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

//NEW: today's date in Singapore as "YYYY-MM-DD" (same format as plan.date)
function getSingaporeToday() {
    return new Date().toLocaleDateString("en-CA", {timeZone: "Asia/Singapore"}) //"en-CA" gives YYYY-MM-DD
}

//CHANGED: was getSingaporeWeekday() (today only). Now works for ANY date, eg. the plan's date
//the weekday of a "YYYY-MM-DD" date in Singapore, eg. "Saturday" (used for rest days)
function getWeekday(date) {
    return new Date(`${date}T00:00:00+08:00`).toLocaleDateString("en-SG", {weekday: "long", timeZone: "Asia/Singapore"})
}

//NEW: is this stall open on this date? Same rules as getValidDishes in shortlist-helper:
// - "closed" always hides the stall
// - rest days are checked against the plan's weekday
// - "sold out" / "closed early" only count if the plan is TODAY and the hawker set it today
function isStallOpenOn(stall, date) {
    const today = getSingaporeToday()

    if (stall.status === "closed") {
        return false
    }

    if ((stall.rest_days || []).includes(getWeekday(date))) { //imported stalls may not have rest_days
        return false
    }

    const updatedToday = stall.status_updated_at &&
        new Date(stall.status_updated_at).toLocaleDateString("en-CA", {timeZone: "Asia/Singapore"}) === today

    if (date === today && updatedToday && (stall.status === "sold_out" || stall.status === "closed_early")) {
        return false
    }

    return true
}

//CHANGED: now also takes &date= (the plan's date). Default is still today.
//GET /api/dishes/search?q=chicken&diet=halal&maxPrice=5&date=2026-10-17
//returns matching dishes from stalls open on that date (default: today), grouped by centre then stall
exports.searchDishes = async (req, res) => {
    const {q: rawQ, diet: rawDiet, maxPrice: maxPriceRaw, date: rawDate} = req.query || {} //CHANGED: added date
    const q = String(rawQ || "").trim()
    const diet = String(rawDiet || "any").trim().toLowerCase()
    const date = String(rawDate || getSingaporeToday()).trim() //NEW

    //validates the search inputs
    if (!q) {
        return res.status(400).json({error: "Please enter a dish name!"})
    }

    if (q.length > 50) {
        return res.status(400).json({error: "Dish name must be 50 characters or fewer."})
    }

    if (!DIET_OPTIONS.includes(diet)) {
        return res.status(400).json({error: "Invalid dietary option."})
    }

    //NEW: date must look like 2026-10-17 and be a real date
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(new Date(`${date}T00:00:00+08:00`).getTime())) {
        return res.status(400).json({error: "Invalid date."})
    }

    //maxPrice is optional, only check it if the user typed something
    let maxPrice = null
    if (maxPriceRaw !== undefined && String(maxPriceRaw).trim() !== "") {
        maxPrice = Number(maxPriceRaw)

        if (isNaN(maxPrice) || maxPrice <= 0) { //Number("abc") returns NaN
            return res.status(400).json({error: "Max price must be a number more than 0."})
        }
                //NEW (error prevention): same $100 cap as the plan's budget
        if (maxPrice > 100) {
            return res.status(400).json({error: "Max price can't be more than $100."})
        }
    }

    const isToday = date === getSingaporeToday() //NEW

    try {
        //CHANGED: the diet is no longer in this filter (it's checked below with canMemberEat)
        const filter = {
            name: {$regex: escapeRegex(q), $options: "i"} //"i" = not case sensitive
        }

        //CHANGED: was always is_available: true.
        //"not available" is a TODAY thing (eg. ran out), so only hide those dishes for today's plans
        if (isToday) {
            filter.is_available = true
        }

        if (maxPrice !== null) {
            filter.price = {$lte: maxPrice} //$lte = less than or equal to
        }

        //finds the dishes + attaches their stall, cheapest first
        const dishes = await Dish.find(filter).populate("stall_id").sort({price: 1})

        //NEW: diet uses the SAME rules as the shortlist, eg. "no pork" also accepts halal + vegetarian dishes
        //(budget is Infinity here because maxPrice was already checked above)
        const dietDishes = dishes.filter(dish => canMemberEat({diet: diet, budget: Infinity}, dish))

        //CHANGED: was "open TODAY" using CLOSED_STATUSES. Now "open on the plan's date"
        const openDishes = dietDishes.filter(dish => dish.stall_id && isStallOpenOn(dish.stall_id, date))

        //NEW: stall.centre_id holds the centre's serialNo (NEA's id, eg. "72"), so look up those centres in ONE query
        const serialNos = [...new Set(openDishes.map(dish => String(dish.stall_id.centre_id)))]
        const centres = await Centre.find({serialNo: {$in: serialNos}})

        //NEW: quick lookup: serialNo -> centre document
        const centreBySerial = {}
        for (const centre of centres) {
            centreBySerial[String(centre.serialNo)] = centre
        }

        //groups the dishes by hawker centre, then by stall
        const results = []

        for (const dish of openDishes) {
            const stall = dish.stall_id
            const centre = centreBySerial[String(stall.centre_id)] //NEW

            //NEW: skip if the centre doesn't exist, or NEA has it closed (cleaning / repairs) on that date
            if (!centre || !isCentreOpen(centre, date)) {
                continue
            }

            //CHANGED: groups by the centre's real _id (was the "72" serialNo).
            //centre_id is now the centre's real _id, which is what the plan's shortlist needs
            let centreGroup = results.find(c => String(c.centre_id) === String(centre._id))
            if (!centreGroup) {
                centreGroup = {
                    centre_id: centre._id,      //CHANGED: was stall.centre_id ("72")
                    centre_name: centre.name,   //NEW: so the page shows "Maxwell Food Centre", not "72"
                    address: centre.address || "", //NEW
                    lat: centre.lat,            //NEW: so Dish Search can show how far it is from the group
                    lng: centre.lng,            //NEW
                    stalls: []
                }
                results.push(centreGroup)
            }

            //finds the stall inside that centre, or creates it
            let stallGroup = centreGroup.stalls.find(s => String(s.stall_id) === String(stall._id))
            if (!stallGroup) {
                stallGroup = {
                    stall_id: stall._id,
                    stall_name: stall.name,
                    unit_no: stall.unit_no,
                    status: stall.status,
                    dishes: []
                }
                centreGroup.stalls.push(stallGroup)
            }

            //adds the dish to its stall
            stallGroup.dishes.push({
                dish_id: dish._id,
                name: dish.name,
                price: dish.price,
                tags: dish.tags
            })
        }

        //counts the total number of dishes across all centres and stalls
        let count = 0
        for (const centre of results) {
            for (const stall of centre.stalls) {
                count += stall.dishes.length
            }
        }

        res.json({query: q, filters: {diet, maxPrice, date}, count, results}) //CHANGED: filters now include date

    } catch(error) {
        console.error(error)
        res.status(500).json({error: "Could not search dishes. Please try again."})
    }
}

//CHANGED: now also takes ?date= so "open" matches the plan's day
//GET /api/dishes/stalls/:stallId/menu?date=2026-10-17
//returns one stall + its full menu (for when a stall name is clicked)
exports.getStallMenu = async (req, res) => {
    const stallId = req.params.stallId
    const date = String(req.query.date || getSingaporeToday()).trim() //NEW

    //checks the id is a real Mongo id (eg. "abc" would crash findById)
    if (!mongoose.isValidObjectId(stallId)) {
        return res.status(400).json({error: "Invalid stall."})
    }

    //NEW: date must look like 2026-10-17
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({error: "Invalid date."})
    }

    try {
        //finds the stall
        const stall = await Stall.findById(stallId)

        if (!stall) {
            return res.status(404).json({error: "Stall not found!"})
        }

        //finds ALL dishes for this stall, not just the searched ones (includes unavailable ones too)
        const dishes = await Dish.find({stall_id: stallId}).sort({name: 1})

        //NEW: the centre's name, for the heading
        const centre = await Centre.findOne({serialNo: String(stall.centre_id)})

        //works out if the stall is open on that date
        const restDays = stall.rest_days || []
        const isRestDay = restDays.includes(getWeekday(date)) //CHANGED: plan's date, not just today

        res.json({
            stall: {
                stall_id: stall._id,
                stall_name: stall.name,
                centre_name: centre ? centre.name : "", //NEW (replaces centre_id)
                unit_no: stall.unit_no,
                status: stall.status,
                status_updated_at: stall.status_updated_at,
                rest_days: restDays,
                is_rest_day: isRestDay,
                is_open: isStallOpenOn(stall, date) //CHANGED: was is_open_today
            },
            dishes: dishes.map(dish => ({
                dish_id: dish._id,
                name: dish.name,
                price: dish.price,
                tags: dish.tags,
                is_available: dish.is_available
            }))
        })

    } catch(error) {
        console.error(error)
        res.status(500).json({error: "Could not load the menu. Please try again."})
    }
}