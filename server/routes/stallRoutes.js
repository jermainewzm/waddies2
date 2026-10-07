const express = require("express")
const router = express.Router()

const {
    getMyStall,
    updateMyStallStatus,
    updateMyStallRestDays,
} = require("../controllers/stallController")

router.get("/my-stall", getMyStall)
router.patch("/my-stall/status", updateMyStallStatus)
router.patch("/my-stall/rest-days", updateMyStallRestDays)

module.exports = router