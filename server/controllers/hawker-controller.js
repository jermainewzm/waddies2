const HawkerRequest = require("../models/hawker-request-model")
const Stall = require("../models/stall-model")
const Centre = require("../models/centre-model")
const mongoose = require("mongoose")

async function createHawkerRequest(req, res) {
    try {
        const {
            serialNo,
            stall_name,
            unit_no,
            message
        } = req.body || {}

        // required fields
        if (
            !serialNo ||
            !stall_name ||
            !unit_no
        ) {
            return res.status(400).json({
                message:
                    "Centre, stall name and unit number are required."
            })
        }

        // prevent duplicate pending requests for same stall/unit
        const existingRequest =
        await HawkerRequest.findOne({
            serialNo: serialNo.trim(),
            unit_no: unit_no.trim(),
            status: "pending"
        })

        if (existingRequest) {
            return res.status(400).json({
                message:
                    "A pending request already exists for this stall."
            })
        }

        const newRequest =
            await HawkerRequest.create({
                serialNo: serialNo.trim(),
                stall_name: stall_name.trim(),
                unit_no: unit_no.trim(),
                message: message || ""
            })

        return res.status(201).json(newRequest)

    } catch (error) {
        return res.status(500).json({
            message:
                "Failed to submit hawker request",
        })
    }
}

async function getPendingRequests(req, res) {
    try {
        // oldest first, so the admin works through them in order
        const requests = await HawkerRequest.find({
            status: "pending"
        }).sort({ created_at: 1 }).lean()

        // requests only store the centre's serialNo, so look the names up in one query
        const serialNos = [
            ...new Set(requests.map((request) => String(request.serialNo)))
        ]

        const centres = await Centre.findBySerials(serialNos)

        const nameBySerial = new Map(
            centres.map((centre) => [String(centre.serialNo), centre.name])
        )

        const requestsWithNames = requests.map((request) => ({
            ...request,
            centre_name:
                nameBySerial.get(String(request.serialNo)) ||
                `Centre ${request.serialNo}`
        }))

        res.json(requestsWithNames)

    } catch (error) {
        res.status(500).json({
            message: "Failed to retrieve hawker requests",
        })
    }
}

async function approveHawkerRequest(req, res) {
    try {

        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({
                message: "Hawker request not found."
            })
        }

        const request = await HawkerRequest.findById(req.params.id)

        if (!request) {
            return res.status(404).json({
                message: "Hawker request not found"
            })
        }

        if (request.status !== "pending") {
            return res.status(400).json({
                message: "This request has already been processed"
            })
        }

        // Check that the selected hawker centre actually exists
        const centre = await mongoose.connection
            .collection("centres")
            .findOne({
                serialNo: String(request.serialNo)
            })

        if (!centre) {
            return res.status(400).json({
                message: "The selected hawker centre does not exist."
            })
        }

        // Check whether the requested unit is already occupied
        const occupiedUnit = await Stall.findOne({
            serialNo: request.serialNo,
            unit_no: request.unit_no
        })

        if (occupiedUnit) {
            return res.status(400).json({
                message: "This unit is already occupied by another stall."
            })
        }

        // Generate next hawker ID
        const hawkerStalls = await Stall.find({
        owner_id: /^HAWKER_\d+$/
        }).select("owner_id")

        let highestNumber = 0

        for (const stall of hawkerStalls) {
            const number = parseInt(
                stall.owner_id.split("_")[1]
            )

            // parseInt extracts string and converts to number, stripping the 0s at the front. e.g '005' --> 5

            if (number > highestNumber) {
                highestNumber = number
            }
        }

        const nextNumber = highestNumber + 1

        const newOwnerId =
            `HAWKER_${String(nextNumber).padStart(3, "0")}`

        // Create actual stall
        const stall = await Stall.create({
            serialNo: request.serialNo,
            owner_id: newOwnerId,
            name: request.stall_name,
            unit_no: request.unit_no,
            status: "closed",
            rest_days: []
        })

        // Update request
        request.status = "approved"
        request.assigned_owner_id = newOwnerId

        await request.save()

        return res.status(200).json({
            message: "Hawker approved successfully",
            assigned_owner_id: newOwnerId,
            request: request,
            stall: stall
        })

    } catch (error) {
        return res.status(500).json({
            message: "Failed to approve hawker request",
        })
    }
}

async function rejectHawkerRequest(req, res) {
    try {

        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({
                message: "Hawker request not found."
            })
        }

        const request = await HawkerRequest.findById(req.params.id)

        if (!request) {
            return res.status(404).json({
                message: "Hawker request not found"
            })
        }

        if (request.status !== "pending") {
            return res.status(400).json({
                message: "This request has already been processed"
            })
        }

        request.status = "rejected"
        await request.save()

        res.status(200).json({
            message: "Hawker request rejected",
            request: request
        })

    } catch (error) {
        res.status(500).json({
            message: "Failed to reject hawker request",
        })
    }
}

async function verifyExistingHawker(req, res) {
    try {
        const {
            owner_id,
            stall_name
        } = req.body || {}

        if (!owner_id || !stall_name) {
            return res.status(400).json({
                message: "Hawker ID and stall name are required."
            })
        }

        const stall = await Stall.findOne({
            owner_id: owner_id.trim().toUpperCase(),
            name: {
                $regex: `^${stall_name.trim()}$`,
                $options: "i"
            }
        })

        if (!stall) {
            return res.status(404).json({
                message: "Hawker ID or stall name is incorrect"
            })
        }

        return res.status(200).json({
            message: "Hawker verified successfully.",
            stall: stall
        })

    } catch (error) {
        return res.status(500).json({
            message: "Failed to verify hawker.",
        })
    }
}

async function getHawkerRequestStatus(req, res) {
    try {

        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({
                message: "Hawker request not found."
            })
        }

        const request = await HawkerRequest.findById(req.params.id)

        if (!request) {
            return res.status(404).json({
                message: "Hawker request not found."
            })
        }

        return res.status(200).json({
            status: request.status,
            assigned_owner_id: request.assigned_owner_id,
            stall_name: request.stall_name
        })

    } catch (error) {
        return res.status(500).json({
            message: "Failed to retrieve hawker request status.",
        })
    }
}

module.exports = {
    createHawkerRequest,
    getPendingRequests,
    approveHawkerRequest,
    rejectHawkerRequest,
    verifyExistingHawker,
    getHawkerRequestStatus
}