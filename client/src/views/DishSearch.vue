<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { API_URL } from '@/utils/constants'

import DishSearchForm from '../components/DishSearchForm.vue'
import DishSearchResults from '../components/DishSearchResults.vue'
import StallMenu from '../components/StallMenu.vue'

// search results
const results = ref([])
const loading = ref(false)
const errorMessage = ref('')
const hasSearched = ref(false)

// stall menu (null = not showing)
const selectedMenu = ref(null)
const menuError = ref('')

// add to plan
const planCentreId = ref(null)   // which centre's form is open
const planCode = ref('')         // remembers the last code used
const planLoading = ref(false)
const planError = ref('')
const addedCentres = ref({})     // { centre_id: plan code } for centres added this visit

// runs when DishSearchForm emits 'search'
// search = { q, diet, maxPrice }
async function searchDishes(search) {
    loading.value = true
    errorMessage.value = ''
    selectedMenu.value = null
    planCentreId.value = null

    const params = {
        q: search.q,
        diet: search.diet
    }

    // only send maxPrice if the price chip is on
    if (search.maxPrice !== '') {
        params.maxPrice = search.maxPrice
    }

    try {
        const response = await axios.get(`${API_URL}/dishes/search`, { params })
        results.value = response.data.results
    } catch (error) {
        errorMessage.value = error.response ? error.response.data.error : "Can't reach the server."
        results.value = [] // so old results don't stay on screen
    } finally {
        loading.value = false
        hasSearched.value = true
    }
}

// runs when a stall name is clicked
async function viewMenu(stall) {
    menuError.value = ''

    try {
        const response = await axios.get(`${API_URL}/dishes/stalls/${stall.stall_id}/menu`)
        selectedMenu.value = response.data
        window.scrollTo(0, 0) // the menu shows at the top of the page
    } catch (error) {
        menuError.value = error.response ? error.response.data.error : "Can't reach the server."
    }
}

function closeMenu() {
    selectedMenu.value = null
}

// runs when "Add to plan" is clicked: opens the plan code form for that centre
function openPlanForm(centre) {
    planCentreId.value = centre.centre_id
    planError.value = ''
}

function cancelPlan() {
    planCentreId.value = null
    planError.value = ''
}

// runs when the plan code form is submitted
// data = { centre, code, name }
async function addToPlan(data) {
    planLoading.value = true
    planError.value = ''

    try {
        await axios.post(`${API_URL}/plans/${data.code}/shortlist`, {
            centre_id: data.centre.centre_id,
            added_by: data.name
        })

        // remember it so the card shows "Added to plan ..."
        addedCentres.value = { ...addedCentres.value, [data.centre.centre_id]: data.code }
        planCode.value = data.code
        planCentreId.value = null
    } catch (error) {
        planError.value = error.response ? error.response.data.error : "Can't reach the server."
    } finally {
        planLoading.value = false
    }
}
</script>

<template>
    <div class="container">

        <h1>Find a dish</h1>

        <DishSearchForm @search="searchDishes" />

        <p v-if="menuError">
            {{ menuError }}
        </p>

        <StallMenu
            v-if="selectedMenu"
            :menu="selectedMenu"
            @close="closeMenu"
        />

        <DishSearchResults
            :results="results"
            :loading="loading"
            :error-message="errorMessage"
            :has-searched="hasSearched"
            :plan-centre-id="planCentreId"
            :plan-code="planCode"
            :plan-loading="planLoading"
            :plan-error="planError"
            :added-centres="addedCentres"
            @view-menu="viewMenu"
            @open-plan-form="openPlanForm"
            @submit-plan="addToPlan"
            @cancel-plan="cancelPlan"
        />

    </div>
</template>


<!-- Notes -->

<!-- this page holds all the data and does every axios call -->
<!-- search: form emits 'search' -> searchDishes() -> results go DOWN to DishSearchResults -->
<!-- menu:   stall name emits 'view-menu' -> viewMenu() -> menu goes DOWN to StallMenu -->
<!-- plan:   'open-plan-form' opens the form, 'submit-plan' -> addToPlan() -> POST /plans/:code/shortlist -->
