<script setup>
import { ref, computed, onMounted} from "vue"
import axios from "axios"
import { API_URL } from "@/utils/constants"
import { useRoute } from "vue-router"

import L from 'leaflet' //import leaflet javascript code
import 'leaflet/dist/leaflet.css' //import leaflet css styling

const route = useRoute() //lets PlanLobby.vue access info about the route that brought the user here

const code = route.params.code
const plan = ref(null)
const errorMessage = ref("")

const name = ref("")
const diet = ref("any")
const budget = ref("")

const selectedLat = ref(null)
const selectedLng = ref(null)

async function loadPlan() {
    try {
        const response = await axios.get(`${API_URL}/plans/${code}`)
        plan.value = response.data
    } catch(error) {
        errorMessage.value = error.response ? error.response.data.error : 'Cant reach the server.'
    }
}

onMounted(() => {
    loadPlan()

    const map = L.map("map").setView([1.4382, 103.7891], 15) // tells Leaflet which HTML element to put the map inside

    //leaflet gets the map tiles from this URL from OpenStreetMap
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors"
    }).addTo(map)

    let pinnedOnce = null
    //Leaflet gives the function an object that contains lat and lng values
    map.on("click", function(clickInfo) {
        //create a pin at the location user clicked, then put the pin on the map
        if (pinnedOnce === null) {
        pinnedOnce = L.marker(clickInfo.latlng).addTo(map)
        } else {
            pinnedOnce.setLatLng(clickInfo.latlng)
            
    }
        selectedLat.value = clickInfo.latlng.lat
        selectedLng.value = clickInfo.latlng.lng
    })
})
</script>

<template>
    <div v-if="plan">
        <h1>{{ plan.name }}</h1>
        <p>{{ plan.date }}</p>
        <p>{{ plan.time }}</p>
        <p>Plan Code: {{ plan.code }}</p>

        <h2>Members</h2>
    <ul>
        <li v-for="member in plan.members" :key="member._id">
            {{ member.name }}
        </li>
    </ul>
    </div>

    <div id="map" style="height: 400px;"></div>

</template>