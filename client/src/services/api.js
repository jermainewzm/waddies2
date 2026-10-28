// A shared axios instance that adds the login headers for us.
//
//   x-hawker-id  -> sent on every /hawker/... request   (requireApprovedHawker middleware)
//   x-admin-id   -> sent on /admin/... and /hawker/requests... (requireAdmin middleware)
//
// Anything that needs a logged-in hawker or admin should import `api` from
// here instead of using plain axios, so the header is never forgotten.

import axios from "axios"

import { getHawkerId, getAdminId } from "./authService"

const api = axios.create()

api.interceptors.request.use((config) => {
  const url = config.url || ""

  const hawkerId = getHawkerId()
  const adminId = getAdminId()

  if (hawkerId && url.includes("/hawker/")) {
    config.headers["x-hawker-id"] = hawkerId
  }

  if (adminId && (url.includes("/admin/") || url.includes("/hawker/requests"))) {
    config.headers["x-admin-id"] = adminId
  }

  return config
})

// The server answers errors as { message } or { error }. This picks whichever
// exists so pages can show the real reason ("This unit is already occupied...").
export function getErrorMessage(error, fallback) {
  return (
    error.response?.data?.message ||
    error.response?.data?.error ||
    fallback
  )
}

export default api
