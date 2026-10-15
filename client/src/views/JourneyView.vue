
<script setup>
import { ref, computed, onMounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import axios from "axios"
import { API_URL } from "@/utils/constants"
import { stations } from "@/utils/station-helper"

const route = useRoute()
const router = useRouter()

const code = route.params.code
const myId = localStorage.getItem(`memberId-${code}`)

const myRoute = ref(null)
const errorMessage = ref("")
const isLoading = ref(true)

const routeLegs = computed(() => {
  if (!myRoute.value) {
    return []
  }
  return myRoute.value.legs
})

function getStations(leg) {
    const stationName = leg.to.replace(" MRT STATION", "").replace(" LRT STATION", "")
    const station = stations.filter(s =>
        s.name.toUpperCase() === stationName.toUpperCase() 
    )
    return station || null
}

async function loadRoute() {
  try {
    const response = await axios.get(`${API_URL}/plans/${code}/route`, {
      params: { memberId: myId }
    })
    myRoute.value = response.data
    console.log("Route legs:", response.data.legs)
  } catch (error) {
    errorMessage.value = error.response ? error.response.data.error: "Can't reach the server."
  }
  isLoading.value = false
}

function goBack() {
  router.push(`/plan/${code}/swipe`)
}

function getMRTLine(line) {
    const lineNames = {
        TE: "Thompson East Coast Line",
        NE: "North East Line",
        NS: "North South Line",
        EW: "East West Line",
        CC: "Circle Line",
        DT: "Downtown Line",
        BP: "Bukit Panjang LRT",
        SK: "Sengkang LRT",
        PG: "Punggol LRT"
    }

    return lineNames[line] || line
}

function getLineColour(service) {
  const colours = {
    NS: "#D42E2E", // North-South Line
    EW: "#009645", // East-West Line
    NE: "#9900AA", // North East Line
    CC: "#FA9E0D", // Circle Line
    DT: "#005EC4", // Downtown Line
    TE: "#9D5B25", // Thomson-East Coast Line
    BP: "#748477", // Bukit Panjang LRT
    SE: "#748477", // Sengkang LRT
    SW: "#748477",
    PE: "#748477", // Punggol LRT
    PW: "#748477"  
  }

  return colours[service] || "#6C757D"
}

function formatStationName(name) {
  const words = name.split(" ")
  let result = ""

  for (const word of words) {
    if (word === "MRT" || word === "LRT") {
      result += word + " "
    } else {
      result += word.charAt(0) + word.slice(1).toLowerCase() + " "
    }
  }

  return result.trim()
}

onMounted(() => {
  loadRoute()
})
</script>

<template>
  <main class="container py-4">
    <button class="btn btn-outline-secondary mb-4" v-on:click="goBack()">
      ← Back to results
    </button>

    <h1 class="hh-display mb-2">Your journey</h1>
    <p class="text-muted mb-4">
      Here's how to get to your group's winning hawker centre.
    </p>

    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border" role="status"></div>
      <p class="text-muted mt-3">Finding your route...</p>
    </div>

    <div v-else-if="errorMessage" class="alert alert-danger">
      {{ errorMessage }}

      <button class="btn btn-outline-danger btn-sm ms-2" v-on:click="loadRoute()">
        Try again
      </button>
    </div>

    <template v-else-if="myRoute">
      <!-- Journey summary -->
      <section class="card shadow-sm border-0 rounded-4 p-4 mb-4">
        <div class="row g-3">
          <div class="col-6">
            <p class="text-muted mb-1">Total travel time</p>
            <h2 class="hh-display h3 mb-0">
              {{ myRoute.totalMinutes }} min
            </h2>
          </div>

          <div class="col-6">
            <p class="text-muted mb-1">Public transport fare</p>
            <h2 class="hh-display h3 mb-0">
              Estimated fare: ${{ myRoute.fare }}
            </h2>
          </div>
        </div>
        <hr/>
        <p class="mb-0 text-muted">
          {{ myRoute.transfers }} transfer(s)
        </p>
      </section>

      <!-- Map placeholder -->
      <section class="card shadow-sm border-0 rounded-4 p-4 mb-4">
        <h2 class="hh-display h4 mb-3">Route map</h2>

        <div class="map-placeholder rounded-3 d-flex flex-column
            justify-content-center align-items-center text-center p-4">
          <span class="fs-1">🗺️</span>
          <p class="fw-bold mt-2 mb-1">Your route will appear here</p>
          <p class="text-muted small mb-0">
            Placeholder for map
          </p>
        </div>
      </section>

      <!-- Step-by-step directions -->
      <section class="card shadow-sm border-0 rounded-4 p-4 mb-4">
        <h2 class="hh-display h4 mb-4">Step-by-step directions</h2>
        <div v-for="(leg, index) in routeLegs" v-bind:key="index" class="d-flex gap-3 mb-4">
          <div class="journey-icon rounded-circle d-flex
            align-items-center justify-content-center">
            <span v-if="leg.mode === 'WALK'">🚶</span>
            <span v-else-if="leg.mode === 'BUS'">🚌</span>
            <span v-else>🚆</span>
          </div>
          <div class="flex-grow-1">
            <h3 class="h6 fw-bold mb-1">
              <template v-if="leg.mode === 'WALK'">
                Walk
              </template>
              <template v-else-if="leg.mode === 'BUS'">
                Take Bus {{ leg.service }}
              </template>
              <template v-else-if="leg.mode === 'SUBWAY'">
                Take {{ getMRTLine(leg.service) }}
              </template>
              <template v-else-if="leg.mode === 'TRAM'">
                Take {{ getMRTLine(leg.service) }}
            </template>
            </h3>

            <p class="text-muted small mb-1">
              {{ leg.minutes }} min
            </p>

            <p class="mb-0">
              To:
              <span v-for="station in getStations(leg)" v-bind:key="station.code" class="station-code-badge"
              v-bind:style="{backgroundColor: getLineColour(station.line)}">
              {{ station.code }}
            </span>
                {{ formatStationName(leg.to) }}
            </p>
          </div>
        </div>
      </section>
    </template>
  </main>
</template>

<style scoped>
.map-placeholder {
  min-height: 220px;
  background: #eef0f1;
}

.journey-icon {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  background: #eef0f1;
  font-size: 1.25rem;
}

.station-code-badge {
  display: inline-block;
  padding: 3px 7px;
  margin: 0 4px;
  border-radius: 6px;
  color: white;
  font-size: 12px;
  font-weight: bold;
}
</style>
