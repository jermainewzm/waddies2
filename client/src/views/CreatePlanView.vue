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
  <div class="container py-5">

    <!-- page heading -->
    <div class="page-header text-center mb-5">
        <div class="heading-icon">🍜</div>
        <h1 class="hh-display mb-2">Start a Makan Plan</h1>
        <p class="mb-0 text-muted fst-italic"> Get everyone together. We'll handle the makan. </p>
     </div>

     <div class="row justify-content-center align-items-start g-4">
     <div class="col-12 col-lg-6">
        <div class="create-plan-card">
          <div class="section-label"> 01</div>
          <h2 class="hh-display mb-2"> Set up your plan </h2>
          <p class="text-muted mb-4"> Give your makan session a name and choose when to meet.</p>

          <form v-on:submit.prevent="createPlan">
             <!-- makan plan name -->
            <div class="mb-3">
              <label for="name" class="form-label">Plan name</label>
              <input id="name" v-model="name" class="form-control" placeholder="e.g. Saturday lunch" />
            </div>

             <!-- date -->
            <div class="mb-3">
            <label for="date" class="form-label">Date</label>
            <input id="date" v-model="date" type="date" class="form-control" :min="minDate" :max="maxDate"/>
            </div>
             <!-- time -->
            <div class="mb-3">
              <label for="time" class="form-label">Time</label>
              <input id="time" v-model="time" type="time" class="form-control" :min="minTime" />
              <p v-if="isOddHour" class="text-warning fw-bold small mb-0 mt-1">
                NOTE: Most hawker centres are closed at this hour, and public transport may not be running.
              </p>
            </div>

            <button type="submit" class="btn btn-hh-red w-100 create-button">Create plan →</button>
          </form>

        <p v-if="errorMessage" class="error-message text-danger mt-3">{{ errorMessage }}</p>

        <div v-if="code" class="alert alert-success mt-4">
          Your makan plan code is: <strong>{{ code }}</strong>
          <button v-on:click="goToLobby()" type="button" class="btn btn-lobby w-100 mt-3"> Go to Plan Lobby </button>
        </div>
      
        <div class="preview-tip">
            <span>💡</span>
            <p class="fs-5 mb-0 fw-bold"> Head to the lobby and join first, then share the code with your friends.</p>
          </div>
      </div>
     </div>

     <!-- side preview-->
     <div class="col-12 col-lg-5">
        <div class="preview-plan-card">
           <div class="section-label">
            02
           </div>
           <h2 class="hh-display mb-2"> Your plan preview </h2>
           <p class="text-muted mb-4"> This is how your plan will appear in the lobby.</p>

           <div class="plan-preview">

            <div class="plan-top">
              <div class="food-icon">🍜 </div>
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
</template>

<style scoped>

.heading-icon {
  font-size: 48px;
  margin-bottom: 5px;
}

.food-icon {
  font-size: 30px;
  margin-bottom:4px;
}

.plan-name {
  font-size: 24px;
  font-weight: bold;
  margin-top: 5px;
}

.page-header h1{
  font-size: 42px;
}

.create-plan-card, .preview-plan-card {
  background-color: white;
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 6px 24px rgba(59, 42, 32, 0.08);
}

.plan-preview {
  background-color: white;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid #e5e5e5;
  text-align: center;
}

.section-label {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--hh-steel);
  color: var(--hh-kopi);
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
  color: var(--hh-red)
}

.create-plan-card h2 {
  font-size: 28px;
}

.create-button {
  background-color: #c4521f;         
  color: #fff4e3;
  border-radius: 14px;
  padding-top: 16px;
  padding-bottom: 16px;
  font-size: 20px;
  font-weight: bold;
  box-shadow: 0 6px 0 #9e4018;        
  transition: transform 0.15s ease, box-shadow 0.15s ease;

}

.create-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 0 #9e4018;  
  
}

.form-label {
  font-weight: bold;
  margin-bottom: 8px;
}

.form-control {
  border-radius: 10px;
  padding: 12px 14px;
}

.form-control:focus {
  border-color: #c4521f;
  box-shadow: 0 0 0 3px rgba(196, 82, 31, 0.15);
}

.plan-details {
  margin-top: 24px;
  background-color: var(--hh-steel);
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

.preview-tip {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 16px;
  padding: 12px 14px;
  background-color: var(--hh-steel);
  border-radius: 10px;
  font-size: 13px;
 
}

.alert-success strong {
  display: inline-block;
  font-size: 24px;
  letter-spacing: 3px;
  color: var(--hh-kopi);
  background-color:white;
  padding: 6px 12px;
  border-radius: 8px;
  margin-left: 6px;
  border: 1px solid #f0d8c0;
}

.btn-lobby {
  background-color:  #287C7A;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 12px;
  font-weight: bold;
  box-shadow: 0 6px 0 #154a49;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.btn-lobby:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 0 #154a49;
}

.preview-code {
  font-size: 28px;
  font-weight: bold;
  letter-spacing: 6px;
  color: var(--hh-kopi);
}
</style>