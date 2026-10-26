
const Stall= require("../models/stall-model")

async function getMyStall(req, res) {
    try {
        const stall = req.stall

        if (!stall) {
            return res.status(404).json({
                message: "No stall found for this hawker."
            })
        }

        res.status(200).json(stall)

    } catch (error) {
        res.status(500).json({
            message: "Failed to retrieve stall",
            error: error.message
        })
    }
}

async function updateMyStallStatus(req, res) {
    try {
        const { status } = req.body

        const allowedStatuses = [
            "open",
            "sold_out",
            "closed_early",
            "closed"
        ]

        // might need to rethink about the allowed status options

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid stall status"
            })
        }

        const stall = await Stall.findOneAndUpdate(
            { _id: req.stall._id },
            {
                status: status,
                status_updated_at: new Date()
            },
            {
                new: true
            }
        )

        if (!stall) {
            return res.status(404).json({
                message: "No stall found for this hawker."
            })
        }

        res.status(200).json(stall)

    } catch (error) {
        res.status(500).json({
            message: "Failed to update stall status",
            error: error.message
        })
    }
}

async function updateMyStallRestDays(req, res) {
    try {
        const { rest_days } = req.body

        const allowedDays = [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday"
        ]

        if (!Array.isArray(rest_days)) {
            return res.status(400).json({
                message: "rest_days must be an array"
            })
        }

        const invalidDay = rest_days.find(
            day => !allowedDays.includes(day)
        )

        if (invalidDay) {
            return res.status(400).json({
                message: `Invalid rest day: ${invalidDay}`
            })
        }

        const stall = await Stall.findOneAndUpdate(
            { _id: req.stall._id },
            {
                rest_days: rest_days
            },
            {
                new: true
            }
        )

        if (!stall) {
            return res.status(404).json({
                message: "No stall found for this hawker."
            })
        }

        res.status(200).json(stall)

    } catch (error) {
        res.status(500).json({
            message: "Failed to update rest days",
            error: error.message
        })
    }
}

module.exports= {
    getMyStall,
    updateMyStallStatus,
    updateMyStallRestDays,
}