const express = require("express")

const {
    verifyAdmin
} = require("../controllers/admin-controller")

const router = express.Router()

router.post("/verify", verifyAdmin)

module.exports = router