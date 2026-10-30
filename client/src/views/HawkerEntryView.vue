<script setup>
// The "For Hawkers" landing page (/hawker).
// Three doors: existing hawker, new hawker, admin.
// If the browser already remembers someone, the button skips straight ahead.

import { RouterLink } from "vue-router"

import {
  getHawkerId,
  getRequestId,
  getAdminId
} from "../services/authService"

const loggedInHawker = getHawkerId()
const pendingRequest = getRequestId()
const loggedInAdmin = getAdminId()
</script>

<template>
  <main class="bg-tiles">
    <div class="container py-5">

      <!-- page heading -->
      <div class="page-header hh-header text-center mb-5">
        <svg width="70" height="77" aria-hidden="true"><use href="#av-milo"/></svg>
        <h1 class="mb-2">For Hawkers</h1>
        <p class="mb-0 text-muted fst-italic">
          Run a stall? Keep hungry groups updated on what's open and what's good.
        </p>
      </div>

      <div class="row justify-content-center g-4">

        <!-- existing hawker -->
        <div class="col-12 col-lg-4">
          <div class="awning"></div>
          <div class="card hh-card door">
            <div class="hh-badge">01</div>
            <h2 class="mb-2">I'm a hawker</h2>
            <p class="text-muted mb-4">Log in with your Hawker ID and stall name.</p>

            <RouterLink v-if="loggedInHawker" class="btn w-100 green" to="/hawker/dashboard">
              Go to my dashboard →
            </RouterLink>
            <RouterLink v-else class="btn w-100 green" to="/hawker/login">
              Hawker login →
            </RouterLink>
          </div>
        </div>

        <!-- new hawker -->
        <div class="col-12 col-lg-4">
          <div class="awning"></div>
          <div class="card hh-card door">
            <div class="hh-badge">02</div>
            <h2 class="mb-2">I'm new here</h2>
            <p class="text-muted mb-4">Tell us about your stall and an admin will approve it.</p>

            <RouterLink v-if="pendingRequest" class="btn w-100 yellow" to="/hawker/status">
              Check my application →
            </RouterLink>
            <RouterLink v-else class="btn w-100 yellow" to="/hawker/apply">
              Apply for a stall →
            </RouterLink>
          </div>
        </div>

        <!-- admin -->
        <div class="col-12 col-lg-4">
          <div class="awning"></div>
          <div class="card hh-card door">
            <div class="hh-badge">03</div>
            <h2 class="mb-2">I'm an admin</h2>
            <p class="text-muted mb-4">Review and approve new stall applications.</p>

            <RouterLink v-if="loggedInAdmin" class="btn w-100 blue" to="/admin/dashboard">
              Go to admin dashboard →
            </RouterLink>
            <RouterLink v-else class="btn w-100 blue" to="/admin/login">
              Admin login →
            </RouterLink>
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

/* keep the three cards the same height */
.door {
  min-height: 250px;
}
</style>
