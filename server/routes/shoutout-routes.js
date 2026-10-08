const express = require("express")
const router = express.Router()

const {
    createShoutout,
    getTodayShoutout
} = require("../controllers/shoutout-controller")

router.get("/my-stall/shoutout", getTodayShoutout)
router.post("/my-stall/shoutout", createShoutout)

module.exports = router