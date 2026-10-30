<script setup>
// Admin dashboard (/admin/dashboard).
// Lists pending hawker applications (with the centre's name) and lets the
// admin approve or reject each one.

import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"

import {
  getPendingRequests,
  approveRequest,
  rejectRequest
} from "../services/adminService"
import { getErrorMessage } from "../services/api"
import { clearAdminId } from "../services/authService"

const router = useRouter()

const requests = ref([])
const loading = ref(true)

const errorMsg = ref("")
const successMsg = ref("")

// _id of the request being approved/rejected, so its buttons can be disabled
const busyId = ref(null)

function logout() {
  clearAdminId()
  router.push("/hawker")
}

// If the stored admin ID stopped being valid, send them back to log in again
function handleAuthFailure(error) {
  const code = error.response?.status

  if (code === 401 || code === 403) {
    clearAdminId()
    router.push("/admin/login")
    return true
  }

  return false
}

async function loadRequests() {
  loading.value = true

  try {
    requests.value = await getPendingRequests()
    errorMsg.value = ""
  } catch (error) {
    if (!handleAuthFailure(error)) {
      errorMsg.value = getErrorMessage(error, "Unable to load applications.")
    }
  } finally {
    loading.value = false
  }
}

async function approve(request) {
  busyId.value = request._id
  errorMsg.value = ""
  successMsg.value = ""

  try {
    const result = await approveRequest(request._id)

    successMsg.value =
      `${request.stall_name} approved. Their Hawker ID is ${result.assigned_owner_id}.`

    requests.value = requests.value.filter((item) => item._id !== request._id)
  } catch (error) {
    if (!handleAuthFailure(error)) {
      // e.g. "This unit is already occupied by another stall."
      errorMsg.value = getErrorMessage(error, "Unable to approve this request.")
    }
  } finally {
    busyId.value = null
  }
}

async function reject(request) {
  busyId.value = request._id
  errorMsg.value = ""
  successMsg.value = ""

  try {
    await rejectRequest(request._id)

    successMsg.value = `${request.stall_name} rejected.`

    requests.value = requests.value.filter((item) => item._id !== request._id)
  } catch (error) {
    if (!handleAuthFailure(error)) {
      errorMsg.value = getErrorMessage(error, "Unable to reject this request.")
    }
  } finally {
    busyId.value = null
  }
}

function formatDate(value) {
  return new Date(value).toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric"
  })
}

onMounted(loadRequests)
</script>

<template>
  <main class="bg-tiles">
    <div class="container py-5">

      <div class="page-header hh-header text-center mb-4">
        <svg width="70" height="77" aria-hidden="true"><use href="#av-waffle"/></svg>
        <h1 class="mb-2">Admin Dashboard</h1>
        <p class="mb-3 text-muted fst-italic">New stalls are waiting for your thumbs up.</p>

        <div class="d-flex justify-content-center gap-3">
          <button type="button" class="btn sm" v-bind:disabled="loading" v-on:click="loadRequests">
            Refresh
          </button>
          <button type="button" class="btn sm red" v-on:click="logout">Log out</button>
        </div>
      </div>

      <div class="row justify-content-center">
        <div class="col-12 col-lg-8">
          <div class="awning"></div>
          <div class="card hh-card">
            <div class="hh-badge">{{ requests.length }}</div>
            <h2 class="mb-2">Pending applications</h2>
            <p class="text-muted mb-4">Approve to create the stall and its Hawker ID.</p>

            <div v-if="successMsg" class="alert alert-success">{{ successMsg }}</div>
            <div v-if="errorMsg" class="alert alert-danger">{{ errorMsg }}</div>

            <p v-if="loading" class="mb-0">Loading applications...</p>

            <div v-else-if="requests.length === 0" class="hh-tip mt-0">
              <span>🎉</span>
              <p class="mb-0 fw-bold">No pending applications. All caught up!</p>
            </div>

            <div v-else class="request-list">
              <div v-for="request in requests" v-bind:key="request._id" class="request-row">
                <div class="request-info">
                  <span class="request-centre">{{ request.centre_name }}</span>
                  <h3 class="request-name">{{ request.stall_name }}</h3>
                  <p class="request-unit mb-0">Unit {{ request.unit_no }}</p>

                  <p v-if="request.message" class="request-message mb-0">
                    "{{ request.message }}"
                  </p>

                  <small class="text-muted">Applied {{ formatDate(request.created_at) }}</small>
                </div>

                <div class="request-buttons">
                  <button type="button" class="btn sm green"
                          v-bind:disabled="busyId === request._id" v-on:click="approve(request)">
                    Approve
                  </button>
                  <button type="button" class="btn sm red"
                          v-bind:disabled="busyId === request._id" v-on:click="reject(request)">
                    Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </main>
</template>

<style scoped>
main {
  min-height: calc(100vh - 72px);   /* full screen minus the 72px header */
}

.request-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* same idea as the plan preview box on the Create Plan page */
.request-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  padding: 18px 20px;
  background-color: var(--cream);
  border: 3px solid var(--ink);
  border-radius: 16px;
}

.request-centre {
  font-size: 11px;
  font-weight: bold;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--tomato);
}

.request-name {
  font-size: 24px;
  font-weight: bold;
  margin: 2px 0;
}

.request-unit {
  font-weight: bold;
}

.request-message {
  margin-top: 6px;
  font-style: italic;
}

.request-buttons {
  display: flex;
  gap: 12px;
}
</style>
