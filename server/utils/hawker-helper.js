function normalizeHawkerId(ownerId) {
  return ownerId.trim().toUpperCase()
}

function isValidStatus(status) {
  const allowedStatuses = [
    "open",
    "sold_out",
    "closed_early",
    "closed"
  ]

  return allowedStatuses.includes(status)
}

function areValidRestDays(restDays) {
  const allowedDays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
  ]

  if (!Array.isArray(restDays)) {
    return false
  }

  return restDays.every(
    day => allowedDays.includes(day)
  )
}

function getNextHawkerId(ownerIds) {
  let highestNumber = 0

  for (const ownerId of ownerIds) {
    const number = parseInt(
      ownerId.split("_")[1]
    )

    if (number > highestNumber) {
      highestNumber = number
    }
  }

  const nextNumber = highestNumber + 1

  return `HAWKER_${String(nextNumber).padStart(3, "0")}`
}

module.exports = {
  normalizeHawkerId,
  isValidStatus,
  areValidRestDays,
  getNextHawkerId
}