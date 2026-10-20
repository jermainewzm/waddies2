const express = require("express")
const router = express.Router()
const requireApprovedHawker = require("../middleware/approve-hawker-middleware")

const {
    getMyStallDishes,
    addDish,
    updateDish,
    deleteDish
} = require("../controllers/dish-controller")


router.get("/my-stall/dishes", requireApprovedHawker, getMyStallDishes)
router.post("/my-stall/dishes", requireApprovedHawker, addDish)
router.patch("/dishes/:id", requireApprovedHawker, updateDish)
router.delete("/dishes/:id", requireApprovedHawker, deleteDish)

module.exports = router