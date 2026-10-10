const express = require("express")
const router = express.Router()

const { searchDishes, getStallMenu } = require("../controllers/dish-search-controller")

router.get("/search", searchDishes)
router.get("/stalls/:stallId/menu", getStallMenu)

module.exports = router