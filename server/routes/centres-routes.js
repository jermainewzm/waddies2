const express = require("express")

const {
  listCentres,
  getCentre,
  submitCrowdReport
} = require("../controllers/centres-controller")

const router = express.Router()

router.get("/", listCentres)

router.get("/:id", getCentre)

router.post(
  "/:id/crowd-reports",
  submitCrowdReport
)

module.exports = router