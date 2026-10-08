<script setup>

defineProps({
    status: {
        type: String,
        required: true
    }
})

const emit = defineEmits([
    'update-status'
])

function changeStatus(newStatus) {
    emit('update-status', newStatus)
}

</script>


<template>

    <div class="card p-3 mb-4">

        <h3>
            Stall Status
        </h3>

        <p>
            Current status:
            <strong>
                {{ status }}
            </strong>
        </p>

        <div class="d-flex flex-wrap gap-2">

            <button
                class="btn btn-success"
                @click="changeStatus('open')"
            >
                Open
            </button>

            <button
                class="btn btn-warning"
                @click="changeStatus('sold_out')"
            >
                Sold Out
            </button>

            <button
                class="btn btn-secondary"
                @click="changeStatus('closed_early')"
            >
                Closed Early
            </button>

            <button
                class="btn btn-danger"
                @click="changeStatus('closed')"
            >
                Closed
            </button>

        </div>

    </div>

</template>


<!-- Notes -->

<!-- emit is how a child vue component sends a message to its parent  -->
<!-- here, parent sends data DOWN with :status="stall.status", then child sends a corr event UP with emit -->