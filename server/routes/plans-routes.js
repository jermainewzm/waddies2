const express = require("express")
const router = express.Router()

const plansController = require("../controllers/plan-controller")

router.post("/", plansController.createPlan)
router.get("/:code", plansController.getPlan)
router.post("/:code/members", plansController.joinPlan)

module.exports = router