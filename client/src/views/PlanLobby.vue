<script setup>
import { ref, computed, onMounted} from "vue"
import axios from "axios"
import { API_URL } from "@/utils/constants"
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

const selectedLat = ref(null)
const selectedLng = ref(null)

let map = null
let pinnedOnce = null

async function loadPlan() {
    try {
        const response = await axios.get(`${API_URL}/plans/${code}`)
        plan.value = response.data
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
    } catch(error) {
        errorMessage.value = error.response ? error.response.data.error : "Can't reach the server."
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
    await loadPlan()
    if (!plan.value) {
        router.push("/plan/new")   // plan not found: just a placeholder for now. will redirect back to join page
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
</script>

<template>
  <div class="container py-4">
    <div class="row g-4">

      <!-- LEFT (top on phones): plan details + members -->
      <div class="col-12 col-lg-5">
        <div v-if="plan">
          <h1 class="hh-display">{{ plan.name }}</h1>
          <p class="mb-1">{{ plan.date }}, {{ plan.time }}</p>
          <p>Plan code: <strong>{{ plan.code }}</strong></p>

          <h2 class="h4 mt-4">Members</h2>
          <ul>
            <li v-for="member in plan.members" :key="member._id">
              {{ member.name }}
            </li>
          </ul>
        </div>
      </div>
        <div class="col-12 col-lg-7">
        <form v-on:submit.prevent="submitPreferences()">
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
            <p v-if="selectedLat" class="small text-success mt-2 mb-0">Location set</p>
          </div>

          <div class="mb-3">
            <label for="diet" class="form-label fw-bold">Dietary needs</label>
            <select id="diet" v-model="diet" class="form-select">
              <option value="any">No preference</option>
              <option value="halal">Halal</option>
              <option value="vegetarian">Vegetarian</option>
            </select>
          </div>

          <div class="mb-4">
            <label for="budget" class="form-label fw-bold">Max budget per person ($)</label>
            <input id="budget" v-model="budget" type="number" min="1" max="50" class="form-control" placeholder="e.g. 8" />
          </div>

          <p v-if="errorMessage" class="text-danger">{{ errorMessage }}</p>

          <button type="submit" class="btn btn-hh-red w-100" v-bind:disabled="selectedLat === null || selectedLng === null">I'm in</button>
        </form>
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

</style>