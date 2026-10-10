<script setup>
import { ref } from 'vue'

defineProps({
    loading: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits([
    'search'
])

const query = ref('')
const diet = ref('any')
const maxPrice = ref('')
const sortBy = ref('price')

// sends the form values up to DishSearch.vue
function submitSearch() {
    emit('search', {
        q: query.value.trim(),
        diet: diet.value,
        maxPrice: maxPrice.value,
        sortBy: sortBy.value
    })
}
</script>

<template>
    <div class="card p-3 mb-4">

        <h3>Search Dishes</h3>

        <div class="mb-3">
            <label class="form-label">
                Dish Name
            </label>

            <input
                v-model="query"
                type="text"
                maxlength="50"
                class="form-control"
                placeholder="chicken rice"
                data-testid="dish-query"
            >
        </div>

        <div class="mb-3">
            <label class="form-label">
                Dietary Needs
            </label>

            <select
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
            <label class="form-label">
                Max Price
            </label>

            <input
                v-model="maxPrice"
                type="number"
                step="0.01"
                class="form-control"
                placeholder="Any"
                data-testid="dish-max-price"
            >
        </div>

        <div class="mb-3">
            <label class="form-label">
                Sort By
            </label>

            <select
                v-model="sortBy"
                class="form-select"
                data-testid="dish-sort"
            >
                <option value="price">Cheapest first</option>
                <option value="travel" disabled>Travel time (soon)</option>
                <option value="seats" disabled>Seat availability (soon)</option>
            </select>
        </div>

        <button
            class="btn btn-primary"
            :disabled="loading || !query.trim()"
            @click="submitSearch"
            data-testid="dish-search-btn"
        >
            {{ loading ? 'Searching...' : 'Search' }}
        </button>

    </div>
</template>


<!-- Notes -->

<!-- form only collects input, no API calls here -->
<!-- clicking Search emits 'search' UP to DishSearch.vue with { q, diet, maxPrice, sortBy } -->
<!-- parent sends loading DOWN so the button can't be clicked twice -->