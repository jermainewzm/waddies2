const express = require("express")
const router = express.Router()

const plansController = require("../controllers/plan-controller")

router.post("/", plansController.createPlan)
router.get("/location", plansController.getLocation)
router.get("/:code", plansController.getPlan)
router.post("/:code/members", plansController.joinPlan)
router.post("/:code/start", plansController.startSwiping)

router.post("/:code/shortlist", plansController.addToShortlist) 

router.get("/:code/cards", plansController.getSwipeCards)   //for swiping
router.post("/:code/swipes", plansController.submitSwipes)

router.get("/:code/route", plansController.getRouteToWinner)

module.exports = router