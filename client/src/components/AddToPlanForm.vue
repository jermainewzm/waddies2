<script setup>
import { ref } from 'vue'

const props = defineProps({
    planCode: { type: String, default: '' },
    loading: { type: Boolean, default: false },
    errorMessage: { type: String, default: '' }
})

const emit = defineEmits([
    'submit-plan',
    'cancel'
])

// starts with the last plan code used, so adding a 2nd centre is quicker
const code = ref(props.planCode)
const name = ref('')
const formError = ref('')

function submitPlan() {
    formError.value = ''

    // plan codes are 6 digits (see generateCode in plan-controller)
    if (!/^\d{6}$/.test(code.value.trim())) {
        formError.value = 'Plan code must be 6 digits.'
        return
    }

    emit('submit-plan', {
        code: code.value.trim(),
        name: name.value.trim()
    })
}
</script>

<template>
    <div>

        <label>
            Plan code
            <input
                v-model="code"
                type="text"
                inputmode="numeric"
                maxlength="6"
                placeholder="123456"
            >
        </label>

        <label>
            Your name (optional)
            <input
                v-model="name"
                type="text"
                maxlength="30"
            >
        </label>

        <p v-if="formError || errorMessage">
            {{ formError || errorMessage }}
        </p>

        <button :disabled="loading" @click="submitPlan">
            {{ loading ? 'Adding...' : 'Add' }}
        </button>

        <button @click="emit('cancel')">
            Cancel
        </button>

    </div>
</template>


<!-- Notes -->

<!-- parent sends planCode, loading, errorMessage DOWN -->
<!-- Add emits 'submit-plan' UP with { code, name }, Cancel emits 'cancel' UP -->