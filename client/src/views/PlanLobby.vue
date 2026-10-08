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
        <div class="col-12 col-lg-7 d-flex align-items-center">
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
         <div v-else class="w-100 card border-1 rounded-4 text-center p-4 p-md-5 waiting-card">
            <h2 class="h3 fw-bold">You're in!</h2>
            <p class="text-muted mb-0">Waiting for everyone to join...</p>
            <button v-if="isHost" v-on:click="startSwiping()" type="button" class="btn btn-lg btn-hh-red w-100 mt-4">Start swiping!</button>
            <p v-if="isHost && errorMessage" class="text-danger fs-5 fw-bold mt-2 mb-0">{{ errorMessage }}</p>
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

.waiting-card {
  background-color: #faf2e5;
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
  font-weight: 700;
}

.code {
  display: inline-block;
  letter-spacing: 3px;
  font-size: 24px;
  background: #fff4e3;
  border-radius: 10px;
  color: #ea351d;
  font-weight: 800;
  padding-top: 8px;
  padding-bottom: 8px;
  padding-left: 12px;
  padding-right: 12px;
  margin-bottom: 0px;
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
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

</style>