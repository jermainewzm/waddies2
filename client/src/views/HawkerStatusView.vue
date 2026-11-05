<script setup>
// Application status page (/hawker/status).
// Reads the request _id we saved when they applied and asks the server:
//   pending  -> still waiting
//   rejected -> can apply again
//   approved -> show their new HAWKER_xxx ID and send them to login

import { ref, onMounted } from "vue"
import { RouterLink } from "vue-router"

import { getRequestStatus } from "../services/hawkerService"
import { getErrorMessage } from "../services/api"
import { getRequestId, clearRequestId } from "../services/authService"

const requestId = ref(getRequestId())

const status = ref(null)            // "pending" | "approved" | "rejected"
const assignedId = ref("")          // e.g. "HAWKER_005" once approved
const stallName = ref("")

const loading = ref(false)
const errorMsg = ref("")

async function checkStatus() {
  if (!requestId.value) {
    return
  }

  loading.value = true
  errorMsg.value = ""

  try {
    const data = await getRequestStatus(requestId.value)

    status.value = data.status
    assignedId.value = data.assigned_owner_id || ""
    stallName.value = data.stall_name || ""

  } catch (error) {
    if (error.response?.status === 404) {
      // the request no longer exists, so stop remembering it
      clearRequestId()
      requestId.value = null
    } else {
      errorMsg.value = getErrorMessage(error, "Unable to check your application.")
    }
  } finally {
    loading.value = false
  }
}

// rejected hawkers start over with a fresh application
function forgetRequest() {
  clearRequestId()
  requestId.value = null
  status.value = null
}

onMounted(checkStatus)
</script>

<template>
  <main class="bg-tiles">
    <div class="container py-5">
      <RouterLink to="/hawker" class="btn sm mb-4">← For Hawkers</RouterLink>

      <div class="page-header hh-header text-center mb-5">
        <svg width="70" height="77" aria-hidden="true"><use href="#av-tissue"/></svg>
        <h1 class="mb-2">Application Status</h1>
        <p class="mb-0 text-muted fst-italic">Chope your spot... we're checking!</p>
      </div>

      <div class="row justify-content-center">
        <div class="col-12 col-lg-5">
          <div class="awning"></div>
          <div class="card hh-card">

            <!-- nothing saved in this browser -->
            <div v-if="!requestId">
              <div class="hh-badge">🤔</div>
              <h2 class="mb-2">No application found</h2>
              <p class="text-muted mb-4">We couldn't find an application on this browser.</p>
              <RouterLink class="btn w-100 yellow" to="/hawker/apply">
                Apply for a stall →
              </RouterLink>
            </div>

            <div v-else>
              <p v-if="loading && !status" class="mb-0">Checking...</p>

              <p v-if="errorMsg" class="text-danger fw-bold">{{ errorMsg }}</p>

              <!-- pending -->
              <div v-if="status === 'pending'">
                <div class="hh-badge">⏳</div>
                <h2 class="mb-3">Still waiting</h2>
                <span class="hh-pill pending">Pending</span>
                <p class="text-muted mt-3 mb-0">
                  An admin hasn't reviewed your application yet. Check back soon.
                </p>
              </div>

              <!-- rejected -->
              <div v-else-if="status === 'rejected'">
                <div class="hh-badge">😞</div>
                <h2 class="mb-3">Not approved</h2>
                <span class="hh-pill rejected">Rejected</span>
                <p class="text-muted mt-3 mb-4">
                  Double-check your stall name and unit number, then apply again.
                </p>
                <RouterLink class="btn w-100 yellow" to="/hawker/apply" v-on:click="forgetRequest">
                  Apply again →
                </RouterLink>
              </div>

              <!-- approved -->
              <div v-else-if="status === 'approved'">
                <div class="hh-badge">🎉</div>
                <h2 class="mb-3">You're approved!</h2>
                <span class="hh-pill approved">Approved</span>

                <div class="hh-plate mt-4">
                  <small>YOUR HAWKER ID</small>
                  <p class="hh-code">{{ assignedId }}</p>
                </div>

                <div class="hh-plate mt-3">
                  <small>YOUR STALL NAME</small>
                  <p class="hh-code">{{ stallName }}</p>
                </div>

                <div class="hh-tip">
                  <span>💡</span>
                  <p class="mb-0 fw-bold">Keep these details safe. You'll log in with it and your stall name.</p>
                </div>

                <RouterLink class="btn w-100 green mt-3"
                            v-bind:to="{ path: '/hawker/login', query: { id: assignedId, stall: stallName } }">
                  Go to Hawker Login →
                </RouterLink>
              </div>

              <button v-if="status === 'pending'" type="button" class="btn w-100 mt-4"
                      v-bind:disabled="loading" v-on:click="checkStatus">
                {{ loading ? "Checking..." : "Refresh status" }}
              </button>
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
</style>
