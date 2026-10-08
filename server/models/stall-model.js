// models/Stall.js
const mongoose = require("mongoose")

const stallSchema = new mongoose.Schema({
    centre_id: {
        type: String,
        required: true
    },

    owner_id: {
        type: String,
        required: true
    },

    name: {
        type: String,
        required: true
    },

    unit_no: {
        type: String,
        required: true
    },

    status: {
        type: String,
        enum: ["open", "sold_out", "closed_early", "closed"],
        default: "open"
    },

    rest_days: {
        type: [String],
        default: []
    },

    status_updated_at: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model("Stall", stallSchema)