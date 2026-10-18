<script setup>

defineProps({
    results: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    errorMessage: { type: String, default: '' },
    hasSearched: { type: Boolean, default: false },
    dateLabel: { type: String, default: '' },           // NEW (styling): eg. "Fri, 30 Oct", shown in the results bubble

    // CHANGED: add-to-shortlist state (REMOVED planCentreId + planCode, because there's no code form)
    addedCentres: { type: Array, default: () => [] },   // CHANGED: was an object { centre_id: code }, now a list of centre _ids
    canAdd: { type: Boolean, default: false },           // NEW: false if not joined / swiping started / 10 picks used
    cannotAddReason: { type: String, default: '' },      // NEW: tells the user WHY they can't add
    addingCentreId: { type: String, default: '' },       // CHANGED: was planLoading. Now knows WHICH centre is being added
    planError: { type: String, default: '' }
})

// CHANGED: was 'open-plan-form', 'submit-plan', 'cancel-plan'. Now one 'add-to-plan'
const emit = defineEmits([
    'view-menu',
    'add-to-plan'
])

// CHANGED (styling): each tag now has an icon too (was just a label)
const TAG_INFO = {
    halal: { icon: '🌙', label: 'Halal' },
    vegetarian: { icon: '🥬', label: 'Vegetarian' },
    no_pork: { icon: '🚫🐷', label: 'No Pork' },
    no_beef: { icon: '🚫🐮', label: 'No Beef' }
}

// REMOVED: SEAT_LABELS (the search API doesn't send seat levels, so they never showed)

// the API groups dishes by stall, but each centre lists all its dishes together
// so this flattens them into one list (each dish keeps its stall), cheapest first
function getCentreDishes(centre) {
    const dishes = []

    for (const stall of centre.stalls) {
        for (const dish of stall.dishes) {
            dishes.push({ ...dish, stall: stall })
        }
    }

    return dishes.sort((a, b) => a.price - b.price)
}
</script>

<template>
    <div>

        <!-- CHANGED (styling): each message is now a friendly card with an icon -->
        <div v-if="loading" class="message-card">
            <span class="search-icon wiggle">🔍</span>
            <p class="message-title handwritten">Finding open stalls...</p>
        </div>

        <div v-else-if="errorMessage" class="message-card" role="alert">
            <span class="search-icon">😵</span>
            <p class="message-title handwritten">Aiyo, something went wrong</p>
            <p class="message-text">{{ errorMessage }}</p>
        </div>

        <div v-else-if="!hasSearched" class="message-card">
            <span class="search-icon bob">🔍</span>
            <p class="message-title handwritten">What you craving ah?</p>
            <p class="message-text">Type a dish above and we'll show which hawker centres sell it on your plan's day.</p>
        </div>

        <div v-else-if="results.length === 0" class="message-card">
            <span class="search-icon">🥲</span>
            <p class="message-title handwritten">Aiyo, nothing found leh</p>
            <p class="message-text">No open stall sells that on your plan's day. Try a shorter word or another diet.</p>
        </div>

        <div v-else>

            <!-- CHANGED (styling): results count is now a bubble -->
            <p class="count-bubble">
                🔎 <b>{{ results.length }}</b> centre(s) open on <b>{{ dateLabel }}</b> · cheapest first
            </p>

            <!-- NEW: add-to-shortlist errors (eg. "already on the shortlist") show once, above the results -->
            <p v-if="planError" class="plan-error" role="alert">
                {{ planError }}
            </p>

            <!-- CHANGED (styling): one "order chit" per hawker centre -->
            <div
                v-for="(centre, index) in results"
                :key="centre.centre_id"
                class="chit"
                data-testid="centre-result"
            >
                <!-- NEW (styling): #1, #2... number badge -->
                <span class="chit-no">#{{ index + 1 }}</span>

                <!-- CHANGED: was centre.centre_name || centre.centre_id (showed "72"). The API now sends the real name -->
                <h3 class="centre-name">{{ centre.centre_name }}</h3>
                <!-- NEW -->
                <p v-if="centre.address" class="centre-address">📍 {{ centre.address }}</p>

                <!-- one row per dish -->
                <div
                    v-for="dish in getCentreDishes(centre)"
                    :key="dish.dish_id"
                    class="dish"
                >
                    <!-- CHANGED (styling): name ..... price, like a menu -->
                    <div class="dish-line">
                        <span>{{ dish.name }}</span>
                        <span class="dots"></span>
                        <span class="price">${{ dish.price.toFixed(2) }}</span>
                    </div>

                    <div class="dish-meta">
                        <!-- click the stall name to see its full menu -->
                        <button type="button" class="stall-chip" @click="emit('view-menu', dish.stall)">
                            {{ dish.stall.stall_name }} · {{ dish.stall.unit_no }}
                        </button>

                        <!-- CHANGED (styling): coloured tag stickers (was "Tags: Halal, ...") -->
                        <span
                            v-for="tag in dish.tags"
                            :key="tag"
                            class="tag"
                            :class="tag"
                        >
                            {{ TAG_INFO[tag] ? TAG_INFO[tag].icon : '' }}
                            {{ TAG_INFO[tag] ? TAG_INFO[tag].label : tag }}
                        </span>
                    </div>
                </div>

                <!-- NEW (styling): bottom of the chit -->
                <div class="chit-foot">
                    <small>{{ getCentreDishes(centre).length }} dish(es) match</small>

                    <!-- CHANGED: already on THIS plan's shortlist (checks the real plan, not just this visit) -->
                    <span v-if="addedCentres.includes(String(centre.centre_id))" class="stamp">
                        <span>✓ SHORTLISTED</span>
                    </span>

                    <!-- CHANGED: one click adds straight to the plan (no plan code form) -->
                    <button
                        v-else-if="canAdd"
                        type="button"
                        class="btn sm green"
                        :disabled="addingCentreId !== ''"
                        data-testid="add-to-plan"
                        @click="emit('add-to-plan', centre)"
                    >
                        {{ addingCentreId === String(centre.centre_id) ? 'Adding...' : '+ Add to shortlist' }}
                    </button>

                    <!-- NEW: why you can't add -->
                    <small v-else class="cannot-add">
                        {{ cannotAddReason }}
                    </small>
                </div>

            </div>

        </div>

    </div>
</template>


<!-- Notes -->

<!-- display only, no API calls here -->
<!-- parent sends results and the shortlist state DOWN as props -->
<!-- stall name emits 'view-menu' UP, "Add to shortlist" emits 'add-to-plan' UP with the centre -->
<!-- CHANGED: no plan code form any more: DishSearch.vue already knows the plan from the URL (?plan=123456) -->
<!-- NEW styling: each centre is a kopitiam "order chit"; colours are main.css variables + a few retro pastels -->


<!-- NEW (styling): "scoped" = these styles only affect this component -->
<style scoped>
/* ---------- empty / loading / error / no results card ---------- */
.message-card {
    max-width: 560px;
    margin: 8px auto 32px;
    padding: 24px 20px;
    text-align: center;
    background: var(--paper);
    border: 4px solid var(--ink);
    border-radius: 24px;
    box-shadow: 6px 6px 0 var(--ink);
}

/* big emoji in a yellow circle */
.search-icon {
    display: inline-block;
    font-size: 48px;
    width: 90px;
    height: 90px;
    line-height: 90px;
    background: var(--sun);
    border: 4px solid var(--ink);
    border-radius: 50%;
}

.message-title {
    font-size: 28px;
    margin: 10px 0 4px;
}

.message-text {
    margin: 0;
    color: var(--muted);
}

/* before searching: floats up and down */
.bob {
    animation: bob 2s ease-in-out infinite;
}

/* while searching: tilts side to side */
.wiggle {
    animation: wiggle 0.6s ease-in-out infinite;
}

@keyframes bob {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
}

@keyframes wiggle {
    0%, 100% { transform: rotate(-10deg); }
    50% { transform: rotate(10deg); }
}

/* ---------- results count bubble ---------- */
.count-bubble {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    padding: 6px 16px;
    margin-bottom: 26px;
    background: var(--paper);
    border: 3px solid var(--ink);
    border-radius: 999px;
    box-shadow: 3px 3px 0 var(--ink);
    font-weight: 700;
}

/* the number + date inside it */
.count-bubble b {
    background: var(--cream);
    border: 2px solid var(--ink);
    border-radius: 999px;
    padding: 0 10px;
}

.plan-error {
    color: var(--bad);
    font-weight: 800;
}

/* ---------- one centre = one order chit ---------- */
.chit {
    position: relative;
    margin-bottom: 30px;
    padding: 22px 22px 20px;
    background: #FFFDF6;
    border: 3px dashed var(--ink);
    border-radius: 6px;
    box-shadow: 5px 5px 0 rgba(0, 0, 0, .18);
    transform: rotate(-0.4deg);   /* slightly crooked, like a real chit */
}

/* every 2nd chit tilts the other way */
.chit:nth-child(even) {
    transform: rotate(0.4deg);
}

/* #1, #2 badge sitting on the top edge */
.chit-no {
    position: absolute;
    top: -15px;
    left: 18px;
    padding: 0 10px;
    background: var(--cream);
    border: 3px solid var(--ink);
    border-radius: 10px;
    box-shadow: 2px 2px 0 var(--ink);
    font-weight: 800;
    font-size: 15px;
}

.centre-name {
    font-size: 24px;
}

.centre-address {
    margin: 6px 0 14px;
    font-size: 17px;
    font-weight: 700;
    color: var(--ink);
}

/* ---------- dish rows ---------- */
/* "Chicken rice ........ $5.30" */
.dish-line {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin: 10px 0 4px;
    font-size: 19px;
}

/* the dotted line fills the space between name and price */
.dots {
    flex: 1;
    border-bottom: 3px dotted var(--ink);
    transform: translateY(-5px);
}

.price {
    font-weight: 800;
    white-space: nowrap;
    padding: 0 10px;
    background: var(--cream);
    border: 2px solid var(--ink);
    border-radius: 10px;
    box-shadow: 2px 2px 0 var(--ink);
}

/* stall button + tags, wraps on phones */
.dish-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
}

.stall-chip {
    padding: 3px 12px;
    background: var(--cream);
    border: 2px solid var(--ink);
    border-radius: 10px;
    box-shadow: 2px 2px 0 var(--ink);
    font: inherit;
    font-size: 16px;
    font-weight: 700;
    color: var(--ink);
    cursor: pointer;
}

.stall-chip:hover {
    background: var(--sun);
}

/* diet tag sticker */
.tag {
    padding: 3px 11px;
    border: 2px solid var(--ink);
    border-radius: 8px;
    box-shadow: 2px 2px 0 var(--ink);
    font-size: 15px;
    font-weight: 800;
    text-transform: uppercase;
    transform: rotate(-2deg);
}

/* one retro pastel per diet (class = the tag name from the database) */
.tag.vegetarian { background: #B8DDB0; }   /* sage */
.tag.halal      { background: #A8D0E6; }   /* dusty blue */
.tag.no_pork    { background: #CDB4DB; }   /* purple */
.tag.no_beef    { background: #F7B7C9; }   /* pink */

/* ---------- bottom of the chit ---------- */
.chit-foot {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    margin-top: 16px;
    padding-top: 14px;
    border-top: 3px solid var(--ink);
}

.chit-foot small {
    font-size: 14px;
    color: var(--muted);
}

.cannot-add {
    font-weight: 700;
}

/* green 3D "SHORTLISTED" stamp with black edges */
.stamp {
    display: inline-block;
    padding: 4px;
    background: #DDF7E8;
    border: 3px solid var(--ink);
    border-radius: 12px;
    box-shadow: 5px 5px 0 var(--ink);
    transform: rotate(-6deg);
}

.stamp span {
    display: block;
    padding: 5px 14px;
    border: 3px solid var(--ok);
    border-radius: 8px;
    color: var(--ok);
    font-weight: 800;
    font-size: 19px;
    letter-spacing: .08em;
    -webkit-text-stroke: .6px var(--ink);   /* thin black outline on the letters */
    paint-order: stroke fill;
}

/* people who turn off animations in their settings */
@media (prefers-reduced-motion: reduce) {
    .bob, .wiggle {
        animation: none;
    }
}
</style>