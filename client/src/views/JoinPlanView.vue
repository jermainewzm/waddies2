<script setup>
import { ref } from "vue"
import axios from "axios"
import { useRouter } from "vue-router"
import { API_URL } from "@/utils/constants"

const router = useRouter()

const code = ref("")
const errorMessage = ref("")

async function joinPlan() {
  errorMessage.value = ""

  if (code.value.trim().length !== 6) {
    errorMessage.value = "Please enter the 6-digit code."
    return
  }

  try {
    // check the plan exists (same GET the lobby uses)
    await axios.get(`${API_URL}/plans/${code.value.trim()}`)
    router.push(`/plan/${code.value.trim()}/lobby`)
  } catch (error) {
    if (error.response && error.response.data && error.response.data.error) {
      errorMessage.value = error.response.data.error
    } else {
      errorMessage.value = "Can't reach the server."
    }
  }
}
</script>

<template>
  <main class="bg-tiles">
  <div class="container py-4">

    <!-- page heading -->
    <div class="page-header text-center mb-4">
      <div class="heading-icon">🎟️</div>
      <h1 class="hh-display mb-2">Join a Makan Plan</h1>
      <p class="mb-0 text-muted fst-italic">Got a code from a friend? Pop it in below.</p>
    </div>

    <div class="row justify-content-center">
      <div class="col-12 col-lg-5">
        <div class="card join-plan-card">
          <h2 class="hh-display mb-2">Enter your code</h2>
          <p class="text-muted mb-4">Ask whoever created the plan for their 6-digit code.</p>

          <form v-on:submit.prevent="joinPlan">
            <div class="mb-3">
              <label for="code" class="form-label">Plan code</label>
              <input id="code" v-model="code" class="form-control code-input"
                     placeholder="123456" inputmode="numeric" maxlength="6" />
            </div>

            <button type="submit" class="btn red w-100">Join plan →</button>
          </form>

          <p v-if="errorMessage" class="text-danger mt-3">{{ errorMessage }}</p>
        </div>
      </div>
    </div>

  </div>
  </main>
</template>

<style scoped>

main {
  min-height: calc(100vh - 72px);   /* full screen minus the 72px header, so the page doesn't scroll for nothing */
}

.heading-icon {
  font-size: 36px;
  margin-bottom: 5px;
}

.page-header h1 {
  font-size: 34px;
}

.join-plan-card {
  background-color: white;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 6px 24px rgba(59, 42, 32, 0.08);
}

.join-plan-card h2 {
  font-size: 24px;
}

.form-label {
  font-weight: bold;
  margin-bottom: 8px;
}

.form-control {
  border-radius: 10px;
  padding: 12px 14px;
}

.form-control:focus {
  border-color: #6b8e5a;
  box-shadow: 0 0 0 3px rgba(107, 142, 90, 0.15);
}

.code-input {
  text-align: center;
  font-size: 28px;
  font-weight: bold;
  letter-spacing: 8px;
}

.join-button {
  border-radius: 10px;
  font-weight: bold;
}

.join-button:hover {
  background-color: #f8756b;
  color: white;
}

@media (max-width: 576px) {
  .heading-icon {
    font-size: 36px;
  }

  .page-header h1 {
    font-size: 32px;
  }

  .join-plan-card {
    padding: 20px;
  }

  .join-plan-card h2 {
    font-size: 22px;
  }
}
</style>
