<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'   // CHANGED: added computed + onMounted + onUnmounted + nextTick
import { useRoute, RouterLink } from 'vue-router' // NEW: to read ?plan= from the URL
import axios from 'axios'
import { API_URL } from '@/utils/constants'

import DishSearchForm from '../components/DishSearchForm.vue'
import DishSearchResults from '../components/DishSearchResults.vue'
import StallMenu from '../components/StallMenu.vue'

const MAX_PICKS = 10  // CHANGED: was MAX_SHORTLIST = 5. Each Makan Plan can pick up to 10 centres (same limit as plan-controller)
const SWIPE_CARDS = 5 // NEW: when swiping starts, the best 5 picks/centres become the swipe cards

// NEW: Dish Search belongs to ONE Makan Plan.
// PlanLobby opens it as /dish-search?plan=123456, so we read the code from the URL (no more typing it)
const route = useRoute()
const planCode = String(route.query.plan || '')

// NEW: PlanLobby saves my member _id in localStorage after I join, e.g. "memberId-123456"
const memberId = planCode ? localStorage.getItem(`memberId-${planCode}`) : null

// NEW: the plan (loaded when the page opens, then every 5 seconds)
const plan = ref(null)
const planChecked = ref(false)   // true once we've tried to load the plan
const planLoadError = ref('')

// search results
const results = ref([])
const loading = ref(false)
const errorMessage = ref('')
const hasSearched = ref(false)

// stall menu (null = not showing)
const selectedMenu = ref(null)
const menuError = ref('')

// add to shortlist
// REMOVED: planCentreId, planCode ref, planLoading, addedCentres ref (the plan code form is gone)
const addingCentreId = ref('')   // NEW: which centre is being added right now ('' = none)
const planError = ref('')

let refreshTimer = null // NEW: reloads the plan every 5 seconds (same as PlanLobby / SwipeLobby)

// ---------- NEW: worked out from the plan ----------

// me = my member object in this plan (null if I haven't joined on this browser)
const me = computed(() => {
    if (!plan.value || !memberId) {
        return null
    }
    return plan.value.members.find(member => String(member._id) === String(memberId)) || null
})


// NEW: the middle point of everyone who has joined (average of their pins)
// same idea as getMidPoint in shortlist-helper.js, which the server uses to pick the best 5
const groupMidpoint = computed(() => {
    if (!plan.value || plan.value.members.length === 0) {
        return null
    }
    let totalLat = 0
    let totalLng = 0
    for (const member of plan.value.members) {
        totalLat += member.lat
        totalLng += member.lng
    }
    return {
        lat: totalLat / plan.value.members.length,
        lng: totalLng / plan.value.members.length
    }
})


// centre _ids already on the plan's shortlist
// (GET /plans/:code fills in shortlist.centre_id with the whole centre, so we take its _id)
const addedCentres = computed(() => {
    if (!plan.value) {
        return []
    }
    return plan.value.shortlist.map(item => String(item.centre_id && item.centre_id._id ? item.centre_id._id : item.centre_id))
})

// why the "Add to shortlist" button is hidden ('' = I can add)
const cannotAddReason = computed(() => {
    if (!me.value) {
        return 'Join the plan to add centres'
    }
    if (plan.value.status !== 'joining') {
        return 'Swiping has started, shortlist is locked'
    }
    if (addedCentres.value.length >= MAX_PICKS) {
        return `Your group has picked ${MAX_PICKS} centres (max)`   // CHANGED: was "Shortlist is full (5 centres)"
    }
    return ''
})

// NEW: how many picks the group has left (never below 0)
const picksLeft = computed(() => Math.max(MAX_PICKS - addedCentres.value.length, 0))

// NEW (styling): friendly date, eg. "Fri, 30 Oct" instead of "2026-10-30"
const friendlyDate = computed(() => {
    if (!plan.value) {
        return ''
    }
    return new Date(`${plan.value.date}T00:00:00+08:00`).toLocaleDateString('en-SG', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        timeZone: 'Asia/Singapore'
    })
})

// ---------- API calls ----------

// NEW: gets the plan (name, date, status, members, shortlist)
async function loadPlan() {
    try {
        const response = await axios.get(`${API_URL}/plans/${planCode}`)
        plan.value = response.data
    } catch (error) {
        // CHANGED: only show the error page if the plan never loaded.
        // If a 5-second refresh fails (eg. bad wifi), keep showing the plan we already have
        if (!plan.value) {
            planLoadError.value = error.response ? error.response.data.error : "Can't reach the server."
        }
    } finally {
        planChecked.value = true
    }
}

// runs when DishSearchForm emits 'search'
// search = { q, diet, maxPrice }
async function searchDishes(search) {
    loading.value = true
    errorMessage.value = ''
    menuError.value = ''   // NEW: clear an old "couldn't load menu" message
    selectedMenu.value = null
    // REMOVED: planCentreId.value = null

    const params = {
        q: search.q,
        diet: search.diet,
        date: plan.value.date   // NEW: only show stalls open on the PLAN's day, not just today
    }

    // only send maxPrice if something was typed
    if (search.maxPrice !== '' && search.maxPrice !== null) { // CHANGED: also checks null
        params.maxPrice = search.maxPrice
    }

    try {
        const response = await axios.get(`${API_URL}/dishes/search`, { params })
        results.value = response.data.results
    } catch (error) {
        errorMessage.value = error.response ? error.response.data.error : "Can't reach the server."
        results.value = [] // so old results don't stay on screen
    } finally {
        loading.value = false
        hasSearched.value = true
    }
}

// runs when a stall name is clicked
async function viewMenu(stall) {
    menuError.value = ''

    try {
        const response = await axios.get(`${API_URL}/dishes/stalls/${stall.stall_id}/menu`, {
            params: { date: plan.value.date } // NEW: "open" matches the plan's day
        })
                selectedMenu.value = response.data

        // CHANGED: was window.scrollTo(0, 0), which jumped to the TOP so you couldn't see the menu.
        // nextTick = wait for Vue to show the menu on the page, THEN scroll down to it
        await nextTick()
        document.getElementById('stall-menu').scrollIntoView({ behavior: 'smooth' })
    } catch (error) {
        menuError.value = error.response ? error.response.data.error : "Can't reach the server."
    }
}

function closeMenu() {
    selectedMenu.value = null
    menuError.value = ''   // NEW: clear an old "couldn't load menu" message
}

// REMOVED: openPlanForm() and cancelPlan() (no plan code form any more)

// CHANGED: was addToPlan(data) with a typed plan code. Now uses the plan from the URL
// runs when "Add to shortlist" is clicked on a centre
async function addToPlan(centre) {
    planError.value = ''
    addingCentreId.value = String(centre.centre_id)

    try {
        await axios.post(`${API_URL}/plans/${planCode}/shortlist`, {
            centre_id: centre.centre_id,   // CHANGED: now the centre's real _id (the search API sends it)
            added_by: me.value.name,       // CHANGED: my name from the plan (no more "Your name" box)
            member_id: memberId
        })
        await loadPlan() // NEW: reload so the shortlist ("Added to shortlist") is up to date
    } catch (error) {
        planError.value = error.response ? error.response.data.error : "Can't reach the server."
    } finally {
        addingCentreId.value = ''
    }
}

// CHANGED: load the plan when the page opens, then every 5 seconds
// so centres added by OTHER members show up without refreshing
onMounted(() => {
    if (planCode) {
        loadPlan()
        refreshTimer = setInterval(loadPlan, 5000)
    } else {
        planChecked.value = true
    }
})

// NEW: stop the timer when leaving the page (otherwise it keeps calling the API in the background)
onUnmounted(() => {
    clearInterval(refreshTimer)
})
</script>

<template>
    <div class="container">

        <!-- NEW 1. no plan code in the URL: Dish Search only works inside a plan -->
        <div v-if="planChecked && !planCode">
            <h1>Dish Search is part of your Makan Plan</h1>
            <p>Open your plan's lobby and click "Search dishes", so the centres you pick go onto that plan's shortlist.</p>
            <RouterLink to="/plan/join">Join a plan</RouterLink> |
            <RouterLink to="/plan/new">Start a plan</RouterLink>
        </div>

        <!-- NEW 2. the plan couldn't be loaded -->
        <div v-else-if="planChecked && planLoadError">
            <p>{{ planLoadError }}</p>
            <RouterLink to="/plan/join">Join a plan</RouterLink>
        </div>

        <!-- 3. the real page -->
        <template v-else-if="plan">

            <!-- CHANGED (styling): back link is now a theme button (main.css .btn, no underline) -->
            <RouterLink :to="`/plan/${planCode}/lobby`" class="btn sm back-btn" data-testid="back-to-lobby">
                ← Back to lobby
            </RouterLink>

            <!-- CHANGED (styling): outlined cartoon title (main.css .outline) -->
            <h1 class="outline find-title">Find a dish</h1>

            <!-- CHANGED (styling): plan info as friendly badges instead of one long sentence -->
            <div class="plan-strip">
                <span class="plan-chip">
                    <small>Plan</small>
                    <strong>{{ plan.name }}</strong>
                </span>
                <span class="plan-chip">
                    <small>Date</small>
                    <strong>{{ friendlyDate }}</strong>
                </span>
                <span class="plan-chip code-chip">
                    <small>Code</small>
                    <strong>{{ planCode }}</strong>
                </span>
                <!-- CHANGED: group picks out of 10 (was shortlist out of 5) -->
                <span class="plan-chip" :class="{ 'chip-warn': picksLeft <= 2 }">
                    <small>Group picks</small>
                    <!-- NEW: 10 dots, one turns green for each centre added -->
                    <span class="dots">
                        <i
                            v-for="n in MAX_PICKS"
                            :key="n"
                            :class="{ filled: n <= addedCentres.length }"
                        ></i>
                    </span>
                    <strong>{{ addedCentres.length }}/{{ MAX_PICKS }}</strong>
                </span>
            </div>

            <!-- NEW: tells everyone about the limit BEFORE they add, so one person doesn't use up all 10 -->
            <div class="picks-note" :class="{ warn: picksLeft <= 2 }">
                <span class="note-icon">🎯</span>
                <p>
                    <b>Your whole group shares {{ MAX_PICKS }} picks</b>
                    <span v-if="picksLeft > 0"> · {{ picksLeft }} left</span>
                    <span v-else> · all used up!</span>
                    <br>
                    Pick your favourite 1–2 so everyone gets a turn. When swiping starts, we'll choose the best {{ SWIPE_CARDS }} for everyone.
                </p>
            </div>

            <!-- CHANGED: now passes loading (it was missing) and my plan diet + budget as starting filters -->
            <DishSearchForm
                :loading="loading"
                :initial-diet="me ? me.diet : 'any'"
                :initial-max-price="me ? me.budget : ''"
                @search="searchDishes"
            />

            <p v-if="menuError">
                {{ menuError }}
            </p>

            <StallMenu
                v-if="selectedMenu"
                :menu="selectedMenu"
                @close="closeMenu"
            />

            <!-- CHANGED: new shortlist props + one 'add-to-plan' event (no more plan code form events) -->
            <!-- NEW (styling): date-label shows the plan date in the results bubble -->
            <DishSearchResults
                :results="results"
                :loading="loading"
                :error-message="errorMessage"
                :has-searched="hasSearched"
                :date-label="friendlyDate"
                :midpoint="groupMidpoint"
                :added-centres="addedCentres"
                :can-add="cannotAddReason === ''"
                :cannot-add-reason="cannotAddReason"
                :adding-centre-id="addingCentreId"
                :plan-error="planError"
                @view-menu="viewMenu"
                @add-to-plan="addToPlan"
            />
        </template>

        <!-- NEW: still loading the plan -->
        <p v-else>Loading your plan...</p>

    </div>
</template>


<!-- Notes -->

<!-- this page holds all the data and does every axios call -->
<!-- NEW plan:   the code comes from the URL (?plan=123456, set by PlanLobby), my member id from localStorage -->
<!-- NEW refresh: the plan reloads every 5 seconds, so centres other members add show up here too -->
<!-- CHANGED picks: each plan can pick up to 10 centres. The server chooses the best 5 (pickBestCentres) when swiping starts -->
<!-- search:     form emits 'search' -> searchDishes() (CHANGED: sends the plan's date) -> results go DOWN to DishSearchResults -->
<!-- menu:       stall name emits 'view-menu' -> viewMenu() -> menu goes DOWN to StallMenu -->
<!-- CHANGED add: 'add-to-plan' -> addToPlan() -> POST /plans/:code/shortlist with centre_id, added_by, member_id -->
<!-- NEW styling: colours are main.css variables (--paper, --cream, --ink, --pandan, --muted) -->


<!-- NEW (styling): "scoped" = these styles only affect this page -->
<style scoped>
/* space around the back button */
.back-btn {
    margin-top: 16px;
    margin-bottom: 12px;
}

/* big outlined white title, smaller on phones */
.find-title {
    color: var(--paper);
    font-size: clamp(40px, 7vw, 64px);
    margin-bottom: 14px;
}

/* row of badges, wraps onto the next line on phones */
.plan-strip {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 20px;
}

/* one white badge with a thick outline + shadow */
.plan-chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    background: var(--paper);
    border: 3px solid var(--ink);
    border-radius: 14px;
    box-shadow: 3px 3px 0 var(--ink);
}

/* small grey label, eg. "PLAN" */
.plan-chip small {
    font-size: 12px;
    font-weight: 800;
    letter-spacing: .08em;
    text-transform: uppercase;
    color: var(--muted);
}

/* the code badge looks like a ticket */
.code-chip {
    border-style: dashed;
    background: var(--cream);
}

.code-chip strong {
    letter-spacing: 2px;
}

/* NEW: group picks dots (10 small ones) */
.dots {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 3px;
}

.dots i {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 2px solid var(--ink);
    background: var(--paper);
}

/* green = a centre has been picked */
.dots i.filled {
    background: var(--pandan);
}

/* NEW: badge turns cream-orange when only 2 or fewer picks are left */
.chip-warn {
    background: #FFE3C2;
}

/* NEW: "your group shares 10 picks" note */
.picks-note {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
    padding: 10px 16px;
    background: var(--cream);
    border: 3px dashed var(--ink);
    border-radius: 16px;
}

.picks-note p {
    margin: 0;
    font-size: 16px;
}

.note-icon {
    font-size: 28px;
}

/* almost out of picks: stronger colour so people notice */
.picks-note.warn {
    background: #FFE3C2;
    border-style: solid;
}
</style>