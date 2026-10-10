const Plan = require("../models/plan-model")
const { getLatLng } = require("../utils/onemap-helper")

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
        res.json(plan)

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
    const memberId = req.body.memberId || {}

    try {
        //Check if the plan even exists
        const plan = await Plan.findByCode(code)
        if (!plan) {
            return res.status(404).json({error: "Can't find a plan with that code."})
        }
        //else check if the member is the HOST. only the host can start
        if (plan.members.length === 0 || String(plan.members[0]._id) !== memberId) {
            return res.status(403).json({error: "Only the host can start swiping!"})
        }
        if (plan.members.length < 2) {
            return res.status(400).json({error: "Not enough people to start swiping! Wait for at least one friend to join."})
        }

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
    const {centre_id, added_by} = req.body || {}

    if (!centre_id || !String(centre_id).trim()) {
        return res.status(400).json({error: "Centre is required!"})
    }

    const centreId = String(centre_id).trim()

    try {
        const plan = await Plan.findByCode(code)

        if (!plan) {
            return res.status(404).json({error: "No plan with that code"})
        }

        //checks the centre is real (at least one stall belongs to it)
        //change this to the centres collection once it exists
        const centreExists = await Stall.exists({centre_id: centreId})

        if (!centreExists) {
            return res.status(404).json({error: "Centre not found!"})
        }

        const shortlist = plan.shortlist || []

        if (shortlist.some(item => item.centre_id === centreId)) {
            return res.status(409).json({error: "This centre is already on the shortlist."})
        }

        if (shortlist.length >= MAX_SHORTLIST) {
            return res.status(400).json({error: "The shortlist is full (max 5 centres)."})
        }

        const updatedPlan = await Plan.addToShortlist(code, {
            centre_id: centreId,
            added_by: String(added_by || "").trim()
        })

        res.json(updatedPlan)

    } catch(error) {
        console.error(error)
        res.status(500).json({error: "Could not add to plan. Please try again."})
    }
}
