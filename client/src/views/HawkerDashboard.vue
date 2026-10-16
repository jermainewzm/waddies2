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
        const response = await axios.patch(
            `${API_URL}/hawker/my-stall/rest-days`,
            {
                rest_days: newRestDays
            }
        )

        stall.value = response.data
        restDaysError.value = ''

    } catch (error) {
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

    <div class="container py-4">

        <h1 class="mb-4">
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

            <div class="mb-4">

                <h2>
                    {{ stall.name }}
                </h2>

                <p class="mb-1">
                    Unit {{ stall.unit_no }}
                </p>

                <p>
                    Centre ID:
                    {{ stall.centre_id }}
                </p>

            </div>


            <StallStatusCard
                :status="stall.status"
                @update-status="updateStatus"
            />

            <div  v-if="statusError"
                class="alert alert-danger mt-2">
                {{ statusError }}
            </div>


            <RestDaysForm
                :rest-days="stall.rest_days"
                @update-rest-days="updateRestDays"
            />

            <div
                v-if="restDaysError"
                class="alert alert-danger mt-2"
            >
                {{ restDaysError }}
            </div>
            
            <DishForm
                @add-dish="addDish"
            />

            <div
                v-if="dishError"
                class="alert alert-danger mt-2"
            >
                {{ dishError }}
            </div>

            <DishList
                :dishes="dishes"
                @delete-dish="deleteDish"
                @update-dish="updateDish"
            />


            <ShoutoutForm
                :shoutout="shoutout"
                :message="shoutoutMessage"
                @update-message="
                    shoutoutMessage = $event
                "
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

</template>

<!-- Notes -->
<!-- here, :status and :rest-days are not v-bind classes, but props you have created in the component files. these props are recieiving data -->