<script setup>
import { ref, computed, onMounted, onUnmounted} from "vue"
import axios from "axios"
import { API_URL, DIET_OPTIONS } from "@/utils/constants"
import { useRoute, useRouter, RouterLink } from "vue-router"
const AVATARS = ["av-milo", "av-waffle", "av-toast", "av-tissue"]

import L from 'leaflet' //import leaflet javascript code
import 'leaflet/dist/leaflet.css' //import leaflet css styling

const route = useRoute() //lets PlanLobby.vue access info about the route that brought the user here
const router = useRouter()

const code = route.params.code
const plan = ref(null)
const errorMessage = ref("")
const mapError = ref("")
const isLoading = ref(true)
const isJoining = ref(false)
const isStartingSwiping = ref(false)

const name = ref("")
const diet = ref("any")
const budget = ref("")
const postal = ref("")

// After joining, my member _id is saved in the browser (localStorage),
// under a key that includes the plan code, e.g. "memberId-468353".
const myId = ref(localStorage.getItem(`memberId-${code}`))

const selectedLat = ref(null)
const selectedLng = ref(null)

let map = null
let pinnedOnce = null

const isHost = computed(() => {
  if (!plan.value || !myId.value || plan.value.members.length == 0) {
    return false
  }
  return plan.value.members[0]._id === myId.value
})

// Holds the timer that refreshes the plan, so we can stop it when leaving the page
let refreshTimer = null

async function loadPlan() {
    try {
        const response = await axios.get(`${API_URL}/plans/${code}`)
        plan.value = response.data

        //members who are mid-swipe belong on the swipe bage, non members see the too late card
        if (plan.value.status === "swiping" && myId.value) {
          router.push(`/plan/${code}/swipe`)
          return
        }
        // else if plan is already finished, redirect to journey page
        if (plan.value.status === "done" && myId.value) {
          router.push(`/plan/${code}/swipe`)
          return
        }
        isLoading.value = false
    } catch(error) {
        isLoading.value = false
        errorMessage.value = error.response ? error.response.data.error : 'Cant reach the server.'
    }
}

const MIN_BUDGET = 1
const MAX_BUDGET = 100

function blockBadKeys(event) {
  if (["-", "+", "e", "E"].includes(event.key)) {
    event.preventDefault()
  }
}


//error prevention: red message under the budget box, updates as you type
const budgetError = computed(() => {
  if (budget.value === "" || budget.value === null) {
    return "" //empty: no message yet (the "I'm in!" button is disabled anyway)
  }
  const budgetNumber = Number(budget.value)
  if (Number.isNaN(budgetNumber) || budgetNumber < MIN_BUDGET || budgetNumber > MAX_BUDGET) {
    return `Budget must be between $${MIN_BUDGET} and $${MAX_BUDGET}.`
  }
  return ""
})

async function submitPreferences() {
  if (isJoining.value) {
    return
  }
      //error prevention: stop if the budget box has a problem (the red line under the box already explains it)
  if (budget.value === "" || budgetError.value) {
    return
  }
  isJoining.value = true
  try {
      const response = await axios.post(`${API_URL}/plans/${code}/members`, {
          name: name.value,
          lat: selectedLat.value,
          lng: selectedLng.value,
          diet: diet.value,
          budget: budget.value
      })
      plan.value = response.data
      const members = response.data.members
      const me = members[members.length -1]

      localStorage.setItem(`memberId-${code}`, me._id)
      myId.value = me._id
    } catch(error) {
        errorMessage.value = error.response ? error.response.data.error : "Can't reach the server."
        isJoining.value = false
    }
}

async function startSwiping() {
  errorMessage.value = ""
  
  if (isStartingSwiping.value) {
    return
  }

  isStartingSwiping.value = true
  try {
    const response = await axios.post(`${API_URL}/plans/${code}/start`, {
        memberId : myId.value
    })
    plan.value = response.data

    router.push(`/plan/${code}/swipe`)
  } catch (error) {
    errorMessage.value = error.response ? error.response.data.error: "Cant reach the server."
    isStartingSwiping.value = false
  }
}

function formatTime(time) {
  const [hours, minutes] = time.split(":")
  const period = hours >= 12 ? "PM" : "AM"
  const hour = hours % 12 || 12

  return `${hour}:${minutes} ${period}`
}

function formatDate(date) {
  const dateObj = new Date(date)

  return dateObj.toLocaleDateString("en-SG", {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

function movePin(position) {
    if (pinnedOnce === null) {
        pinnedOnce = L.marker(position).addTo(map)
    } else {
        pinnedOnce.setLatLng(position)
    }
    selectedLat.value = position.lat
    selectedLng.value = position.lng
}

//sg's rough edges, so users dont click from johor, batam
function pinInSingapore(position) {
    return position.lat >= 1.24 && position.lat <= 1.47 && position.lng >= 103.63 && position.lng <= 104.01
}

async function getPostal() {
    errorMessage.value = ""
    try {
        const response = await axios.get(`${API_URL}/plans/location`, {
            params: {postal: postal.value} 
        }) //response.data returns {lat: "value", lng: "value"}
        movePin(response.data)
        map.setView(response.data, 16)
    } catch(error) {
        errorMessage.value = error.response ? error.response.data.error: "Can't reach the server"
    }
}

onMounted(async () => {
    refreshTimer = setInterval(() => {
      loadPlan()
    }, 5000)
    console.log(refreshTimer)
    await loadPlan()
    if (!plan.value) {
      router.push("/plan/join")   // plan not found: will redirect back to join page
    return
  }
    if (myId.value) {
      return
    }
    if (plan.value.status !== "joining") {
      return
    }
    map = L.map("map").setView([1.3521, 103.8198], 11) // tells Leaflet which HTML element to put the map inside

    //Keep map view around SG, we pass in a nested arr of coordinates
    map.setMaxBounds([[1.22,103.62], [1.47,104.08]])

    //leaflet gets the map tiles from this URL from OpenStreetMap
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors"
    }).addTo(map)

    //Leaflet gives the function an object that contains lat and lng values
    map.on("click", function(clickInfo) {
        if (!pinInSingapore(clickInfo.latlng)) {
           mapError.value = "Please select a location within Singapore!"
          return
        }
         mapError.value = ""
        movePin(clickInfo.latlng)
    }
      )
})

onUnmounted(() => {
    clearInterval(refreshTimer)
})

</script>

<template>
  <main class="bg-tiles">
  <div class="container py-4">
    <div class="row g-4">
            <div class="col-12 col-lg-5">
        <div v-if="plan" class="card plan-card">
          <div class="text-center">
             <svg width="70" height="77" aria-hidden="true"><use href="#av-milo"/></svg>
            <h1 class="plan-name mb-1">{{ plan.name }}</h1>
            <span class="plan-type">MAKAN PLAN</span>
          </div>
          <div class="plan-details">
            <div class="plan-detail">
              <span class="detail-icon">📅</span>
              <div>
                <small>Date</small>
                <strong>{{ formatDate(plan.date) }}</strong>
              </div>
            </div>
            <div class="plan-detail">
              <span class="detail-icon">🕐</span>
              <div>
                <small>Time</small>
                <strong>{{ formatTime(plan.time) }}</strong>
              </div>
            </div>
          </div>
          <div class="text-center mt-3">
            <small class="code-label">PLAN CODE</small>
            <p class="preview-code mb-0">{{ plan.code }}</p>
          </div>

          <h1 class="members-title">Members: <span class="member-count">{{ plan.members.length }}</span></h1>
          <div class="members-list">
            <div class="member-card" v-for="(member, index) in plan.members" :key="member._id">
              <svg class="avatar" width="32" height="35" aria-hidden="true">
                <use v-bind:href="`#${AVATARS[index % AVATARS.length]}`"/>
              </svg>
              <span class="fw-bold member-name">{{ member.name }}</span>
              <!-- the first person to join is the host -->
              <span v-if="index === 0" class="member-badge host">Host</span>
              <!-- this member's _id matches the one saved in my browser = this is me -->
              <span v-if="member._id === myId" class="member-badge you">You</span>
            </div>
          </div>

        </div>
      </div>
        <div class="col-12 col-lg-7">
        <form v-if="plan && !myId && plan.status === 'joining'" class="card w-100 p-4" novalidate v-on:submit.prevent="submitPreferences()">
          <h2 class="h4 mb-3">Your preferences</h2>

          <div class="mb-3">
            <label for="name" class="form-label fw-bold">Your name</label>
            <input id="name" maxlength="30" v-model="name" class="cute-input form-control" placeholder="e.g. Aisha" />
          </div>

          <div class="mb-3">
            <p class="form-label fw-bold mb-1">Where are you coming from?</p>
            <p class="text-muted small mb-2">Enter a postal code, or tap the map to drop a pin.</p>

           <div class="input-group mb-2">
               <input v-model="postal" class="cute-input form-control" placeholder="Postal code, e.g. 730707" inputmode="numeric" maxlength="6" />
               <button type="button" class="btn sm" v-on:click="getPostal()">Find</button>
           </div>
            <div id="map"></div>
            <p v-if="mapError" class="text-center text-danger small fw-bold mt-2 mb-0">{{ mapError }}</p>
            <p v-if="selectedLat !== null && selectedLng !== null && !errorMessage" class="location-set mt-2 mb-0">Location set</p>
          </div>

          <div class="mb-3">
            <label for="diet" class="form-label fw-bold">Dietary needs</label>
            <select id="diet" v-model="diet" class="cute-input form-select">
              <option v-for="option in DIET_OPTIONS" :key="option.value" :value="option.value" >
                 {{ option.label }} 
              </option>
            </select>
                    </div>

          <div class="mb-4">
            <label for="budget" class="form-label fw-bold">Max budget per person ($)</label>
            <input
                id="budget"
                v-model="budget"
                type="number"
                inputmode="decimal"
                :min="MIN_BUDGET"
                :max="MAX_BUDGET"
                step="0.5"
                class="cute-input form-control"
                :class="{ 'is-invalid': budgetError }"
                placeholder="e.g. 8"
                @keydown="blockBadKeys"
              />
            <!-- NEW (error prevention): red line ABOVE the hint, only when the budget is wrong -->
            <p v-if="budgetError" class="text-danger small fw-bold mt-1 mb-0" role="alert">{{ budgetError }}</p>
            <small class="text-muted">Between ${{ MIN_BUDGET }} and ${{ MAX_BUDGET }}</small>
          </div>

          <p v-if="errorMessage" class="text-danger">{{ errorMessage }}</p>
          <button type="submit" class="btn red w-100" v-bind:disabled="isJoining || selectedLat === null || selectedLng === null || name.trim() === '' ||budget === ''">{{ isJoining ? "Joining..." : "I'm in!" }}</button>
        </form>

        <!--arrived after swiping started -->
        <div v-else-if="plan && !myId" class="card waiting-card">
          <h2 class="h3 fw-bold">Too late!</h2>
          <p class="text-muted mb-0">This group has already started swiping.</p>
          <RouterLink class="btn mx-auto red w-50 mt-4" to="/plan/new">Start your own plan</RouterLink>
        </div>

         <div v-else class="card waiting-card">
            <h2 class="h3 fw-bold">You're in!</h2>
            <div class="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div class="waiting-status"> 
              <span class="status-dot"></span>
              Waiting for everyone to join...
            </div>
            <button v-if="isHost" v-on:click="startSwiping()" type="button" v-bind:disabled="isStartingSwiping" class="btn green w-50 mt-4 mx-auto">
            <span v-if="isStartingSwiping" class="spinner-border spinner-border-sm me-2" role="status"></span>
            {{ isStartingSwiping ? 'Starting...' : 'Start Swiping!' }}
            </button>
            <p v-if="isHost && errorMessage" class="text-danger fs-5 fw-bold mt-2 mb-0">{{ errorMessage }}</p>
        </div>

        <div v-if="myId" class="next-section">
          <div class="h3 fw-bold mb-3"> What's next?</div>
          <div class="row g-3">
            <div class="col-12 col-lg-4">
              <div class="card h-100 p-3 step-card step-1">
                <p class="step-number mb-2">1</p>
                <h3 class="h5 fw-bold"> Everyone joins</h3>
                <p class="text-muted mb-0"> Share the code with your friends</p>
              </div>
            </div>
            <div class="col-12 col-lg-4">
              <div class="card h-100 p-3 step-card step-2">
                <p class="step-number mb-2">2</p>
                <h3 class="h5 fw-bold">Wait for everyone</h3>
                <p class="text-muted mb-0">
                 Once everyone's in, the host can start swiping.
                </p>
              </div>
            </div>
            <div class="col-12 col-lg-4">
              <div class="card h-100 p-3 step-card step-3">
                  <p class="step-number mb-2">3</p>
                  <h3 class="h5 fw-bold">Find a match</h3>
                  <p class="text-muted mb-0">Swipe together and find a hawker centre everyone likes. 
                  </p>
              </div>
            </div>    
          </div>
        </div>
        <div v-if="myId" class="dish-search-prompt mt-4">
          <div class="dish-search-content">
            <div class="dish-search-icon">🔎</div>
            <div>
              <h3 class="h5 fw-bold mb-1">Got specific cravings? </h3>
              <p class="text-muted mb-0">
                Search dishes and add your desired hawker centre to swipe!
              </p>
              </div>
          </div>
          <button type="button" class="btn red" v-on:click="router.push(`/dish-search?plan=${code}`)"> Search dishes</button>
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

.plan-card {
  padding: 24px;
}

.plan-name {
  font-size: 24px;
  font-weight: bold;
  margin-top: 5px;
}

.plan-type {
  font-size: 20px;
  font-weight: bold;
  letter-spacing: 1px;
  color: var(--tomato);
}

.plan-details {
  margin-top: 24px;
  padding: 18px 20px;
  background-color: var(--cream);
  border-radius: 12px;
}

.plan-detail {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.plan-detail:last-child {
  margin-bottom: 0;
}

.plan-detail small {
  display: block;
  color: var(--muted);
}

.code-label {
  display: block;
  margin-top: 0;
  color: var(--muted);
  font-size: 13px;
  font-weight: bold;
  letter-spacing: 2px;
}

.preview-code {
  font-size: 28px;
  font-weight: bold;
  letter-spacing: 6px;
  color: var(--ink);
}

#map {
  height: 280px;
  border: 3px solid var(--ink);
  border-radius: 12px;
  box-shadow: 3px 3px 0 var(--ink);
}

#map {
  position: relative;     /* needed so the label positions against the map */
}

#map::before {
  content: "Tap to drop a pin 📍 ";    
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 500;                   
  padding: 4px 10px;
  background: var(--paper);
  border: 2px solid var(--ink);
  border-radius: 999px;
  font-size: 13px;
  font-weight: bold;
}

@media (min-width: 992px) {
  #map {
    height: 400px;
  }
}

.avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;           
  background-color: var(--tomato);
  color: var(--cream);
  font-weight: bold;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
}

.location-set {
  display: flex;
  width: fit-content;
  margin-left: auto;
  margin-right: auto;
  padding: 4px 12px;
  align-items: center;
  background: var(--pandan);
  border: 2px solid var(--ink);
  border-radius: 999px;
  font-weight: 800;
  font-size: 14px;
}

.members-title {
  margin-top: 20px;
  margin-bottom: 12px;
  color: var(--ink) ;
  font-size: 20px;
  font-weight: bold;
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.member-card {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  max-width: 300px;
  padding: 10px 12px;
  background: var(--paper);
  border: 3px solid var(--ink);
  border-radius: 12px;
  box-shadow: 3px 3px 0 var(--ink);;
}

.member-count {
  margin-left: 6px;
  color: var(--tomato);
}

.member-name {
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.member-badge {
  padding-top: 4px;
  padding-bottom: 4px;
  padding-left: 8px;
  padding-right: 8px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
}

.host {
  background: var(--sun);
  color: var(--ink);
  border: 2px solid var(--ink);
}

.you {
  background: var(--pandan);
  color: var(--ink);
  border: 2px solid var(--ink);
}

.waiting-card {
  padding-top: 32px;
  padding-bottom: 32px;
  padding-left: 32px;
  padding-right: 32px;
  text-align: center;
}

.loading-dots {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 18px;
  margin-bottom: 10px;
}

.loading-dots span {
  width: 7px;
  height: 7px;
  background: var(--tomato);
  border-radius: 50%;
  animation: loading 1s infinite ease-in-out;
}

.loading-dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.loading-dots span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes loading {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.4;
  }

  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.waiting-status {
  display: flex;
  width: fit-content;
  align-items: center;
  gap: 7px;
  padding: 6px 12px 6px 12px;
  border-radius: 20px;
  background: #e3f3e8;
  color: #267344;
  font-size: 12px;
  font-weight: bold;
  letter-spacing: 0.5px;
  margin: auto;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #267344;
}

.next-section {
  margin-top: 24px;
}

.step-card {
  background-color: var(--cream);
}

.step-number {
  font-size: 28px;
  font-weight: bold;
  color: var(--ink);
  line-height: 1;
}

.step-card:hover {
  background-color: #faf8f3;
}

.dish-search-prompt {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 20px;
  padding-top: 20px;
  padding-bottom: 20px;
  padding-left: 24px;
  padding-right: 24px;  
  background-color: var(--cream);
  border: 3px dashed var(--ink);           
  border-radius: 16px;
}

.dish-search-prompt h3 {
  color: var(--ink);                     
  font-size: 20px;
}

.step-1 {
   background: #FFF2C4; 
}   
.step-2 {
   background: #DCF2FB; 
}   
.step-3 {
   background: #D7F2E3; 
}   
</style>