<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { API_URL } from '../utils/constants'

import StallStatusCard from '../components/StallStatusCard.vue'
import RestDaysForm from '../components/RestDaysForm.vue'
import DishList from '../components/Dishlist.vue'
import DishForm from '../components/DishForm.vue'
import ShoutoutForm from '../components/ShoutoutForm.vue'


const stall = ref(null)
const errorMsg = ref('')

const statusError = ref('')
const restDaysError = ref('')
const dishError = ref('')
const shoutoutError = ref('')
const restDaysSuccess = ref('')

const loading = ref(true)

const dishes = ref([])

const shoutout = ref(null)
const shoutoutMessage = ref('')


// stalls

async function loadStall() {
    try {
        const response = await axios.get(
            `${API_URL}/hawker/my-stall`
        )

        stall.value = response.data
        errorMsg.value = ''

        return true

    } catch (error) {

        if (error.response?.status === 403) {
            errorMsg.value =
                'You do not have an approved stall yet.'
        } else {
            errorMsg.value =
                'Unable to load your stall.'
        }

        return false

    } finally {
        loading.value = false
    }
}


async function updateStatus(newStatus) {
    try {
        const response = await axios.patch(
            `${API_URL}/hawker/my-stall/status`,
            {
                status: newStatus
            }
        )

        stall.value = response.data
        statusError.value = ''

    } catch (error) {
        statusError.value =
            'Unable to update stall status.'
    }
}


// restdays

async function updateRestDays(newRestDays) {
    try {

        restDaysSuccess.value = ''

        const response = await axios.patch(
            `${API_URL}/hawker/my-stall/rest-days`,
            {
                rest_days: newRestDays
            }
        )

        stall.value = response.data

        restDaysError.value = ''

        restDaysSuccess.value =
            'Rest days saved!'

        setTimeout(() => {
            restDaysSuccess.value = ''
        }, 3000)

    } catch (error) {

        restDaysSuccess.value = ''

        restDaysError.value =
            'Unable to update rest days.'
    }
}

// dishes

async function loadDishes() {
    try {
        const response = await axios.get(
            `${API_URL}/hawker/my-stall/dishes`
        )

        dishes.value = response.data
        dishError.value= ''

    } catch (error) {
        dishError.value =
            'Unable to load dishes.'
    }
}


async function deleteDish(id) {
    try {
        await axios.delete(
            `${API_URL}/hawker/dishes/${id}`
        )

        await loadDishes()
        dishError.value = ''

    } catch (error) {
        dishError.value =
            'Unable to delete dish.'
    }
}


async function addDish(newDish) {
    try {
        await axios.post(
            `${API_URL}/hawker/my-stall/dishes`,
            newDish
        )

        await loadDishes()
        dishError.value = ''

    } catch (error) {
        dishError.value =
            'Unable to add dish.'
    }
}


async function updateDish(id, updatedDish) {
    try {
        await axios.patch(
            `${API_URL}/hawker/dishes/${id}`,
            updatedDish
        )

        await loadDishes()
        dishError.value = ''

    } catch (error) {
        dishError.value =
            'Unable to update dish.'
    }
}

// shoutouts

async function loadShoutout() {
    try {
        const response = await axios.get(
            `${API_URL}/hawker/my-stall/shoutout`
        )

        shoutout.value = response.data

        if (response.data) {
            shoutoutMessage.value =
                response.data.message
        } else {
            shoutoutMessage.value = ''
        }

        shoutoutError.value = ''

    } catch (error) {
        shoutoutError.value =
            'Unable to load today\'s shout-out.'
    }
}


async function saveShoutout() {
    try {
        const response = await axios.post(
            `${API_URL}/hawker/my-stall/shoutout`,
            {
                message: shoutoutMessage.value
            }
        )

        shoutout.value =
            response.data.shoutout

        shoutoutMessage.value = ''

        shoutoutError.value = ''

    } catch (error) {
        shoutoutError.value =
            'Unable to save shout-out.'
    }
}

onMounted(async () => {

    const approvedHawker =
        await loadStall()

    if (approvedHawker) {
        await loadDishes()
        await loadShoutout()
    }

})
</script>


<template>
    <main class="bg-tiles">
    <div class="container py-4">

        <h1 class="outline hawker-title">
            Hawker Dashboard
        </h1>

        <p v-if="loading">
            Loading stall...
        </p>

        <div
            v-if="errorMsg"
            class="alert alert-danger"
        >
            {{ errorMsg }}
        </div>

        <div v-if="stall">

            <!-- decorative stall awning -->
            <div
                class="awning"
                aria-hidden="true"
            ></div>


            <!-- stall summary -->
            <div class="card panel hawker-summary mb-4">

                <div class="summary-row">

                    <div>

                        <p class="lbl">
                            Centre {{ stall.centre_id }}
                        </p>

                        <h2 class="stall-name">
                            {{ stall.name }}
                        </h2>

                    </div>


                    <div class="unit-plate">

                        <span class="unit-label">
                            STALL
                        </span>

                        <span class="stall-unit">
                            {{ stall.unit_no }}
                        </span>

                    </div>

                </div>

            </div>


            <!-- stall status -->
            <StallStatusCard
                :status="stall.status"
                @update-status="updateStatus"
            />

            <div
                v-if="statusError"
                class="alert alert-danger mt-2"
            >
                {{ statusError }}
            </div>


            <!-- rest days -->
            <RestDaysForm
                :rest-days="stall.rest_days"
                @update-rest-days="updateRestDays"
            />

            <div
                v-if="restDaysSuccess"
                class="cute-success"
            >
                ✓ {{ restDaysSuccess }}
            </div>

            <div
                v-if="restDaysError"
                class="alert alert-danger mt-2"
            >
                {{ restDaysError }}
            </div>

            <!-- add dish -->
            <DishForm
                @add-dish="addDish"
            />

            <div
                v-if="dishError"
                class="alert alert-danger mt-2"
            >
                {{ dishError }}
            </div>


            <!-- menu -->
            <DishList
                :dishes="dishes"
                @delete-dish="deleteDish"
                @update-dish="updateDish"
            />


            <!-- shout-out -->
            <ShoutoutForm
                :shoutout="shoutout"
                :message="shoutoutMessage"
                @update-message="shoutoutMessage = $event"
                @save-shoutout="saveShoutout"
            />

            <div
                v-if="shoutoutError"
                class="alert alert-danger mt-2"
            >
                {{ shoutoutError }}
            </div>

        </div>

    </div>
</main>
</template>


<style scoped>

.hawker-title {
    color: var(--paper);
    font-size: clamp(44px, 6vw, 72px);
    margin-bottom: 24px;
}


.hawker-summary {
    margin-top: 6px;
    margin-bottom: 24px;
}


.summary-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
}


.stall-name {
    font-size: 40px;
    margin: 6px 0 0;
}


.unit-plate {
    display: flex;
    flex-direction: column;
    align-items: center;

    padding: 8px 18px;

    background: var(--paper);

    border: 3px solid var(--ink);
    border-radius: 14px;

    box-shadow: 4px 4px 0 var(--ink);

    transform: rotate(-3deg);
}


.unit-label {
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 2px;
}


.stall-unit {
    font-size: 28px;
    font-weight: 800;
    line-height: 1;
}

.cute-success {
    display: inline-block;

    margin-top: -8px;
    margin-bottom: 24px;

    padding: 10px 18px;

    background: var(--pandan);

    border: 3px solid var(--ink);
    border-radius: 14px;

    box-shadow: 4px 4px 0 var(--ink);

    font-weight: 800;

    animation: pop-in .18s ease;
}

@keyframes pop-in {
    from {
        transform: scale(.9);
        opacity: 0;
    }

    to {
        transform: scale(1);
        opacity: 1;
    }
}

</style>