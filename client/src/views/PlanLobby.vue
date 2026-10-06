<script setup>
import { ref, computed } from "vue"
import axios from "axios"
import { API_URL } from "@/utils/constants"
import { useRoute } from "vue-router"

const route = useRoute()

const code = route.params.code
console.log(code)
</script>


<template>
</template>