const Admin = require("../models/admin-model")

async function requireAdmin(req, res, next) {
    try {
        const adminId = req.headers["x-admin-id"]

        if (!adminId) {
            return res.status(401).json({
                message: "Admin ID is required."
            })
        }

        const admin = await Admin.findOne({
            admin_id: adminId
        })

        if (!admin) {
            return res.status(403).json({
                message: "Admin access required."
            })
        }

        req.admin = admin

        next()

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            message: "Something went wrong. Please try again."
        })
    }
}

module.exports = requireAdmin