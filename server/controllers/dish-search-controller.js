const mongoose = require("mongoose")
const Dish = require("../models/dish-model")
const Stall = require("../models/stall-model") //also registers "Stall" so populate("stall_id") works

const DIET_OPTIONS = ["any", "halal", "vegetarian", "no_pork", "no_beef"]
const CLOSED_STATUSES = ["closed", "closed_early", "sold_out"]

//makes the search text safe to use in a regex (eg. "chicken (rice)" won't break the search)
function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

//gets today's weekday in Singapore time (eg. "Monday"), used to check stall rest days
function getSingaporeWeekday() {
    return new Date().toLocaleDateString("en-US", {weekday: "long", timeZone: "Asia/Singapore"})
}

//GET /api/dishes/search?q=chicken&diet=halal&maxPrice=5
//returns matching dishes from stalls that are open today, grouped by centre then stall
exports.searchDishes = async (req, res) => {
    const {q: rawQ, diet: rawDiet, maxPrice: maxPriceRaw} = req.query || {}
    const q = String(rawQ || "").trim()
    const diet = String(rawDiet || "any").trim().toLowerCase()

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

    //maxPrice is optional, only check it if the user typed something
    let maxPrice = null
    if (maxPriceRaw !== undefined && String(maxPriceRaw).trim() !== "") {
        maxPrice = Number(maxPriceRaw)

        if (isNaN(maxPrice) || maxPrice <= 0) { //Number("abc") returns NaN
            return res.status(400).json({error: "Max price must be a number more than 0."})
        }
    }

    //escapes the search text
    const safeQuery = escapeRegex(q)

    try {
        //builds the filter
        const filter = {
            name: {$regex: safeQuery, $options: "i"}, //"i" = not case sensitive
            is_available: true
        }

        if (diet !== "any") {
            filter.tags = diet //matches if the tags array contains this value
        }

        if (maxPrice !== null) {
            filter.price = {$lte: maxPrice} //$lte = less than or equal to
        }

        //finds the dishes + attaches their stall, cheapest first
        const dishes = await Dish.find(filter).populate("stall_id").sort({price: 1})

        //keeps only stalls that are open today
        const today = getSingaporeWeekday()

        const openDishes = dishes.filter(dish => {
            const stall = dish.stall_id

            if (!stall) return false //stall was deleted or doesn't exist
            if (CLOSED_STATUSES.includes(stall.status)) return false
            if ((stall.rest_days || []).includes(today)) return false //imported stalls may not have rest_days

            return true
        })

        //groups the dishes by hawker centre, then by stall
        const results = []

        for (const dish of openDishes) {
            const stall = dish.stall_id

            //finds the centre, or creates it if it's the first time we see it
            let centre = results.find(c => c.centre_id === stall.centre_id)
            if (!centre) {
                centre = {centre_id: stall.centre_id, stalls: []}
                results.push(centre)
            }

            //finds the stall inside that centre, or creates it
            let stallGroup = centre.stalls.find(s => String(s.stall_id) === String(stall._id))
            if (!stallGroup) {
                stallGroup = {
                    stall_id: stall._id,
                    stall_name: stall.name,
                    unit_no: stall.unit_no,
                    status: stall.status,
                    dishes: []
                }
                centre.stalls.push(stallGroup)
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

        res.json({query: q, filters: {diet, maxPrice}, count, results})

    } catch(error) {
        console.error(error)
        res.status(500).json({error: "Could not search dishes. Please try again."})
    }
}

//GET /api/dishes/stalls/:stallId/menu
//returns one stall + its full menu (for when a stall name is clicked)
exports.getStallMenu = async (req, res) => {
    const stallId = req.params.stallId

    //checks the id is a real Mongo id (eg. "abc" would crash findById)
    if (!mongoose.isValidObjectId(stallId)) {
        return res.status(400).json({error: "Invalid stall."})
    }

    try {
        //finds the stall
        const stall = await Stall.findById(stallId)

        if (!stall) {
            return res.status(404).json({error: "Stall not found!"})
        }

        //finds ALL dishes for this stall, not just the searched ones (includes unavailable ones too)
        const dishes = await Dish.find({stall_id: stallId}).sort({name: 1})

        //works out if the stall is open today
        const restDays = stall.rest_days || []
        const isRestDay = restDays.includes(getSingaporeWeekday())
        const isOpenToday = !isRestDay && !CLOSED_STATUSES.includes(stall.status)

        res.json({
            stall: {
                stall_id: stall._id,
                stall_name: stall.name,
                centre_id: stall.centre_id,
                unit_no: stall.unit_no,
                status: stall.status,
                status_updated_at: stall.status_updated_at,
                rest_days: restDays,
                is_rest_day: isRestDay,
                is_open_today: isOpenToday
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