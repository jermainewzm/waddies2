<script setup>
// Admin login (/admin/login).
// Admin ID -> POST /api/admin/verify -> remember it -> admin dashboard.

import { ref } from "vue"
import { useRouter } from "vue-router"

import { verifyAdmin } from "../services/adminService"
import { getErrorMessage } from "../services/api"
import { saveAdminId } from "../services/authService"

const router = useRouter()

const adminId = ref("")
const errorMsg = ref("")
const submitting = ref(false)

async function login() {
  errorMsg.value = ""

  if (!adminId.value.trim()) {
    errorMsg.value = "Please enter your admin ID."
    return
  }

  submitting.value = true

  try {
    const data = await verifyAdmin(adminId.value)

    // from now on admin requests send x-admin-id (see services/api.js)
    saveAdminId(data.admin.admin_id)

    router.push("/admin/dashboard")
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
        <svg width="70" height="77" aria-hidden="true"><use href="#av-milo"/></svg>
        <h1 class="mb-2">Admin Login</h1>
        <p class="mb-0 text-muted fst-italic">Approve new stalls and keep the hawker centres tip-top.</p>
      </div>

      <div class="row justify-content-center">
        <div class="col-12 col-lg-5">
          <div class="awning"></div>
          <div class="card hh-card">
            <div class="hh-badge">🛡️</div>
            <h2 class="mb-2">Enter your admin ID</h2>
            <p class="text-muted mb-4">Only HawkerHop admins can review applications.</p>

            <form v-on:submit.prevent="login">
              <div class="mb-3">
                <label for="adminId" class="form-label">Admin ID</label>
                <input id="adminId" v-model="adminId" class="form-control cute-input"
                       placeholder="e.g. admin_001" autocomplete="off" />
              </div>

              <button type="submit" class="btn w-100 blue" v-bind:disabled="submitting">
                {{ submitting ? "Checking..." : "Log in →" }}
              </button>
            </form>

            <p v-if="errorMsg" class="text-danger fw-bold mt-3 mb-0">{{ errorMsg }}</p>
          </div>
        </div>
      </div>

    </div>
  </main>
</template>

<style scoped>
main {
  min-height: 100vh;
}
</style>
