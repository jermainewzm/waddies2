const HawkerRequest = require("../models/HawkerRequest")
const currentUser = require("../utils/mockUser")
const Stall = require("../models/Stall")

async function createHawkerRequest(req, res) {
    try {
        const {
            centre_id,
            stall_name,
            unit_no,
            message
        } = req.body

        // check for existing stall, then block if have
        const existingStall = await Stall.findOne({
            owner_id: currentUser.id
        })

        if (existingStall) {
            return res.status(400).json({
                message: "You are already an approved hawker."
            })
        }

        // if already got pendign req, block duplicate 
        const existingRequest = await HawkerRequest.findOne({
            user_id: currentUser.id,
            status: "pending"
        })

        if (existingRequest) {
            return res.status(400).json({
                message: "You already have a pending hawker request."
            })
        }

        const newRequest = await HawkerRequest.create({
            user_id: currentUser.id,
            centre_id,
            stall_name,
            unit_no,
            message
        })

        res.status(201).json(newRequest)

    } catch (error) {
        res.status(500).json({
            message: "Failed to submit hawker request",
            error: error.message
        })
    }
}

async function getPendingRequests(req, res) {
    try {
        const requests = await HawkerRequest.find({
            status: "pending"
        })

        res.json(requests)

    } catch (error) {
        res.status(500).json({
            message: "Failed to retrieve hawker requests",
            error: error.message
        })
    }
}

async function approveHawkerRequest(req, res) {
    try {
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


        // ERR HANDLING: Check if this user already owns a stall 

        const existingStall = await Stall.findOne({
            owner_id: request.user_id
        })

        if (existingStall) {
            return res.status(400).json({
                message: "This hawker already has a stall."
            })
        }

        // Create the stall first
        const stall = await Stall.create({
            centre_id: request.centre_id,
            owner_id: request.user_id,
            name: request.stall_name,
            unit_no: request.unit_no,
            status: "closed",
            rest_days: []
        })

        // Only approve the request if stall creation succeeded
        request.status = "approved"
        await request.save()

        res.status(200).json({
            message: "Hawker approved successfully",
            request: request,
            stall: stall
        })

    } catch (error) {
        res.status(500).json({
            message: "Failed to approve hawker request",
            error: error.message
        })
    }
}

async function rejectHawkerRequest(req, res) {
    try {
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
            error: error.message
        })
    }
}


module.exports = {
    createHawkerRequest,
    getPendingRequests,
    approveHawkerRequest,
    rejectHawkerRequest,
}