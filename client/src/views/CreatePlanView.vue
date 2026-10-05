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

function formatDate(date) {
  const dateObj = new Date(date)

  return dateObj.toLocaleDateString("en-SG", {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

function formatTime(time) {
  const [hours, minutes] = time.split(":")
  const period = hours >= 12 ? "PM" : "AM"
  const hour = hours % 12 || 12

  return `${hour}:${minutes} ${period}`
}
</script>

<template>
  <div class="container py-5">

    <!-- page heading -->
    <div class="page-header text-center mb-5">
        <div class="heading-icon">🍜</div>
        <h1 class="hh-display mb-2">Start a Makan Plan</h1>
        <p class="mb-0 text-muted fst-italic"> Get everyone together. We'll handle the makan. </p>
     </div>

     <div class="row justify-content-center align-items-start g-4">

     <div class="col-12 col-lg-6">
        <div class="create-plan-card">
          <div class="section-label"> 01</div>
          <h2 class="hh-display mb-2"> Set up your plan </h2>
          <p class="text-muted mb-4"> Give your makan session a name and choose when to meet.</p>

          <form v-on:submit.prevent="createPlan">
             <!-- makan plan name -->
            <div class="mb-3">
              <label for="name" class="form-label">Plan name</label>
              <input id="name" v-model="name" class="form-control" placeholder="e.g. Saturday lunch" />
            </div>

             <!-- date -->
            <div class="mb-3">
            <label for="date" class="form-label">Date</label>
            <input id="date" v-model="date" type="date" class="form-control" />
            </div>
             <!-- time -->
            <div class="mb-3">
              <label for="time" class="form-label">Time</label>
              <input id="time" v-model="time" type="time" class="form-control" />
            </div>

            <button type="submit" class="btn btn-hh-red w-100 create-button">Create plan →</button>
          </form>

        <p v-if="errorMessage" class="error-message mt-3">{{ errorMessage }}</p>

        <div v-if="code" class="alert alert-success mt-4">
          Share this code with your friends: <strong>{{ code }}</strong>
        </div>
      </div>
     </div>

     <!-- side preview-->
     <div class="col-12 col-lg-5">
        <div class="preview-plan-card">
           <div class="section-label">
            02
           </div>
           <h2 class="hh-display mb-2"> What your friends see </h2>
           <p class="text-muted mb-4"> This is what your plan will look like when they join.</p>

           <div class="plan-preview">

            <div class="plan-top">
              <div class="food-icon">🍜 </div>
            </div>
            <h3 class="plan-name mb-1">
              {{ name || 'Saturday lunch' }}
            </h3>
            <span class="plan-type">MAKAN PLAN</span>
       

        <div class="plan-details">
          <div class="plan-detail">
            <span class="detail-icon">📅 </span>
            <div>
              <small> Date </small>
              <strong>
                {{ date ? formatDate(date): 'Pick a date' }}
              </strong>
            </div>
          </div>

           <div class="plan-detail">
            <span class="detail-icon">🕐 </span>
            <div>
              <small> Time </small>
              <strong>
                {{ time ? formatTime(time) : 'Pick a time' }}
              </strong>
            </div>
          </div>
        </div>

        <div class="join-section text-center">
          <small class="text-muted fw-bold"> JOIN WITH CODE</small>
          <div v-if="code" class="join-code">
              {{ code }}
          </div>
          <div v-else class="text-muted fw-bold">
            Your 6 digit code will appear here
          </div>
        </div>
          </div>
          <div class="preview-tip">
            <span>💡</span>
            <p class="mb-0 fw-bold"> Share the code with your friends so they can join your plan! </p>
          </div>
        </div>
     </div>
     </div>
  </div>
</template>

<style scoped>

.heading-icon {
  font-size: 48px;
  margin-bottom: 5px;
}

.food-icon {
  font-size: 30px;
  margin-bottom:4px;
}

.plan-name {
  font-size: 24px;
  font-weight: bold;
  margin-top: 5px;
}

.page-header h1{
  font-size: 42px;
}

.create-plan-card, .preview-plan-card {
  background-color: white;
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 6px 24px rgba(59, 42, 32, 0.08);
}

.plan-preview {
  background-color: white;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid #e5e5e5;
  text-align: center;
}

.section-label {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--hh-steel);
  color: var(--hh-kopi);
  font-size: 12px;
  font-weight: bold;
  display: flex;
  justify-content: center;
  align-items: center;

}

.plan-type {
  font-size: 11px;
  font-weight: bold;
  letter-spacing: 1px;
  color: var(--hh-red)
}

.create-plan-card h2 {
  font-size: 28px;
}

.create-button {
  border-radius: 10px;
  font-weight: bold;

}

.create-button:hover {
  background-color: #f8756b;
  color:white;
  
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

.plan-details {
  margin-top: 24px;
  background-color: var(--hh-steel);
  border-radius: 12px;
  padding: 18px 20px;
 
}

.plan-detail {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;

}

.plan-detail:last-child {
  margin-bottom: 0px;
}

.join-section small {
  display: block;
  font-size: 13px;
  letter-spacing: 2px;
  margin-bottom: 8px;
  margin-top: 8px;
}

.preview-tip {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 16px;
  padding: 12px 14px;
  background-color: var(--hh-steel);
  border-radius: 10px;
  font-size: 13px;
 
}

</style>