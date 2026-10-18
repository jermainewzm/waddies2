<script setup>
import { RouterLink } from "vue-router"
</script>

<template>
  <main class="container py-5 text-center">
    <h1 class="display-4 fw-bold">Page not found</h1>
    <p class="text-muted mb-4">That page doesn't exist. Check the link, or head back.</p>
    <RouterLink class="btn btn-hh-red" to="/">Back to home</RouterLink>
  </main>
</template>