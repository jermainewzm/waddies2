<script setup>
import { ref, onMounted } from "vue"
import axios from "axios"
import { API_URL } from "@/utils/constants"
import { useRoute, useRouter } from "vue-router"

const route = useRoute()
const router = useRouter()

const code = route.params.code // req.query.code also can
const plan = ref(null)
const errorMessage = ref("")
const isLoading = ref(true)

const myId = localStorage.getItem(`memberId-${code}`)



</script>
<template>
  <div class="container py-5 text-center">
    <h1 class="display-5 fw-bold">Swipe to Match</h1>
    <p class="lead">Coming soon: this is where the swiping happens.</p>
  </div>
</template>