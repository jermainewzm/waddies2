const Stall = require("../models/stall-model")

async function requireApprovedHawker(req, res, next) {
    try {
        const hawkerId = req.headers["x-hawker-id"]?.trim().toUpperCase()

        if (!hawkerId) {
            return res.status(401).json({
                message: "Hawker ID is required."
            })
        }

        const stall = await Stall.findOne({
            owner_id: hawkerId
        })

        if (!stall) {
            return res.status(403).json({
                message: "You do not have access to a stall."
            })
        }

        req.stall = stall

        next()

    } catch (error) {
        res.status(500).json({
            message: "Failed to verify hawker access.",
            error: error.message
        })
    }
}

module.exports = requireApprovedHawker