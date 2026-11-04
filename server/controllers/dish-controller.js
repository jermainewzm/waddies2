const Dish= require("../models/dish-model")
const mongoose = require("mongoose")

function hasMaxTwoDecimalPlaces(price) {
    const parts = String(price).split(".")
    return !parts[1] || parts[1].length <= 2
}

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

async function getMyStallDishes(req, res) {
    try {
        const stall = req.stall

        if (!stall) {
            return res.status(404).json({
                message: "No stall found for this hawker."
            })
        }

        const dishes = await Dish.find({
            stall_id: stall._id
        })

        res.status(200).json(dishes)

    } catch (error) {
        res.status(500).json({
            message: "Failed to retrieve dishes",
        })
    }
}

async function addDish(req, res) {
    try {
        const {
            name,
            price,
            tags,
            is_available
        } = req.body || {}

        const stall = req.stall

        if (!stall) {
            return res.status(404).json({
                message: "No stall found for this hawker."
            })
        }

        if (!name || name.trim() === "") {
            return res.status(400).json({
                message: "Dish name is required."
            })
        }

        if (
            price === undefined ||
            typeof price !== "number" ||
            price <= 0
        ) {
            return res.status(400).json({
                message: "Price must be a number greater than 0."
            })
        }

        if (!hasMaxTwoDecimalPlaces(price)) {
            return res.status(400).json({
                message: "Price can have at most 2 decimal places."
            })
        }

        const existingDish = await Dish.findOne({
            stall_id: stall._id,
            name: {
                $regex: `^${escapeRegex(name.trim())}$`,
                $options: "i"
            }
        })

        if (existingDish) {
            return res.status(409).json({
                message: "You already have a dish with that name."
            })
        }

        const newDish = await Dish.create({
            stall_id: stall._id,
            name: name.trim(),
            price: price,
            tags: tags || [],
            is_available:
                is_available === undefined ? true : is_available
        })

        res.status(201).json(newDish)

    } catch (error) {
        res.status(500).json({
            message: "Failed to add dish",
        })
    }
}

async function updateDish(req, res) {
    try {

        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({
                message: "Dish not found for this stall."
            })
        }

        const stall = req.stall

        if (!stall) {
            return res.status(404).json({
                message: "No stall found for this hawker."
            })
        }

        const dish = await Dish.findOne({
            _id: req.params.id,
            stall_id: stall._id
        })

        if (!dish) {
            return res.status(404).json({
                message: "Dish not found for this stall."
            })
        }

        const {
            name,
            price,
            tags,
            is_available
        } = req.body || {}

        if (name !== undefined) {
            if (name.trim() === "") {
                return res.status(400).json({
                    message: "Dish name cannot be empty."
                })
            }

            const duplicateDish = await Dish.findOne({
                stall_id: stall._id,
                _id: { $ne: dish._id },
                name: {
                    $regex: `^${escapeRegex(name.trim())}$`,
                    $options: "i"
                }
            })

            if (duplicateDish) {
                return res.status(409).json({
                    message: "You already have a dish with that name."
                })
            }

            dish.name = name.trim()
        }

        if (price !== undefined) {

            if (
                typeof price !== "number" ||
                price <= 0
            ) {
                return res.status(400).json({
                    message: "Price must be a number greater than 0."
                })
            }

            if (!hasMaxTwoDecimalPlaces(price)) {
                return res.status(400).json({
                    message: "Price can have at most 2 decimal places."
                })
            }

            dish.price = price
        }

        if (tags !== undefined) {
            dish.tags = tags
        }

        if (is_available !== undefined) {
            dish.is_available = is_available
        }

        await dish.save()

        res.status(200).json(dish)

    } catch (error) {
        res.status(500).json({
            message: "Failed to update dish",
        })
    }
}

async function deleteDish(req, res) {
    try {

        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({
                message: "Dish not found for this stall."
            })
        }

        const stall = req.stall
        
        if (!stall) {
            return res.status(404).json({
                message: "No stall found for this hawker."
            })
        }

        const dish = await Dish.findOneAndDelete({
            _id: req.params.id,
            stall_id: stall._id
        })

        if (!dish) {
            return res.status(404).json({
                message: "Dish not found for this stall."
            })
        }

        res.status(200).json({
            message: "Dish deleted successfully."
        })

    } catch (error) {
        res.status(500).json({
            message: "Failed to delete dish"
        })
    }
}

module.exports = {
    getMyStallDishes,
    addDish,
    updateDish,
    deleteDish
}