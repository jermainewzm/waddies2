const path = require("path")
const mongoose = require("mongoose")
const dotenv = require("dotenv")

dotenv.config({
    path: path.join(__dirname, "..", ".env")
})

const Stall = require("../models/stall-model")
const Shoutout = require("../models/shoutout-model")

async function seedShoutouts() {
    try {
        await mongoose.connect(process.env.DB)
        console.log("Connected to MongoDB")

        // clear old shoutouts
        await mongoose.connection
            .collection("shoutouts")
            .deleteMany({})

        console.log("Cleared old shoutouts")

        // get a few real seeded stalls
        const stalls = await Stall.find({}).limit(4)

        if (stalls.length === 0) {
            throw new Error(
                "No stalls found. Run seed-test-stalls.js first."
            )
        }

        const messages = [
            "Fresh steamed chicken available today! - Sunrise Chicken Rice",
            "Fresh fish soup until sold out! - Bismillah Chicken Rice",
            "Curry rice special today! - Warung Selera Nasi Padang",
            "Fresh batch out now! - Prata Paradise"
        ]

        const now = new Date()

        const endOfToday = new Date(now)
        endOfToday.setHours(
            23,
            59,
            59,
            999
        )

        for (let i = 0; i < stalls.length; i++) {
            await Shoutout.create({
                stall_id: stalls[i]._id,
                message: messages[i],
                created_at: now,
                expires_at: endOfToday
            })
        }

        console.log(
            `Created ${stalls.length} shoutouts`
        )

        await mongoose.disconnect()
        console.log("Disconnected from MongoDB")

    } catch (error) {
        console.error(
            "Shoutout seed failed:",
            error
        )

        await mongoose.disconnect()
        process.exit(1)
    }
}

seedShoutouts()