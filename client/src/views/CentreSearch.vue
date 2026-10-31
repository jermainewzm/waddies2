<script setup>
//pick a centre, look through its stalls, then add it to the group's picks (max 10)
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import axios from 'axios'
import { API_URL } from '@/utils/constants'

import CentreMenu from '../components/CentreMenu.vue'
import NotFoundView from './NotFoundView.vue'   //team's Not Found page, shown under URL errors

const MAX_PICKS = 10        //whole group can pick up to 10 centres (same as plan-controller)
const SUGGESTED_COUNT = 5   //how many nearest centres to suggest
const MAX_PRICE_LIMIT = 100 //same cap as a plan budget

//same diet rules as canMemberEat in shortlist-helper.js (ie. no pork also accepts halal + vegetarian)
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

//PlanLobby opens this page as /centre-search?plan=123456
const route = useRoute()
const router = useRouter()
const planCode = String(route.query.plan || '')

//member _id PlanLobby saved when you joined (ie. "memberId-123456")
const memberId = planCode ? localStorage.getItem(`memberId-${planCode}`) : null

const plan = ref(null)
const planChecked = ref(false)   //true once we tried loading the plan
const planLoadError = ref('')

const allCentres = ref([])       //every centre: { serialNo, name, lat, lng, is_open }
const centresError = ref('')

const centreQuery = ref('')      //what's typed in the centre search box
const selectedSerialNo = ref('') //centre chosen in the dropdown ('' = none yet)
const menu = ref(null)           //that centre's stalls + dishes (null = not loaded)
const menuLoading = ref(false)
const menuError = ref('')

//filters (diet + max price start from your plan settings)
const dishQuery = ref('')
const maxPrice = ref('')
const diet = ref('any')
let filtersSet = false           //so the 5 sec refresh doesn't undo the person's own filter changes

const openStallIds = ref([])     //stalls showing their dishes (can open a few to compare)

const adding = ref(false)
const addError = ref('')

let refreshTimer = null          //reloads the plan every 5 sec (same as PlanLobby)


//my member object in this plan (null if not joined on this browser)
const me = computed(() => {
    if (!plan.value || !memberId) {
        return null
    }
    return plan.value.members.find(member => String(member._id) === String(memberId)) || null
})

//middle point of everyone's pins (same idea as getMidPoint in shortlist-helper.js)
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

//km from the group's middle point to 1dp (same formula as getDistance on the server)
function distanceKm(centre) {
    if (!groupMidpoint.value) {
        return null
    }
    const northToSouth = (centre.lat - groupMidpoint.value.lat) * 111
    const eastToWest = (centre.lng - groupMidpoint.value.lng) * 111
    return Math.round(Math.sqrt(northToSouth ** 2 + eastToWest ** 2) * 10) / 10
}

//only centres open on the plan's date go in the dropdown
const openCentres = computed(() => allCentres.value.filter(centre => centre.is_open))

//how many were hidden, for the note under the dropdown
const closedCount = computed(() => allCentres.value.length - openCentres.value.length)

//5 open centres nearest to the group's middle point
const suggested = computed(() => {
    if (!groupMidpoint.value) {
        return []
    }
    const copy = [...openCentres.value]   //copy first as .sort() changes the original list
    copy.sort((a, b) => distanceKm(a) - distanceKm(b))
    return copy.slice(0, SUGGESTED_COUNT)
})

//open centres with the typed words in their name, max 6 (ie. "max" -> Maxwell Food Centre)
const centreMatches = computed(() => {
    const query = centreQuery.value.trim().toLowerCase()
    if (query === '') {
        return []
    }
    return openCentres.value.filter(centre => centre.name.toLowerCase().includes(query)).slice(0, 6)
})

//serialNos already picked (ie. ["72", "2"])
const pickedSerials = computed(() => {
    if (!plan.value) {
        return []
    }
    return plan.value.shortlist.map(item => String(item.serialNo))
})

const picksLeft = computed(() => Math.max(MAX_PICKS - pickedSerials.value.length, 0))

//picked centres with their names and who added them (ie. [{ serialNo: "72", name: "Maxwell Food Centre", added_by: "Angel" }])
const pickedCentres = computed(() => {
    if (!plan.value) {
        return []
    }
    return plan.value.shortlist.map(item => {
        const centre = allCentres.value.find(c => String(c.serialNo) === String(item.serialNo))
        return {
            serialNo: String(item.serialNo),
            name: centre ? centre.name : `Centre ${item.serialNo}`,
            added_by: item.added_by
        }
    })
})

//"2026-10-30" -> "Fri, 30 Oct"
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

//empty = no limit, otherwise must be more than $0 and at most $100
const priceError = computed(() => {
    if (maxPrice.value === '' || maxPrice.value === null) {
        return ''
    }
    const price = Number(maxPrice.value)
    if (Number.isNaN(price) || price < 0.5 || price > MAX_PRICE_LIMIT) {
        return `Max price must be between $0.50 and $${MAX_PRICE_LIMIT}.`
    }
    return ''
})

//checks one dish against the dish name, max price and diet filters
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

//each stall only keeps matching dishes, stalls with none are hidden
const filteredStalls = computed(() => {
    if (!menu.value) {
        return []
    }
    const result = []
    for (const stall of menu.value.stalls) {
        const dishes = stall.dishes.filter(dishMatches)
        if (dishes.length > 0) {
            result.push({ ...stall, dishes: dishes })   //copy of the stall with only the matching dishes
        }
    }
    return result
})

//while typing a dish name, matching stalls open by themselves
const showAllDishes = computed(() => dishQuery.value.trim() !== '')

//why the add button can't be used ('' = can add)
const cannotAddReason = computed(() => {
    if (menuLoading.value) {
        return 'Loading the menu…'
    }
    if (!me.value) {
        return 'Join the plan to add centres'
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
    return ''
})

const alreadyPicked = computed(() => menu.value !== null && pickedSerials.value.includes(menu.value.centre.serialNo))

//text on the big add button (laptops)
const addButtonText = computed(() => {
    if (adding.value) {
        return 'Adding…'
    }
    if (alreadyPicked.value) {
        return '✓ In group picks'
    }
    if (cannotAddReason.value === '') {
        return '+ Add to picks'   //same words as the phone bar
    }
    return "Can't add"
})

//shorter text for the add bar on phones
const addBarText = computed(() => {
    if (adding.value) {
        return 'Adding…'
    }
    if (menuLoading.value) {
        return 'Loading…'
    }
    if (alreadyPicked.value) {
        return '✓ Picked'
    }
    if (cannotAddReason.value === '') {
        return '+ Add to picks'
    }
    return "Can't add"
})

//ie. "Wei Jie (🌙 Halal, $5 budget)"
function describeMember(member) {
    const option = DIET_OPTIONS.find(item => item.value === member.diet)
    const dietText = member.diet === 'any' ? 'no diet' : (option ? option.label : member.diet)   //unknown diet: show it as it is instead of crashing
    return `${member.name} (${dietText}, $${member.budget} budget)`
}

//everyone who can't eat here in one line
const cannotEatNames = computed(() => {
    if (!menu.value) {
        return ''
    }
    return menu.value.cannotEat.map(describeMember).join(', ')
})


//gets the plan (name, date, status, members, shortlist)
async function loadPlan() {
    try {
        const response = await axios.get(`${API_URL}/plans/${planCode}`)
        plan.value = response.data

        //host started swiping (or it's done): members go to the swipe page (same as PlanLobby)
        if (plan.value.status !== 'joining' && me.value) {
            router.replace(`/plan/${planCode}/swipe`)   //replace, so Back doesn't land here again
            return
        }

        //first time only: start the filters on my plan diet + budget
        if (!filtersSet && me.value) {
            diet.value = me.value.diet
            maxPrice.value = me.value.budget
            filtersSet = true
        }
    } catch (error) {
        //only show the error page if the plan never loaded (keeps the page if a refresh fails)
        if (!plan.value) {
            planLoadError.value = (error.response && error.response.data && error.response.data.error) || "We couldn't load this plan. Check the link, or try again in a moment."
        }
    } finally {
        planChecked.value = true
    }
}

//every centre + if it's open on the plan's date
async function loadCentres() {
    centresError.value = ''
    try {
        const response = await axios.get(`${API_URL}/centre-search/centres`, {
            params: { date: plan.value.date }
        })
        allCentres.value = response.data.centres

        //nothing chosen yet so start with the nearest suggested centre
        if (selectedSerialNo.value === '' && suggested.value.length > 0) {
            chooseCentre(suggested.value[0].serialNo)
        }
    } catch (error) {
        centresError.value = (error.response && error.response.data && error.response.data.error) || "Can't reach the server."
    }
}

//chosen centre's stalls + dishes (runs when the dropdown changes)
async function loadMenu() {
    const wanted = selectedSerialNo.value   //the centre this request is for
    if (wanted === '') {
        menu.value = null
        return
    }
    menuLoading.value = true
    menuError.value = ''
    addError.value = ''
    openStallIds.value = []   //new centre so all stalls start closed
    try {
        const response = await axios.get(`${API_URL}/centre-search/plans/${planCode}/centres/${wanted}`)
        if (wanted !== selectedSerialNo.value) {
            return   //another centre was chosen meanwhile: ignore this older answer
        }
        menu.value = response.data
    } catch (error) {
        if (wanted !== selectedSerialNo.value) {
            return
        }
        menu.value = null
        menuError.value = (error.response && error.response.data && error.response.data.error) || "Can't reach the server."
    } finally {
        if (wanted === selectedSerialNo.value) {
            menuLoading.value = false
        }
    }
}

//choose a centre without the dropdown (first load + typed search), the dropdown updates too
function chooseCentre(serialNo) {
    selectedSerialNo.value = serialNo
    loadMenu()
}

//tapped a centre from the typed search: choose it and empty the box
function pickTyped(serialNo) {
    centreQuery.value = ''
    chooseCentre(serialNo)
}

//tap a stall to open it, tap again to close it
function toggleStall(stallId) {
    if (openStallIds.value.includes(stallId)) {
        openStallIds.value = openStallIds.value.filter(id => id !== stallId)
    } else {
        openStallIds.value.push(stallId)
    }
}

//adds the chosen centre to the group's picks
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
        await loadPlan()   //refresh so the dots update straight away
    } catch (error) {
        addError.value = (error.response && error.response.data && error.response.data.error) || "Can't reach the server."
    } finally {
        adding.value = false
    }
}

//blocks "-", "+", "e", "E" in the price box (ie. "-5" or "1e9")
function blockBadKeys(event) {
    if (['-', '+', 'e', 'E'].includes(event.key)) {
        event.preventDefault()
    }
}

let left = false   //true once you've left the page, so a late request can't start the timer

onMounted(async () => {
    if (!planCode) {
        planChecked.value = true
        return
    }
    await loadPlan()
    if (left) {
        return
    }
    if (plan.value) {
        loadCentres()
        refreshTimer = setInterval(loadPlan, 5000)   //new picks from others show up within 5 sec
    }
})

onUnmounted(() => {
    left = true
    clearInterval(refreshTimer)
})
</script>

<template>
    <main class="bg-tiles">
    <div class="container centre-search">

        <!-- no plan code in the url -->
        <div v-if="planChecked && !planCode" class="card p-4 my-4">
            <h1 class="h3">Centre Search is part of your Makan Plan</h1>
            <p>Open your plan's lobby and click "Find a centre", so the centres you pick go onto that plan.</p>
            <RouterLink to="/plan/join">Join a plan</RouterLink> |
            <RouterLink to="/plan/new">Start a plan</RouterLink>
        </div>

        <!-- plan couldn't load -->
        <!-- plan couldn't load (fake code, broken link, server down): the message + the team's Not Found page (same as JourneyView) -->
        <div v-else-if="planChecked && planLoadError">
            <div class="text-center pt-4">
                <div class="alert alert-danger d-inline-block px-4 py-3 mb-0">
                    <strong>Oops!</strong> {{ planLoadError }}
                </div>
            </div>
            <NotFoundView />
        </div>

        <!-- the actual page -->
        <!-- plan already swiping or done (members are sent to the swipe page; this is for everyone else) -->
        <div v-else-if="plan && plan.status !== 'joining'" class="card p-4 my-4">
            <h1 class="h4">Picks are closed</h1>
            <p>This plan has moved on to {{ plan.status === 'done' ? 'its results' : 'swiping' }}, so no more centres can be added.</p>
            <RouterLink :to="`/plan/${planCode}`" class="btn red">Back to the plan</RouterLink>
        </div>

        <template v-else-if="plan">

            <div class="top-row">
                <RouterLink :to="`/plan/${planCode}/lobby`" class="btn sm" aria-label="Back to plan lobby">←</RouterLink>
                <h1 class="outline find-title">Find a centre</h1>
            </div>

            <!-- group picks (always visible at the top) -->
            <div class="picks-bar" :class="{ warn: picksLeft <= 2 }">
                <span class="picks-label">📝 Group picks</span>
                <strong class="picks-count">{{ pickedSerials.length }}/{{ MAX_PICKS }}</strong>
                <span class="dots">
                    <i v-for="n in MAX_PICKS" :key="n" :class="{ filled: n <= pickedSerials.length }"></i>
                </span>
                <span class="picks-note">
                    Your group can pick up to {{ MAX_PICKS }} centres · your picks are swiped first, followed by nearby suggestions!
                </span>
            </div>

            <!-- which centres the group picked, and who added each -->
            <ul v-if="pickedCentres.length > 0" class="pick-chips" aria-label="Group picks">
                <li v-for="pick in pickedCentres" :key="pick.serialNo">
                    {{ pick.name }}<small v-if="pick.added_by"> · {{ pick.added_by }}</small>
                </li>
            </ul>

            <!-- plan name, date, code -->
            <div class="plan-strip">
                <span class="plan-chip">🍽 {{ plan.name }}</span>
                <span class="plan-chip">📅 {{ friendlyDate }}, {{ plan.time }}</span>
                <span class="plan-chip code-chip">🎟 {{ planCode }}</span>
            </div>

            <div class="layout">

                <!-- left: choose a centre + filters (stays in place on laptops) -->
                <section class="search-box">
                    <!-- type part of a name, matching centres show underneath to tap -->
                    <label for="centre-query" class="visually-hidden">Type a centre name</label>
                    <input
                        id="centre-query"
                        v-model="centreQuery"
                        type="search"
                        maxlength="50"
                        class="cute-input form-control"
                        placeholder="🔍 Type a centre name"
                    >
                    <div v-if="centreQuery.trim() !== '' && allCentres.length > 0" class="match-list">
                        <button
                            v-for="centre in centreMatches"
                            :key="centre.serialNo"
                            type="button"
                            class="match"
                            @click="pickTyped(centre.serialNo)"
                        >
                            {{ suggested.includes(centre) ? '⭐ ' : '' }}{{ centre.name }}<template v-if="distanceKm(centre) !== null"> · {{ distanceKm(centre) }} km</template>
                        </button>
                        <p v-if="centreMatches.length === 0" class="no-match">No open centre matches "{{ centreQuery.trim() }}"</p>
                    </div>

                    <!-- or choose from the full list -->
                    <label for="centre-select" class="visually-hidden">Which centre?</label>
                    <select
                        id="centre-select"
                        v-model="selectedSerialNo"
                        class="cute-input form-select centre-select"
                        @change="loadMenu"
                    >
                        <option value="" disabled>Choose a centre…</option>
                        <optgroup v-if="suggested.length > 0" label="Suggested">
                            <option v-for="centre in suggested" :key="'s' + centre.serialNo" :value="centre.serialNo">
                                ⭐ {{ centre.name }} · {{ distanceKm(centre) }} km
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


                    <!-- diet: radio buttons styled as chips (same as DishForm.vue) -->
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

                <!-- right: the chosen centre -->
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
                                    <p class="fit-bad">⚠ Not everyone can eat here</p>
                                    <p class="blocked-box">
                                        <b>{{ cannotEatNames }}</b>
                                        {{ menu.cannotEat.length === 1 ? 'has' : 'have' }} nothing to eat here. You can still add it, but they won't have dishes to choose from 😭.
                                    </p>
                                </template>
                            </div>

                            <!-- add button for laptops (phones use the bar at the bottom) -->
                            <button
                                type="button"
                                class="btn green add-big"
                                :disabled="cannotAddReason !== '' || adding"
                                @click="addToPicks"
                            >
                                {{ addButtonText }}
                            </button>
                        </div>
                        <p v-if="cannotAddReason !== '' && !alreadyPicked" class="small fw-bold mt-2 mb-0">{{ cannotAddReason }}</p>
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

            <!-- add bar stuck to the bottom of the screen (phones + tablets) -->
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
</main>
</template>


<style scoped>

main {
    min-height: calc(100vh - 72px);   /* full screen minus the 72px header */
}
/* phone (base) */
.centre-search {
    padding-top: 12px;
    padding-bottom: 90px;   /* room for the add bar */
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
    flex-basis: 100%;   /* note gets its own line on phones */
    font-size: 14px;
    font-weight: 700;
    color: var(--ink);
}

/* plan name, date, code: scrolls sideways on phones */
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

/* typed search results: a list of centres to tap */
.match-list {
    margin-top: 6px;
    background: var(--paper);
    border: 3px solid var(--ink);
    border-radius: 14px;
    overflow: hidden;   /* keeps the rows inside the rounded corners */
}

.match {
    display: block;
    width: 100%;
    padding: 8px 12px;
    background: none;
    border: 0;
    border-top: 2px dashed var(--line);
    font: inherit;
    font-size: 15px;
    font-weight: 700;
    color: var(--ink);
    text-align: left;
    cursor: pointer;
}

.match:first-child {
    border-top: 0;
}

.match:hover {
    background: var(--cream);
}

.no-match {
    margin: 0;
    padding: 8px 12px;
    font-size: 15px;
    font-weight: 700;
    color: var(--muted);
}

.centre-select {
    margin-top: 8px;
}

/* diet row: every option shows, wraps onto the next line when there's no room */
.chip-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    padding: 4px 2px 6px;
    margin-top: 8px;
}

/* holds one radio + its label (main.css hides the radio with position: absolute) */
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

/* chosen diet is black (main.css makes it pink) */
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

/* add bar stuck to the bottom of the screen */
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
    white-space: nowrap;   /* keeps "+ Add to picks" on one line */
}

/* can't add = grey */
.add-bar .btn:disabled,
.add-big:disabled {
    background: #E8E2D8;
    color: var(--muted);
}

/* tablet (768px+) */
@media (min-width: 768px) {
    .picks-bar {
        width: fit-content;
    }

    .picks-note {
        flex-basis: auto;   /* note fits on the same line now */
        margin-left: 6px;
    }

    /* enough room so wrap instead of scrolling sideways */
    .plan-strip,
    .pill-row {
        flex-wrap: wrap;
        overflow-x: visible;
    }

    .filter-row {
        grid-template-columns: minmax(0, 1fr) 130px;
    }
}

/* laptop (992px+) */
@media (min-width: 992px) {
    .centre-search {
        padding-bottom: 40px;
    }

    .add-bar {
        display: none;   /* add button sits in the centre panel instead */
    }

    .add-big {
        display: inline-flex;
        flex: none;
    }

    /* two panels: search on the left, centre on the right */
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

/* desktop (1200px+) */
@media (min-width: 1200px) {
    .layout {
        grid-template-columns: minmax(0, 380px) minmax(0, 1fr);
    }
}

/* group picks as chips under the counter */
.pick-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 8px 0 0;
    padding: 0;
    list-style: none;
}

.pick-chips li {
    padding: 4px 10px;
    background: var(--paper);
    border: 2px solid var(--ink);
    border-radius: 999px;
    font-size: 14px;
    font-weight: 700;
}

.pick-chips small {
    font-weight: 400;
    color: var(--muted);
}

/* phones: the add-bar warning wraps instead of being cut off with "…" */
.add-bar-name {
    white-space: normal;
    overflow: visible;
    font-size: 14px;
    line-height: 1.2;
}

/* landscape phones: slimmer add bar so more of the menu shows */
@media (max-height: 500px) {
    .add-bar {
        padding: 4px 16px;
    }

    .add-bar .btn {
        padding-top: 6px;
        padding-bottom: 6px;
    }
}
</style>