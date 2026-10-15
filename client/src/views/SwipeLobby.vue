<script setup>
import { ref, computed, onMounted, onUnmounted} from "vue"
import axios from "axios"
import { API_URL } from "@/utils/constants"
import { useRoute, useRouter } from "vue-router"

const route = useRoute()
const router = useRouter()

const code = route.params.code // req.query.code also can
const myId = localStorage.getItem(`memberId-${code}`)

const plan = ref(null)
const errorMessage = ref("")
const isLoading = ref(true)
const isSending = ref(false)
const cards = ref([])         //centres to swipe on with personalised info
const currentIndex = ref(0)   //which card person is on
const answers = ref([])       //the person's swipes so far: [{centreId, liked}]

let refreshTimer = null

//card on top of the pile (null once all swiped)
const currentCard = computed(() => cards.value[currentIndex.value] || null)

//person finished swiping? 
const finished = computed(() => {
  return plan.value !== null && plan.value.finishedIds.includes(String(myId))
})

//winning centre (only when all done swiping and atleast one like)
const winner = computed(() => {
  if (!plan.value || !plan.value.winner || !plan.value.results) {
    return null
  }
  return plan.value.results.find(r => String(r.centreId) === String(plan.value.winner))
})

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
    if (plan.value.status === 'joining') {
      router.push(`/plan/${code}`)
      return 
    }

    //stop checking for updates once all done
    if (plan.value.status === "done") {
      clearInterval(refreshTimer)
    }
  } catch(error) {
    errorMessage.value = error.response ? error.response.data.error : "Can't reach the server."
  }
}

async function loadCards() {
  try {
    const response = await axios.get(`${API_URL}/plans/${code}/cards`, {
      params: { memberId: myId }
    })
    cards.value = response.data.cards
  } catch(error) {
    errorMessage.value = error.response ? error.response.data.error : "Can't reach the server."
  }
}

async function submitSwipes() {
  errorMessage.value = ""
  isSending.value = true

  try {
    await axios.post(`${API_URL}/plans/${code}/swipes`, {
      memberId: myId,
      swipes: answers.value
    })
    await loadPlan()  //refresh so waiting screen (or results if everyone is done) shows
  } catch(error) {
    errorMessage.value = error.response ? error.response.data.error : "Can't reach the server."
  } finally {
    isSending.value = false
  }
}

//called by the skip or i'm in buttons (liked -> boolean (false/true))
function answer(liked) {
  answers.value.push({centreId: currentCard.value.centreId, liked: liked})
  currentIndex.value++ 

  //after last card, send everything to server
  if (currentIndex.value >= cards.value.length) {
    submitSwipes()
  }
}

//shown only if something went wrong
function retry() {
  errorMessage.value = ""
  if (cards.value.length === 0) {
    loadCards()
  } else {
    submitSwipes()
  }
}

function crowdClass(level) {
  if (level === "plenty") return "crowd-plenty"
  if (level === "few") return "crowd-few"
  if (level === "full") return "crowd-full"
  return "crowd-none"
}

function dishText(stall) {
  return stall.dishes
    .slice(0,2)
    .map(dish => `${dish.name} ($${dish.price.toFixed(2)})`)
    .join(", ")
}

//for the drag to swipe
const dragX = ref(0)            // how far the card is dragged sideways, in px
const isDragging = ref(false)
let startX = 0

function onPointerDown(event) {
  isDragging.value = true
  startX = event.clientX
  // keep receiving move events even if the pointer leaves the card
  event.currentTarget.setPointerCapture(event.pointerId)
}

function onPointerMove(event) {
  if (!isDragging.value) {
    return
  }
  dragX.value = event.clientX - startX
}

function onPointerUp() {
  if (!isDragging.value) {
    return
  }
  isDragging.value = false

  const distance = dragX.value
  dragX.value = 0               // the card slides back to the middle

  // dragged far enough? then count it as a swipe
  if (distance > 100) {
    answer(true)                // right = I'm in
  } else if (distance < -100) {
    answer(false)               // left = skip
  }
}

onMounted(async () => {
    await loadPlan()

    //only fetch cards if swiping status
    if (plan.value && plan.value.status === "swiping" && !finished.value) {
      await loadCards()
    }
    isLoading.value = false

    //keep checking, so waiting screen will update as friends finish
    refreshTimer = setInterval(loadPlan, 5000)
})

onUnmounted(() => {
  clearInterval(refreshTimer)
})
</script>

<template>
  <div class="container py-4 swipe-page">

    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border" role="status"></div>
    </div>

    <p v-else-if="!plan" class="text-danger text-center">{{ errorMessage }}</p>

    <template v-else>
      <div class="text-center mb-4">
        <p class="section-kicker mb-1">SWIPE TO MATCH</p>
        <h1 class="hh-display">{{ plan.name }}</h1>
      </div>

      <!-- 1. RESULTS: everyone has finished -->
      <div v-if="plan.status === 'done'">
        <h2 class="hh-display h4 text-center mb-3">
          {{ winner ? "You're all heading to..." : "No match this time" }}
        </h2>

        <div v-if="winner" class="swipe-card text-center mb-4">
          <img v-if="winner.photoUrl" :src="winner.photoUrl" :alt="winner.name" class="card-photo" />
          <div class="p-4">
            <h2 class="hh-display">{{ winner.name }}</h2>
            <p class="text-muted">{{ winner.address }}</p>
            <p class="mb-0">
              <strong>{{ winner.likes }} of {{ plan.members.length }}</strong> said yes
            </p>
          </div>
        </div>
        <p v-else class="text-center text-muted">
          Nobody liked any of the centres. Try a new plan with different choices.
        </p>
        <button v-if="winner" v-on:click="router.push(`/plan/${code}/journey`)"class="btn btn-hh-red w-100 mb-4"> Take me there!</button>
        <h3 class="h6 fw-bold mb-2">All centres</h3>
        <div v-for="result in plan.results" :key="result.centreId"
             class="result-row d-flex justify-content-between">
          <span class="fw-bold">{{ result.name }}</span>
          <span class="text-muted">{{ result.likes }} yes · {{ result.totalDist }} km total</span>
        </div>
      </div>

      <!-- 2. WAITING: I've swiped, others haven't -->
      <div v-else-if="finished || isSending" class="swipe-card text-center p-4">
        <h2 class="hh-display">{{ isSending ? "Sending your swipes..." : "You're done!" }}</h2>
        <p class="text-muted">
          Waiting for everyone ({{ plan.finishedIds.length }} of {{ plan.members.length }} finished)
        </p>
        <ul class="list-unstyled mb-0">
          <li v-for="member in plan.members" :key="member._id">
            <strong>{{ member.name }}</strong>
            <span class="text-muted">
              · {{ plan.finishedIds.includes(member._id) ? "✓ done" : "still swiping" }}
            </span>
          </li>
        </ul>
      </div>

      <!-- 3. SWIPING: the current card -->
      <div v-else-if="currentCard">
        <p class="text-center text-muted">Centre {{ currentIndex + 1 }} of {{ cards.length }}</p>

        <div class="swipe-card draggable-card"
            :style="{
              transform: `translateX(${dragX}px) rotate(${dragX / 20}deg)`,
              transition: isDragging ? 'none' : 'transform 0.2s'
            }"
            v-on:pointerdown="onPointerDown"
            v-on:pointermove="onPointerMove"
            v-on:pointerup="onPointerUp"
            v-on:pointercancel="onPointerUp">

          <span v-if="dragX > 40" class="stamp stamp-yes">I'M IN</span>
          <span v-if="dragX < -40" class="stamp stamp-no">SKIP</span>
          <img v-if="currentCard.photoUrl" :src="currentCard.photoUrl" :alt="currentCard.name" class="card-photo" draggable="false"/>

          <div class="p-4">
            <div class="d-flex justify-content-between align-items-start gap-2">
              <h2 class="hh-display h3 mb-1">{{ currentCard.name }}</h2>
              <span class="info-pill" :class="crowdClass(currentCard.crowd.level)">
                {{ currentCard.crowd.label }}
              </span>
            </div>

            <p class="text-muted small">{{ currentCard.address }}</p>
            <p><strong>{{ currentCard.distanceKm }} km</strong> from your pin</p>

            <h3 class="h6 fw-bold">Stalls that suit you</h3>
            <p v-if="currentCard.stalls.length === 0" class="small text-muted mb-0">
              No stalls here match your diet and budget.
            </p>
            <div v-for="(stall, index) in currentCard.stalls.slice(0, 3)" :key="index" class="small mb-1">
              <strong>{{ stall.name }}</strong>
              <span class="text-muted"> · {{ dishText(stall) }}</span>
            </div>
          </div>
        </div>

        <div class="d-flex gap-3 mt-4">
          <button type="button" class="btn btn-outline-dark w-50 fw-bold" v-on:click="answer(false)">Skip</button>
          <button type="button" class="btn btn-hh-red w-50 fw-bold" v-on:click="answer(true)">I'm in</button>
        </div>
      </div>

      <!-- 4. Something went wrong -->
      <div v-else class="swipe-card text-center p-4">
        <p class="text-danger">{{ errorMessage || "Something went wrong." }}</p>
        <button type="button" class="btn btn-hh-red" v-on:click="retry()">Try again</button>
      </div>
    </template>

  </div>
</template>

<style scoped>
.swipe-page {
  max-width: 560px;
}

.section-kicker {
  color: var(--hh-red);
  font-weight: 800;
  letter-spacing: 0.12em;
  font-size: 0.8rem;
}

.swipe-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 6px 24px rgba(59, 42, 32, 0.08);
}

.card-photo {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.info-pill {
  display: inline-block;
  border-radius: 999px;
  padding: 0.35rem 0.65rem;
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
}

.crowd-plenty { background: #ccebd8; color: #17603a; }
.crowd-few { background: #fff0b8; color: #705500; }
.crowd-full { background: #f7ceca; color: #8f211c; }
.crowd-none { background: #e8e8e8; color: #666; }

.result-row {
  background: white;
  border-radius: 12px;
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;
}

.draggable-card {
  position: relative;
  touch-action: pan-y;     /* up/down still scrolls the page; sideways goes to our code */
  user-select: none;
  cursor: grab;
}

.stamp {
  position: absolute;
  top: 16px;
  z-index: 1;
  background: white;
  border: 3px solid;
  border-radius: 8px;
  padding: 4px 12px;
  font-weight: 900;
}
.stamp-yes { left: 16px; color: #17603a; }
.stamp-no { right: 16px; color: #8f211c; }
</style>