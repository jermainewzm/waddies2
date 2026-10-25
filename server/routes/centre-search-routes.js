//routes for Centre Search
const express = require("express")
const router = express.Router()

const { getCentreList, getCentreMenu } = require("../controllers/centre-search-controller")

//every centre + if it's open on the plan's date (fills the dropdown)
router.get("/centres", getCentreList)

//one centre's stalls + dishes for a plan, and who can't eat there
router.get("/plans/:code/centres/:serialNo", getCentreMenu)

module.exports = router