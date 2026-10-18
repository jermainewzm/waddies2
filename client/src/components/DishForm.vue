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

function blockBadKeys(event) {
    if (["-", "+", "e", "E"].includes(event.key)) {
        event.preventDefault()
    }
}

</script>


<template>

    <div class="card panel mb-4">

        <h3 class="mb-3">
            Add Dish
        </h3>


        <div class="add-dish-box">

            <!-- name + price -->
            <div class="row-fields mb-3">

                <div class="grow">

                    <label
                        class="form-label fw-bold"
                        for="dishName"
                    >
                        Dish Name
                    </label>

                    <input
                        id="dishName"
                        v-model="name"
                        type="text"
                        class="form-control cute-input"
                        placeholder="e.g. Roasted chicken rice"
                    >

                </div>


                <div class="price-field">

                    <label
                        class="form-label fw-bold"
                        for="dishPrice"
                    >
                        Price ($)
                    </label>

                    <input
                        id="dishPrice"
                        v-model="price"
                        type="number"
                        min="0.01"
                        step="0.01"
                        class="form-control cute-input"
                        placeholder="0.00"
                        @keydown="blockBadKeys"
                    >

                </div>

            </div>


            <!-- dietary tags -->
            <div class="mb-3">

                <p class="mb-2 fw-bold">
                    Dietary Tags
                </p>


                <div class="d-flex flex-wrap gap-2">

                    <div class="chip-wrap">

                        <input
                            v-model="vegetarian"
                            class="chip-input green"
                            type="checkbox"
                            id="vegetarian"
                        >

                        <label
                            class="chip"
                            for="vegetarian"
                        >
                            Vegetarian
                        </label>

                    </div>


                    <div class="chip-wrap">

                        <input
                            v-model="halal"
                            class="chip-input green"
                            type="checkbox"
                            id="halal"
                        >

                        <label
                            class="chip"
                            for="halal"
                        >
                            Halal
                        </label>

                    </div>


                    <div class="chip-wrap">

                        <input
                            v-model="noPork"
                            class="chip-input"
                            type="checkbox"
                            id="noPork"
                        >

                        <label
                            class="chip"
                            for="noPork"
                        >
                            No Pork
                        </label>

                    </div>


                    <div class="chip-wrap">

                        <input
                            v-model="noBeef"
                            class="chip-input"
                            type="checkbox"
                            id="noBeef"
                        >

                        <label
                            class="chip"
                            for="noBeef"
                        >
                            No Beef
                        </label>

                    </div>

                </div>

            </div>


            <!-- availability + add button -->
            <div
                class="d-flex align-items-center justify-content-between flex-wrap gap-3"
            >

                <div class="d-flex align-items-center gap-2">

                    <input
                        v-model="isAvailable"
                        class="switch-input"
                        type="checkbox"
                        id="available"
                    >

                    <label
                        class="fw-bold"
                        for="available"
                    >
                        Available today
                    </label>

                </div>


                <button
                    class="btn pink"
                    @click="submitDish"
                >
                    Add Dish
                </button>

            </div>

        </div>

    </div>

</template>


<style scoped>

.add-dish-box {
    padding: 16px;
    border: 3px dashed var(--ink);
    border-radius: 18px;
    background: var(--paper);
}

.row-fields {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
}

.row-fields .grow {
    flex: 1;
    min-width: 220px;
}

.price-field {
    width: 170px;
}

.chip-wrap {
    position: relative;
}

</style>