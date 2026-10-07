const express = require("express")
const router = express.Router()

const {
    getMyStallDishes,
    addDish,
    updateDish,
    deleteDish
} = require("../controllers/dishController")


router.get("/my-stall/dishes", getMyStallDishes)
router.post("/my-stall/dishes", addDish)
router.patch("/dishes/:id", updateDish)
router.delete("/dishes/:id", deleteDish)

module.exports = router