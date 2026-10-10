const mongoose = require("mongoose")

const hawkerRequestSchema = new mongoose.Schema({
    user_id: {
        type: String,
        required: true
    },

    centre_id: {
        type: String,
        required: true
    },

    stall_name: {
        type: String,
        required: true,
        trim: true
    },

    unit_no: {
        type: String,
        required: true,
        trim: true
    },

    message: {
        type: String,
        default: ""
    },

    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending"
    },

    created_at: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model("HawkerRequest", hawkerRequestSchema)