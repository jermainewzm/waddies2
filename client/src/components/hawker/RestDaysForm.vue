<script setup>
import { ref } from 'vue'

const props = defineProps({
    restDays: {
        type: Array,
        required: true
    }
})

const emit = defineEmits([
    'update-rest-days'
])

const days = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday'
]

const selectedDays = ref([...props.restDays])

function saveRestDays() {
    emit('update-rest-days', selectedDays.value)
}
</script>

<template>
    <div class="card p-3 mb-4">

        <h3>Weekly Rest Days</h3>

        <div class="d-flex flex-wrap gap-3 mb-3">

            <div
                v-for="day in days"
                :key="day"
                class="form-check"
            >
                <input
                    class="form-check-input"
                    type="checkbox"
                    :value="day"
                    v-model="selectedDays"
                    :id="day"
                >

                <label
                    class="form-check-label"
                    :for="day"
                >
                    {{ day }}
                </label>
            </div>

        </div>

        <button
            class="btn btn-primary"
            @click="saveRestDays"
        >
            Save Rest Days
        </button>
        
    </div>
</template>

<!-- Notes -->
<!-- when i click this, i go to my saverestdays and that will pass back the updated value back to hawkerdashbaord  -->