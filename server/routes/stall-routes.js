const express = require("express")
const router = express.Router()
const requireApprovedHawker = require("../middleware/approve-hawker-middleware")

const {
    getMyStall,
    updateMyStallStatus,
    updateMyStallRestDays,
} = require("../controllers/stall-controller")

router.get("/my-stall", requireApprovedHawker, getMyStall)
router.patch("/my-stall/status", requireApprovedHawker, updateMyStallStatus)
router.patch("/my-stall/rest-days", requireApprovedHawker, updateMyStallRestDays)

module.exports = router