
<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue"
import { useRoute, useRouter } from "vue-router"
import axios from "axios"
import { API_URL } from "@/utils/constants"
import { stations } from "@/utils/station-helper"
import L from "leaflet"     //map library same as lobby
import "leaflet/dist/leaflet.css"     //styling for the map

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
  errorMessage.value = ""     //clear old error so "try again" works
  isLoading.value = true      //show spinner again on retry

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

  //map's div only exists after vue has re-rendered page, so wait one tick
  if (myRoute.value && !errorMessage.value) {
    await nextTick()
    drawMap()
  }
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
      result += word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() + " "
    }
  }

  return result.trim()
}

//MAP stuffs:
let map = null            //leaflet map (plain variable that display Leaflet will manage)
let legLines = []         //one line per leg, same order as routeLegs
let endMarkers = []       //start and end dots
let routeBounds = null    //area that contains the whole route

//Turns OneMap's compressed text into [lat,lng] points
function decodePolyline(encoded) {
  const points = []
  let index = 0
  let lat = 0
  let lng = 0

  while (index < encoded.length) {
    // read one number (change in lat)
    let result = 0
    let shift = 0
    let byte
    do {
      byte = encoded.charCodeAt(index++) - 63     // each character is a 5-bit chunk, offset by 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)                        // 0x20 means "more chunks follow"
    lat += (result & 1) ? ~(result >> 1) : (result >> 1)   // lowest bit = sign

    // read the next number (change in lng), same way
    result = 0
    shift = 0
    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)
    lng += (result & 1) ? ~(result >> 1) : (result >> 1)

    points.push([lat / 1e5, lng / 1e5])           // values are stored as degrees x 100,000
  }

  return points
}

// walking = grey dots, bus = teal, MRT/LRT = the line's own colour
function legColour(leg) {
  if (leg.mode === "WALK") {
    return "#6C757D"
  }
  if (leg.mode === "BUS") {
    return "#0B7285"
  }
  return getLineColour(leg.service)
}

// a short name for the hover label, e.g. "Bus 190" or "East West Line"
function legTitle(leg) {
  if (leg.mode === "WALK") {
    return "Walk"
  }
  if (leg.mode === "BUS") {
    return `Bus ${leg.service}`
  }
  return getMRTLine(leg.service)
}

function drawMap() {
  // remove an earlier map first (e.g. after "Try again")
  if (map) {
    map.remove()
  }
  legLines = []
  endMarkers = []

  // start zoomed out over Singapore; we zoom to the route below
  map = L.map("journey-map").setView([1.3521, 103.8198], 11)

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
  }).addTo(map)

  let allPoints = []

  for (let index = 0; index < routeLegs.value.length; index++) {
    const leg = routeLegs.value[index]
    const points = decodePolyline(leg.geometry || "")
    allPoints = allPoints.concat(points)

    const line = L.polyline(points, {
      color: legColour(leg),
      weight: 5,
      opacity: 0.9,
      dashArray: leg.mode === "WALK" ? "2 10" : null,   // dotted for walking
      lineCap: "round"
    }).addTo(map)

    line.bindTooltip(`${legTitle(leg)} · ${leg.minutes} min`, { sticky: true })
    line.on("click", () => selectLeg(index))
    legLines.push(line)
  }

  if (allPoints.length === 0) {
    return
  }

  // green dot = where you start (first point), red dot = the hawker centre (last point)
  endMarkers.push(
    L.circleMarker(allPoints[0], {
      radius: 9, color: "white", weight: 3, fillColor: "#2f9e44", fillOpacity: 1
    }).addTo(map).bindTooltip("You start here")
  )
  endMarkers.push(
    L.circleMarker(allPoints[allPoints.length - 1], {
      radius: 11, color: "white", weight: 3, fillColor: "#c8372d", fillOpacity: 1
    }).addTo(map).bindTooltip("Your hawker centre")
  )

  // zoom so the whole route fits, with some breathing room
  routeBounds = L.latLngBounds(allPoints)
  map.fitBounds(routeBounds, { padding: [30, 30] })
}

const selectedLeg = ref(null)      // which step is highlighted (null = none)

// restyle every line: the selected one bold, the others faded
function styleLines() {
  for (let i = 0; i < legLines.length; i++) {
    const isSelected = selectedLeg.value === i
    const nothingSelected = selectedLeg.value === null

    legLines[i].setStyle({
      weight: isSelected ? 9 : 5,
      opacity: (nothingSelected || isSelected) ? 0.9 : 0.25
    })

    if (isSelected) {
      legLines[i].bringToFront()
    }
  }

  // keep the start and end dots on top of the lines
  for (const marker of endMarkers) {
    marker.bringToFront()
  }
}

function selectLeg(index) {
  if (!map) {
    return
  }

  // clicking the same step again clears the highlight and shows the whole route
  if (selectedLeg.value === index) {
    selectedLeg.value = null
    styleLines()
    if (routeBounds && routeBounds.isValid()) {
      map.fitBounds(routeBounds, { padding: [30, 30] })
    }
    return
  }

  selectedLeg.value = index
  styleLines()

  const bounds = legLines[index].getBounds()
  if (bounds.isValid()) {
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 })
  }

  // on a phone the map may be off-screen; "nearest" only scrolls if it needs to
  document.getElementById("journey-map").scrollIntoView({ behavior: "smooth", block: "nearest" })
}

onMounted(() => {
  loadRoute()
})

onUnmounted(() => {
  if (map) {
    map.remove()    //tidy up map when leaving page
  }
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
        <p v-if="myRoute.totalMinutes > 120" class="alert alert-warning mt-3 mb-0">
          NOTE: Long travelling time may be due to public transport running at this hour!
        </p>
      </section>

      <!-- Map placeholder -->
      <section class="card shadow-sm border-0 rounded-4 p-4 mb-4">
        <h2 class="hh-display h4 mb-3">Route map</h2>
        <div id="journey-map" class="journey-map rounded-3"></div>
        <p class="text-muted small mt-2 mb-0">Tap a step below to see it on the map.</p>
      </section>

      <!-- Step-by-step directions -->
      <section class="card shadow-sm border-0 rounded-4 p-4 mb-4">
        <h2 class="hh-display h4 mb-4">Step-by-step directions</h2>
        <div v-for="(leg, index) in routeLegs" v-bind:key="index" 
          class="d-flex gap-3 mb-4"
          v-bind:class="{'step-active' : selectedLeg === index }"
          role="button" tabindex="0"
          v-on:click="selectLeg(index)">
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
      <!-- Where to next -->
      <div v-if="myRoute.centre" class="text-center mt-4">
        <RouterLink class="btn btn-outline-dark me-2" v-bind:to="`/centres/${myRoute.centre.serialNo}`">
          See live seats at the centre
        </RouterLink>
        <RouterLink class="btn" to="/plan/new">
          Start a new Makan Plan
        </RouterLink>
      </div>
    </template>
  </main>
</template>

<style scoped>
.journey-map {
  width: 100%;
  height: 380px;  /* Leaflet map needs a set height to appear */
  z-index: 0;   /* keeps map from floating over navbar when scrolling */
}

@media (max-width: 576px) {
  .journey-map {
    height: 300px;  /* shorter on phones */
  }
}

.journey-step {
  cursor: pointer;
  padding: 12px;
  border-radius: 12px;
  border: 2px solid transparent;
}

.journey-step:hover {
  background: #f6f7f8;
}

.step-active {
  background: #eef0f1;
  border-color: var(--hh-red);
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
