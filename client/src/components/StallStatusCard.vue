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

function formatStatus(status) {
    const labels = {
        open: "Open",
        sold_out: "Sold Out",
        closed_early: "Closed Early",
        closed: "Closed"
    }

    return labels[status] || status
}

</script>


<template>

    <div class="card panel mb-4">

        <div class="status-head">

            <h3>
                Stall Status
            </h3>

            <span
                :class="[
                    'status-pill',
                    'status-' + status
                ]"
            >
                {{ formatStatus(status) }}
            </span>

        </div>


        <p class="mb-3 status-sub">
            Current status:
            <strong>
                {{ formatStatus(status) }}
            </strong>
        </p>


        <div class="status-grid">

            <button
                class="btn green"
                :class="{ pressed: status === 'open' }"
                @click="changeStatus('open')"
            >
                Open
            </button>

            <button
                class="btn orange"
                :class="{ pressed: status === 'sold_out' }"
                @click="changeStatus('sold_out')"
            >
                Sold Out
            </button>

            <button
                class="btn yellow"
                :class="{ pressed: status === 'closed_early' }"
                @click="changeStatus('closed_early')"
            >
                Closed Early
            </button>

            <button
                class="btn red"
                :class="{ pressed: status === 'closed' }"
                @click="changeStatus('closed')"
            >
                Closed
            </button>

        </div>

    </div>

</template>


<style scoped>

.status-head {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
}

.status-sub {
    margin-top: 6px;
}

.status-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
}

.status-pill {
    display: inline-block;
    padding: 4px 16px;
    border: 3px solid var(--ink);
    border-radius: 999px;
    font-weight: 800;
    font-size: 18px;
    transform: rotate(-2deg);
    background: var(--paper);
}

.status-open {
    background: var(--pandan);
}

.status-sold_out {
    background: var(--orange);
}

.status-closed_early {
    background: var(--sun);
}

.status-closed {
    background: var(--tomato);
}


@media (max-width: 600px) {

    .status-grid {
        grid-template-columns: 1fr;
    }

}

</style>


<!-- Notes -->
<!-- emit is how a child Vue component sends a message to its parent -->
<!-- parent sends data DOWN with :status="stall.status" -->
<!-- child sends an event UP with emit('update-status', newStatus) -->