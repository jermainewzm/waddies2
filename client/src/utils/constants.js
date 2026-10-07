// The Vite development server proxies /api
// to http://localhost:8000.
//
// For deployment, VITE_API_URL can be
// supplied if the backend lives elsewhere.

// so if we need to change the values of constants, just come here and change

export const DIET_OPTIONS = [
  { value: "any", label: "No preference" },
  { value: "halal", label: "Halal" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "no_pork", label: "No pork" },
  { value: "no_beef", label: "No beef" }
]

export const API_URL =
  import.meta.env.VITE_API_URL || "/api"
