const Plan = require("../models/plan-model")
const Centre = require("../models/centre-model")
const { getLatLng, getRoute } = require("../utils/onemap-helper")
const { rankCentres, getDistance, getValidDishes, canMemberEat, pickBestCentres, isCentreOpen } = require("../utils/shortlist-helper") //for Swiping Card + Centre Search checks
const { getFinishedIds, getResults } = require("../utils/swipe-helper") //for Swiping Card
const { summariseCrowd } = require("./centres-controller") //for Swiping Card
const CrowdReport = require("../models/crowd-report-model") //for Swiping Card
const Stall = require("../models/stall-model") //for swipe cards
const MAX_SHORTLIST = 5 //how many swipe cards the best centres fill
const MAX_PICKS = 10 //each Makan Plan can pick up to 10 centres in Centre Search

//gets many centres in one query and returns a lookup (ie. { "72": centre, "2": centre })
async function getCentresBySerial(serialNos) {
    const centres = await Centre.findBySerials(serialNos)   //helper in centre-model.js
    const centresBySerial = {}
    for (const centre of centres) {
        centresBySerial[String(centre.serialNo)] = centre
    }
    return centresBySerial
}

//serialNos on a plan's shortlist (ie. ["72", "2"])
function getShortlistSerials(plan) {
    return plan.shortlist.map(item => String(item.serialNo))
}
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

        //error prevention: also rejects things that aren't numbers (eg. "abc" or "1e5abc")
    const budgetNumber = Number(budget)
    if (Number.isNaN(budgetNumber) || budgetNumber < 1 || budgetNumber > 100) {
        return res.status(400).json({error: "Budget must be between $1 and $100"})
    }
    try {
        const plan = await Plan.findByCode(code)

        if (!plan) {
            return res.status(404).json({error: "No plan with that code"})
        }

        if (plan.status !== "joining") {
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
            const centresBySerial = await getCentresBySerial(getShortlistSerials(plan)) //look up the shortlisted centres
            data.results = getResults(plan, centresBySerial)     //revealing the results once all done
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
            return res.status(400).json({error: "Not enough people to start swiping!\nWait for at least one friend to join."})
        }

        //picks (up to 10) + nearby centres are scored together and
        //the best 5 for the whole group become the swipe cards

        //centres members picked in Centre Search
        const pickedBySerial = await getCentresBySerial(getShortlistSerials(plan))
        const pickedCentres = []
        for (const item of plan.shortlist) {
            const centre = pickedBySerial[String(item.serialNo)]
            if (centre) {   //skip a centre that was deleted
                pickedCentres.push(centre)
            }
        }

        const allCentres = await Centre.findAllCentres()
        const centresRanked = await rankCentres(plan, allCentres)

        //score picks + nearby centres together, keep the best 5
        const bestCentres = await pickBestCentres(plan, pickedCentres, centresRanked, MAX_SHORTLIST)

        const shortlist = []
        for (const centre of bestCentres) {
            //if someone picked it, keep who added it (saved in the database)
            let pick = null
            for (const item of plan.shortlist) {
                if (String(item.serialNo) === String(centre.serialNo)) {   //same centre?
                    pick = item
                }
            }
            shortlist.push({
                serialNo: String(centre.serialNo),   //saves the serialNo
                added_by: pick ? pick.added_by : "",
                added_by_id: pick ? pick.added_by_id : null
            })
        }

        if (shortlist.length === 0) {
            return res.status(400).json({error: "Nothing nearby fits everyone's diets and budgets.\nTry manually adding a hawker centre you want to try!"})
        }

        await Plan.setShortlist(code, shortlist)
        const updatedPlan = await Plan.updatePlanStatus(code, "swiping")
        res.json(updatedPlan)
    } catch (error) {
        console.error(error)
        res.status(500).json({error : "Could not start swiping."})
    }
}

//POST /api/plans/:code/shortlist   body: { serialNo, added_by, member_id }
//adds a centre to the plan's picks (Centre Search's add button)
//up to 10 picks per plan, the best 5 are chosen when swiping starts
exports.addToShortlist = async (req, res) => {
    const code = req.params.code
    const {serialNo, added_by, member_id} = req.body || {}

    //serialNo is plain text like "72"
    if (!serialNo || String(serialNo).trim() === "") {
        return res.status(400).json({error: "Please pick a centre."})
    }

    const centreSerial = String(serialNo).trim()

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

        //find the centre by its serialNo
        const centre = await Centre.findBySerial(centreSerial)

        if (!centre) {
            return res.status(404).json({error: "Centre not found!"})
        }

        //centre must be open on the plan's date (not closed for NEA cleaning)
        if (!isCentreOpen(centre, plan.date)) {
            return res.status(400).json({error: "This centre is closed on your plan's date."})
        }

        //no duplicates
        const alreadyAdded = getShortlistSerials(plan).includes(centreSerial)

        if (alreadyAdded) {
            return res.status(409).json({error: "This centre is already on the shortlist."})
        }

        //each plan can pick up to 10 centres. The best 5 are chosen when swiping starts
        if (plan.shortlist.length >= MAX_PICKS) {
            return res.status(400).json({error: `Your group has picked ${MAX_PICKS} centres already (max).`})
        }

        const updatedPlan = await Plan.addToShortlist(code, {
            serialNo: centreSerial,   //saves the serialNo
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
        const centresBySerial = await getCentresBySerial(getShortlistSerials(plan)) //look up the shortlisted centres

        for (const item of plan.shortlist) {
            const centre = centresBySerial[String(item.serialNo)]   //find the centre by its serialNo
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
                centreId: centre.serialNo,   //serialNo, swipes send it back
                name: centre.name,
                addedBy: item.added_by || "", //who added this centre ("" = suggested by HawkerHop)
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
        const centreIds = getShortlistSerials(plan)   //serialNos
        const swipedIds = swipes.map(swipe => String(swipe.centreId))
        const coversAll = swipedIds.length === centreIds.length && centreIds.every(id => swipedIds.includes(id))

        if (!coversAll) {
            return res.status(400).json({error: "Please swipe on every centre."})
        }

        const newSwipes = swipes.map(swipe => ({
            memberId: memberId,
            centreId: String(swipe.centreId),   //serialNo
            liked: swipe.liked === true
        }))
        await Plan.addSwipes(code, newSwipes)

        //fetch again so the new swipes are included to see once everyone is done.
        const freshPlan = await Plan.findByCode(code)
        const finishedIds = getFinishedIds(freshPlan)

        if (finishedIds.length === freshPlan.members.length) {
            const centresBySerial = await getCentresBySerial(getShortlistSerials(freshPlan)) //look up the shortlisted centres
            const results = getResults(freshPlan, centresBySerial)   //most likes first
            // no winner if nobody liked anything (winnerId is now a serialNo)
            const winnerId = results.length > 0 && results[0].likes > 0 ? results[0].centreId : null
            await Plan.finishPlan(code, winnerId)
        }

        res.json({message: "Swipes saved.", finished: finishedIds.length, total: freshPlan.members.length})

    } catch (error) {
        console.error(error)
        res.status(500).json({error: "Could not save your swipes."})
    }
}

/* GET /api/plans/:code/route?memberId=...
   One member's public transport route to the winning centre. */
//plan.winner is a serialNo so we look the centre up ourselves
exports.getRouteToWinner = async (req,res) => {
    const code = req.params.code
    const memberId = req.query.memberId
    //anything that isn't "drive" falls back to public transport
    const mode = req.query.mode === "drive" ? "drive" : "pt"
    let plan = null
    let me = null
    let winner = null   //the winning centre
    try {
        plan = await Plan.findByCode(code)

        if (!plan) {
            return res.status(404).json({error: "Plan not found!"})
        }
    
        for (const member of plan.members) {
            if (String(member._id) === String(memberId)) {
                me = member
            }
        }
        if (!me) {
            return res.status(403).json({error: "Join the plan first."})
        }
        if (plan.status !== "done" || !plan.winner) {
            return res.status(400).json({error: "The group hasn't picked a centre yet!"})
        }

        winner = await Centre.findBySerial(plan.winner)   //helper in centre-model.js
        if (!winner) {
            return res.status(404).json({error: "The winning centre could not be found."})
        }

        const routeToCentre = await getRoute(me, winner, plan.date, plan.time, winner.name, mode)

        if (!routeToCentre) {
            return res.status(502).json({error: "Could not find a route to this centre.",
                centre: {
                    serialNo: winner.serialNo, 
                    name: winner.name, 
                    lat: winner.lat, 
                    lng: winner.lng },
                member: {
                    lat: me.lat,
                    lng: me.lng
                }
            })
        }

        res.json({...routeToCentre, centre: {
            serialNo: winner.serialNo,
            name: winner.name,
            lat: winner.lat, 
            lng: winner.lng},
            member: {
                lat: me.lat,
                lng: me.lng
                }
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({error: "Could not load the route.",
            centre: winner ? { serialNo: winner.serialNo, name: winner.name, lat: winner.lat, lng: winner.lng } : null,
            member: me ? {lat: me.lat, lng: me.lng} : null   //me can be null if the plan lookup failed
        })
    }
}