const express = require("express")
const router = express.Router()

const plansController = require("../controllers/plan-controller")

router.post("/", plansController.createPlan)
router.get("/location", plansController.getLocation)
router.get("/:code", plansController.getPlan)
router.post("/:code/members", plansController.joinPlan)
router.post("/:code/start", plansController.startSwiping)

module.exports = router