// Every API call the admin pages make.
// api.js adds the x-admin-id header automatically.

import api from "./api"
import { API_URL } from "@/utils/constants"

// Admin login. Resolves with { message, admin } or throws a 401.
export async function verifyAdmin(adminId) {
  const response = await api.post(`${API_URL}/admin/verify`, {
    admin_id: adminId
  })
  return response.data
}

// Pending hawker applications. Each one includes centre_name.
export async function getPendingRequests() {
  const response = await api.get(`${API_URL}/hawker/requests`)
  return response.data
}

// Resolves with { assigned_owner_id, request, stall }
export async function approveRequest(id) {
  const response = await api.patch(
    `${API_URL}/hawker/requests/${encodeURIComponent(id)}/approve`
  )
  return response.data
}

export async function rejectRequest(id) {
  const response = await api.patch(
    `${API_URL}/hawker/requests/${encodeURIComponent(id)}/reject`
  )
  return response.data
}
