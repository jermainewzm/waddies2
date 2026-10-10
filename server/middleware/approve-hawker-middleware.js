const Stall = require("../models/stall-model")
const currentUser = require("../utils/mockUser")

async function requireApprovedHawker(req, res, next) {
    try {
        const stall = await Stall.findOne({
            owner_id: currentUser.id
        })

        if (!stall) {
            return res.status(403).json({
                message: "Only approved hawkers can access this feature."
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