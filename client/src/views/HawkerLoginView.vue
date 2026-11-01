<script setup>
// Existing hawker login (/hawker/login).
// Hawker ID + stall name -> POST /api/hawker/verify -> remember the ID -> dashboard.

import { ref } from "vue"
import { RouterLink, useRoute, useRouter } from "vue-router"

import { verifyHawker } from "../services/hawkerService"
import { getErrorMessage } from "../services/api"
import { saveHawkerId, clearRequestId } from "../services/authService"

const route = useRoute()
const router = useRouter()

// The status page links here with ?id=HAWKER_005 so hawkers don't retype it
const ownerId = ref(String(route.query.id || ""))
const stallName = ref(String(route.query.stall || ""))

const errorMsg = ref("")
const submitting = ref(false)

async function login() {
  errorMsg.value = ""

  if (!ownerId.value.trim() || !stallName.value.trim()) {
    errorMsg.value = "Please enter your Hawker ID and stall name."
    return
  }

  submitting.value = true

  try {
    const data = await verifyHawker(
      ownerId.value,
      stallName.value
    )

    // from now on every /hawker/... request sends x-hawker-id (see services/api.js)
    saveHawkerId(data.stall.owner_id)

    // their application is finished, so forget it
    clearRequestId()

    router.push("/hawker/dashboard")
  } catch (error) {
    errorMsg.value = getErrorMessage(error, "Unable to log in. Please try again.")
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <main class="bg-tiles">
    <div class="container py-5">

      <div class="page-header hh-header text-center mb-5">
        <svg width="70" height="77" aria-hidden="true"><use href="#av-toast"/></svg>
        <h1 class="mb-2">Hawker Login</h1>
        <p class="mb-0 text-muted fst-italic">Welcome back! Open your stall for the day.</p>
      </div>

      <div class="row justify-content-center">
        <div class="col-12 col-lg-5">
          <div class="awning"></div>
          <div class="card hh-card">
            <div class="hh-badge">🔑</div>
            <h2 class="mb-2">Enter your details</h2>
            <p class="text-muted mb-4">Use the Hawker ID the admin gave you.</p>

            <form v-on:submit.prevent="login">
              <div class="mb-3">
                <label for="ownerId" class="form-label">Hawker ID</label>
                <input id="ownerId" v-model="ownerId" class="form-control cute-input"
                       placeholder="e.g. HAWKER_001" autocomplete="off" />
              </div>

              <div class="mb-3">
                <label for="stallName" class="form-label">Stall name</label>
                  <input
                    id="stallName"
                    v-model="stallName"
                    class="form-control cute-input"
                    placeholder="Exactly as registered"
                    autocomplete="off"
                  />
              </div>

              <button type="submit" class="btn w-100 green" v-bind:disabled="submitting">
                {{ submitting ? "Checking..." : "Log in →" }}
              </button>
            </form>

            <p v-if="errorMsg" class="text-danger fw-bold mt-3 mb-0">{{ errorMsg }}</p>

            <div class="switch-card">
              <span class="switch-icon">✨</span>

              <span>
                New here?
                <RouterLink to="/hawker/apply">
                  Apply for a stall
                </RouterLink>
              </span>
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

.switch-card {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;

    margin-top: 18px;
    padding: 10px 14px;

    background: var(--paper);

    border: 2px dashed var(--ink);
    border-radius: 14px;

    box-shadow: 3px 3px 0 var(--ink);

    font-size: 14px;
    font-weight: 700;
}

.switch-icon {
    font-size: 16px;
}

.switch-card a {
    color: var(--tomato);
    font-weight: 800;
    text-decoration-thickness: 2px;
    text-underline-offset: 3px;
}

.switch-card a:hover {
    opacity: 0.8;
}
</style>
