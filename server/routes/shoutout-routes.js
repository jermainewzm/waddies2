const express = require("express")
const router = express.Router()
const requireApprovedHawker = require("../middleware/approve-hawker-middleware")

const {
    createShoutout,
    getTodayShoutout
} = require("../controllers/shoutout-controller")

router.get("/my-stall/shoutout", requireApprovedHawker, getTodayShoutout)
router.post("/my-stall/shoutout", requireApprovedHawker, createShoutout)

module.exports = router