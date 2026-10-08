<script setup>
import { ref, computed, onMounted, onUnmounted} from "vue"
import axios from "axios"
import { API_URL, DIET_OPTIONS } from "@/utils/constants"
import { useRoute, useRouter } from "vue-router"

import L from 'leaflet' //import leaflet javascript code
import 'leaflet/dist/leaflet.css' //import leaflet css styling

const route = useRoute() //lets PlanLobby.vue access info about the route that brought the user here
const router = useRouter()

const code = route.params.code
const plan = ref(null)
const errorMessage = ref("")
const isLoading = ref(true)
const isJoining = ref(false)

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

        //since we run loadPlan(), we check if swiping has started. 
        if (plan.value.status === "swiping" && myId.value) {
          router.push(`/plan/${code}/swipe`)
        }
        isLoading.value = false
    } catch(error) {
        isLoading.value = false
        errorMessage.value = error.response ? error.response.data.error : 'Cant reach the server.'
    }
}

async function submitPreferences() {
  if (isJoining.value) {
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

  try {
    const response = await axios.post(`${API_URL}/plans/${code}/start`, {
        memberId : myId.value
    })
    plan.value = response.data

    router.push(`/plan/${code}/swipe`)
  } catch (error) {
    errorMessage.value = error.response ? error.response.data.error: "Cant reach the server."
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
    return position.lat >= 1.22 && position.lat <= 1.47 && position.lng >= 103.62 && position.lng <= 104.08
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
    map = L.map("map").setView([1.4382, 103.7891], 15) // tells Leaflet which HTML element to put the map inside

    //Keep map view around SG, we pass in a nested arr of coordinates
    map.setMaxBounds([[1.22,103.62], [1.47,104.08]])

    //leaflet gets the map tiles from this URL from OpenStreetMap
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors"
    }).addTo(map)

    //Leaflet gives the function an object that contains lat and lng values
    map.on("click", function(clickInfo) {
        if (!pinInSingapore(clickInfo.latlng)) {
          errorMessage.value = "Please select a location within Singapore!"
          return
        }
        errorMessage.value = ""
        movePin(clickInfo.latlng)
    }
      )
})

onUnmounted(() => {
    clearInterval(refreshTimer)
})

</script>

<template>
  <div v-if="!isLoading && plan" class="container py-4">
    <div class="row g-4">
      <div class="col-12 col-lg-5">
        <div class="plan-card"> 
          <h1 class="display-6 fw-bold mb-1">{{ plan.name }}</h1>
          <p class="plan-date">{{ formatDate(plan.date) }} · {{ formatTime(plan.time) }}</p>
          <div class="code-row">
            <p class="code-label">Plan code: </p>
            <p class="code">{{ plan.code }}</p>
          </div>
          <h2 class="members-title">Members: <span class="member-count">{{ plan.members.length }} </span> </h2>
          <div class="members-list">
          <div class="member-card"
              v-for="(member, index) in plan.members" :key="member._id">
              <span class="avatar">{{ member.name.charAt(0).toUpperCase() }}</span>
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
        <form v-if="!myId" class="w-100" v-on:submit.prevent="submitPreferences()">
          <h2 class="h4 mb-3">Your preferences</h2>

          <div class="mb-3">
            <label for="name" class="form-label fw-bold">Your name</label>
            <input id="name" maxlength="30" v-model="name" class="form-control" placeholder="e.g. Aisha" />
          </div>

          <div class="mb-3">
            <p class="form-label fw-bold mb-1">Where are you coming from?</p>
            <p class="text-muted small mb-2">Enter a postal code, or tap the map to drop a pin.</p>

           <div class="input-group mb-2">
               <input v-model="postal" class="form-control" placeholder="Postal code, e.g. 730707" inputmode="numeric" maxlength="6" />
               <button type="button" class="btn btn-outline-dark" v-on:click="getPostal()">Find</button>
           </div>
            <div id="map"></div>
            <p v-if="selectedLat !== null && selectedLng !== null && !errorMessage" class="small text-success mt-2 mb-0">Location set</p>
          </div>

          <div class="mb-3">
            <label for="diet" class="form-label fw-bold">Dietary needs</label>
            <select id="diet" v-model="diet" class="form-select">
              <option v-for="option in DIET_OPTIONS" :key="option.value" :value="option.value" >
                 {{ option.label }} 
              </option>
            </select>
          </div>

          <div class="mb-4">
            <label for="budget" class="form-label fw-bold">Max budget per person ($)</label>
            <input id="budget" v-model="budget" type="number" min="1" max="100" class="form-control" placeholder="e.g. 8" />
          </div>

          <p v-if="errorMessage" class="text-danger">{{ errorMessage }}</p>
          <button type="submit" class="btn btn-hh-red w-100" v-bind:disabled="isJoining || selectedLat === null || selectedLng === null || name.trim() === '' ||budget === ''">{{ isJoining ? "Joining..." : "I'm in!" }}</button>
        </form>
         <div v-else class="waiting-card">
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
            <button v-if="isHost" v-on:click="startSwiping()" type="button" class="btn start-btn w-50 mt-4">Start swiping!</button>
            <p v-if="isHost && errorMessage" class="text-danger fs-5 fw-bold mt-2 mb-0">{{ errorMessage }}</p>
        </div>

        <div v-if="myId" class="next-section">
          <div class="h3 fw-bold mb-3"> What's next?</div>
          <div class="row g-3">
            <div class="col-12 col-lg-4">
              <div class="card h-100 p-3 step-card">
                <p class="step-number mb-2">1</p>
                <h3 class="h5 fw-bold"> Everyone joins</h3>
                <p class="text-muted mb-0"> Share the code with your friends</p>
              </div>
            </div>
            <div class="col-12 col-lg-4">
              <div class="card h-100 p-3 step-card">
                <p class="step-number mb-2">2</p>
                <h3 class="h5 fw-bold">Wait for everyone</h3>
                <p class="text-muted mb-0">
                 Once everyone's in, the host can start swiping.
                </p>
              </div>
            </div>
            <div class="col-12 col-lg-4">
              <div class="card h-100 p-3 step-card">
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
          <button type="button" class="btn btn-outline-dark" v-on:click="router.push(`/dish-search?plan=${code}`)"> Search dishes</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
#map {
  height: 280px;
}

@media (min-width: 992px) {
  #map {
    height: 400px;
  }
}

.code-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
  margin-bottom: 20px;
}

.code-label {
  margin-top: 20px;
  margin-bottom: 4px;
  color: #777;
  font-size: 13px;
  font-weight: bold;
}

.code {
  display: inline-block;
  letter-spacing: 3px;
  font-size: 24px;
  background: #fff4e3;
  border-radius: 10px;
  color: #c4521f;
  font-weight: bold;
  padding-top: 8px;
  padding-bottom: 8px;
  padding-left: 12px;
  padding-right: 12px;
  margin-bottom: 0px;
}

.start-btn {
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

.start-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 0 #9e4018;        
}

.avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;           
  background-color: #f48342;
  color: #fff4e3;
  font-weight: bold;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
}

.plan-card {
  background: white;
  border-radius: 18px;
  padding: 24px;
  box-shadow: 0 10px 35px rgba(59, 42, 32, 0.25);
}

.plan-date {
  margin: 8px 0 0;
  color: #777;
  font-size: 15px;
}

.members-title {
  margin-top: 20px;
  margin-bottom: 12px;
  color: #3b2a20;
  font-size: 14px;
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
  background: #ffffff;
  border: 1px solid #e9e9e9;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(59, 42, 32, 0.1);
}

.member-count {
  margin-left: 6px;
  color: #ea351d;
}

.member-name {
  color: #3b2a20;
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
  background: #fff0d6;
  color: #a85d00;
}

.you {
  background: #e3f3e8;
  color: #267344;
}

.waiting-card {
  width: 100%;
  background: #fefefe;
  border: 1px solid #e5e1dc;
  border-radius: 18px;
  padding-top: 32px;
  padding-bottom: 32px;
  padding-left: 32px;
  padding-right: 32px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(59, 42, 32, 0.25);
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
  background: #ea351d;
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
  border: 1px solid #e5e1dc;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 4px 15px rgba(59, 42, 32, 0.1);
}

.step-number {
  font-size: 28px;
  font-weight: bold;
  color: #c8372d;
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
  background-color: #fff4e3;           
  border: 2px dashed #c4521f;           
  border-radius: 16px;
}

.dish-search-prompt h3 {
  color: #3b2a20;                     
  font-size: 20px;
}

.dish-search-prompt .btn {
  background-color: #c4521f;           
  border-color: #c4521f;
  color: #fff4e3;
  border-radius: 10px;
  padding-top: 9px;
  padding-bottom: 9px;
  padding-left: 18px;
  padding-right: 18px;
  font-weight: bold;
  box-shadow: 0 6px 0 #9e4018;   
  transition: transform 0.15s ease, box-shadow 0.15s ease; 
}

.dish-search-prompt .btn:hover {
  transform: translateY(-2px);
  background-color: #c4521f;
  box-shadow: 0 8px 0 #9e4018;  
}
</style>