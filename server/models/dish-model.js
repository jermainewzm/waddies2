const mongoose = require("mongoose")

const dishSchema = new mongoose.Schema({
    stall_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Stall",
        required: true
    },

    name: {
        type: String,
        required: true,
        trim: true
    },

    price: {
        type: Number,
        required: true,
        min: 0.01
    },

    tags: {
        type: [String],
        enum: ["halal", "vegetarian", "no_pork", "no_beef"],
        default: []
    },

    is_available: {
        type: Boolean,
        default: true
    }
})

module.exports = mongoose.model("Dish", dishSchema)