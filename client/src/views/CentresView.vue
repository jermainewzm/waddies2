<script setup>
import {
  computed,
  onMounted,
  onUnmounted,
  ref,
  watch
} from "vue"

import {
  getCentres
} from "@/services/centreService"

const centres = ref([])
const loading = ref(true)
const errorMessage = ref("")

const searchText = ref("")
const openOnly = ref(false)

const currentPage = ref(1)
const pageSize = 20

let refreshTimer = null

const filteredCentres = computed(() => {
  const query =
    searchText.value
      .trim()
      .toLowerCase()

  return centres.value
    .filter((centre) => {
      const matchesSearch =
        !query ||
        centre.name
          .toLowerCase()
          .includes(query) ||
        centre.address
          .toLowerCase()
          .includes(query)

      const matchesOpen =
        !openOnly.value ||
        centre.isOpen

      return (
        matchesSearch &&
        matchesOpen
      )
    })
    .sort((a, b) =>
      a.name.localeCompare(
        b.name,
        "en",
        {
          sensitivity: "base"
        }
      )
    )
})

const totalPages = computed(() =>
  Math.max(
    1,
    Math.ceil(
      filteredCentres.value.length /
      pageSize
    )
  )
)

const paginatedCentres = computed(() => {
  const start =
    (currentPage.value - 1) *
    pageSize

  return filteredCentres.value.slice(
    start,
    start + pageSize
  )
})

watch(
  [
    searchText,
    openOnly
  ],
  () => {
    currentPage.value = 1
  }
)

function goToPage(page) {
  if (
    page < 1 ||
    page > totalPages.value
  ) {
    return
  }

  currentPage.value = page

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  })
}

function previousPage() {
  goToPage(
    currentPage.value - 1
  )
}

function nextPage() {
  goToPage(
    currentPage.value + 1
  )
}

async function loadCentres(
  showLoader = true
) {
  if (showLoader) {
    loading.value = true
  }

  errorMessage.value = ""

  try {
    const data =
      await getCentres()

    centres.value =
      data.centres || []
  } catch (error) {
    errorMessage.value =
      error.response?.data?.error ||
      "Unable to load hawker centres."
  } finally {
    if (showLoader) {
      loading.value = false
    }
  }
}

function hideBrokenImage(event) {
  event.currentTarget.style.display =
    "none"
}

function crowdClass(level) {
  if (level === "plenty") {
    return "crowd-plenty"
  }

  if (level === "few") {
    return "crowd-few"
  }

  if (level === "full") {
    return "crowd-full"
  }

  return "crowd-none"
}

onMounted(() => {
  loadCentres()

  refreshTimer = setInterval(
    () => loadCentres(false),
    60000
  )
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
})
</script>

<template>
  <main class="bg-tiles">
  <div class="container py-4 py-md-5">
    <section class="centre-heading mb-4">
      <div
        class="d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3"
      >
        <div>
          <p class="section-kicker mb-1">
            LIVE CENTRE STATUS
          </p>

          <h1 class="hh-display mb-2">
            Hawker Centres
          </h1>

          <p class="text-muted mb-0">
            See which centres are open and how crowded they are right now.
          </p>
        </div>

        <button
          type="button"
          class="btn btn-outline-dark"
          @click="loadCentres()"
        >
          Refresh
        </button>
      </div>
    </section>

    <section
      class="filter-panel mb-4"
    >
      <div class="row g-3 align-items-center">
        <div class="col-12 col-md-8">
          <label
            for="centre-search"
            class="form-label fw-bold"
          >
            Search centres
          </label>

          <input
            id="centre-search"
            v-model="searchText"
            type="search"
            class="form-control"
            placeholder="Search by centre name or address"
          />
        </div>

        <div class="col-12 col-md-4">
          <div
            class="form-check form-switch mt-md-4"
          >
            <input
              id="open-only"
              v-model="openOnly"
              class="form-check-input"
              type="checkbox"
              role="switch"
            />

            <label
              class="form-check-label fw-bold"
              for="open-only"
            >
              Open now only
            </label>
          </div>
        </div>
      </div>
    </section>

    <div
      v-if="loading"
      class="text-center py-5"
    >
      <div
        class="spinner-border"
        role="status"
      >
        <span class="visually-hidden">
          Loading...
        </span>
      </div>

      <p class="mt-3 text-muted">
        Loading hawker centres...
      </p>
    </div>

    <div
      v-else-if="errorMessage"
      class="alert alert-danger"
    >
      {{ errorMessage }}

      <button
        type="button"
        class="btn btn-sm btn-outline-danger ms-2"
        @click="loadCentres()"
      >
        Try again
      </button>
    </div>

    <template v-else>
      <div
        class="d-flex justify-content-between align-items-center mb-3"
      >
        <p class="mb-0 text-muted">
          {{ filteredCentres.length }}
          centre<span v-if="filteredCentres.length !== 1">s</span>
          shown
        </p>
      </div>

      <div
        v-if="filteredCentres.length === 0"
        class="empty-state text-center"
      >
        <h2 class="h4 fw-bold">
          No centres found
        </h2>

        <p class="text-muted mb-0">
          Try changing your search or filter.
        </p>
      </div>

      <div
        v-else
        class="row g-4"
      >
        <div
          v-for="centre in paginatedCentres"
          :key="centre.id"
          class="col-12 col-md-6 col-xl-4"
        >
          <RouterLink
            :to="`/centres/${centre.id}`"
            class="text-decoration-none text-reset"
          >
            <article
              class="card centre-card h-100"
              data-testid="centre-card"
            >
              <img
                v-if="centre.photoUrl"
                :src="centre.photoUrl"
                :alt="centre.name"
                class="centre-photo"
                @error="hideBrokenImage"
              />

              <div class="card-body d-flex flex-column">
                <div
                  class="d-flex justify-content-between align-items-start gap-3 mb-2"
                >
                  <h2
                    class="h5 fw-bold mb-0"
                  >
                    {{ centre.name }}
                  </h2>

                  <span
                    class="status-badge"
                    :class="
                      centre.isOpen
                        ? 'status-open'
                        : 'status-closed'
                    "
                  >
                    {{
                      centre.isOpen
                        ? "Open"
                        : "Closed"
                    }}
                  </span>
                </div>

                <p
                  class="small text-muted mb-3"
                >
                  {{ centre.address }}
                </p>

                <div
                  class="d-flex flex-wrap gap-2 mb-3"
                >
                  <span
                    class="info-pill"
                  >
                    🍜
                    {{
                      centre.foodStalls ??
                      "?"
                    }}
                    food stalls
                  </span>

                  <span
                    class="info-pill"
                    :class="
                      crowdClass(
                        centre.crowd?.level
                      )
                    "
                  >
                    {{
                      centre.crowd?.label ||
                      "No recent reports"
                    }}
                  </span>
                </div>

                <div
                  v-if="
                    !centre.isOpen &&
                    centre.currentClosure
                  "
                  class="closure-box mt-auto"
                >
                  <strong>
                    Closed
                  </strong>

                  <span>
                    {{
                      centre.currentClosure.label
                    }}
                  </span>
                </div>

                <div
                  v-else
                  class="mt-auto view-link"
                >
                  View centre →
                </div>
              </div>
            </article>
          </RouterLink>
        </div>
      </div>

      <div
        v-if="
          filteredCentres.length > 0 &&
          totalPages > 1
        "
        class="d-flex flex-column align-items-center gap-2 mt-4"
      >
        <nav aria-label="Hawker centre pages">
          <ul
            class="pagination justify-content-center flex-wrap mb-0"
          >
            <li
              class="page-item"
              :class="{
                disabled:
                  currentPage === 1
              }"
            >
              <button
                type="button"
                class="page-link"
                :disabled="
                  currentPage === 1
                "
                @click="previousPage"
              >
                Previous
              </button>
            </li>

            <li
              v-for="page in totalPages"
              :key="page"
              class="page-item"
              :class="{
                active:
                  currentPage === page
              }"
            >
              <button
                type="button"
                class="page-link"
                @click="
                  goToPage(page)
                "
              >
                {{ page }}
              </button>
            </li>

            <li
              class="page-item"
              :class="{
                disabled:
                  currentPage ===
                  totalPages
              }"
            >
              <button
                type="button"
                class="page-link"
                :disabled="
                  currentPage ===
                  totalPages
                "
                @click="nextPage"
              >
                Next
              </button>
            </li>
          </ul>
        </nav>

        <small class="text-muted">
          Page {{ currentPage }}
          of {{ totalPages }}
        </small>
      </div>
    </template>
  </div>
</main>
</template>

<style scoped>

main {
  min-height: calc(100vh - 72px);   /* full screen minus the 72px header */
}
.centre-heading h1 {
  font-size: clamp(
    2rem,
    5vw,
    3.25rem
  );
}

.section-kicker {
  color: var(--tomato);
  font-weight: 800;
  letter-spacing: 0.12em;
  font-size: 0.8rem;
}

.filter-panel {
  background: var(--paper);
  border: 4px solid var(--ink);
  border-radius: 18px;
  padding: 1.25rem;
  box-shadow: 8px 8px 0 var(--ink);
}

.centre-card {
  border: 4px solid var(--ink);
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 6px 6px 0 var(--ink);

  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.centre-card:hover {
  transform: translate(-3px, -3px);

  box-shadow: 9px 9px 0 var(--ink);
}

.centre-photo {
  width: 100%;
  height: 180px;
  object-fit: cover;
}

.status-badge {
  border-radius: 999px;
  padding:
    0.35rem 0.65rem;

  font-size: 0.75rem;
  font-weight: 800;
  white-space: nowrap;
}

.status-open {
  background: #ccebd8;
  color: #17603a;
}

.status-closed {
  background: #f7ceca;
  color: #8f211c;
}

.info-pill {
  display: inline-block;
  background: var(--cream);
  border-radius: 999px;
  padding:
    0.35rem 0.65rem;

  font-size: 0.8rem;
  font-weight: 600;
}

.crowd-plenty {
  background: #ccebd8;
  color: #17603a;
}

.crowd-few {
  background: #fff0b8;
  color: #705500;
}

.crowd-full {
  background: #f7ceca;
  color: #8f211c;
}

.crowd-none {
  background: #e8e8e8;
  color: #666;
}

.closure-box {
  border-radius: 10px;
  padding: 0.75rem;
  background: #fff0ee;
  color: #8f211c;

  display: flex;
  flex-direction: column;
  gap: 0.15rem;

  font-size: 0.85rem;
}

.view-link {
  color: var(--tomato);
  font-weight: 800;
}

.empty-state {
  background: var(--paper);
  border: 4px solid var(--ink);
  padding: 4rem 1rem;
}

@media (max-width: 767px) {
  .centre-card {
    flex-direction: row;
  }

  .centre-card .card-body {
    padding: 12px;
  }
  
  .centre-photo {
    width: 110px;
    height: auto;
    flex-shrink: 0;
    object-fit: cover; /* fill the box, crop rather than stretch */
  }
}
</style>