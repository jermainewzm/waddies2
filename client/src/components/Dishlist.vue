<script setup>
import { ref } from 'vue'

const props = defineProps({
    dishes: {
        type: Array,
        required: true
    }
})

const emit = defineEmits([
    'delete-dish',
    'update-dish'
])

const editingId = ref(null)

const editName = ref('')
const editPrice = ref('')
const editAvailable = ref(true)
const editVegetarian = ref(false)
const editHalal = ref(false)
const editNoPork = ref(false)
const editNoBeef = ref(false)

function startEdit(dish) {
    editingId.value = dish._id

    editName.value = dish.name
    editPrice.value = dish.price
    editAvailable.value = dish.is_available

    editVegetarian.value = dish.tags.includes('vegetarian')
    editHalal.value = dish.tags.includes('halal')
    editNoPork.value = dish.tags.includes('no_pork')
    editNoBeef.value = dish.tags.includes('no_beef')
}

function saveEdit(dish) {
    const updatedTags = []

    if (editVegetarian.value) {
        updatedTags.push('vegetarian')
    }

    if (editHalal.value) {
        updatedTags.push('halal')
    }

    if (editNoPork.value) {
        updatedTags.push('no_pork')
    }

    if (editNoBeef.value) {
        updatedTags.push('no_beef')
    }

    emit(
        'update-dish',
        dish._id,
        {
            name: editName.value,
            price: Number(editPrice.value),
            is_available: editAvailable.value,
            tags: updatedTags
        }
    )

    editingId.value = null
}

function cancelEdit() {
    editingId.value = null
}

function removeDish(id) {
    emit('delete-dish', id)
}
</script>

<template>
    <div class="card p-3 mb-4">

        <h3>Menu</h3>

        <p v-if="dishes.length === 0">
            No dishes added yet.
        </p>

        <div
            v-for="dish in dishes"
            :key="dish._id"
            class="border rounded p-3 mb-2"
        >

            <!-- normal display -->
            <div v-if="editingId !== dish._id">

                <h5>
                    {{ dish.name }}
                </h5>

                <p>
                    ${{ dish.price.toFixed(2) }}
                </p>

                <p>
                    Available:
                    {{ dish.is_available ? 'Yes' : 'No' }}
                </p>

                <p>
                    Tags:
                    {{ dish.tags.length > 0
                        ? dish.tags.join(', ')
                        : 'None'
                    }}
                </p>

                <div class="d-flex gap-2">

                    <button
                        class="btn btn-warning"
                        @click="startEdit(dish)"
                    >
                        Edit
                    </button>

                    <button
                        class="btn btn-danger"
                        @click="removeDish(dish._id)"
                    >
                        Delete
                    </button>

                </div>

            </div>


            <!-- when editing -->
            <div v-else>

                <div class="mb-2">
                    <label class="form-label">
                        Dish Name
                    </label>

                    <input
                        v-model="editName"
                        class="form-control"
                    >
                </div>

                <div class="mb-2">
                    <label class="form-label">
                        Price
                    </label>

                    <input
                        v-model="editPrice"
                        type="number"
                        step="0.01"
                        class="form-control"
                    >
                </div>

                <div class="form-check mb-3">

                    <input
                        v-model="editAvailable"
                        type="checkbox"
                        class="form-check-input"
                        :id="'available-' + dish._id"
                    >

                    <label
                        class="form-check-label"
                        :for="'available-' + dish._id"
                    >
                        Available
                    </label>

                </div>

                <div class="mb-3">

                    <p class="mb-2">
                        Dietary Tags
                    </p>

                    <div class="form-check">
                        <input
                            v-model="editVegetarian"
                            class="form-check-input"
                            type="checkbox"
                            :id="'edit-vegetarian-' + dish._id"
                        >

                        <label
                            class="form-check-label"
                            :for="'edit-vegetarian-' + dish._id"
                        >
                            Vegetarian
                        </label>
                    </div>

                    <div class="form-check">
                        <input
                            v-model="editHalal"
                            class="form-check-input"
                            type="checkbox"
                            :id="'edit-halal-' + dish._id"
                        >

                        <label
                            class="form-check-label"
                            :for="'edit-halal-' + dish._id"
                        >
                            Halal
                        </label>
                    </div>

                    <div class="form-check">
                        <input
                            v-model="editNoPork"
                            class="form-check-input"
                            type="checkbox"
                            :id="'edit-no-pork-' + dish._id"
                        >

                        <label
                            class="form-check-label"
                            :for="'edit-no-pork-' + dish._id"
                        >
                            No Pork
                        </label>
                    </div>

                    <div class="form-check">
                        <input
                            v-model="editNoBeef"
                            class="form-check-input"
                            type="checkbox"
                            :id="'edit-no-beef-' + dish._id"
                        >

                        <label
                            class="form-check-label"
                            :for="'edit-no-beef-' + dish._id"
                        >
                            No Beef
                        </label>
                    </div>

                </div>

                <div class="d-flex gap-2">

                    <button
                        class="btn btn-success"
                        @click="saveEdit(dish)"
                    >
                        Save
                    </button>

                    <button
                        class="btn btn-secondary"
                        @click="cancelEdit"
                    >
                        Cancel
                    </button>

                </div>

            </div>

        </div>

    </div>
</template>