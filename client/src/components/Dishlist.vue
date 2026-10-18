<script setup>
import { ref } from 'vue'
import { DIET_OPTIONS } from '../utils/constants'

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


function getDietLabel(tag) {
    const option = DIET_OPTIONS.find(
        item => item.value === tag
    )

    return option ? option.label : tag
}


function startEdit(dish) {
    editingId.value = dish._id

    editName.value = dish.name
    editPrice.value = dish.price
    editAvailable.value = dish.is_available

    editVegetarian.value =
        dish.tags.includes('vegetarian')

    editHalal.value =
        dish.tags.includes('halal')

    editNoPork.value =
        dish.tags.includes('no_pork')

    editNoBeef.value =
        dish.tags.includes('no_beef')
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

function blockBadKeys(event) {
    if (["-", "+", "e", "E"].includes(event.key)) {
        event.preventDefault()
    }
}

</script>


<template>

    <div class="card panel mb-4">

        <h3>
            Menu
        </h3>

        <p v-if="dishes.length === 0">
            No dishes added yet.
        </p>


        <div class="menu-grid">

            <div
                v-for="dish in dishes"
                :key="dish._id"
                class="dish-card"
                :class="{ editing: editingId === dish._id }"
            >

                <!-- normal display -->
                <div
                    v-if="editingId !== dish._id"
                    class="dish-view"
                >

                    <div class="dish-top">

                        <h5 class="dish-name">
                            {{ dish.name }}
                        </h5>

                        <span class="price-tag">
                            ${{ dish.price.toFixed(2) }}
                        </span>

                    </div>


                    <div
                        v-if="dish.tags.length > 0"
                        class="tag-row"
                    >

                        <span
                            v-for="tag in dish.tags"
                            :key="tag"
                            class="tag-sticker"
                        >
                            {{ getDietLabel(tag) }}
                        </span>

                    </div>


                    <div class="dish-bottom">

                        <span
                            class="avail-badge"
                            :class="
                                dish.is_available
                                    ? 'is-on'
                                    : 'is-off'
                            "
                        >
                            {{
                                dish.is_available
                                    ? 'Available'
                                    : 'Unavailable'
                            }}
                        </span>


                        <div class="dish-tools">

                            <button
                                class="icon-btn yellow-bg"
                                aria-label="Edit dish"
                                title="Edit"
                                @click="startEdit(dish)"
                            >
                                ✏️
                            </button>

                            <button
                                class="icon-btn red-bg"
                                aria-label="Delete dish"
                                title="Delete"
                                @click="removeDish(dish._id)"
                            >
                                🗑️
                            </button>

                        </div>

                    </div>

                </div>


                <!-- edit mode -->
                <div v-else>

                    <div class="row-fields mb-3">

                        <div class="grow">

                            <label
                                class="form-label fw-bold"
                                :for="'edit-name-' + dish._id"
                            >
                                Dish Name
                            </label>

                            <input
                                v-model="editName"
                                class="form-control cute-input"
                                :id="'edit-name-' + dish._id"
                            >

                        </div>


                        <div class="price-field">

                            <label
                                class="form-label fw-bold"
                                :for="'edit-price-' + dish._id"
                            >
                                Price ($)
                            </label>

                            <input
                                v-model="editPrice"
                                type="number"
                                min="0.01"
                                step="0.01"
                                class="form-control cute-input"
                                :id="'edit-price-' + dish._id"
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
                                    v-model="editVegetarian"
                                    class="chip-input green"
                                    type="checkbox"
                                    :id="'edit-vegetarian-' + dish._id"
                                >

                                <label
                                    class="chip"
                                    :for="'edit-vegetarian-' + dish._id"
                                >
                                    Vegetarian
                                </label>

                            </div>


                            <div class="chip-wrap">

                                <input
                                    v-model="editHalal"
                                    class="chip-input green"
                                    type="checkbox"
                                    :id="'edit-halal-' + dish._id"
                                >

                                <label
                                    class="chip"
                                    :for="'edit-halal-' + dish._id"
                                >
                                    Halal
                                </label>

                            </div>


                            <div class="chip-wrap">

                                <input
                                    v-model="editNoPork"
                                    class="chip-input"
                                    type="checkbox"
                                    :id="'edit-no-pork-' + dish._id"
                                >

                                <label
                                    class="chip"
                                    :for="'edit-no-pork-' + dish._id"
                                >
                                    No Pork
                                </label>

                            </div>


                            <div class="chip-wrap">

                                <input
                                    v-model="editNoBeef"
                                    class="chip-input"
                                    type="checkbox"
                                    :id="'edit-no-beef-' + dish._id"
                                >

                                <label
                                    class="chip"
                                    :for="'edit-no-beef-' + dish._id"
                                >
                                    No Beef
                                </label>

                            </div>

                        </div>

                    </div>


                    <!-- availability -->
                    <div
                        class="d-flex align-items-center justify-content-between flex-wrap gap-3"
                    >

                        <div class="d-flex align-items-center gap-2">

                            <input
                                v-model="editAvailable"
                                type="checkbox"
                                class="switch-input"
                                :id="'available-' + dish._id"
                            >

                            <label
                                class="fw-bold"
                                :for="'available-' + dish._id"
                            >
                                Available
                            </label>

                        </div>


                        <div class="dish-tools">

                            <button
                                class="btn green"
                                @click="saveEdit(dish)"
                            >
                                Save
                            </button>

                            <button
                                class="btn"
                                @click="cancelEdit"
                            >
                                Cancel
                            </button>

                        </div>

                    </div>

                </div>

            </div>

        </div>

    </div>

</template>


<style scoped>

.menu-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
    margin-top: 16px;
}


.dish-card {
    display: flex;
    flex-direction: column;
    padding: 16px;
    background: var(--paper);
    border: 3px solid var(--ink);
    border-radius: 18px;
}


.dish-card.editing {
    grid-column: 1 / -1;
}


.dish-view {
    display: flex;
    flex-direction: column;
    gap: 12px;
    height: 100%;
}


.dish-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
}


.dish-name {
    margin: 0;
    font-size: 22px;
    font-weight: 800;
}


.price-tag {
    flex-shrink: 0;
    padding: 4px 12px;
    background: var(--sun);
    border: 3px solid var(--ink);
    border-radius: 10px;
    box-shadow: 3px 3px 0 var(--ink);
    font-weight: 800;
    font-size: 20px;
    transform: rotate(4deg);
}


.tag-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}


.tag-sticker {
    padding: 2px 12px;
    background: var(--cream);
    border: 2px solid var(--ink);
    border-radius: 999px;
    font-weight: 800;
    font-size: 14px;
}


.dish-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: auto;
}


.avail-badge {
    padding: 2px 12px;
    border: 2px solid var(--ink);
    border-radius: 999px;
    font-weight: 800;
    font-size: 14px;
}


.avail-badge.is-on {
    background: var(--pandan);
}


.avail-badge.is-off {
    background: var(--line);
}


.dish-tools {
    display: flex;
    gap: 10px;
}


.icon-btn {
    width: 44px;
    height: 44px;

    display: flex;
    align-items: center;
    justify-content: center;

    padding: 0;

    border: 3px solid var(--ink);
    border-radius: 12px;

    box-shadow: 3px 3px 0 var(--ink);

    cursor: pointer;
    transition:
        transform .12s ease,
        box-shadow .12s ease;
}


.icon-btn:hover {
    transform: translate(-1px, -1px);
    box-shadow: 4px 4px 0 var(--ink);
}


.icon-btn:active {
    transform: translate(2px, 2px);
    box-shadow: 1px 1px 0 var(--ink);
}


.yellow-bg {
    background: var(--sun);
}


.red-bg {
    background: var(--tomato);
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


@media (max-width: 760px) {

    .menu-grid {
        grid-template-columns: 1fr;
    }

}

</style>