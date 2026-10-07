const mongoose = require("mongoose")

const crowdReportSchema = new mongoose.Schema(
  {
    centreId: {
      type: String,
      required: true,
      index: true
    },

    userId: {
      type: String,
      required: true,
      maxlength: 100
    },

    level: {
      type: String,
      enum: ["plenty", "few", "full"],
      required: true
    }
  },
  {
    timestamps: true
  }
)

crowdReportSchema.index({
  centreId: 1,
  createdAt: -1
})

crowdReportSchema.index({
  centreId: 1,
  userId: 1,
  createdAt: -1
})

module.exports = mongoose.model(
  "CrowdReport",
  crowdReportSchema,
  "crowd_reports"
)