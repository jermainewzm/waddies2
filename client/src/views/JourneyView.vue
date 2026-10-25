
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
const routeMode = ref("pt")

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
      params: { memberId: myId, mode: routeMode.value }
    })
    myRoute.value = response.data
    console.log("Route legs:", response.data.legs)
  } catch (error) {
    console.log("Status:", error.response?.status)
  console.log("Response:", error.response?.data)
  console.log("Message:", error.message)
    errorMessage.value = error.response ? error.response.data.error: "Can't reach the server."

    if (error.response && error.response.data.centre) {
      myRoute.value = {
        centre: error.response.data.centre,
        member: error.response.data.member
      }
    }
  }
  isLoading.value = false

  //map's div only exists after vue has re-rendered page, so wait one tick
  if (myRoute.value && !errorMessage.value) {
    await nextTick()
    drawMap()
  }
}

function changeRouteMode(mode) {
  routeMode.value = mode
  loadRoute()
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
let routeBounds = null    //area that contains the whole route
let stopIcons = []        //bus/train icons: one for each point where a leg ends and the next begins
let stopLayer = null      //holds only the stop icons currently shown on the map
let startMarker = null    //the green start dot
let endMarker = null      //the hawker centre icon

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

// a round white badge with emoji inside (plain html)
function makeIcon(emoji, size, ring = "white", fill = "white") {
  return L.divIcon({
    className: "",    //removes Leaflet's default white box
    html: `<div class="map-icon" style="width:${size}px; height:${size}px; font-size:${Math.round(size*0.55)}px; border-color:${ring}; background:${fill}">${emoji}</div>`,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2]    //center of the badge sits on the point
  })
}

function drawMap() {
  // remove an earlier map first (e.g. after "Try again")
  if (map) {
    map.remove()
  }
  legLines = []
  stopIcons = []
  startMarker = null
  endMarker = null

  // start zoomed out over Singapore; we zoom to the route below
  map = L.map("journey-map").setView([1.3521, 103.8198], 11)

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
  }).addTo(map)

  stopLayer = L.layerGroup().addTo(map)     // a box we can empty and refill with icons for each step

  let allPoints = []

  for (let index = 0; index < routeLegs.value.length; index++) {
    const leg = routeLegs.value[index]
    const points = decodePolyline(leg.geometry || "")
    allPoints = allPoints.concat(points)

    const line = L.polyline(points, {
      color: legColour(leg),
      weight: 7,
      opacity: 1,
      dashArray: leg.mode === "WALK" ? "1 14" : null,   // dotted for walking
      lineCap: "round"
    }).addTo(map)

    line.bindTooltip(`${legTitle(leg)} · ${leg.minutes} min`, { sticky: true })
    line.on("click", () => selectLeg(index))
    legLines.push(line)

    //the stop icon at the END of this leg (where the next leg starts)
    //only created here: it is added to the map when a step next to it is selected
    if (index < routeLegs.value.length - 1 && points.length > 0) {
      const nextLeg = routeLegs.value[index + 1]
      const vehicle = leg.mode !== "WALK" ? leg : nextLeg      // which bus/train is at this stop
      const isBus = vehicle.mode === "BUS"

      stopIcons.push(
        L.marker(points[points.length - 1], { icon: makeIcon(isBus ? "🚌" : "🚆", 30) })
          .bindTooltip(formatStationName(leg.to), { direction: "top", offset: [0, -16] })
      )
    } else {
      stopIcons.push(null)       // the last leg has no icon (the 🍜 is there), but this keeps the numbering lined up
    }
  }

  if (allPoints.length === 0) {
    return
  }

  // green dot = where you start (first point)
  startMarker = L.marker(allPoints[0], { icon: makeIcon("", 25, "white", "#2f9e44") })
                  .addTo(map)
                  .bindTooltip("You start here", { direction: "top", offset: [0, -12]})

  //hawker centre: food icon (end point)
  const lastLeg = routeLegs.value[routeLegs.value.length - 1]
  endMarker = L.marker(allPoints[allPoints.length-1], { icon: makeIcon("🍜", 40, "#c8372d") })
                .addTo(map)
                .bindTooltip(lastLeg.to || "Your hawker centre", { direction: "top", offset: [0, -22] })

  // zoom so the whole route fits, with some breathing room
  routeBounds = L.latLngBounds(allPoints)
  map.fitBounds(routeBounds, { padding: [25, 25] })

  // re-check whenever the zoom changes
  map.on("zoomend", updateEndIcons)
}

const selectedLeg = ref(null)      // which step is highlighted (null = none)

const OVERLAP_PX = 35     // closer than this and the icons would overlap

// hide the green dot / food icon when a stop icon is shown right next to it
function updateEndIcons() {
  if (!map || !startMarker || !endMarker) {
    return
  }

  for (const marker of [startMarker, endMarker]) {
    const markerPoint = map.latLngToContainerPoint(marker.getLatLng())   // where it is on screen
    let crowded = false

    stopLayer.eachLayer(stop => {                                        // every stop icon currently shown
      const stopPoint = map.latLngToContainerPoint(stop.getLatLng())
      if (markerPoint.distanceTo(stopPoint) < OVERLAP_PX) {
        crowded = true
      }
    })

    if (crowded) {
      marker.remove()          // take it off the map
    } else {
      marker.addTo(map)        // put it back (does nothing if it's already there)
    }
  }
}

// show only the stop icons that belong to the selected step (none if no step is selected)
function showStopIcons(index) {
  stopLayer.clearLayers()          // takes every stop icon off the map (they still exist in stopIcons)

  if (index === null) {
    return
  }

  if (index > 0 && stopIcons[index - 1]) {
    stopLayer.addLayer(stopIcons[index - 1])     // where this step starts
  }
  if (index < routeLegs.value.length - 1 && stopIcons[index]) {
    stopLayer.addLayer(stopIcons[index])         // where this step ends
  }

  updateEndIcons()   // hide the green dot/food icon if a stop icon is right next to it
}

// restyle every line: the selected one bold, the others faded
function styleLines() {
  for (let i = 0; i < legLines.length; i++) {
    const isSelected = selectedLeg.value === i
    const nothingSelected = selectedLeg.value === null

    legLines[i].setStyle({
      weight: isSelected ? 9 : 7,
      opacity: (nothingSelected || isSelected) ? 1 : 0.5
    })

    if (isSelected) {
      legLines[i].bringToFront()
    }
  }

  showStopIcons(selectedLeg.value)
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
  <main class="bg-tiles">
  <div class="container py-4">
    <button class="btn mb-4" v-on:click="goBack()">
      ← Back to results
    </button>

    <h1 class="hh-display mb-2 d-flex justify-content-center">Journey Summary</h1>
    <p class="text-muted mb-4 d-flex justify-content-center">
      Choose how to get to your group's winning hawker centre. 
    </p>

    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border" role="status"></div>
      <p class="text-muted mt-3">Finding your route...</p>
    </div>

    <!-- travel mode toggles-->
    <div v-if="!isLoading" class="mb-4 d-flex justify-content-center">
      <button class="btn me-2" 
      v-on:click="changeRouteMode('pt')">Public Transport 🚌</button>
      <button class="btn" v-on:click="changeRouteMode('drive')">Driving 🚗 
      </button>
    </div>
    <div v-if="!isLoading && errorMessage && myRoute && myRoute.centre" class="card text-center alert alert-danger">
       <h2 class="hh-display h4 mb-3">
    {{ routeMode === 'pt' ? 'No public transport route found.' : 'Route unavailable' }}
      </h2>
      <a class="btn blue w-50 mx-auto mb-3" v-bind:href="`https://www.google.com/maps/dir/?api=1&destination=${myRoute.centre.lat},${myRoute.centre.lng}&travelmode=${routeMode === 'drive' ? 'driving' : 'transit'}`"
        target="_blank"
        rel="noopener"
      >
        Try opening in Google Maps ↗
      </a>
      <div class="card next-actions mt-4">
        <h3 class="next-title">Where to next?</h3>
        <p>Continue exploring Makan Plan.</p>

      <div class="next-buttons">
        <RouterLink class="btn" v-bind:to="`/centres/${myRoute.centre.serialNo}`">
          See live seats at the centre 🪑
        </RouterLink>
        <RouterLink class="btn red" to="/">
          Back to Homepage 🏡
        </RouterLink>
      </div>
    </div>
  </div>

    <template v-else-if="!isLoading && myRoute && !errorMessage">

      <!-- Journey summary -->
      <section class="card rounded-4 p-4 mb-4">
        <div class="row g-3">
          <div class="col-6">
            <p class="text-muted mb-1">Total travel time</p>
            <h2 class="hh-display h3 mb-0">
              {{ myRoute.totalMinutes }} min (est)
            </h2>
          </div>

          <div class="col-6" v-if="routeMode === 'pt' && myRoute.fare">
            <p class="text-muted mb-1">Public transport fare</p>
            <h2 class="hh-display h3 mb-0">
              ${{ myRoute.fare }} (est)
            </h2>
          </div>
        </div>
        <hr/>
        <p class="mb-0 text-muted" v-if="routeMode === 'pt'">
          {{ myRoute.transfers }} transfer(s)
        </p>
        <p v-if="myRoute.totalMinutes > 120" class="alert alert-warning mt-3 mb-0">
          NOTE: Long travelling time may be due to public transport running at this hour!
        </p>
      </section>

      <!-- Map -->
      <section class="card rounded-4 p-4 mb-4">
        <h2 class="hh-display h4 mb-3">Route map</h2>
        <div id="journey-map" class="journey-map rounded-3"></div>
        <p class="text-muted small mt-2 mb-0">Tap a step below to zoom in and see where it starts and ends.</p>
      </section>

      <!-- Step-by-step directions -->
      <section class="card rounded-4 p-4 mb-4">
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <h2 class="hh-display h4 mb-4">Directions</h2>
         <a v-if="myRoute.member && myRoute.centre" class="btn blue sm"
          v-bind:href="`https://www.google.com/maps/dir/?api=1&origin=${myRoute.member.lat},${myRoute.member.lng}&destination=${myRoute.centre.lat},${myRoute.centre.lng}&travelmode=driving`"
          target="_blank"
          rel="noopener"
        >
          Need additional help? Open in Google Maps ↗
        </a>
        </div>
        <div v-for="(leg, index) in routeLegs" v-bind:key="index" 
          class="d-flex gap-3 mb-4"
          v-bind:class="{'step-active' : selectedLeg === index }"
          v-on:click="selectLeg(index)">
          <div class="journey-icon rounded-circle d-flex
            align-items-center justify-content-center">
            <span v-if="leg.mode === 'WALK'">🚶</span>
            <span v-else-if="leg.mode === 'BUS'">🚌</span>
            <span v-else-if="leg.mode === 'DRIVE'">🚗</span>
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
            <template v-else-if="leg.mode === 'DRIVE'">
              Drive to your destination
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
      <div v-if="myRoute.centre" class="text-center d-flex justify-content-center gap-2 mt-4">
        <RouterLink class="btn me-2" v-bind:to="`/centres/${myRoute.centre.serialNo}`">
          See live seats at the centre 🪑
        </RouterLink>
        <RouterLink class="btn red" to="/plan/new">
          Start a new Makan Plan
        </RouterLink>
      </div>
    </template>
  </div>
</main>
</template>

<style scoped>

main {
  min-height: 100vh;
}
.journey-map {
  width: 100%;
  height: 380px;  /* Leaflet map needs a set height to appear */
  z-index: 0;   /* keeps map from floating over navbar when scrolling */
}

/* icon badges (need deep to reach the html made by Leaflet*/
.journey-map :deep(.map-icon) {
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 3px solid white;
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
}

/* hover labels (over the icons and the route lines): bigger text */
.journey-map :deep(.leaflet-tooltip) {
  font-size: 18px;      
  font-weight: 600;     /* bolder text */
}

.journey-map {
  width: 100%;
  height: 380px;  /* Leaflet map needs a set height to appear */
  z-index: 0;     /* keeps map from floating over navbar when scrolling */
  border: 3px solid var(--ink);
  border-radius: 12px;
  overflow: hidden;
}

.journey-step {
  cursor: pointer;
  padding: 12px;
  border-radius: 12px;
  border: 2px solid transparent;
}

.journey-step:hover {
  background: var(--cream);
}

.step-active {
  background: var(--cream);
  border-color: var(--tomato);
}

.journey-icon {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  background: var(--cream);
  font-size: 1.25rem;
  border: 3px solid var(--ink);
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

.next-actions {
  padding: 24px;
  text-align: center;
  background: var(--cream);     /* sets it apart from the white panels above */
}

.next-title {
  font-size: 24px;
  margin-bottom: 16px;
}

.next-buttons {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
}
</style>
