const mongoose = require("mongoose")

const CrowdReport = require("../models/crowd-report-model")

const {
  getCentresWithStatus,
  getCentreById,
  getSingaporeTodayIso
} = require("../utils/nea-helper")

const RECENT_REPORT_MS = 60 * 60 * 1000
const REPORT_COOLDOWN_MS = 15 * 60 * 1000

function crowdLabel(level) {
  if (level === "plenty") {
    return "Plenty of seats"
  }

  if (level === "few") {
    return "Few seats"
  }

  if (level === "full") {
    return "Full"
  }

  return "No recent reports"
}

function summariseCrowd(reports) {
  if (!reports || reports.length === 0) {
    return {
      level: null,
      label: "No recent reports",
      count: 0
    }
  }

  const counts = {
    plenty: 0,
    few: 0,
    full: 0
  }

  for (const report of reports) {
    if (counts[report.level] !== undefined) {
      counts[report.level] += 1
    }
  }

  const highestCount = Math.max(
    counts.plenty,
    counts.few,
    counts.full
  )

  const tiedLevels = Object.keys(counts).filter(
    (level) => counts[level] === highestCount
  )

  let chosenLevel

  if (tiedLevels.length === 1) {
    chosenLevel = tiedLevels[0]
  } else {
    // If multiple levels are tied, use the most recently
    // submitted level among those tied choices.
    const newestMatchingReport = [...reports]
      .filter((report) => tiedLevels.includes(report.level))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      )[0]

    chosenLevel = newestMatchingReport.level
  }

  return {
    level: chosenLevel,
    label: crowdLabel(chosenLevel),
    count: reports.length,
    counts
  }
}

async function recentCrowdReports() {
  const since = new Date(Date.now() - RECENT_REPORT_MS)

  return CrowdReport.find({
    createdAt: {
      $gte: since
    }
  })
    .sort({
      createdAt: -1
    })
    .lean()
}

function groupReportsByCentre(reports) {
  const grouped = {}

  for (const report of reports) {
    if (!grouped[report.centreId]) {
      grouped[report.centreId] = []
    }

    grouped[report.centreId].push(report)
  }

  return grouped
}

// stalls and shout-outs for one centre (stalls link to centres by serialNo)
async function getWp4Data(centreId) {
  if (!mongoose.connection.db) {
    return {
      stalls: [],
      shoutouts: []
    }
  }

  let shoutouts = []

  const stalls = await mongoose.connection.db
    .collection("stalls")
    .find({ serialNo: String(centreId) })
    .toArray()

  if (stalls.length > 0) {
    const stallIds = stalls.map((stall) => stall._id)

    const allShoutouts = await mongoose.connection.db
      .collection("shoutouts")
      .find({ stall_id: { $in: stallIds } })
      .sort({ created_at: -1 })
      .toArray()

    const now = Date.now()

    const stallsById = new Map(
      stalls.map((stall) => [
        String(stall._id),
        stall
      ])
    )

    shoutouts = allShoutouts
      .filter((shoutout) => {
        const expiryTime =
          new Date(shoutout.expires_at).getTime()

        return expiryTime >= now
      })
      .map((shoutout) => {
        const stall =
          stallsById.get(
            String(shoutout.stall_id)
          )

        return {
          ...shoutout,

          stall_name:
            stall?.name ??
            "Unknown stall",

          stall_unit_no:
            stall?.unit_no ??
            null
        }
      })
  }

  return {
    stalls,
    shoutouts
  }
}

async function listCentres(req, res, next) {
  try {
    const requestedDate =
      req.query.date || getSingaporeTodayIso()

    let centres = await getCentresWithStatus(
      requestedDate
    )

    const reports = await recentCrowdReports()
    const reportsByCentre =
      groupReportsByCentre(reports)

    centres = centres.map((centre) => ({
      ...centre,

      crowd: summariseCrowd(
        reportsByCentre[centre.id] || []
      )
    }))

    const search =
      String(req.query.search || "")
        .trim()
        .toLowerCase()

    if (search) {
      centres = centres.filter((centre) => {
        return (
          centre.name.toLowerCase().includes(search) ||
          centre.address.toLowerCase().includes(search)
        )
      })
    }

    if (req.query.openOnly === "true") {
      centres = centres.filter(
        (centre) => centre.isOpen
      )
    }

    res.json({
      date: requestedDate,
      count: centres.length,
      centres
    })
  } catch (error) {
    next(error)
  }
}

async function getCentre(req, res, next) {
  try {
    const requestedDate =
      req.query.date || getSingaporeTodayIso()

    const centre = await getCentreById(
      req.params.id,
      requestedDate
    )

    if (!centre) {
      return res.status(404).json({
        error: "Hawker centre not found."
      })
    }

    const since = new Date(
      Date.now() - RECENT_REPORT_MS
    )

    const reports = await CrowdReport.find({
      centreId: centre.id,

      createdAt: {
        $gte: since
      }
    })
      .sort({
        createdAt: -1
      })
      .lean()

    const wp4Data = await getWp4Data(
      centre.id
    )

    res.json({
      ...centre,

      crowd: summariseCrowd(reports),

      stalls: wp4Data.stalls,
      shoutouts: wp4Data.shoutouts
    })
  } catch (error) {
    next(error)
  }
}

async function submitCrowdReport(req, res, next) {
  try {
    const centre = await getCentreById(
      req.params.id
    )

    if (!centre) {
      return res.status(404).json({
        error: "Hawker centre not found."
      })
    }

    const level =
      String(req.body.level || "")
        .trim()
        .toLowerCase()

    const userId = String(
      req.user?.id ||
      req.body.userId ||
      ""
    ).trim()

    if (!userId) {
      return res.status(400).json({
        error: "A user ID is required."
      })
    }

    if (
      !["plenty", "few", "full"].includes(
        level
      )
    ) {
      return res.status(400).json({
        error:
          "Crowd level must be plenty, few or full."
      })
    }

    const cooldownStart = new Date(
      Date.now() - REPORT_COOLDOWN_MS
    )

    const lastReport =
      await CrowdReport.findOne({
        centreId: centre.id,
        userId,

        createdAt: {
          $gte: cooldownStart
        }
      })
        .sort({
          createdAt: -1
        })
        .lean()

    if (lastReport) {
      const nextAllowedAt =
        new Date(lastReport.createdAt).getTime() +
        REPORT_COOLDOWN_MS

      const minutesRemaining = Math.max(
        1,
        Math.ceil(
          (nextAllowedAt - Date.now()) /
          60000
        )
      )

      return res.status(429).json({
        error:
          `You can submit another crowd report in approximately ${minutesRemaining} minute(s).`
      })
    }

    const report = await CrowdReport.create({
      centreId: centre.id,
      userId,
      level
    })

    const recentSince = new Date(
      Date.now() - RECENT_REPORT_MS
    )

    const recentReports =
      await CrowdReport.find({
        centreId: centre.id,

        createdAt: {
          $gte: recentSince
        }
      })
        .sort({
          createdAt: -1
        })
        .lean()

    res.status(201).json({
      message: "Crowd report submitted.",
      report,
      crowd: summariseCrowd(recentReports)
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  listCentres,
  getCentre,
  submitCrowdReport,
  summariseCrowd
}