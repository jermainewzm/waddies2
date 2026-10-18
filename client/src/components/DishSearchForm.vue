<script setup>
import { ref } from 'vue'

const props = defineProps({
    loading: {
        type: Boolean,
        default: false
    },
    // NEW: my diet + budget from the plan, so the filters start filled in
    initialDiet: {
        type: String,
        default: 'any'
    },
    initialMaxPrice: {
        type: [Number, String],
        default: ''
    }
})

const emit = defineEmits([
    'search'
])

const MAX_PRICE_LIMIT = 100 // NEW (error prevention): same $100 limit as the plan's budget

const query = ref('')
const diet = ref(props.initialDiet)         // CHANGED: was ref('any'), now starts from my plan diet
const maxPrice = ref(props.initialMaxPrice) // CHANGED: was ref(''), now starts from my plan budget
const formError = ref('')                   // NEW (error prevention): message shown under the form
// REMOVED: sortBy - it was sent but the server never used it

// sends the form values up to DishSearch.vue
function submitSearch() {
    formError.value = ''

    // NEW (error prevention): no empty search
    if (!query.value.trim()) {
        formError.value = 'Type a dish name first, e.g. chicken rice.'
        return
    }

    // NEW (error prevention): max price is optional, but if typed it must be a sensible number
    if (maxPrice.value !== '' && maxPrice.value !== null) {
        const price = Number(maxPrice.value)

        if (isNaN(price) || price <= 0) {
            formError.value = 'Max price must be more than $0.'
            return
        }
        if (price > MAX_PRICE_LIMIT) {
            formError.value = `Max price can't be more than $${MAX_PRICE_LIMIT}.`
            return
        }
    }

    emit('search', {
        q: query.value.trim(),
        diet: diet.value,
        maxPrice: maxPrice.value
    })
}

// NEW (error prevention): stops "-", "+" and "e" being typed into the price box
// (number inputs allow them by default, eg. "-5" or "1e9")
function blockBadKeys(event) {
    if (['-', '+', 'e', 'E'].includes(event.key)) {
        event.preventDefault()
    }
}
</script>

<template>
    <!-- CHANGED: <div> -> <form>, so pressing Enter also searches (.prevent stops the page reloading) -->
    <form class="card p-3 mb-4" novalidate @submit.prevent="submitSearch">

        <h3>Search Dishes</h3>

        <div class="mb-3">
            <label class="form-label" for="dish-query">
                Dish Name
            </label>

            <input
                id="dish-query"
                v-model="query"
                type="text"
                maxlength="50"
                class="form-control"
                placeholder="chicken rice"
                data-testid="dish-query"
            >
        </div>

        <div class="mb-3">
            <label class="form-label" for="dish-diet">
                Dietary Needs
            </label>

            <select
                id="dish-diet"
                v-model="diet"
                class="form-select"
                data-testid="dish-diet"
            >
                <option value="any">Any</option>
                <option value="halal">Halal</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="no_pork">No Pork</option>
                <option value="no_beef">No Beef</option>
            </select>
        </div>

        <div class="mb-3">
            <label class="form-label" for="dish-max-price">
                Max Price ($)
            </label>

            <!-- CHANGED (error prevention): min/max + blocks "-" and "e" from being typed -->
            <input
                id="dish-max-price"
                v-model="maxPrice"
                type="number"
                min="0.5"
                :max="MAX_PRICE_LIMIT"
                step="0.5"
                inputmode="decimal"
                class="form-control"
                placeholder="Any"
                data-testid="dish-max-price"
                @keydown="blockBadKeys"
            >
        </div>

        <!-- REMOVED: "Sort By" dropdown (the server always sorts cheapest first) -->

        <!-- NEW (error prevention): shows what's wrong instead of failing silently -->
        <p v-if="formError" class="text-danger fw-bold" data-testid="dish-form-error">
            {{ formError }}
        </p>

        <!-- CHANGED: type="submit" (works with Enter) + "btn red" instead of "btn btn-primary" (that looked blank) -->
        <button
            type="submit"
            class="btn red"
            :disabled="loading"
            data-testid="dish-search-btn"
        >
            {{ loading ? 'Searching...' : 'Search' }}
        </button>

    </form>
</template>


<!-- Notes -->

<!-- form only collects input, no API calls here -->
<!-- clicking Search (or pressing Enter) emits 'search' UP to DishSearch.vue with { q, diet, maxPrice } -->
<!-- NEW: parent sends my plan diet + budget DOWN as starting values -->
<!-- NEW (error prevention): empty search, negative / zero / over-$100 price are caught here with a message -->
<!-- parent sends loading DOWN so the button can't be clicked twice -->