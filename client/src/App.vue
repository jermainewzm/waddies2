<script setup>
import { ref } from "vue"
import { RouterLink, RouterView } from "vue-router"
import HawkerArt from "./components/HawkerArt.vue"

// true while the phone menu is open
const menuOpen = ref(false)
</script>

<template>
  <!-- Shared SVG symbols, available to every page -->
  <HawkerArt />

  <header class="site-head">
    <div class="page">
      <RouterLink class="logo" to="/" v-on:click="menuOpen = false">
        <svg width="44" height="48" aria-hidden="true"><use href="#av-milo"/></svg>
        <b class="outline">HawkerHop</b>
      </RouterLink>

      <!-- Only shows on narrow screens (see the media query) -->
      <button type="button" class="btn sm menu-btn" v-on:click="menuOpen = !menuOpen" aria-label="Menu">
      {{ menuOpen ? "✕" : "☰" }}
      </button>

      <nav class="nav" v-bind:class="{ open: menuOpen }">
        <RouterLink class="link" to="/centres" v-on:click="menuOpen = false">Centres</RouterLink>
        <!-- REMOVED: Dish Search link. It only works inside a plan, so it opens from the plan lobby (/dish-search?plan=CODE) -->
        <RouterLink class="link" to="/hawker/dashboard" v-on:click="menuOpen = false">For hawkers</RouterLink>
        <RouterLink class="btn sm" to="/plan/join" v-on:click="menuOpen = false">Join with a code</RouterLink>
        <RouterLink class="btn sm red" to="/plan/new" v-on:click="menuOpen = false">Start a plan</RouterLink>
      </nav>
    </div>
  </header>

  <RouterView />
</template>

<style scoped>
.site-head {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: var(--sun);
  border-bottom: 4px solid var(--ink);
}

.site-head .page {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 10px;
  padding-bottom: 10px;
}

.nav .link {
  color: var(--ink);
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
}

.logo b {
  font-size: 30px;
  color: var(--paper);
}

.nav {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 18px;
  font-weight: 800;
}

.nav .link {
  text-decoration: none;
  padding: 4px 2px;
  border-bottom: 3px solid transparent;
}

.nav .link:hover,
.nav .link.router-link-active {
  border-bottom-color: var(--ink);
}

/* The menu button is hidden on wide screens */
.menu-btn {
  display: none;
}

@media (max-width: 760px) {
  .menu-btn {
    display: inline-flex;
  }
  .site-head .page {
    flex-wrap: wrap;
  }

  /* Hidden until the button opens it */
  .nav {
  display: none;
  width: 100%;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  padding: 12px 0 4px;
  font-size: 18px;
  }

  .nav .link {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: .02em;
  }

  .nav.open {
    display: flex;
  }

  .logo b {
    font-size: 24px;
  }
}
</style>