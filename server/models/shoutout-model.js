const mongoose = require("mongoose")

const shoutoutSchema = new mongoose.Schema({
    stall_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Stall",
        required: true
    },

    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 80
    },

    created_at: {
        type: Date,
        default: Date.now
    },

    expires_at: {
        type: Date,
        required: true
    }
})

module.exports = mongoose.model("Shoutout", shoutoutSchema)