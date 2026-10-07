const express = require("express")
const {
    createHawkerRequest,
    getPendingRequests,
    approveHawkerRequest,
    rejectHawkerRequest
} = require("../controllers/hawkerController")

const router = express.Router()

router.post("/apply", createHawkerRequest)
router.get("/requests", getPendingRequests)
router.patch("/requests/:id/approve", approveHawkerRequest)
router.patch("/requests/:id/reject", rejectHawkerRequest)


module.exports = router


// notes
// what is patch? partially updates existing data (changing only specific fields)