// Every API call the hawker pages make (login, apply, check status).

import api from "./api"
import { API_URL } from "@/utils/constants"

// All centres A-Z, used to fill the "Which centre?" dropdown.
// Each item looks like { serialNo, name, lat, lng, is_open }
export async function getCentreOptions() {
  const response = await api.get(`${API_URL}/centre-search/centres`)
  return response.data.centres
}

// Existing hawker login. Resolves with { message, stall } or throws a 404.
export async function verifyHawker(ownerId, stallName) {
  const response = await api.post(`${API_URL}/hawker/verify`, {
    owner_id: ownerId,
    stall_name: stallName
  })
  return response.data
}

// New hawker application. Resolves with the saved request (has _id and status).
export async function applyAsHawker(form) {
  const response = await api.post(`${API_URL}/hawker/apply`, {
    serialNo: form.serialNo,
    stall_name: form.stall_name,
    unit_no: form.unit_no,
    message: form.message
  })
  return response.data
}

// Resolves with { status: "pending" | "approved" | "rejected", assigned_owner_id }
export async function getRequestStatus(requestId) {
  const response = await api.get(
    `${API_URL}/hawker/requests/${encodeURIComponent(requestId)}/status`
  )
  return response.data
}
