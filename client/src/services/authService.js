// Keeps track of "who is logged in" for hawkers and admins.
//
// There are no passwords or tokens in this app, so "logged in" simply means
// we remembered an ID in the browser's localStorage. localStorage survives
// page refreshes, so a hawker stays logged in until they press Log out.
//
// Same idea as getCrowdUserId() in centreService.js.

const HAWKER_KEY = "hawkerhop-hawker-id"            // e.g. "HAWKER_003"
const ADMIN_KEY = "hawkerhop-admin-id"              // e.g. "admin_001"
const REQUEST_KEY = "hawkerhop-hawker-request-id"   // _id of a new-hawker application

// localStorage can throw (private browsing, storage full), so every call is wrapped
function read(key) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // nothing we can do, the user just has to log in again next time
  }
}

function remove(key) {
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

// ---- existing hawker ----
export function getHawkerId() {
  return read(HAWKER_KEY)
}

export function saveHawkerId(id) {
  write(HAWKER_KEY, id)
}

export function clearHawkerId() {
  remove(HAWKER_KEY)
}

// ---- admin ----
export function getAdminId() {
  return read(ADMIN_KEY)
}

export function saveAdminId(id) {
  write(ADMIN_KEY, id)
}

export function clearAdminId() {
  remove(ADMIN_KEY)
}

// ---- new hawker application (so "Check Status" works after a refresh) ----
export function getRequestId() {
  return read(REQUEST_KEY)
}

export function saveRequestId(id) {
  write(REQUEST_KEY, id)
}

export function clearRequestId() {
  remove(REQUEST_KEY)
}