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

    <div class="card panel mb-4">

        <h3>
            Today's Shout-out
        </h3>

        <p class="shout-sub">
            This is what diners see on your stall page.
        </p>


        <!-- current shout-out -->
        <div
            v-if="shoutout"
            class="bubble"
        >
            "{{ shoutout.message }}"
        </div>

        <p
            v-else
            class="mb-3"
        >
            No shout-out posted today.
        </p>


        <!-- shout-out input -->
        <div class="field">

            <label
                class="lbl"
                for="shoutoutText"
            >
                Shout-out to diners
            </label>


            <div class="shoutout-row">

                <textarea
                    id="shoutoutText"
                    :value="message"
                    @input="emit('update-message', $event.target.value)"
                    maxlength="80"
                    class="form-control cute-input"
                    rows="3"
                    placeholder="Fresh batch out now!"
                ></textarea>


                <button
                    class="btn yellow"
                    @click="emit('save-shoutout')"
                >
                    {{ shoutout ? 'Update' : 'Post' }}
                </button>

            </div>


            <!-- character counter -->
            <div class="counter">

                <div class="meter">

                    <div
                        class="meter-fill"
                        :class="{ near: message.length >= 65 }"
                        :style="{
                            width: (message.length / 80 * 100) + '%'
                        }"
                    ></div>

                </div>

                <p class="count-text">
                    {{ message.length }}/80
                </p>

            </div>

        </div>

    </div>

</template>


<style scoped>

.shout-sub {
    color: var(--muted);
    font-size: 15px;
    margin-bottom: 18px;
}


.shoutout-row {
    display: flex;
    gap: 10px;
    align-items: flex-start;
}


.shoutout-row textarea {
    flex: 1;
}


.bubble {
    position: relative;
    margin-bottom: 30px;
    padding: 16px 20px;
    background: var(--paper);
    border: 3px solid var(--ink);
    border-radius: 20px;
    box-shadow: 4px 4px 0 var(--ink);
    font-weight: 800;
    font-size: 20px;
}


.bubble::after {
    content: "";
    position: absolute;
    left: 34px;
    bottom: -14px;
    width: 22px;
    height: 22px;
    background: var(--paper);
    border-right: 3px solid var(--ink);
    border-bottom: 3px solid var(--ink);
    transform: rotate(45deg);
}


.counter {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 10px;
}


.meter {
    flex: 1;
    height: 14px;
    border: 3px solid var(--ink);
    border-radius: 999px;
    background: var(--paper);
    overflow: hidden;
}


.meter-fill {
    height: 100%;
    background: var(--lilac);
    transition:
        width .15s ease,
        background .15s ease;
}


.meter-fill.near {
    background: var(--tomato);
}


.count-text {
    margin: 0;
    font-size: 15px;
    font-weight: 800;
}


@media (max-width: 700px) {
    .shoutout-row {
        flex-direction: column;
    }
}

</style>


<!-- Notes -->
<!-- props go down, emits go up -->
<!-- parent passes message down as a prop -->
<!-- user types in child -->
<!-- child emits update-message back to HawkerDashboard -->
<!-- HawkerDashboard updates shoutoutMessage -->
<!-- updated value comes back down through the message prop -->