<script setup>
// New hawker application (/hawker/apply).
// Centre dropdown + stall name + unit + message -> POST /api/hawker/apply
// -> remember the request _id -> go to the status page.

import { ref, onMounted } from "vue"
import { RouterLink, useRouter } from "vue-router"

import { getCentreOptions, applyAsHawker } from "../services/hawkerService"
import { getErrorMessage } from "../services/api"
import { getRequestId, saveRequestId } from "../services/authService"

const router = useRouter()

const centres = ref([])
const loadingCentres = ref(true)

const serialNo = ref("")
const stallName = ref("")
const unitNo = ref("")
const message = ref("")

const errorMsg = ref("")
const submitting = ref(false)

// true if this browser already sent an application earlier
const hasExistingRequest = !!getRequestId()

onMounted(async () => {
  try {
    centres.value = await getCentreOptions()
  } catch (error) {
    errorMsg.value = "Unable to load the hawker centres. Please refresh."
  } finally {
    loadingCentres.value = false
  }
})

async function submit() {
  errorMsg.value = ""

  if (!serialNo.value || !stallName.value.trim() || !unitNo.value.trim()) {
    errorMsg.value = "Please choose a centre and fill in your stall name and unit number."
    return
  }

  submitting.value = true

  try {
    const request = await applyAsHawker({
      serialNo: serialNo.value,
      stall_name: stallName.value,
      unit_no: unitNo.value,
      message: message.value
    })

    // remember it so "Check status" still works after a refresh
    saveRequestId(request._id)

    router.push("/hawker/status")
  } catch (error) {
    errorMsg.value = getErrorMessage(error, "Unable to submit your application.")
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <main class="bg-tiles">
    <div class="container py-5">

      <div class="page-header hh-header text-center mb-5">
        <svg width="70" height="77" aria-hidden="true"><use href="#av-waffle"/></svg>
        <h1 class="mb-2">Apply for a Stall</h1>
        <p class="mb-0 text-muted fst-italic">Join HawkerHop so groups can find your food.</p>
      </div>

      <div class="row justify-content-center">
        <div class="col-12 col-lg-6">
          <div class="awning"></div>
          <div class="card hh-card">
            <div class="hh-badge">📝</div>
            <h2 class="mb-2">Your stall</h2>
            <p class="text-muted mb-4">An admin will check your details and get back to you.</p>

            <div v-if="hasExistingRequest" class="alert alert-warning">
              You already sent an application from this browser.
              <RouterLink to="/hawker/status">Check its status</RouterLink>
            </div>

            <form v-on:submit.prevent="submit">
              <div class="mb-3">
                <label for="centre" class="form-label">Hawker centre</label>
                <select id="centre" v-model="serialNo" class="form-select cute-input"
                        v-bind:disabled="loadingCentres">
                  <option value="" disabled>
                    {{ loadingCentres ? "Loading centres..." : "Choose your centre" }}
                  </option>
                  <option v-for="centre in centres" v-bind:key="centre.serialNo"
                          v-bind:value="centre.serialNo">
                    {{ centre.name }}
                  </option>
                </select>
              </div>

              <div class="mb-3">
                <label for="stallName" class="form-label">Stall name</label>
                <input id="stallName" v-model="stallName" class="form-control cute-input"
                       placeholder="e.g. Ah Seng Chicken Rice" />
              </div>

              <div class="mb-3">
                <label for="unitNo" class="form-label">Unit number</label>
                <input id="unitNo" v-model="unitNo" class="form-control cute-input"
                       placeholder="e.g. #01-23" />
              </div>

              <div class="mb-3">
                <label for="message" class="form-label">Shoutout for customers (optional)</label>
                <textarea id="message" v-model="message" rows="3" class="form-control cute-input"
                          placeholder="Anything that helps us verify your stall"></textarea>
              </div>

              <button type="submit" class="btn w-100 yellow" v-bind:disabled="submitting">
                {{ submitting ? "Sending..." : "Submit application →" }}
              </button>
            </form>

            <p v-if="errorMsg" class="text-danger fw-bold mt-3 mb-0">{{ errorMsg }}</p>

            <div class="hh-tip">
              <span>💡</span>
              <p class="mb-0 fw-bold">
                Already approved?
                <RouterLink to="/hawker/login">Hawker login</RouterLink>
              </p>
            </div>
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
