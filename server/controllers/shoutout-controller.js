const Shoutout = require("../models/shoutout-model")
const Stall = require("../models/stall-model")

async function createShoutout(req, res) {
    try {
        const { message } = req.body

        if (!message || message.trim() === "") {
            return res.status(400).json({
                message: "Shout-out message is required."
            })
        }

        if (message.trim().length > 80) {
            return res.status(400).json({
                message: "Shout-out cannot exceed 80 characters."
            })
        }

        const stall = req.stall

        if (!stall) {
            return res.status(404).json({
                message: "No stall found for this hawker."
            })
        }

        const now = new Date()

        const startOfToday = new Date(now)
        startOfToday.setHours(0, 0, 0, 0)

        const endOfToday = new Date(now)
        endOfToday.setHours(23, 59, 59, 999)

        const existingShoutout = await Shoutout.findOne({
            stall_id: stall._id,
            created_at: {
                $gte: startOfToday,
                $lte: endOfToday
            }
        })

        if (existingShoutout) {
            existingShoutout.message = message.trim()
            existingShoutout.expires_at = endOfToday

            await existingShoutout.save()

            return res.status(200).json({
                message: "Today's shout-out updated successfully.",
                shoutout: existingShoutout
            })
        }

        const shoutout = await Shoutout.create({
            stall_id: stall._id,
            message: message.trim(),
            expires_at: endOfToday
        })

        res.status(201).json({
            message: "Shout-out created successfully.",
            shoutout: shoutout
        })

    } catch (error) {
        res.status(500).json({
            message: "Failed to create shout-out",
            error: error.message
        })
    }
}

async function getTodayShoutout(req, res) {
    try {
        const stall = req.stall

        if (!stall) {
            return res.status(404).json({
                message: "No stall found for this hawker."
            })
        }

        const now = new Date()

        const startOfToday = new Date(now)
        startOfToday.setHours(0, 0, 0, 0)

        const endOfToday = new Date(now)
        endOfToday.setHours(23, 59, 59, 999)

        const shoutout = await Shoutout.findOne({
            stall_id: stall._id,
            created_at: {
                $gte: startOfToday,
                $lte: endOfToday
            }
        })

        if (!shoutout) {
            return res.status(200).json(null)
        }

res.status(200).json(shoutout)

    } catch (error) {
        res.status(500).json({
            message: "Failed to retrieve today's shout-out",
            error: error.message
        })
    }
}


module.exports = {
    createShoutout,
    getTodayShoutout
}

// notes

// for shoutouts, we had to add a endoftoday such that previous' days shoutouts are not counted as active, which might prevent hawker from adding a brand new day's shoutout
//  $gte = greater than or equal to
// $lte = less than or equal to
// so mongoDB checks if created_at is between the start and of today 