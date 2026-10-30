<script setup>
import { ref, computed } from "vue"
import axios from "axios"
import { API_URL } from "@/utils/constants"
import { useRouter } from "vue-router"

const name = ref("")
const date = ref("")
const time = ref("")
const code = ref("")
const errorMessage = ref("")
const isCreating = ref(false)

const router = useRouter()


function pad(n) {     //helper function to pad everything atleast 2 char long (ie. 3 -> 03)
  return String(n).padStart(2, "0")
}

function getLocalDateString(d = new Date()) {     //function to get local date for the date input in format that <input type="date"> uses (ie. "2026-10-06")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`    //month + 1 as Jan is 0
}

function getLocalTimeString(d = new Date()) {     //function to get local time for the time input in format that <input type="time"> uses (ie. "09:30")
  return `${pad(d.getHours())}:${pad(d.getMinutes())}` 
}

function hasPassed(dateStr, timeStr) {
  if (!dateStr || !timeStr ) {    //if either field is empty
    return false
  } else {
    return new Date(`${dateStr}T${timeStr}`) <= new Date()   //compares the date & time with the date & time right now
  }
}

function goToLobby() {
  router.push(`/plan/${code.value}/lobby`)
}

// most hawker stalls are closed within 6am-10pm,
// and public transport may not be running. but we 
//just warn the user because some centres are 24/7.
const isOddHour = computed(() => {
  if (!time.value) {
    return false
  }
  const hour = Number(time.value.split(":")[0])
  return hour < 6 || hour >= 22
})

const minDate = computed(() => getLocalDateString())    //earliest allowed date
const minTime = computed(() => date.value === getLocalDateString() ? getLocalTimeString() : undefined) //earliest allowed time: only restricted when chosen date is today

// OneMap API restricts the year to within 2 years

const maxDate = computed(() => {
    const d = new Date()
    const currentYear = d.getFullYear()
    d.setFullYear(currentYear + 2)
    return getLocalDateString(d)
})

async function createPlan() {
  errorMessage.value = ""

  if (!name.value.trim() || !date.value || !time.value) {   //validation on client side 
    errorMessage.value = "Please fill in the plan name, date and time."
    return
  }
  if (hasPassed(date.value, time.value)) {
    errorMessage.value = "Please pick a date and time in the future."
    return
  }
  isCreating.value = true
  try {
    const response = await axios.post(`${API_URL}/plans`, {
      name: name.value,
      date: date.value,
      time: time.value
    })
    code.value = response.data.code
  } catch (error) {
    errorMessage.value = error.response
      ? error.response.data.error
      : "Can't reach the server."
      isCreating.value = false
  }
}

function formatDate(date) {
  const dateObj = new Date(date)

  return dateObj.toLocaleDateString("en-SG", {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

function formatTime(time) {
  const [hours, minutes] = time.split(":")
  const period = hours >= 12 ? "PM" : "AM"
  const hour = hours % 12 || 12

  return `${hour}:${minutes} ${period}`
}
</script>

<template>
  <main class="bg-tiles">
  <div class="container py-5">

    <!-- page heading -->
    <div class="page-header text-center mb-5">
        <svg width="70" height="77" aria-hidden="true"><use href="#av-waffle"/></svg>
        <h1 class=" mb-2">Start a Makan Plan</h1>
        <p class="mb-0 text-muted fst-italic"> Get everyone together. We'll handle the makan. </p>
     </div>

     <div class="row justify-content-center align-items-start g-4">
     <div class="col-12 col-lg-6">
        <div class="awning"></div>
        <div class="card create-plan-card">
          <div class="section-label"> 01</div>
          <h2 class=" mb-2"> Set up your plan </h2>
          <p class="text-muted mb-4"> Give your makan session a name and choose when to meet.</p>

          <form v-on:submit.prevent="createPlan">
             <!-- makan plan name -->
            <div class="mb-3">
              <label for="name" class="form-label">Plan name</label>
              <input id="name" maxlength="40" v-model="name" class="form-control cute-input" placeholder="e.g. Saturday lunch" />
            </div>

             <!-- date -->
            <div class="mb-3">
            <label for="date" class="form-label">Date</label>
            <input id="date" v-model="date" type="date" class="form-control cute-input" :min="minDate" :max="maxDate"/>
            </div>
             <!-- time -->
            <div class="mb-3">
              <label for="time" class="form-label">Time</label>
              <input id="time" v-model="time" type="time" class="form-control cute-input" :min="minTime" />
              <p v-if="isOddHour" class="text-danger fw-bold small mb-0 mt-1">
                NOTE: Most hawker centres are closed at this hour, and public transport may not be running.
              </p>
            </div>

            <button type="submit" class="btn w-100 red" v-bind:disabled="isCreating">{{ isCreating ? 'Creating...' : "Create Plan →" }}</button>
          </form>

        <p v-if="errorMessage" class="error-message text-danger mt-3">{{ errorMessage }}</p>

        <div v-if="code" class="text-center alert alert-success mt-4">
          Your makan plan code is: <strong data-testid="plan-code">{{ code }}</strong>
          <button v-on:click="goToLobby()" type="button" class="btn green w-100 mt-3"> Go to Plan Lobby </button>
        </div>
      
        <div class="preview-tip">
            <span>💡</span>
            <p class="fs-5 mb-0 fw-bold"> Head to the lobby and join first, then share the code with your friends.</p>
          </div>
      </div>
     </div>

     <!-- side preview-->
     <div class="col-12 col-lg-5">
        <div class="card preview-plan-card">
           <div class="section-label">
            02
           </div>
           <h2 class="mb-2"> Your plan preview </h2>
           <p class="text-muted mb-4"> This is how your plan will appear in the lobby.</p>

           <div class="plan-preview">

            <div class="plan-top">
              <svg width="70" height="77" aria-hidden="true"><use href="#av-milo"/></svg>
            </div>
            <h3 class="plan-name mb-1">
              {{ name || 'Saturday lunch' }}
            </h3>
            <span class="plan-type">MAKAN PLAN</span>
       

        <div class="plan-details">
          <div class="plan-detail">
            <span class="detail-icon">📅 </span>
            <div>
              <small> Date </small>
              <strong>
                {{ date ? formatDate(date): 'Pick a date' }}
              </strong>
            </div>
          </div>

           <div class="plan-detail">
            <span class="detail-icon">🕐 </span>
            <div>
              <small> Time </small>
              <strong>
                {{ time ? formatTime(time) : 'Pick a time' }}
              </strong>
            </div>
          </div>
        </div>
        <div class="join-section text-center">
          <small class="text-muted fw-bold">PLAN CODE</small>
          <p class="preview-code mt-2 mb-0">{{ code || '------' }}</p>
          <small class="text-muted"> {{ code ? 'Join the lobby first, then share this' : 'Your code appears here once you create the plan'}}</small>
        </div>
          </div>
        </div>
     </div>
     </div>
  </div>
  </main>
</template>

<style scoped>


.plan-name {
  font-size: 24px;
  font-weight: bold;
  margin-top: 5px;
}

.page-header h1{
  font-size: 42px;
}

.create-plan-card, .preview-plan-card {
  padding: 32px;
}

.plan-preview {
  background-color: var(--paper);
  border-radius: 16px;
  padding: 24px;
  border: 3px solid var(--ink);
  text-align: center;
}

.section-label {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--cream);
  color: var(--ink);
  font-size: 12px;
  font-weight: bold;
  display: flex;
  justify-content: center;
  align-items: center;

}

.plan-type {
  font-size: 11px;
  font-weight: bold;
  letter-spacing: 1px;
  color: var(--tomato)
}

.create-plan-card h2 {
  font-size: 28px;
}

.plan-details {
  margin-top: 24px;
  background-color: var(--cream);
  border-radius: 12px;
  padding: 18px 20px;
 
}

.plan-detail {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;

}

.plan-detail:last-child {
  margin-bottom: 0px;
}

.join-section small {
  display: block;
  font-size: 13px;
  letter-spacing: 2px;
  margin-bottom: 8px;
  margin-top: 8px;
}

.form-label {
  font-weight: bold;
  margin-bottom: 8px;
}

.preview-tip {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 16px;
  padding: 12px 14px;
  background-color: var(--cream);
  border: 3px solid var(--ink);
  border-radius: 10px;
  font-size: 13px;
 
}
.alert-success strong {
  display: inline-block;
  font-size: 24px;
  letter-spacing: 3px;
  color: var(--ink);
  background-color: var(--paper);
  padding: 6px 12px;
  border-radius: 8px;
  margin-left: 6px;
  border: 3px solid var(--ink);
}

.preview-code {
  font-size: 28px;
  font-weight: bold;
  letter-spacing: 6px;
  color: var(--ink);
}

.page-header svg {
  animation: bob 2.6s ease-in-out infinite;
}

@keyframes bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-7px); }
}
</style>