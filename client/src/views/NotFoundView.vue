<script setup>
import { RouterLink } from "vue-router"
</script>

<template>
  <main class="bg-tiles not-found">
    <div class="container py-5 text-center">
      <svg width="90" height="99" ><use href="#av-tissue"/></svg>

      <h1 class="outline mt-3 mb-2">Page not found</h1>
      <p class="mb-4">Aiyo, that page doesn't exist. Check the link, or head back.</p>

      <RouterLink class="btn big red" to="/">Back to home</RouterLink>
      
    </div>
  </main>
</template>

<style scoped>
.not-found {
  min-height: calc(100vh - 72px);   /* full screen minus the 72px header */
}

.not-found h1 {
  font-size: clamp(40px, 7vw, 72px);
  color: var(--paper);
}

.not-found svg {
  animation: bob 2.6s ease-in-out infinite;
}

@keyframes bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-7px); }
}
</style>