<script setup>
import { ref } from "vue"
import axios from "axios"
import { API_URL } from "@/utils/constants"

const name = ref("")
const date = ref("")
const time = ref("")
const code = ref("")
const errorMessage = ref("")

async function createPlan() {
  errorMessage.value = ""
  try {
    const response = await axios.post(`${API_URL}/plans`, {
      name: name.value,
      date: date.value,
      time: time.value
    })
    code.value = response.data.code
  } catch (error) {
    errorMessage.value = error.response
      ? error.response.data.error
      : "Can't reach the server."
  }
}
</script>

<template>
  <div class="container py-4" style="max-width: 480px">
    <h1 class="hh-display mb-4">Start a Makan Plan</h1>

    <form v-on:submit.prevent="createPlan">
      <div class="mb-3">
        <label for="name" class="form-label">Plan name</label>
        <input id="name" v-model="name" class="form-control" placeholder="e.g. Saturday lunch" />
      </div>
      <div class="mb-3">
        <label for="date" class="form-label">Date</label>
        <input id="date" v-model="date" type="date" class="form-control" />
      </div>
      <div class="mb-3">
        <label for="time" class="form-label">Time</label>
        <input id="time" v-model="time" type="time" class="form-control" />
      </div>
      <button type="submit" class="btn btn-hh-red w-100">Create plan</button>
    </form>

    <p v-if="errorMessage" class="text-danger mt-3">{{ errorMessage }}</p>

    <div v-if="code" class="alert alert-success mt-4">
      Share this code with your friends: <strong>{{ code }}</strong>
    </div>
  </div>
</template>