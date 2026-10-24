const express = require("express")

const {
    createHawkerRequest,
    getPendingRequests,
    approveHawkerRequest,
    rejectHawkerRequest,
    verifyExistingHawker,
    getHawkerRequestStatus

} = require("../controllers/hawker-controller")

const requireAdmin =
    require("../middleware/require-admin-middleware")

const router = express.Router()

router.post("/apply", createHawkerRequest)
router.get("/requests", requireAdmin, getPendingRequests)
router.patch("/requests/:id/approve", requireAdmin, approveHawkerRequest)
router.patch("/requests/:id/reject", requireAdmin, rejectHawkerRequest)
router.post("/verify", verifyExistingHawker)
router.get("/requests/:id/status",getHawkerRequestStatus)

module.exports = router


// notes
// what is patch? partially updates existing data (changing only specific fields)