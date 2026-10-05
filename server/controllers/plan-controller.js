const Plan = require("../models/plan-model")
const { getLatLng } = require("../utils/onemap-helper")

function generateCode() {
    return String(Math.floor(100000+ Math.random() * 900000))
}

exports.createPlan = async (req, res) => {
    const {name, date, time} = req.body || {}
    if (!name || !date || !time) {
        return res.status(400).json({error: "Name, date and time are required!"})
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
    const {name, postal, diet, budget} = req.body || {}

    if (!name || !postal || !budget) {
        return res.status(400).json({error: "Name, postal code and budget are required!"})
    }
    try {
        const plan = await Plan.findByCode(code)

        if (!plan) {
            return res.status(404).json({error: "No plan with that code"})
        }

        const location = await getLatLng(postal)

        if (!location) {
            return res.status(400).json({error: "Postal code not found!"})
        }

        const member = {
            name: name,
            lat: location.lat,
            lng: location.lng,
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
