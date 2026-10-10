<script setup>
import { ref } from 'vue'

const emit = defineEmits([
    'add-dish'
])

const name = ref('')
const price = ref('')
const vegetarian = ref(false)
const halal = ref(false)
const noPork = ref(false)
const noBeef = ref(false)
const isAvailable = ref(true)

function submitDish() {
    const tags = []

    if (vegetarian.value) {
        tags.push('vegetarian')
    }

    if (halal.value) {
        tags.push('halal')
    }

    if (noPork.value) {
        tags.push('no_pork')
    }

    if (noBeef.value) {
        tags.push('no_beef')
    }

    emit('add-dish', {
        name: name.value,
        price: Number(price.value),
        tags: tags,
        is_available: isAvailable.value
    })

    name.value = ''
    price.value = ''
    vegetarian.value = false
    halal.value = false
    noPork.value = false
    noBeef.value = false
    isAvailable.value = true
}
</script>

<template>
    <div class="card p-3 mb-4">

        <h3>Add Dish</h3>

        <div class="mb-3">
            <label class="form-label">
                Dish Name
            </label>

            <input
                v-model="name"
                type="text"
                class="form-control"
            >
        </div>

        <div class="mb-3">
            <label class="form-label">
                Price
            </label>

            <input
                v-model="price"
                type="number"
                step="0.01"
                class="form-control"
            >
        </div>

        <div class="mb-3">

            <p class="mb-2">
                Dietary Tags
            </p>

            <div class="form-check">
                <input
                    v-model="vegetarian"
                    class="form-check-input"
                    type="checkbox"
                    id="vegetarian"
                >

                <label
                    class="form-check-label"
                    for="vegetarian"
                >
                    Vegetarian
                </label>
            </div>

            <div class="form-check">
                <input
                    v-model="halal"
                    class="form-check-input"
                    type="checkbox"
                    id="halal"
                >

                <label
                    class="form-check-label"
                    for="halal"
                >
                    Halal
                </label>
            </div>

            <div class="form-check">
                <input
                    v-model="noPork"
                    class="form-check-input"
                    type="checkbox"
                    id="noPork"
                >

                <label
                    class="form-check-label"
                    for="noPork"
                >
                    No Pork
                </label>
            </div>

            <div class="form-check">
                <input
                    v-model="noBeef"
                    class="form-check-input"
                    type="checkbox"
                    id="noBeef"
                >

                <label
                    class="form-check-label"
                    for="noBeef"
                >
                    No Beef
                </label>
            </div>

        </div>

        <div class="form-check mb-3">

            <input
                v-model="isAvailable"
                class="form-check-input"
                type="checkbox"
                id="available"
            >

            <label
                class="form-check-label"
                for="available"
            >
                Available
            </label>

        </div>

        <button
            class="btn btn-primary"
            @click="submitDish"
        >
            Add Dish
        </button>

    </div>
</template>