<script setup>

defineProps({
    menu: { type: Object, required: true }
})

const emit = defineEmits([
    'close'
])

// CHANGED (styling): each tag has an icon too, same as DishSearchResults.vue (was TAG_LABELS)
const TAG_INFO = {
    halal: { icon: '🌙', label: 'Halal' },
    vegetarian: { icon: '🥬', label: 'Vegetarian' },
    no_pork: { icon: '🚫🐷', label: 'No Pork' },
    no_beef: { icon: '🚫🐮', label: 'No Beef' }
}

// NEW: friendly words for the stall status (was showing raw values like "sold_out")
const STATUS_LABELS = {
    open: 'Open',
    sold_out: 'Sold out',
    closed_early: 'Closed early',
    closed: 'Closed'
}

function formatTime(date) {
    if (!date) {
        return 'unknown'
    }

    return new Date(date).toLocaleTimeString('en-SG', {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'Asia/Singapore'
    })
}
</script>

<template>
    <!-- CHANGED (styling): the menu is now a "menu board" card (was plain text) -->
    <!-- NEW: id="stall-menu" so DishSearch.vue can scroll to it when it opens -->
    <section id="stall-menu" class="menu-card" data-testid="stall-menu">

        <!-- top: stall name + close button -->
        <div class="menu-head">
            <div>
                <h2 class="stall-name">
                    {{ menu.stall.stall_name }}
                    <span class="unit">{{ menu.stall.unit_no }}</span>
                </h2>
                <!-- NEW: the API now also sends the centre's name -->
                <p class="centre-name">📍 {{ menu.stall.centre_name }}</p>
            </div>

            <!-- CHANGED (styling): theme button (main.css .btn) instead of a plain button -->
            <button type="button" class="btn sm red" @click="emit('close')">
                Close ✕
            </button>
        </div>

        <!-- CHANGED (styling): stall info as badges (was 3 lines of text) -->
        <div class="info-row">
            <!-- CHANGED: is_open_today -> is_open (the API now checks the PLAN's day, not just today) -->
            <span class="info-badge" :class="menu.stall.is_open ? 'open' : 'closed'">
                {{ menu.stall.is_open ? '✓ Open on your plan\'s day' : '✕ Not open on your plan\'s day' }}
                <template v-if="menu.stall.is_rest_day"> (rest day)</template>
            </span>

            <span class="info-badge">
                Today: {{ STATUS_LABELS[menu.stall.status] || menu.stall.status }}
                · updated {{ formatTime(menu.stall.status_updated_at) }}
            </span>

            <span class="info-badge">
                Rest days: {{ menu.stall.rest_days.length > 0 ? menu.stall.rest_days.join(', ') : 'None' }}
            </span>
        </div>

        <h3 class="menu-title">Menu</h3>

        <p v-if="menu.dishes.length === 0" class="empty">
            No dishes added yet.
        </p>

        <!-- CHANGED (styling): one row per dish, name ..... price (like the results) -->
        <div
            v-for="dish in menu.dishes"
            :key="dish.dish_id"
            class="dish"
            :class="{ unavailable: !dish.is_available }"
        >
            <div class="dish-line">
                <span>{{ dish.name }}</span>
                <span class="dots"></span>
                <span class="price">${{ dish.price.toFixed(2) }}</span>
            </div>

            <div class="dish-meta">
                <!-- CHANGED: only shows when NOT available (was "Available: Yes/No" on every dish) -->
                <span v-if="!dish.is_available" class="sold-out">Not available</span>

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

    </section>
</template>


<!-- Notes -->

<!-- parent sends the menu DOWN as a prop: { stall: {...}, dishes: [...] } from GET /dishes/stalls/:stallId/menu -->
<!-- Close button emits 'close' UP so the parent can hide this -->
<!-- NEW styling: same look as the result "order chits" (cream paper, dotted lines, pastel tags) -->


<!-- NEW (styling): "scoped" = these styles only affect this component -->
<style scoped>
/* the whole menu: cream paper card with a thick outline */
.menu-card {
    margin-bottom: 30px;
    padding: 22px;
    background: #FFFDF6;
    border: 4px solid var(--ink);
    border-radius: 20px;
    box-shadow: 6px 6px 0 var(--ink);
    scroll-margin-top: 100px;  /* space above it when the page scrolls to it (so the sticky navbar doesn't cover it) */
}

/* stall name on the left, Close button on the right (wraps on phones) */
.menu-head {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
}

.stall-name {
    font-size: 26px;
}

.unit {
    font-size: 18px;
    color: var(--muted);
}

.centre-name {
    margin: 6px 0 0;
    font-size: 18px;      
    font-weight: 700;     
    color: var(--ink);    
}

/* ---------- info badges ---------- */
.info-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 16px 0;
}

.info-badge {
    padding: 4px 12px;
    background: var(--cream);
    border: 2px solid var(--ink);
    border-radius: 999px;
    font-size: 14px;
    font-weight: 700;
}

.info-badge.open {
    background: #DDF7E8;
    color: var(--ok);
}

.info-badge.closed {
    background: #FFE1DE;
    color: var(--bad);
}

/* ---------- menu ---------- */
.menu-title {
    font-size: 22px;
    padding-top: 12px;
    border-top: 3px solid var(--ink);
}

.empty {
    color: var(--muted);
}

/* "Chicken rice ........ $5.30" */
.dish-line {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin: 12px 0 4px;
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

.dish-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

/* dish that's not available today: faded */
.dish.unavailable {
    opacity: .55;
}

.sold-out {
    padding: 2px 10px;
    background: var(--ink);
    color: var(--paper);
    border-radius: 8px;
    font-size: 13px;
    font-weight: 800;
}

/* diet tag sticker (same as DishSearchResults.vue) */
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

.tag.vegetarian { background: #B8DDB0; }   /* sage */
.tag.halal      { background: #A8D0E6; }   /* dusty blue */
.tag.no_pork    { background: #CDB4DB; }   /* purple */
.tag.no_beef    { background: #F7B7C9; }   /* pink */
</style>