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

//check if the person is a member of the plan 
async function loadPlan() {
  try {
    const response = await axios.get(`${API_URL}/plans/${code}`)
    plan.value = response.data
    console.log("Shortlist:", plan.value.shortlist)
    let isMember = false

    for (let member of plan.value.members) {
      if (String(member._id) === String(myId)) {
        isMember = true
        break
      }
    }
    //guardrail for a person who types in /plan/:code/swipe manually
    if (!isMember) {
      router.push(`/plan/${code}`)
      return
    }

    //guardrail for members who try to access the swipe page before the host presses swipe
    if (plan.value.status !== 'swiping') {
      router.push(`/plan/${code}`)
      return 
    }
    isLoading.value = false;
  } catch(error) {
    isLoading.value = false
    errorMessage.value = error.response ? error.response.data.error : "Cant reach the server."
  }
}

onMounted(() => {
    loadPlan()
})

</script>
<template>

<!-- placeholder code, no swiping implemented yet. -->
  <div v-if="!isLoading && plan" class="container py-5 text-center"> 
<h1 class="display-5 fw-bold">{{ plan.name }}</h1>

<p class="lead">Plan Code: {{ plan.code }}</p>
<p>Members: {{ plan.members.length }}</p>

<h2 class="mt-4 mb-3">Choose your hawker centres</h2>

<div class="row g-3">
  <div
    v-for="item in plan.shortlist"
    :key="item._id"
    class="col-12 col-md-6 col-lg-4"
  >
    <div class="card h-100 shadow-sm">
      <img
        v-if="item.centre_id && item.centre_id.photoUrl"
        :src="item.centre_id.photoUrl"
        class="card-img-top"
        :alt="item.centre_id.name"
        style="height: 200px; object-fit: cover;"
      >

      <div class="card-body">
        <h5 class="card-title">
          {{ item.centre_id?.name || "Unknown centre" }}
        </h5>

        <p class="card-text">
          {{ item.centre_id?.address || "Address unavailable" }}
        </p>

        <p class="text-muted mb-0">
          {{ item.centre_id?.foodStalls ?? "N/A" }} food stalls
        </p>
      </div>
    </div>
  </div>
</div>

<p v-if="plan.shortlist.length === 0" class="text-muted mt-3">
  No hawker centres have been shortlisted yet.
</p>
  </div>
</template>