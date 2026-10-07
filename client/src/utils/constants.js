// The Vite development server proxies /api
// to http://localhost:8000.
//
// For deployment, VITE_API_URL can be
// supplied if the backend lives elsewhere.

export const API_URL =
  import.meta.env.VITE_API_URL || "/api"