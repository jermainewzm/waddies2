<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

import StallStatusCard from '../../components/hawker/StallStatusCard.vue'
import RestDaysForm from '../../components/hawker/RestDaysForm.vue'
import DishList from '../../components/hawker/Dishlist.vue'
import DishForm from '../../components/hawker/DishForm.vue'
import ShoutoutForm from '../../components/hawker/ShoutoutForm.vue'


const stall = ref(null)
const errorMsg = ref('')
const loading = ref(true)

// stall status 

async function loadStall() {
    try {
        const response = await axios.get(
            'http://localhost:8000/api/hawker/my-stall'
        )

        stall.value = response.data
        errorMsg.value = ''

    } catch (error) {
        errorMsg.value = 'Unable to load your stall.'

    } finally {
        loading.value = false
    }
}

async function updateStatus(newStatus) {
    try {
        const response = await axios.patch(
            'http://localhost:8000/api/hawker/my-stall/status',
            {
                status: newStatus
            }
        )

        stall.value = response.data
        errorMsg.value = ''

    } catch (error) {
        errorMsg.value = 'Unable to update stall status.'
    }
}

// rest days update

async function updateRestDays(newRestDays) {
    try {
        const response = await axios.patch(
            'http://localhost:8000/api/hawker/my-stall/rest-days',
            {
                rest_days: newRestDays
            }
        )

        stall.value = response.data
        errorMsg.value = ''

    } catch (error) {
        errorMsg.value = 'Unable to update rest days.'
    }
}

// dish crud 

const dishes = ref([])

async function loadDishes() {
    try {
        const response = await axios.get(
            'http://localhost:8000/api/hawker/my-stall/dishes'
        )

        dishes.value = response.data

    } catch (error) {
        errorMsg.value = 'Unable to load dishes.'
    }
}

async function deleteDish(id) {
    try {
        await axios.delete(
            `http://localhost:8000/api/hawker/dishes/${id}`
        )

        await loadDishes()

    } catch (error) {
        errorMsg.value = 'Unable to delete dish.'
    }
}

async function addDish(newDish) {
    try {
        await axios.post(
            'http://localhost:8000/api/hawker/my-stall/dishes',
            newDish
        )

        await loadDishes()
        errorMsg.value = ''

    } catch (error) {
        errorMsg.value = 'Unable to add dish.'
    }
}

async function updateDish(id, updatedDish) {
    try {
        await axios.patch(
            `http://localhost:8000/api/hawker/dishes/${id}`,
            updatedDish
        )

        await loadDishes()
        errorMsg.value = ''

    } catch (error) {
        errorMsg.value = 'Unable to update dish.'
    }
}

// shoutouts

const shoutout = ref(null)
const shoutoutMessage = ref('')

async function loadShoutout() {
    try {
        const response = await axios.get(
            'http://localhost:8000/api/hawker/my-stall/shoutout'
        )

        shoutout.value = response.data

        if (response.data) {
            shoutoutMessage.value = response.data.message
        } else {
            shoutoutMessage.value = ''
        }

    } catch (error) {
        errorMsg.value = 'Unable to load today\'s shout-out.'
    }
}

async function saveShoutout() {
    try {
        const response = await axios.post(
            'http://localhost:8000/api/hawker/my-stall/shoutout',
            {
                message: shoutoutMessage.value
            }
        )

        shoutout.value = response.data.shoutout
        shoutoutMessage.value = response.data.shoutout.message

    } catch (error) {
        errorMsg.value = 'Unable to save shout-out.'
    }
}

onMounted(() => {
    loadStall()
    loadDishes()
    loadShoutout()
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

        <p
            v-if="errorMsg"
            class="text-danger"
        >
            {{ errorMsg }}
        </p>

        <div v-if="stall">

            <div class="mb-4">

                <h2>
                    {{ stall.name }}
                </h2>

                <p class="mb-1">
                    Unit {{ stall.unit_no }}
                </p>

                <p>
                    Centre ID: {{ stall.centre_id }}
                </p>

            </div>

            <StallStatusCard
                :status="stall.status"
                @update-status="updateStatus"
            />

            <RestDaysForm
                :rest-days="stall.rest_days"
                @update-rest-days="updateRestDays"
            />

            <DishForm
                @add-dish="addDish"
            />

            <DishList
                :dishes="dishes"
                @delete-dish="deleteDish"
                @update-dish="updateDish"
            />

            <ShoutoutForm
                :shoutout="shoutout"
                :message="shoutoutMessage"
                @update-message="shoutoutMessage = $event"
                @save-shoutout="saveShoutout"
            />
        </div>

    </div>

</template>

<!-- Notes -->
<!-- here, :status and :rest-days are not v-bind classes, but props you have created in the component files. these props are recieiving data -->