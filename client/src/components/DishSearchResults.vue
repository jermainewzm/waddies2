<script setup>
import AddToPlanForm from './AddToPlanForm.vue'

defineProps({
    results: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    errorMessage: { type: String, default: '' },
    hasSearched: { type: Boolean, default: false },

    // add to plan state
    planCentreId: { type: String, default: null },   // which centre's form is open
    planCode: { type: String, default: '' },
    planLoading: { type: Boolean, default: false },
    planError: { type: String, default: '' },
    addedCentres: { type: Object, default: () => ({}) }   // { centre_id: plan code }
})

const emit = defineEmits([
    'view-menu',
    'open-plan-form',
    'submit-plan',
    'cancel-plan'
])

const TAG_LABELS = {
    halal: 'Halal',
    vegetarian: 'Vegetarian',
    no_pork: 'No Pork',
    no_beef: 'No Beef'
}

// seat_level will come from Live Centre Status later
const SEAT_LABELS = {
    plenty: 'Plenty of seats',
    few: 'Few seats',
    full: 'Full'
}

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

        <p v-if="loading">
            Searching open stalls...
        </p>

        <p v-else-if="errorMessage">
            {{ errorMessage }}
        </p>

        <p v-else-if="!hasSearched">
            Search for a dish to see which open centres sell it.
        </p>

        <p v-else-if="results.length === 0">
            No open stalls sell that right now.
        </p>

        <div v-else>

            <p>
                {{ results.length }} centre(s) open today - cheapest first
            </p>

            <!-- one block per hawker centre -->
            <div
                v-for="centre in results"
                :key="centre.centre_id"
            >

                <h3>
                    {{ centre.centre_name || centre.centre_id }}
                    <span v-if="SEAT_LABELS[centre.seat_level]">
                        - {{ SEAT_LABELS[centre.seat_level] }}
                    </span>
                </h3>

                <!-- one row per dish -->
                <div
                    v-for="dish in getCentreDishes(centre)"
                    :key="dish.dish_id"
                >
                    <p>
                        <strong>{{ dish.name }}</strong> - ${{ dish.price.toFixed(2) }}
                        <br>

                        <!-- click the stall name to see its full menu -->
                        <button @click="emit('view-menu', dish.stall)">
                            {{ dish.stall.stall_name }} {{ dish.stall.unit_no }}
                        </button>
                        <br>

                        Tags: {{ dish.tags.length > 0 ? dish.tags.map(tag => TAG_LABELS[tag] || tag).join(', ') : 'None' }}
                        | Status: {{ dish.stall.status }}
                    </p>
                </div>

                <!-- already added -->
                <p v-if="addedCentres[centre.centre_id]">
                    Added to plan {{ addedCentres[centre.centre_id] }}!
                </p>

                <!-- plan code form, only for the centre that was clicked -->
                <AddToPlanForm
                    v-else-if="planCentreId === centre.centre_id"
                    :plan-code="planCode"
                    :loading="planLoading"
                    :error-message="planError"
                    @submit-plan="emit('submit-plan', { centre: centre, ...$event })"
                    @cancel="emit('cancel-plan')"
                />

                <button
                    v-else
                    @click="emit('open-plan-form', centre)"
                >
                    Add to plan
                </button>

                <hr>

            </div>

        </div>

    </div>
</template>


<!-- Notes -->

<!-- display only, no API calls here -->
<!-- parent sends results and the add-to-plan state DOWN as props -->
<!-- stall name emits 'view-menu' UP, Add to plan emits 'open-plan-form' UP -->
<!-- AddToPlanForm's submit is passed UP again as 'submit-plan' with the centre attached -->