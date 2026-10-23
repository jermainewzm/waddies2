<script setup>
// NEW FILE (Centre Search): replaces DishSearch.vue
// Pick a centre (dropdown or a Suggested button), see its stalls + dishes, filter by dish / price / diet,
// then add it to the group's picks (up to 10). When swiping starts, the best 5 picks become swipe cards.
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import axios from 'axios'
import { API_URL } from '@/utils/constants'

import CentreMenu from '../components/CentreMenu.vue'

const MAX_PICKS = 10        // same limit as plan-controller.js
const SWIPE_CARDS = 5       // when swiping starts, the best 5 picks become swipe cards
const SUGGESTED_COUNT = 5   // how many nearest centres to suggest
const MAX_PRICE_LIMIT = 100 // same cap as a plan budget

// same diet rules as canMemberEat in shortlist-helper.js (e.g. "no pork" also accepts halal and vegetarian)
const DIET_TAGS = {
    any: null,
    halal: ['halal'],
    vegetarian: ['vegetarian'],
    no_pork: ['no_pork', 'halal', 'vegetarian'],
    no_beef: ['no_beef', 'vegetarian']
}

const DIET_OPTIONS = [
    { value: 'any', label: 'Any' },
    { value: 'halal', label: '🌙 Halal' },
    { value: 'vegetarian', label: '🥬 Vegetarian' },
    { value: 'no_pork', label: '🚫🐷 No pork' },
    { value: 'no_beef', label: '🚫🐮 No beef' }
]

// Centre Search belongs to ONE plan: PlanLobby opens it as /centre-search?plan=123456
const route = useRoute()
const planCode = String(route.query.plan || '')

// PlanLobby saves my member _id in localStorage after I join, e.g. "memberId-123456"
const memberId = planCode ? localStorage.getItem(`memberId-${planCode}`) : null

// ---------- state ----------
const plan = ref(null)
const planChecked = ref(false)   // true once we've tried to load the plan
const planLoadError = ref('')

const allCentres = ref([])       // every centre: { serialNo, name, lat, lng, is_open }
const centresError = ref('')

const selectedSerialNo = ref('') // the centre chosen in the dropdown ('' = none yet)
const menu = ref(null)           // that centre's menu from the server (null = not loaded)
const menuLoading = ref(false)
const menuError = ref('')

// filters (diet + max price start from MY plan settings, see loadPlan)
const dishQuery = ref('')
const maxPrice = ref('')
const diet = ref('any')
let filtersSet = false           // so the 5-second refresh doesn't undo the person's own changes

const openStallIds = ref([])     // stalls whose dishes are showing (several can be open to compare)

const adding = ref(false)
const addError = ref('')

let refreshTimer = null          // reloads the plan every 5 seconds (same as PlanLobby)

// ---------- worked out from the data ----------

// me = my member object in this plan (null if I haven't joined on this browser)
const me = computed(() => {
    if (!plan.value || !memberId) {
        return null
    }
    return plan.value.members.find(member => String(member._id) === String(memberId)) || null
})

// the middle point of everyone's pins (same idea as getMidPoint in shortlist-helper.js)
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

// km from the group's middle point, 1 decimal place (same formula as getDistance on the server)
function distanceKm(centre) {
    if (!groupMidpoint.value) {
        return null
    }
    const northToSouth = (centre.lat - groupMidpoint.value.lat) * 111
    const eastToWest = (centre.lng - groupMidpoint.value.lng) * 111
    return Math.round(Math.sqrt(northToSouth ** 2 + eastToWest ** 2) * 10) / 10
}

// only centres open on the plan's date go in the dropdown (already A-Z from the server)
const openCentres = computed(() => allCentres.value.filter(centre => centre.is_open))

// how many were hidden, for the small note under the dropdown
const closedCount = computed(() => allCentres.value.length - openCentres.value.length)

// the 5 open centres nearest to the group's middle point
const suggested = computed(() => {
    if (!groupMidpoint.value) {
        return []
    }
    const copy = [...openCentres.value]   // copy first: .sort() changes the list it's called on
    copy.sort((a, b) => distanceKm(a) - distanceKm(b))
    return copy.slice(0, SUGGESTED_COUNT)
})

// serialNos already in the group's picks, e.g. ["72", "2"]
const pickedSerials = computed(() => {
    if (!plan.value) {
        return []
    }
    return plan.value.shortlist.map(item => String(item.serialNo))
})

const picksLeft = computed(() => Math.max(MAX_PICKS - pickedSerials.value.length, 0))

// "2026-10-30" -> "Fri, 30 Oct"
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

// max price: '' (no limit) is fine, otherwise it must be more than $0 and at most $100
const priceError = computed(() => {
    if (maxPrice.value === '' || maxPrice.value === null) {
        return ''
    }
    const price = Number(maxPrice.value)
    if (Number.isNaN(price) || price <= 0 || price > MAX_PRICE_LIMIT) {
        return `Max price must be between $0.50 and $${MAX_PRICE_LIMIT}.`
    }
    return ''
})

// does this dish pass the dish name, max price and diet filters?
function dishMatches(dish) {
    const query = dishQuery.value.trim().toLowerCase()
    if (query !== '' && !dish.name.toLowerCase().includes(query)) {
        return false
    }
    if (maxPrice.value !== '' && maxPrice.value !== null && priceError.value === '' && dish.price > Number(maxPrice.value)) {
        return false
    }
    const safeTags = DIET_TAGS[diet.value]
    if (safeTags && !dish.tags.some(tag => safeTags.includes(tag))) {
        return false
    }
    return true
}

// the menu after filtering: each stall keeps only matching dishes, stalls with none are hidden
const filteredStalls = computed(() => {
    if (!menu.value) {
        return []
    }
    const result = []
    for (const stall of menu.value.stalls) {
        const dishes = stall.dishes.filter(dishMatches)
        if (dishes.length > 0) {
            result.push({ ...stall, dishes: dishes })   // copy the stall with the filtered dishes
        }
    }
    return result
})

// while typing a dish name, show the matching stalls already opened
const showAllDishes = computed(() => dishQuery.value.trim() !== '')

// why the Add button can't be used ('' = I can add this centre)
const cannotAddReason = computed(() => {
    if (!me.value) {
        return 'Join the plan to add centres'
    }
    if (plan.value.status !== 'joining') {
        return 'Swiping has started, picks are locked'
    }
    if (!menu.value) {
        return 'Choose a centre first'
    }
    if (pickedSerials.value.includes(menu.value.centre.serialNo)) {
        return 'Already in your group picks'
    }
    if (pickedSerials.value.length >= MAX_PICKS) {
        return `Your group has picked ${MAX_PICKS} centres (max)`
    }
    if (menu.value.cannotEat.length > 0) {
        return 'Not everyone can eat here'
    }
    return ''
})

const alreadyPicked = computed(() => menu.value !== null && pickedSerials.value.includes(menu.value.centre.serialNo))

// NEW: text on the big Add button (laptops). Plain ifs instead of 3 ternaries in a row
const addButtonText = computed(() => {
    if (adding.value) {
        return 'Adding…'
    }
    if (alreadyPicked.value) {
        return '✓ In group picks'
    }
    if (cannotAddReason.value === '') {
        return '+ Add to group picks'
    }
    return "Can't add"
})

// NEW: shorter text for the Add bar at the bottom of phones
const addBarText = computed(() => {
    if (adding.value) {
        return 'Adding…'
    }
    if (alreadyPicked.value) {
        return '✓ Picked'
    }
    if (cannotAddReason.value === '') {
        return '+ Add to picks'
    }
    return "Can't add"
})

// e.g. "Wei Jie (🌙 Halal, $5 budget)"
function describeMember(member) {
    const option = DIET_OPTIONS.find(item => item.value === member.diet)
    const dietText = member.diet === 'any' ? 'no diet' : option.label
    return `${member.name} (${dietText}, $${member.budget} budget)`
}

// NEW: everyone who can't eat here, as one line, e.g. "Wei Jie (🌙 Halal, $5 budget), Bob (...)"
const cannotEatNames = computed(() => {
    if (!menu.value) {
        return ''
    }
    return menu.value.cannotEat.map(describeMember).join(', ')
})

// ---------- API calls ----------

// the plan (name, date, status, members, shortlist)
async function loadPlan() {
    try {
        const response = await axios.get(`${API_URL}/plans/${planCode}`)
        plan.value = response.data

        // first time only: start the filters on MY plan diet and budget
        if (!filtersSet && me.value) {
            diet.value = me.value.diet
            maxPrice.value = me.value.budget
            filtersSet = true
        }
    } catch (error) {
        // only show the error page if the plan never loaded (keep the page if a refresh fails)
        if (!plan.value) {
            planLoadError.value = error.response ? error.response.data.error : "Can't reach the server."
        }
    } finally {
        planChecked.value = true
    }
}

// every centre + whether it's open on the plan's date
async function loadCentres() {
    centresError.value = ''
    try {
        const response = await axios.get(`${API_URL}/centre-search/centres`, {
            params: { date: plan.value.date }
        })
        allCentres.value = response.data.centres

        // nothing chosen yet: start with the nearest suggested centre
        if (selectedSerialNo.value === '' && suggested.value.length > 0) {
            chooseCentre(suggested.value[0].serialNo)
        }
    } catch (error) {
        centresError.value = error.response ? error.response.data.error : "Can't reach the server."
    }
}

// the chosen centre's stalls + dishes (runs when the dropdown changes)
async function loadMenu() {
    if (selectedSerialNo.value === '') {
        menu.value = null
        return
    }
    menuLoading.value = true
    menuError.value = ''
    addError.value = ''
    openStallIds.value = []   // new centre: start with every stall closed
    try {
        const response = await axios.get(`${API_URL}/centre-search/plans/${planCode}/centres/${selectedSerialNo.value}`)
        menu.value = response.data
    } catch (error) {
        menu.value = null
        menuError.value = error.response ? error.response.data.error : "Can't reach the server."
    } finally {
        menuLoading.value = false
    }
}

// a Suggested button sets the dropdown to that centre, then loads its menu
function chooseCentre(serialNo) {
    selectedSerialNo.value = serialNo
    loadMenu()
}

// tap a stall: open it if closed, close it if open (several can stay open)
function toggleStall(stallId) {
    if (openStallIds.value.includes(stallId)) {
        openStallIds.value = openStallIds.value.filter(id => id !== stallId)
    } else {
        openStallIds.value.push(stallId)
    }
}

// add the chosen centre to the group's picks
async function addToPicks() {
    if (cannotAddReason.value !== '') {
        return
    }
    adding.value = true
    addError.value = ''
    try {
        await axios.post(`${API_URL}/plans/${planCode}/shortlist`, {
            serialNo: menu.value.centre.serialNo,
            added_by: me.value.name,
            member_id: memberId
        })
        await loadPlan()   // so the dots and "Added" update straight away
    } catch (error) {
        addError.value = error.response ? error.response.data.error : "Can't reach the server."
    } finally {
        adding.value = false
    }
}

// stop "-", "+", "e" and "E" being typed in the price box (e.g. "-5" or "1e9")
function blockBadKeys(event) {
    if (['-', '+', 'e', 'E'].includes(event.key)) {
        event.preventDefault()
    }
}

onMounted(async () => {
    if (!planCode) {
        planChecked.value = true
        return
    }
    await loadPlan()
    if (plan.value) {
        loadCentres()
        refreshTimer = setInterval(loadPlan, 5000)   // picks other people add show up within 5 seconds
    }
})

onUnmounted(() => {
    clearInterval(refreshTimer)
})
</script>

<template>
    <div class="container centre-search">

        <!-- 1. no plan code in the URL: Centre Search only works inside a plan -->
        <div v-if="planChecked && !planCode" class="card p-4 my-4">
            <h1 class="h3">Centre Search is part of your Makan Plan</h1>
            <p>Open your plan's lobby and click "Find a centre", so the centres you pick go onto that plan.</p>
            <RouterLink to="/plan/join">Join a plan</RouterLink> |
            <RouterLink to="/plan/new">Start a plan</RouterLink>
        </div>

        <!-- 2. the plan couldn't be loaded -->
        <div v-else-if="planChecked && planLoadError" class="card p-4 my-4">
            <p>{{ planLoadError }}</p>
            <RouterLink to="/plan/join">Join a plan</RouterLink>
        </div>

        <!-- 3. the real page -->
        <template v-else-if="plan">

            <div class="top-row">
                <RouterLink :to="`/plan/${planCode}/lobby`" class="btn sm" aria-label="Back to plan lobby">←</RouterLink>
                <h1 class="outline find-title">Find a centre</h1>
            </div>

            <!-- group picks: always at the top, never needs sideways scrolling -->
            <div class="picks-bar" :class="{ warn: picksLeft <= 2 }">
                <span class="picks-label">📝 Group picks</span>
                <strong class="picks-count">{{ pickedSerials.length }}/{{ MAX_PICKS }}</strong>
                <span class="dots">
                    <i v-for="n in MAX_PICKS" :key="n" :class="{ filled: n <= pickedSerials.length }"></i>
                </span>
                <span class="picks-note">
                    Your group can pick {{ MAX_PICKS }} centres · the best {{ SWIPE_CARDS }} are kept for swiping
                </span>
            </div>

            <!-- plan name, date, code (these can scroll sideways on phones) -->
            <div class="plan-strip">
                <span class="plan-chip">🍽 {{ plan.name }}</span>
                <span class="plan-chip">📅 {{ friendlyDate }}, {{ plan.time }}</span>
                <span class="plan-chip code-chip">🎟 {{ planCode }}</span>
            </div>

            <div class="layout">

                <!-- LEFT (stays in place on laptops): choose a centre + filters -->
                <section class="search-box">
                    <label for="centre-select" class="visually-hidden">Which centre?</label>
                    <select
                        id="centre-select"
                        v-model="selectedSerialNo"
                        class="cute-input form-select"
                        @change="loadMenu"
                    >
                        <option value="" disabled>Choose a centre…</option>
                        <optgroup v-if="suggested.length > 0" label="⭐ Suggested">
                            <option v-for="centre in suggested" :key="'s' + centre.serialNo" :value="centre.serialNo">
                                {{ centre.name }} · {{ distanceKm(centre) }} km
                            </option>
                        </optgroup>
                        <optgroup label="All open centres (A–Z)">
                            <option v-for="centre in openCentres" :key="centre.serialNo" :value="centre.serialNo">
                                {{ centre.name }}<template v-if="distanceKm(centre) !== null"> · {{ distanceKm(centre) }} km</template>
                            </option>
                        </optgroup>
                    </select>
                    <p v-if="closedCount > 0" class="closed-note">
                        🧹 {{ closedCount }} {{ closedCount === 1 ? 'centre is' : 'centres are' }} closed on {{ friendlyDate }} and {{ closedCount === 1 ? "isn't" : "aren't" }} shown.
                    </p>
                    <p v-if="centresError" class="text-danger fw-bold">{{ centresError }}</p>

                    <div class="filter-row">
                        <label for="dish-query" class="visually-hidden">Dish name</label>
                        <input
                            id="dish-query"
                            v-model="dishQuery"
                            type="search"
                            maxlength="50"
                            class="cute-input form-control"
                            placeholder="🍜 Dish (optional)"
                        >
                        <label for="max-price" class="visually-hidden">Max price in dollars</label>
                        <input
                            id="max-price"
                            v-model="maxPrice"
                            type="number"
                            min="0.5"
                            :max="MAX_PRICE_LIMIT"
                            step="0.5"
                            inputmode="decimal"
                            class="cute-input form-control"
                            :class="{ 'is-invalid': priceError }"
                            placeholder="Max $"
                            @keydown="blockBadKeys"
                        >
                    </div>
                    <p v-if="priceError" class="text-danger small fw-bold mb-0" role="alert">{{ priceError }}</p>

                    <!-- Suggested: the 5 nearest open centres. Clicking one = choosing it in the dropdown -->
                    <div v-if="suggested.length > 0" class="chip-row">
                        <b>⭐ Suggested:</b>
                        <button
                            v-for="centre in suggested"
                            :key="centre.serialNo"
                            type="button"
                            class="suggest-chip"
                            :class="{ on: selectedSerialNo === centre.serialNo }"
                            @click="chooseCentre(centre.serialNo)"
                        >
                            {{ centre.name }} · {{ distanceKm(centre) }} km
                        </button>
                    </div>

                    <!-- Diet: radio buttons styled as chips (main.css .chip-input + .chip, same as DishForm.vue) -->
                    <!-- CHANGED: each input + label pair sits in a span.chip-wrap (was <template v-for>) -->
                    <div class="chip-row">
                        <b>Diet:</b>
                        <span v-for="option in DIET_OPTIONS" :key="option.value" class="chip-wrap">
                            <input
                                :id="'diet-' + option.value"
                                v-model="diet"
                                type="radio"
                                name="diet"
                                class="chip-input"
                                :value="option.value"
                            >
                            <label :for="'diet-' + option.value" class="chip diet-chip">{{ option.label }}</label>
                        </span>
                    </div>
                </section>

                <!-- RIGHT: the chosen centre -->
                <section class="centre-panel">
                    <p v-if="menuLoading" class="m-0">Loading the menu…</p>
                    <p v-else-if="menuError" class="text-danger fw-bold m-0">{{ menuError }}</p>
                    <p v-else-if="!menu" class="m-0">Choose a centre to see its stalls.</p>

                    <template v-else>
                        <div class="centre-head">
                            <div class="centre-info">
                                <h2 class="centre-name">{{ menu.centre.name }}</h2>
                                <p class="address">📍 {{ menu.centre.address }}</p>
                                <div class="pill-row">
                                    <span v-if="distanceKm(menu.centre) !== null" class="pill green">📏 {{ distanceKm(menu.centre) }} km</span>
                                    <span class="pill green">✓ Open {{ friendlyDate }}</span>
                                    <span v-if="menu.centre.foodStalls" class="pill">🍜 {{ menu.centre.foodStalls }} stalls</span>
                                    <span v-if="menu.centre.crowd && menu.centre.crowd.level" class="pill">👥 {{ menu.centre.crowd.label }}</span>
                                </div>

                                <p v-if="menu.cannotEat.length === 0" class="fit-ok">✓ Everyone can eat here within budget</p>
                                <template v-else>
                                    <p class="fit-bad">✕ Not everyone can eat here</p>
                                    <!-- CHANGED: names come from the cannotEatNames computed (was a <template v-for>) -->
                                    <p class="blocked-box">
                                        <b>{{ cannotEatNames }}</b>
                                        {{ menu.cannotEat.length === 1 ? 'has' : 'have' }} nothing to eat here. Try a Suggested centre.
                                    </p>
                                </template>
                            </div>

                            <!-- laptops: the Add button sits here (phones use the bar at the bottom) -->
                            <button
                                type="button"
                                class="btn green add-big"
                                :disabled="cannotAddReason !== '' || adding"
                                @click="addToPicks"
                            >
                                {{ addButtonText }}
                            </button>
                        </div>
                        <p v-if="cannotAddReason !== '' && !alreadyPicked && menu.cannotEat.length === 0" class="small fw-bold mt-2 mb-0">{{ cannotAddReason }}</p>
                        <p v-if="addError" class="text-danger fw-bold mt-2 mb-0" role="alert">{{ addError }}</p>

                        <CentreMenu
                            :stalls="filteredStalls"
                            :closed-stalls="menu.closedStalls"
                            :open-stall-ids="openStallIds"
                            :show-all="showAllDishes"
                            :date-label="friendlyDate"
                            :has-any-stalls="menu.stalls.length > 0"
                            @toggle-stall="toggleStall"
                        />
                    </template>
                </section>
            </div>

            <!-- phones + tablets: Add bar stuck to the bottom of the screen -->
            <div v-if="menu" class="add-bar">
                <span class="add-bar-name" :class="{ bad: menu.cannotEat.length > 0 }">
                    {{ menu.cannotEat.length > 0 ? 'Not everyone can eat here' : menu.centre.name }}
                </span>
                <button
                    type="button"
                    class="btn green"
                    :disabled="cannotAddReason !== '' || adding"
                    @click="addToPicks"
                >
                    {{ addBarText }}
                </button>
            </div>
        </template>

        <p v-else class="my-4">Loading your plan…</p>
    </div>
</template>

<style scoped>
/* ---------- base = phone ---------- */
.centre-search {
    padding-top: 12px;
    padding-bottom: 90px;   /* room for the Add bar at the bottom */
}

.top-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 10px;
}

.find-title {
    color: var(--paper);
    font-size: clamp(32px, 8vw, 56px);
    margin: 0;
}

/* group picks bar */
.picks-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 10px;
    padding: 8px 12px;
    margin-bottom: 10px;
    background: var(--paper);
    border: 3px solid var(--ink);
    border-radius: 14px;
    box-shadow: 3px 3px 0 var(--ink);
}

.picks-bar.warn {
    background: #FFE3C2;   /* 2 or fewer picks left */
}

.picks-label {
    font-weight: 800;
}

.picks-count {
    font-size: 20px;
}

.dots {
    display: inline-flex;
    gap: 3px;
}

.dots i {
    width: 11px;
    height: 11px;
    border: 2px solid var(--ink);
    border-radius: 50%;
    background: var(--paper);
}

.dots i.filled {
    background: var(--pandan);
}

.picks-note {
    flex-basis: 100%;   /* phones: the note gets its own line */
    font-size: 14px;
    font-weight: 700;
    color: var(--ink);
}

/* plan name, date, code: one row that scrolls sideways on phones */
.plan-strip {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding: 2px 2px 8px;
    margin-bottom: 8px;
}

.plan-chip {
    flex: none;
    padding: 4px 10px;
    background: var(--paper);
    border: 3px solid var(--ink);
    border-radius: 12px;
    box-shadow: 2px 2px 0 var(--ink);
    font-size: 14px;
    font-weight: 700;
    white-space: nowrap;
}

.code-chip {
    border-style: dashed;
    background: var(--cream);
}

.layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
}

.search-box,
.centre-panel {
    background: var(--paper);
    border: 3px solid var(--ink);
    border-radius: 20px;
    box-shadow: 5px 5px 0 var(--ink);
    padding: 14px;
}

.closed-note {
    margin: 6px 0 0;
    font-size: 14px;
    font-weight: 700;
}

.filter-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 110px;
    gap: 8px;
    margin-top: 10px;
}

/* suggested + diet rows: scroll sideways on phones instead of taking 4 lines */
.chip-row {
    display: flex;
    align-items: center;
    gap: 6px;
    overflow-x: auto;
    padding: 4px 2px 6px;
    margin-top: 8px;
}

.chip-row b {
    flex: none;
}

.suggest-chip {
    flex: none;
    padding: 4px 10px;
    background: var(--cream);
    border: 2.5px solid var(--ink);
    border-radius: 999px;
    font: inherit;
    font-size: 14px;
    font-weight: 700;
    color: var(--ink);
    white-space: nowrap;
    cursor: pointer;
}

.suggest-chip.on {
    background: var(--sun);
}

/* NEW: holds one radio + its label (main.css hides the radio with position: absolute) */
.chip-wrap {
    position: relative;
    flex: none;
}

.diet-chip {
    flex: none;
    padding: 4px 10px;
    font-size: 14px;
    white-space: nowrap;
}

/* chosen diet: black (main.css makes it pink by default) */
.chip-input:checked + .diet-chip {
    background: var(--ink);
    color: var(--paper);
}

/* centre panel */
.centre-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    padding-bottom: 10px;
    border-bottom: 3px solid var(--ink);
}

.centre-info {
    min-width: 0;
}

.centre-name {
    font-size: 24px;
    margin: 0;
}

.address {
    margin: 2px 0 6px;
    font-size: 14px;
    font-weight: 700;
}

.pill-row {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    padding-bottom: 4px;
}

.pill {
    flex: none;
    padding: 2px 10px;
    background: var(--cream);
    border: 2px solid var(--ink);
    border-radius: 999px;
    font-size: 13px;
    font-weight: 700;
    white-space: nowrap;
}

.pill.green {
    background: #DDF7E8;
}

.fit-ok,
.fit-bad {
    margin: 6px 0 0;
    font-size: 14px;
    font-weight: 800;
}

.fit-ok {
    color: var(--ok);
}

.fit-bad {
    color: var(--bad);
}

.blocked-box {
    margin: 8px 0 0;
    padding: 10px 12px;
    background: #FFE1DE;
    border: 2.5px solid var(--bad);
    border-radius: 12px;
    font-size: 14px;
    font-weight: 700;
}

.blocked-box b {
    color: var(--bad);
}

.add-big {
    display: none;   /* phones use the bottom bar instead */
}

/* Add bar stuck to the bottom of the screen */
.add-bar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 10;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    background: var(--paper);
    border-top: 3px solid var(--ink);
}

.add-bar-name {
    font-weight: 800;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.add-bar-name.bad {
    color: var(--bad);
}

.add-bar .btn {
    flex: none;
    white-space: nowrap;   /* keep "+ Add to picks" on one line */
}

/* can't add: grey instead of a faded green */
.add-bar .btn:disabled,
.add-big:disabled {
    background: #E8E2D8;
    color: var(--muted);
}

/* ---------- tablet (768px+) ---------- */
@media (min-width: 768px) {
    .picks-bar {
        width: fit-content;
    }

    .picks-note {
        flex-basis: auto;   /* the note fits on the same line now */
        margin-left: 6px;
    }

    /* enough room: wrap onto more lines instead of scrolling sideways */
    .plan-strip,
    .chip-row,
    .pill-row {
        flex-wrap: wrap;
        overflow-x: visible;
    }

    .filter-row {
        grid-template-columns: minmax(0, 1fr) 130px;
    }
}

/* ---------- laptop (992px+) ---------- */
@media (min-width: 992px) {
    .centre-search {
        padding-bottom: 40px;
    }

    .add-bar {
        display: none;   /* the Add button sits in the centre panel instead */
    }

    .add-big {
        display: inline-flex;
        flex: none;
    }

    /* two panels: search on the left (stays in place), centre on the right */
    .layout {
        grid-template-columns: minmax(0, 330px) minmax(0, 1fr);
        align-items: start;
        gap: 24px;
    }

    .search-box {
        position: sticky;
        top: 12px;
    }
}

/* ---------- desktop (1200px+) ---------- */
@media (min-width: 1200px) {
    .layout {
        grid-template-columns: minmax(0, 380px) minmax(0, 1fr);
    }
}
</style>