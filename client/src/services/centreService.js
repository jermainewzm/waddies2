import axios from "axios"

import {
  API_URL
} from "@/utils/constants"

const CROWD_USER_KEY =
  "hawkerhop-crowd-user-id"

export function getCrowdUserId() {
  let userId =
    localStorage.getItem(
      CROWD_USER_KEY
    )

  if (!userId) {
    if (
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID ===
        "function"
    ) {
      userId =
        crypto.randomUUID()
    } else {
      userId =
        `anonymous-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`
    }

    localStorage.setItem(
      CROWD_USER_KEY,
      userId
    )
  }

  return userId
}

export async function getCentres(
  options = {}
) {
  const params = {}

  if (options.date) {
    params.date = options.date
  }

  if (options.search) {
    params.search = options.search
  }

  if (options.openOnly) {
    params.openOnly = true
  }

  const response = await axios.get(
    `${API_URL}/centres`,
    {
      params
    }
  )

  return response.data
}

export async function getCentre(
  id,
  options = {}
) {
  const params = {}

  if (options.date) {
    params.date = options.date
  }

  const response = await axios.get(
    `${API_URL}/centres/${encodeURIComponent(id)}`,
    {
      params
    }
  )

  return response.data
}

export async function submitCrowdReport(
  centreId,
  level
) {
  const response = await axios.post(
    `${API_URL}/centres/${encodeURIComponent(centreId)}/crowd-reports`,
    {
      level,
      userId: getCrowdUserId()
    }
  )

  return response.data
}