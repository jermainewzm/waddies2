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
    } catch(error) {
        errorMessage.value = error.response ? error.response.data.error : 'Cant reach the server.'
    }
}

async function submitPreferences() {
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

function movePin(position) {
    if (pinnedOnce === null) {
        pinnedOnce = L.marker(position).addTo(map)
    } else {
        pinnedOnce.setLatLng(position)
    }
    selectedLat.value = position.lat
    selectedLng.value = position.lng
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
    //leaflet gets the map tiles from this URL from OpenStreetMap
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors"
    }).addTo(map)

    //Leaflet gives the function an object that contains lat and lng values
    map.on("click", function(clickInfo) {
        movePin(clickInfo.latlng)
    }
      )
})

onUnmounted(() => {
    clearInterval(refreshTimer)
})

</script>

<template>
  <div class="container py-4">
    <div class="row g-4">
      <div class="col-12 col-lg-5">
        <div v-if="plan"> 
          <h1 class="display-5 fw-bold mb-1">{{ plan.name }}</h1>
          <p class="text-muted mb-1">{{ plan.date }}, {{ plan.time }}</p>
          <p>Plan code: <strong class="code">{{ plan.code }}</strong></p>
          <h2 class="h4 fw-bold mt-2">Members: {{ plan.members.length }}</h2>
          <ul class="list-unstyled">
             <li v-for="(member, index) in plan.members" :key="member._id"
              class="member-row rounded-3 p-2 mb-1 d-flex align-items-center gap-2">
              <span class="avatar">{{ member.name.charAt(0).toUpperCase() }}</span>
              <span class="fw-bold">{{ member.name }}</span>
              <!-- the first person to join is the host -->
              <span v-if="index === 0" class="badge rounded-pill bg-warning text-dark ms-1">Host</span>
              <!-- this member's _id matches the one saved in my browser = this is me -->
              <span v-if="member._id === myId" class="badge rounded-pill bg-success ms-1">You</span>
          </li>
        </ul>
        </div>
      </div>
        <div class="col-12 col-lg-7 d-flex align-items-center">
        <form v-if="!myId" class="w-100" v-on:submit.prevent="submitPreferences()">
          <h2 class="h4 mb-3">Your preferences</h2>

          <div class="mb-3">
            <label for="name" class="form-label fw-bold">Your name</label>
            <input id="name" v-model="name" class="form-control" placeholder="e.g. Aisha" />
          </div>

          <div class="mb-3">
            <p class="form-label fw-bold mb-1">Where are you coming from?</p>
            <p class="text-muted small mb-2">Enter a postal code, or tap the map to drop a pin.</p>

           <div class="input-group mb-2">
               <input v-model="postal" class="form-control" placeholder="Postal code, e.g. 730707" inputmode="numeric" maxlength="6" />
               <button type="button" class="btn btn-outline-dark" v-on:click="getPostal()">Find</button>
           </div>
            <div id="map"></div>
            <p v-if="selectedLat !== null && selectedLng !== null" class="small text-success mt-2 mb-0">Location set</p>
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
            <input id="budget" v-model="budget" type="number" min="1" max="50" class="form-control" placeholder="e.g. 8" />
          </div>

          <p v-if="errorMessage" class="text-danger">{{ errorMessage }}</p>

          <button type="submit" class="btn btn-hh-red w-100" v-bind:disabled="selectedLat === null || selectedLng === null || name === '' ||budget === ''">I'm in</button>
        </form>
         <div v-else class="w-100 card border-1 rounded-4 text-center p-4 p-md-5 waiting-card">
            <h2 class="h3 fw-bold">You're in!</h2>
            <p class="text-muted mb-0">Waiting for everyone to join...</p>
            <button v-if="isHost" v-on:click="startSwiping()" type="button" class="btn btn-lg btn-hh-red w-100 mt-4">Start swiping!</button>
            <p v-if="isHost && errorMessage" class="text-danger fs-5 fw-bold mt-3 mb-0">{{ errorMessage }}</p>
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
  background-color: #fff4e3;
}

.code {
  letter-spacing: 3px;
  font-size: 24px;
}
 
.avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;           
  background-color: #f48342;
  color: #fff4e3;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
}


</style>