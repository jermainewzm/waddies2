const axios = require("axios")

const DATASET_ID = "d_bda4baa634dd1cc7a6c7cad5f19e2d68"

const NEA_URL =
  `https://data.gov.sg/api/action/datastore_search?resource_id=${DATASET_ID}&limit=200`

// Cache the NEA dataset so we do not repeatedly hit data.gov.sg.
const CACHE_TTL_MS = 60 * 60 * 1000

let centreCache = []
let cacheLoadedAt = 0

function clean(value) {
  return String(value ?? "").trim()
}

function isMissingValue(value) {
  const text = clean(value).toLowerCase()

  return (
    text === "" ||
    text === "na" ||
    text === "nil" ||
    text === "null" ||
    text === "tbc" ||
    text === "-"
  )
}

// NEA gives dates in D/M/YYYY format.
function parseNeaDate(value) {
  if (isMissingValue(value)) {
    return null
  }

  const match = clean(value).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)

  if (!match) {
    return null
  }

  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])

  const checkDate = new Date(Date.UTC(year, month - 1, day))

  const valid =
    checkDate.getUTCFullYear() === year &&
    checkDate.getUTCMonth() === month - 1 &&
    checkDate.getUTCDate() === day

  if (!valid) {
    return null
  }

  const iso =
    `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`

  return {
    iso,
    key: year * 10000 + month * 100 + day
  }
}

function parseIsoDate(value) {
  const match = clean(value).match(/^(\d{4})-(\d{2})-(\d{2})$/)

  if (!match) {
    return null
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  const checkDate = new Date(Date.UTC(year, month - 1, day))

  const valid =
    checkDate.getUTCFullYear() === year &&
    checkDate.getUTCMonth() === month - 1 &&
    checkDate.getUTCDate() === day

  if (!valid) {
    return null
  }

  return {
    iso: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    key: year * 10000 + month * 100 + day
  }
}

function getSingaporeTodayIso() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Singapore",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date())

  const year = parts.find((part) => part.type === "year").value
  const month = parts.find((part) => part.type === "month").value
  const day = parts.find((part) => part.type === "day").value

  return `${year}-${month}-${day}`
}

function cleanRemarks(value) {
  if (isMissingValue(value)) {
    return ""
  }

  return clean(value)
}

function makeClosurePeriod(label, startValue, endValue, remarks) {
  const start = parseNeaDate(startValue)
  const end = parseNeaDate(endValue)

  if (!start && !end) {
    return null
  }

  // If only one valid date exists, treat it as a one-day closure.
  const actualStart = start || end
  const actualEnd = end || start

  return {
    label,
    start: actualStart.iso,
    end: actualEnd.iso,
    startKey: actualStart.key,
    endKey: actualEnd.key,
    remarks: cleanRemarks(remarks)
  }
}

function buildClosurePeriods(record) {
  const periods = [
    makeClosurePeriod(
      "Q1 cleaning",
      record.q1_cleaningstartdate,
      record.q1_cleaningenddate,
      record.remarks_q1
    ),

    makeClosurePeriod(
      "Q2 cleaning",
      record.q2_cleaningstartdate,
      record.q2_cleaningenddate,
      record.remarks_q2
    ),

    makeClosurePeriod(
      "Q3 cleaning",
      record.q3_cleaningstartdate,
      record.q3_cleaningenddate,
      record.remarks_q3
    ),

    makeClosurePeriod(
      "Q4 cleaning",
      record.q4_cleaningstartdate,
      record.q4_cleaningenddate,
      record.remarks_q4
    ),

    makeClosurePeriod(
      "Other works",
      record.other_works_startdate,
      record.other_works_enddate,
      record.remarks_other_works
    )
  ]

  return periods.filter(Boolean)
}

function safeNumber(value) {
  const number = Number(value)

  return Number.isFinite(number) ? number : null
}

function makeHttps(url) {
  const text = clean(url)

  if (!text || isMissingValue(text)) {
    return null
  }

  return text.replace(/^http:\/\//i, "https://")
}

function normalizeCentre(record) {
  // CKAN responses often contain _id.
  // serial_no is used as fallback.
  const id = clean(record.serial_no ?? record._id)

  return {
    id,
    serialNo: clean(record.serial_no),
    name: clean(record.name),
    address: clean(record.address_myenv),

    latitude: safeNumber(record.latitude_hc),
    longitude: safeNumber(record.longitude_hc),

    photoUrl: makeHttps(record.photourl),

    marketStalls: safeNumber(record.no_of_market_stalls),
    foodStalls: safeNumber(record.no_of_food_stalls),

    description: clean(record.description_myenv),
    neaStatus: clean(record.status),

    closurePeriods: buildClosurePeriods(record)
  }
}

function getOpenStatus(centre, dateIso = getSingaporeTodayIso()) {
  const requestedDate =
    parseIsoDate(dateIso) || parseIsoDate(getSingaporeTodayIso())

  const currentClosure = centre.closurePeriods.find((period) => {
    return (
      requestedDate.key >= period.startKey &&
      requestedDate.key <= period.endKey
    )
  })

  return {
    isOpen: !currentClosure,

    currentClosure: currentClosure
      ? {
          label: currentClosure.label,
          start: currentClosure.start,
          end: currentClosure.end,
          remarks: currentClosure.remarks
        }
      : null
  }
}

function publicClosurePeriods(periods) {
  return periods.map((period) => ({
    label: period.label,
    start: period.start,
    end: period.end,
    remarks: period.remarks
  }))
}

async function loadCentres(forceRefresh = false) {
  const cacheStillValid =
    centreCache.length > 0 &&
    Date.now() - cacheLoadedAt < CACHE_TTL_MS

  if (!forceRefresh && cacheStillValid) {
    return centreCache
  }

  try {
    const response = await axios.get(NEA_URL, {
      timeout: 15000
    })

    const records = response.data?.result?.records

    if (!Array.isArray(records)) {
      throw new Error("Unexpected response from data.gov.sg")
    }

    centreCache = records
      .map(normalizeCentre)
      .filter((centre) => centre.id && centre.name)
      .sort((a, b) => a.name.localeCompare(b.name))

    cacheLoadedAt = Date.now()

    return centreCache
  } catch (error) {
    // If data.gov.sg temporarily fails but we already have cached data,
    // continue serving the previous cache.
    if (centreCache.length > 0) {
      console.warn(
        "NEA refresh failed. Using cached data:",
        error.message
      )

      return centreCache
    }

    throw error
  }
}

async function getCentresWithStatus(dateIso) {
  const requestedDate = dateIso || getSingaporeTodayIso()
  const centres = await loadCentres()

  return centres.map((centre) => {
    const status = getOpenStatus(centre, requestedDate)

    return {
      ...centre,
      closurePeriods: publicClosurePeriods(centre.closurePeriods),
      ...status
    }
  })
}

async function getCentreById(id, dateIso) {
  const requestedDate = dateIso || getSingaporeTodayIso()
  const centres = await loadCentres()

  const centre = centres.find(
    (item) => String(item.id) === String(id)
  )

  if (!centre) {
    return null
  }

  return {
    ...centre,
    closurePeriods: publicClosurePeriods(centre.closurePeriods),
    ...getOpenStatus(centre, requestedDate)
  }
}

module.exports = {
  loadCentres,
  getCentresWithStatus,
  getCentreById,
  getOpenStatus,
  getSingaporeTodayIso
}