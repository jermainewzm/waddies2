<script setup>

defineProps({
    shoutout: {
        type: Object,
        default: null
    },

    message: {
        type: String,
        required: true
    }
})

const emit = defineEmits([
    'update-message',
    'save-shoutout'
])
</script>

<template>
    <div class="card p-3 mb-4">

        <h3>Today's Shout-out</h3>

        <p v-if="shoutout">
            Current shout-out: "{{ shoutout.message }}"
        </p>

        <p v-else>
            No shout-out posted today.
        </p>

        <textarea
            :value="message"
            @input="emit('update-message', $event.target.value)"
            maxlength="80"
            class="form-control mb-2"
            rows="3"
            placeholder="Fresh batch out now!"
        ></textarea>

        <p>
            {{ message.length }}/80
        </p>

        <button
            class="btn btn-primary"
            @click="emit('save-shoutout')"
        >
            {{ shoutout ? 'Update Shout-out' : 'Post Shout-out' }}
        </button>

    </div>
</template>

<!-- Notes -->
<!-- props goes down, emits go up -->
<!-- parent value passed as prop and child displays it. user types in child. child emits new text up to parent. then parent updates shoutoutmessage. then updated value comes back down as a prop -->