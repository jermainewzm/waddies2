<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()

function createPlan() {
  router.push("/plan/new")
}

function joinPlan() {
  router.push("/plan/join")
}

function hawkerDashboard() {
  router.push("/hawker/dashboard")
}

// How it works
const steps = [
  { title: "Share a plan", text: "Friends add where they're coming from, their diet and budget." },
  { title: "Swipe in private", text: "Nobody sees the votes until everyone's done." },
  { title: "Makan!", text: "The centre with the most yeses wins, and everyone gets a route there." }
]
</script>

<template>
  <main class="container py-4">
    <div class="top-banner p-4 p-md-5 mb-4 rounded-3">
      <div class="row align-items-center g-5">
        <div class="col-12 col-lg-7">
          <h1 class="display-1 fw-bold">
            Makan where <span class="keyword">ah?</span>
          </h1>
          <p class="fs-2 fw-bold tagline"> Leave the decision to us.
          </p>
          <p class="lead mb-4">HawkerHop picks a hawker centre that's open, suits everyone's preferences and budget, and isn't packed.</p>
          <div class="d-grid d-sm-flex gap-3">
            <button type="button" class="btn btn-lg btn-cream" v-on:click="createPlan()">Start a Makan Plan!</button>
            <button type="button" class="btn btn-lg btn-outline-cream" v-on:click="joinPlan()">Join plan with a code</button>
          </div>
        </div>
        <div class="col-12 col-lg-5">
          <div class="deck">
             <div class="back-card back-card-far"></div>
             <div class="back-card back-card-near"></div>

             <div class="card front-card">
              <div class="card-header front-top">
                 <h2 class="h3 fw-bold mb-0">Maxwell Food Centre</h2>
              </div>
              <div class="card-body">
                <span class="badge rounded-pill bg-success me-1">OPEN</span>
                <span class="badge rounded-pill bg-warning text-dark">Few seats</span>
                <p class="small text-muted mt-3 mb-0">Your trip</p>
                <p class="display-6 fw-bold mb-1">21 min</p>
                <p class="mb-3">Bus 174, $1.28</p>
                <div class="d-flex gap-2">
                  <span class="btn btn-outline-dark w-50 fw-bold">Skip</span>
                  <span class="btn btn-orange w-50">I'm in</span>
                </div>
              </div>
             </div>
          </div>
        </div>

      </div>
    </div>

      <h2 class="display-5 fw-bold mb-4">How it works</h2>
      <div class="row g-4 mb-5">
          <div v-for="(step,index) in steps" :key="step.title" class="col-12 col-md-4">
            <div class="card h-100 p-4 step-card">
              <p class="step-number mb-2">{{ index + 1 }}</p>
              <h3 class="h4 fw-bold">{{ step.title }}</h3>
              <p class="text-muted mb-0">{{ step.text }}</p>
            </div>
          </div>
      </div>

      <div class="hawker-box p-4 p-md-5 rounded-3">
        <div class="row align-items-center g-4">
          <div class="col-12 col-lg-8">
            <h2 class="display-5 fw-bold"> Run a stall? </h2>
            <p class="lead mb-0"> Tell regulars you're open, sold out or closing early, in one tap. </p>
          </div>
          <div class="col-12 col-lg-4 d-grid d-lg-block text-lg-end">
          <button type="button" class="btn btn-lg btn-orange" v-on:click="hawkerDashboard()">Go to Hawker Dashboard</button>
          </div>
        </div>
      </div>

  </main>
</template>

<style scoped>


.top-banner {
  background-color: #c4521f;
  color: #fff4e3;
}

.keyword {
  background-color: #fff4e3;
  color: #c4521f;
  border: 4px solid #3b2a20;
  border-radius: 12px;
  padding-top: 0px;
  padding-bottom: 0px;
  padding-left: 12px;
  padding-right: 12px;
}

.tagline {
  color: #fce5b0;
}

.btn-cream {
  background-color: #fff4e3;
  color: #3b2a20;
  font-weight: bold;
}

.btn-cream:hover {
  background-color: #ffd166;
  color: #3b2a20;
}

.btn-outline-cream {
  border: 2px solid #fff4e3;
  color: #fff4e3;
  font-weight: bold;
}

.btn-outline-cream:hover {
  background-color: #fff4e3;
  color: #3b2a20;
}

.deck {
  position: relative;
  max-width: 380px;
  margin: auto;
  padding-top: 0px;
  padding-right: 24px;
  padding-bottom: 24px;
  padding-left: 0px;
}

.front-card {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  color: #3b2a20;
}

.back-card {
  position: absolute;
  border-radius: 20px;
}

.front-top {
  background-color: #503524;
  color: #fff4e3;
}

.back-card-near {
  top: 12px;
  left: 12px;
  right: 12px;
  bottom: 12px;
  background-color: #ffe2a3;
}

.back-card-far {
  top: 24px;
  left: 24px;
  right: 0px;
  bottom: 0px;
  background-color: #c7a08a;
}

.btn-orange {
  background-color: #c4521f;
  color: #fff4e3;
  font-weight: bold;
}

.step-card {
  border-color: rgb(255, 0, 0);
  border-radius: 20px;
}
 
.step-number {
  font-size: 32px;
  font-weight: bold;
  color: #c4521f;
  line-height: 1;
}

.step-card:hover {
  background-color: #fff4e3;
}

.hawker-box {
  background-color: white;
}
</style>