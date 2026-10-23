<script setup>
// NEW FILE (Centre Search): replaces DishSearchResults.vue, StallMenu.vue and DishSearchForm.vue
// Shows ONE centre's stalls. Tap a stall to show/hide its dishes (several can be open to compare).
// Display only: CentreSearch.vue sends the data DOWN as props, this sends 'toggle-stall' UP.

const props = defineProps({
    stalls: { type: Array, required: true },        // open stalls (already filtered): [{ stall_id, name, unit_no, dishes }]
    closedStalls: { type: Array, required: true },  // [{ stall_id, name, unit_no, reason }]
    openStallIds: { type: Array, required: true },  // which stalls are showing their dishes
    showAll: { type: Boolean, default: false },     // true while typing a dish name: every matching stall shows its dishes
    dateLabel: { type: String, default: '' },       // e.g. "Fri, 30 Oct"
    hasAnyStalls: { type: Boolean, default: false } // false = this centre has no open stalls at all (before filtering)
})

const emit = defineEmits(['toggle-stall'])

const TAG_ICONS = {
    halal: '🌙',
    vegetarian: '🥬',
    no_pork: '🚫🐷',
    no_beef: '🚫🐮'
}

const TAG_NAMES = {
    halal: 'Halal',
    vegetarian: 'Vegetarian',
    no_pork: 'No pork',
    no_beef: 'No beef'
}

// is this stall showing its dishes?
function isOpen(stall) {
    return props.showAll || props.openStallIds.includes(stall.stall_id)
}

// cheapest dish price at a stall
// CHANGED: starts from the first dish's price (was Infinity). Every stall here has at least 1 dish
function cheapest(stall) {
    let lowest = stall.dishes[0].price
    for (const dish of stall.dishes) {
        if (dish.price < lowest) {
            lowest = dish.price
        }
    }
    return lowest
}

// every diet tag used at a stall, once each (new Set removes repeats)
function stallTags(stall) {
    const tags = []
    for (const dish of stall.dishes) {
        for (const tag of dish.tags) {
            tags.push(tag)
        }
    }
    return [...new Set(tags)]
}

// emoji per closed reason
function reasonIcon(reason) {
    if (reason.includes('Rest day')) {   // CHANGED: was .startsWith
        return '😴'
    }
    if (reason === 'Closed by hawker') {
        return '🔒'
    }
    return '🍽'
}
</script>

<template>
    <div class="centre-menu">
        <div class="menu-head">
            <h3 class="menu-title">🍜 Menu · {{ stalls.length }} {{ stalls.length === 1 ? 'stall' : 'stalls' }}</h3>
            <span class="menu-hint">Tap a stall to show or hide its dishes</span>
        </div>

        <p v-if="!hasAnyStalls" class="empty">No stalls at this centre are open on {{ dateLabel }}.</p>
        <p v-else-if="stalls.length === 0" class="empty">No dishes match your filters. Try another dish, a higher price or "Any" diet.</p>

        <!-- stalls: 1 column on phones, 2 on tablets and up -->
        <div class="stall-grid">
            <div v-for="stall in stalls" :key="stall.stall_id" class="stall">
                <!-- the whole row is one button -->
                <button
                    type="button"
                    class="stall-row"
                    :class="{ open: isOpen(stall) }"
                    @click="emit('toggle-stall', stall.stall_id)"
                >
                    <span class="stall-text">
                        <b class="stall-name">{{ stall.name }}</b>
                        <span class="stall-info">
                            {{ stall.unit_no }} · {{ stall.dishes.length }} {{ stall.dishes.length === 1 ? 'dish' : 'dishes' }}
                            · from ${{ cheapest(stall).toFixed(2) }}
                            <span
                                v-for="tag in stallTags(stall)"
                                :key="tag"
                                class="tag"
                                :class="tag"
                                :title="TAG_NAMES[tag]"
                            >{{ TAG_ICONS[tag] }}</span>
                        </span>
                    </span>
                    <span class="arrow">{{ isOpen(stall) ? '▴' : '▾' }}</span>
                </button>

                <!-- the dishes, only while the stall is open -->
                <div v-if="isOpen(stall)" class="dishes">
                    <div v-for="dish in stall.dishes" :key="dish.dish_id" class="dish">
                        <span>{{ dish.name }}</span>
                        <span
                            v-for="tag in dish.tags"
                            :key="tag"
                            class="tag"
                            :class="tag"
                            :title="TAG_NAMES[tag]"
                        >{{ TAG_ICONS[tag] }}</span>
                        <span class="dots"></span>
                        <span class="price">${{ dish.price.toFixed(2) }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- stalls that aren't open on the plan's date -->
        <div v-if="closedStalls.length > 0" class="closed-box">
            <p class="closed-title">Not open on {{ dateLabel }} · {{ closedStalls.length }} {{ closedStalls.length === 1 ? 'stall' : 'stalls' }}</p>
            <div v-for="stall in closedStalls" :key="stall.stall_id" class="closed-row">
                <span>
                    <b>{{ stall.name }}</b>
                    <small>{{ stall.unit_no }}</small>
                </span>
                <span class="reason">{{ reasonIcon(stall.reason) }} {{ stall.reason }}</span>
            </div>
        </div>
    </div>
</template>

<style scoped>
.menu-head {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: baseline;
    gap: 4px 8px;
    margin: 12px 0 4px;
}

.menu-title {
    font-size: 20px;
    margin: 0;
}

.menu-hint {
    font-size: 13px;
    font-weight: 700;
    color: var(--muted);
}

.empty {
    font-weight: 700;
}

.stall-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    column-gap: 22px;
}

.stall {
    border-top: 2px dashed var(--line);
}

/* the row is a real <button>, so reset the browser's button look */
.stall-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 10px 0;
    background: none;
    border: 0;
    font: inherit;
    color: var(--ink);
    text-align: left;
    cursor: pointer;
}

.stall-name {
    display: block;
    font-size: 17px;
}

.stall-info {
    display: block;
    margin-top: 2px;
    font-size: 15px;
    font-weight: 700;
}

/* round arrow: cream when closed, black when open */
.arrow {
    flex: none;
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    background: var(--cream);
    border: 2.5px solid var(--ink);
    border-radius: 50%;
    box-shadow: 2px 2px 0 var(--ink);
    font-size: 14px;
    font-weight: 800;
}

.stall-row.open .arrow {
    background: var(--ink);
    color: var(--paper);
    box-shadow: none;
}

.dishes {
    padding-bottom: 10px;
}

/* "Chicken rice ........ $5.00" */
.dish {
    display: flex;
    align-items: baseline;
    gap: 6px;
    margin: 5px 0;
    font-size: 16px;
}

.dots {
    flex: 1;
    border-bottom: 2px dotted var(--ink);
    transform: translateY(-4px);
}

.price {
    font-weight: 800;
    white-space: nowrap;
}

/* small diet icon box (dish rows + stall rows) */
.tag {
    display: inline-block;   /* CHANGED: one box that moves as a whole */
    white-space: nowrap;     /* CHANGED: never split 🚫 and 🐷 onto two lines */
    margin-left: 2px;        /* CHANGED: small gap between boxes */
    padding: 0 4px;
    border: 1.5px solid var(--ink);
    border-radius: 6px;
    font-size: 12px;
}

.tag.vegetarian { background: #B8DDB0; }   /* sage */
.tag.halal      { background: #A8D0E6; }   /* dusty blue */
.tag.no_pork    { background: #CDB4DB; }   /* purple */
.tag.no_beef    { background: #F7B7C9; }   /* pink */

/* grey dashed box for stalls not open that day */
.closed-box {
    margin-top: 14px;
    padding: 10px 12px;
    background: #F1EEE8;
    border: 2.5px dashed var(--muted);
    border-radius: 14px;
}

.closed-title {
    margin: 0 0 6px;
    font-weight: 800;
}

.closed-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    padding: 7px 0;
    border-top: 1.5px dashed #D6CFC3;
    opacity: .75;
}

.closed-row small {
    display: block;
    font-weight: 700;
    color: var(--muted);
}

.reason {
    flex: none;
    padding: 2px 10px;
    background: var(--paper);
    border: 2px solid var(--ink);
    border-radius: 999px;
    font-size: 13px;
    font-weight: 800;
    white-space: nowrap;
}

/* tablets and up: stalls in 2 columns */
@media (min-width: 768px) {
    .stall-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}
</style>