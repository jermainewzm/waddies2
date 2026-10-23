// NEW FILE (Centre Search): replaces dish-search-routes.js
const express = require("express")
const router = express.Router()

const { getCentreList, getCentreMenu } = require("../controllers/centre-search-controller")

// every centre + whether it's open on the plan's date (fills the dropdown)
router.get("/centres", getCentreList)

// one centre's stalls and dishes for a plan, plus who in the group can't eat there
router.get("/plans/:code/centres/:serialNo", getCentreMenu)

module.exports = router