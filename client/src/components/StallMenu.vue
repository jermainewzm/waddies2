<script setup>

defineProps({
    menu: { type: Object, required: true }
})

const emit = defineEmits([
    'close'
])

const TAG_LABELS = {
    halal: 'Halal',
    vegetarian: 'Vegetarian',
    no_pork: 'No Pork',
    no_beef: 'No Beef'
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
    <div>

        <h2>
            {{ menu.stall.stall_name }} {{ menu.stall.unit_no }}
        </h2>

        <p>
            Today: {{ menu.stall.is_open_today ? 'Open' : 'Not open' }}
            <span v-if="menu.stall.is_rest_day">(rest day)</span>
        </p>

        <p>
            Status: {{ menu.stall.status }} (updated {{ formatTime(menu.stall.status_updated_at) }})
        </p>

        <p>
            Rest days: {{ menu.stall.rest_days.length > 0 ? menu.stall.rest_days.join(', ') : 'None' }}
        </p>

        <h3>Menu</h3>

        <p v-if="menu.dishes.length === 0">
            No dishes added yet.
        </p>

        <p
            v-for="dish in menu.dishes"
            :key="dish.dish_id"
        >
            <strong>{{ dish.name }}</strong> - ${{ dish.price.toFixed(2) }}
            <br>
            Available: {{ dish.is_available ? 'Yes' : 'No' }}
            <br>
            Tags: {{ dish.tags.length > 0 ? dish.tags.map(tag => TAG_LABELS[tag] || tag).join(', ') : 'None' }}
        </p>

        <button @click="emit('close')">
            Close
        </button>

        <hr>

    </div>
</template>


<!-- Notes -->

<!-- parent sends the menu DOWN as a prop: { stall: {...}, dishes: [...] } from GET /dishes/stalls/:stallId/menu -->
<!-- Close button emits 'close' UP so the parent can hide this -->