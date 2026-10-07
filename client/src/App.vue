<script setup>
import {
  RouterLink,
  RouterView
} from "vue-router"
</script>

<template>
  <nav
    class="navbar navbar-expand-lg app-navbar"
    data-bs-theme="light"
  >
    <div class="container">
      <RouterLink
        to="/"
        class="navbar-brand brand"
      >
        HawkerHop
      </RouterLink>

      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#mainNav"
        aria-controls="mainNav"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span
          class="navbar-toggler-icon"
        ></span>
      </button>

      <div
        id="mainNav"
        class="collapse navbar-collapse"
      >
        <ul
          class="navbar-nav ms-auto"
        >
          <li class="nav-item">
            <RouterLink
              to="/centres"
              class="nav-link"
            >
              Centres
            </RouterLink>
          </li>

          <li class="nav-item">
            <RouterLink
              to="/plan/new"
              class="nav-link"
            >
              Start a plan
            </RouterLink>
          </li>

          <li class="nav-item">
            <RouterLink
              to="/plan/join"
              class="nav-link"
            >
              Join a plan
            </RouterLink>
          </li>

          <li class="nav-item">
            <RouterLink
              to="/hawker/dashboard"
              class="nav-link"
            >
              For hawkers
            </RouterLink>
          </li>
        </ul>
      </div>
    </div>
  </nav>

  <RouterView />
</template>

<style scoped>
.app-navbar {
  width: 100%;
  background: white;

  border-bottom:
    1px solid rgba(
      59,
      42,
      32,
      0.08
    );
}

.brand {
  color: var(--hh-red);
  font-weight: 900;
}

.nav-link {
  font-weight: 600;
  color: var(--hh-kopi);
}

.nav-link:hover {
  color: var(--hh-red);
}

.router-link-exact-active.nav-link {
  color: var(--hh-red);
}
</style>