const Admin = require("../models/admin-model")

async function verifyAdmin(req, res) {
    try {
        const { admin_id } = req.body

        if (!admin_id) {
            return res.status(400).json({
                message: "Admin ID is required."
            })
        }

        const admin = await Admin.findOne({
            admin_id: admin_id.trim()
        })

        if (!admin) {
            return res.status(401).json({
                message: "Invalid admin ID."
            })
        }

        return res.status(200).json({
            message: "Admin verified successfully.",
            admin: admin
        })

    } catch (error) {
        return res.status(500).json({
            message: "Failed to verify admin.",
            error: error.message
        })
    }
}

module.exports = {
    verifyAdmin
}