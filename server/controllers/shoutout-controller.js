const Shoutout = require("../models/shoutout-model")

function getSingaporeDate() {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Singapore",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(new Date())
}


function getSingaporeDayRange() {

    const singaporeDate = getSingaporeDate()

    // Singapore is UTC+8, so these represent
    // midnight and end-of-day in Singapore time
    const startOfToday = new Date(
        `${singaporeDate}T00:00:00.000+08:00`
    )

    const endOfToday = new Date(
        `${singaporeDate}T23:59:59.999+08:00`
    )

    return {
        startOfToday,
        endOfToday
    }
}


async function createShoutout(req, res) {
    try {
        const { message } = req.body || {}

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

        const {
            startOfToday,
            endOfToday
        } = getSingaporeDayRange()


        const existingShoutout =
            await Shoutout.findOne({
                stall_id: stall._id,
                created_at: {
                    $gte: startOfToday,
                    $lte: endOfToday
                }
            })


        if (existingShoutout) {

            existingShoutout.message =
                message.trim()

            existingShoutout.expires_at =
                endOfToday

            await existingShoutout.save()

            return res.status(200).json({
                message:
                    "Today's shout-out updated successfully.",
                shoutout: existingShoutout
            })
        }


        const shoutout =
            await Shoutout.create({
                stall_id: stall._id,
                message: message.trim(),
                expires_at: endOfToday
            })


        return res.status(201).json({
            message:
                "Shout-out created successfully.",
            shoutout: shoutout
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            message:
                "Something went wrong. Please try again."
        })
    }
}


async function getTodayShoutout(req, res) {
    try {
        const stall = req.stall

        if (!stall) {
            return res.status(404).json({
                message:
                    "No stall found for this hawker."
            })
        }


        const {
            startOfToday,
            endOfToday
        } = getSingaporeDayRange()


        const shoutout =
            await Shoutout.findOne({
                stall_id: stall._id,
                created_at: {
                    $gte: startOfToday,
                    $lte: endOfToday
                }
            })


        if (!shoutout) {
            return res.status(200).json(null)
        }


        return res.status(200).json(shoutout)

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            message:
                "Something went wrong. Please try again."
        })
    }
}


module.exports = {
    createShoutout,
    getTodayShoutout,
    getSingaporeDate,
    getSingaporeDayRange
}

// notes

// shout-outs are considered active only for the current
// Singapore calendar day.
//
// getSingaporeDate() determines today's date in Asia/Singapore.
//
// getSingaporeDayRange() then converts Singapore midnight
// and Singapore end-of-day into Date objects that MongoDB
// can compare against created_at.
//
// $gte = greater than or equal to
// $lte = less than or equal to
//
// MongoDB checks whether created_at falls between the
// start and end of today's Singapore date.