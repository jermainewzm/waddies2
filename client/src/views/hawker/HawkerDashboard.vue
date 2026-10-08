<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

import StallStatusCard from '../../components/hawker/StallStatusCard.vue'



const stall = ref(null)
const errorMsg = ref('')
const loading = ref(true)

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

onMounted(() => {
    loadStall()
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
            

        </div>

    </div>

</template>