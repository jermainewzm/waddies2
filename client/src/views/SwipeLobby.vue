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
  <div v-if="!isLoading && plan" class="container py-5 text-center">
    <h1 class="display-5 fw-bold">{{ plan.name }}</h1>
    <p class="lead">Coming soon: this is where the swiping happens.</p>
    <p class="lead">Plan Code: {{ plan.code }}</p>
    <p>Members: {{ plan.members.length }}</p>
  </div>

  <p v-if="errorMessage" class="text-danger text-center">
      {{ errorMessage }}
    </p>
</template>