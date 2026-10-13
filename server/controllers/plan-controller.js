const Plan = require("../models/plan-model")
const Centre = require("../models/centre-model")
const { getLatLng } = require("../utils/onemap-helper")
const { rankCentres, getDistance, getValidDishes, canMemberEat } = require("../utils/shortlist-helper") //for Swiping Card
const { getFinishedIds, getResults } = require("../utils/swipe-helper") //for Swiping Card
const { summariseCrowd } = require("./centres-controller") //for Swiping Card
const CrowdReport = require("../models/crowd-report-model") //for Swiping Card
const Stall = require("../models/stall-model") //ADDED for Dish Search
const MAX_SHORTLIST = 5 //ADDED for Dish Search


function generateCode() {
    return String(Math.floor(100000+ Math.random() * 900000))
}

exports.createPlan = async (req, res) => {
    const {name, date, time} = req.body || {}
    if (!name || !name.trim() || !date || !time) { //added name cant be only spaces
        return res.status(400).json({error: "Name, date and time are required!"})
    }
    //turns the user selected date into a date object 
    const planDateTime = new Date(`${date}T${time}:00+08:00`) //+08:00" means Singapore time, so it works even if the server runs in another timezone

    //validates that the date is not garbage (ie. hello or invalid month)
    if (isNaN(planDateTime.getTime())) {
        return res.status(400).json({error: "Invalid date or time."}) //.getTime on invalid dates returns NaN
    }

    //validates that the date is not in the past
    if (planDateTime <= new Date()) {
        return res.status(400).json({error: "Plan must be in the future"})
    }

    try {
        let code = generateCode()

        while (await Plan.findByCode(code)) {
            code = generateCode()
        }
        const plan = await Plan.addPlan(code, name, date, time) 
        res.json(plan)

    } catch(error) {
        console.error(error)
        res.status(500).json({error: "Could not create plan. Please try again." })
        }
}

exports.joinPlan = async (req,res) => {
    const code = req.params.code
    const {name, lat, lng, diet, budget} = req.body || {}

    if (!name || lat == null || lng == null|| !budget) {
        return res.status(400).json({error: "Name, location and budget are required!"})
    }

    if (Number(budget) < 1 || Number(budget) > 100) {
        return res.status(400).json({error: "Budget must be between $1 and $100"})
    }
    try {
        const plan = await Plan.findByCode(code)

        if (!plan) {
            return res.status(404).json({error: "No plan with that code"})
        }

        if (plan.status === "swiping") {
            return res.status(400).json({error: "This plan has already started swiping"})
        }

        const member = {
            name: name,
            lat: Number(lat),
            lng: Number(lng),
            diet: diet,
            budget: Number(budget)
        }

        const updatedPlan = await Plan.addMember(code, member)
        res.json(updatedPlan)
        
    } catch(error) {
        console.error(error)
        res.status(500).json({error: "Could not join plan. Please try again." })

    }

}

exports.getPlan = async(req,res) => {
    const code = req.params.code

    if (!code) {
        return res.status(400).json({error: "Plan code is required!"})
    }
    try {
        const plan = await Plan.findByCode(code)

        if (!plan) {
            return res.status(404).json({error: "Plan not found!"})
    }
        const data = plan.toObject()    //plain copy to safely change (for swiping)
        data.finishedIds = getFinishedIds(plan)     //members who finished swiping

        if (plan.status === "done") {
            data.results = getResults(plan)     //revealing the results once all done
        } else {
            data.swipes = []    //keep swipes secret until everyone is done
        }

        res.json(data)

    } catch(error) {
        console.error(error)
        res.status(500).json({error: "Could not get plan"})
    }

}

exports.getLocation = async (req, res) => {
  const postal = req.query.postal

  if (!postal) {
    return res.status(400).json({ error: "Postal code is required!"})
  }

  try {
    const location = await getLatLng(postal)
    if (!location) {
      return res.status(404).json({ error: "Postal code not found!"})
    }
    res.json(location)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Could not look up postal code."})
  }
}

exports.startSwiping = async (req,res) => {
    const code = req.params.code
    const {memberId} = req.body || {}

    try {
        //Check if the plan even exists
        const plan = await Plan.findByCode(code)
        if (!plan) {
            return res.status(404).json({error: "Can't find a plan with that code."})
        }

        // is the plan already swiping? dont rebuild shortlist if already swiping
        if (plan.status !== "joining") {
            return res.status(400).json({error: "Swiping has already started for this plan."})
        }
        //else check if the member is the HOST. only the host can start
        if (plan.members.length === 0 || String(plan.members[0]._id) !== memberId) {
            return res.status(403).json({error: "Only the host can start swiping!"})
        }
        if (plan.members.length < 2) {
            return res.status(400).json({error: "Not enough people to start swiping! Wait for at least one friend to join."})
        }

        const shortlist = []
        const duplicateIds = []

        //save the centres that plan members added from Dish Search
        for (const item of plan.shortlist) {
            shortlist.push({centre_id : item.centre_id,
                            added_by : item.added_by,
                            added_by_id : item.added_by_id
            })
            duplicateIds.push(String(item.centre_id))
        }

        const allCentres = await Centre.findAllCentres()
        const centresRanked = await rankCentres(plan,allCentres)

        for (const centre of centresRanked) {
            if (shortlist.length >= MAX_SHORTLIST) {
                break
            }

            if (!duplicateIds.includes(String(centre._id))) {
                shortlist.push({centre_id : centre._id, added_by: ""})
                duplicateIds.push(String(centre._id))
            }
        }

        if (shortlist.length === 0) {
            return res.status(400).json({error: "No nearby centre fits everyone's diets. Try raising budgets or add a centre from Dish Search!"})
        }

        await Plan.setShortlist(code, shortlist)
        const updatedPlan = await Plan.updatePlanStatus(code, "swiping")
        res.json(updatedPlan)
    } catch (error) {
        console.error(error)
        res.status(500).json({error : "Could not start swiping."})
    }
}

//ADDED for Dish Search
//POST /api/plans/:code/shortlist   body: { centre_id, added_by }
//adds a hawker centre to the plan's shortlist (used by Dish Search's "Add to plan")
exports.addToShortlist = async (req, res) => {
    const code = req.params.code
    const {centre_id, added_by, member_id} = req.body || {}

    if (!centre_id || !String(centre_id).trim()) {
        return res.status(400).json({error: "Centre is required!"})
    }

    const centreId = String(centre_id).trim()

    try {
        const plan = await Plan.findByCode(code)

        if (!plan) {
            return res.status(404).json({error: "No plan with that code"})
        }

        if (plan.status !== "joining") {
            return res.status(400).json({error: "This plan has already started swiping."})
        }

        let isMember = false
        for (const member of plan.members) {
            if (String(member._id) === String(member_id)) {
                isMember = true
            }
        }
        if (!isMember) {
            return res.status(403).json({error: "Join the plan before adding centres."})
        }

        //checks the centre is real (at least one stall belongs to it)
        //change this to the centres collection once it exists
        const centreExists = await Stall.exists({centre_id: centreId})

        if (!centreExists) {
            return res.status(404).json({error: "Centre not found!"})
        }

        const shortlist = plan.shortlist || []

        if (shortlist.some(item => String(item.centre_id) === centreId)) {
            return res.status(409).json({error: "This centre is already on the shortlist."})
        }

        if (shortlist.length >= MAX_SHORTLIST) {
            return res.status(400).json({error: "The shortlist is full (max 5 centres)."})
        }

        const updatedPlan = await Plan.addToShortlist(code, {
            centre_id: centreId,
            added_by: String(added_by || "").trim(),
            added_by_id: member_id
        })

        res.json(updatedPlan)

    } catch(error) {
        console.error(error)
        res.status(500).json({error: "Could not add to plan. Please try again."})
    }
}

//GET /api/plans/:code/cards?memberId=...
//swipe cards for ONE member (crowd level, distance from them & stalls for them)
exports.getSwipeCards = async (req, res) => {
    const code = req.params.code
    const memberId = req.query.memberId

    try {
        const plan = await Plan.findByCode(code)

        if (!plan) {
            return res.status(404).json({error: "Plan not found!"})
        }

        let me = null
        for (const member of plan.members) {
            if (String(member._id) === String(memberId)) {
                me = member
            }
        }
        if (!me) {
            return res.status(403).json({error: "Join the plan first."})
        }
        if (plan.status === "joining") {
            return res.status(400).json({error: "Swiping hasn't started yet."})
        }

        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
        const cards = []

        for (const item of plan.shortlist) {
            const centre = item.centre_id
            if (!centre) {
                continue
            }

            //Dishes THIS member can eat at this centre (within diet + budget)
            const openDishes = await getValidDishes(centre, plan.date)
            const myDishes = openDishes.filter(dish => canMemberEat(me, dish))

            //Find the stalls by the dishes (Set removes dupes, Map looks up)
            const stallIds = [...new Set(myDishes.map(dish => String(dish.stall_id)))]
            const stalls = await Stall.find({_id: {$in: stallIds}})

            const suitableStalls = stalls.map(stall => ({
                name: stall.name,
                dishes: myDishes
                    .filter(dish => String(dish.stall_id) === String(stall._id))
                    .map(dish => ({name: dish.name, price: dish.price}))
            }))

            //Crowd level from the reports of the last hour only
            const reports = await CrowdReport.find({
                centreId: String(centre.serialNo),
                createdAt: {$gte: oneHourAgo}
            }).sort({createdAt: -1}).lean()

            cards.push({
                centreId: centre._id,
                name: centre.name,
                address: centre.address,
                photoUrl: centre.photoUrl,
                foodStalls: centre.foodStalls,
                distanceKm: Math.round(getDistance(me, centre) * 10) / 10,
                crowd: summariseCrowd(reports),
                stalls: suitableStalls
            })
        }

        res.json({cards})
    } catch (error) {
        console.error(error)
        res.status(500).json({error: "Could not load the swipe cards."})
    }
}

//POST /api/plans/:code/swipes   body: { memberId, swipes: [{centreId, liked}, ...] }
//saves ONE member's swipes. Only when all members done, then select winning centre
exports.submitSwipes = async (req, res) => {
    const code = req.params.code
    const {memberId, swipes} = req.body || {}

    if (!memberId || !Array.isArray(swipes)) {
        return res.status(400).json({error: "Member and swipes are required!"})
    }

    try {
        const plan = await Plan.findByCode(code)

        if (!plan) {
            return res.status(404).json({error: "Plan not found!"})
        }
        if (plan.status !== "swiping") {
            return res.status(400).json({error: "This plan is not swiping right now."})
        }

        const isMember = plan.members.some(member => String(member._id) === String(memberId))
        if (!isMember) {
            return res.status(403).json({error: "Only members of this plan can swipe."})
        }

        if (getFinishedIds(plan).includes(String(memberId))) {
            return res.status(400).json({error: "You have already sent your swipes."})
        }

        // the swipes must cover every shortlisted centre exactly once
        const centreIds = plan.shortlist
            .filter(item => item.centre_id)
            .map(item => String(item.centre_id._id))
        const swipedIds = swipes.map(swipe => String(swipe.centreId))
        const coversAll = swipedIds.length === centreIds.length && centreIds.every(id => swipedIds.includes(id))

        if (!coversAll) {
            return res.status(400).json({error: "Please swipe on every centre."})
        }

        const newSwipes = swipes.map(swipe => ({
            memberId: memberId,
            centreId: swipe.centreId,
            liked: swipe.liked === true
        }))
        await Plan.addSwipes(code, newSwipes)

        //fetch again so the new swipes are included to see once everyone is done.
        const freshPlan = await Plan.findByCode(code)
        const finishedIds = getFinishedIds(freshPlan)

        if (finishedIds.length === freshPlan.members.length) {
            const results = getResults(freshPlan)
            // no winner if nobody liked anything
            const winnerId = results.length > 0 && results[0].likes > 0 ? results[0].centreId : null
            await Plan.finishPlan(code, winnerId)
        }

        res.json({message: "Swipes saved.", finished: finishedIds.length, total: freshPlan.members.length})

    } catch (error) {
        console.error(error)
        res.status(500).json({error: "Could not save your swipes."})
    }
}