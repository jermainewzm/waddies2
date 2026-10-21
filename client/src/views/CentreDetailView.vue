<script setup>
import {
  onMounted,
  onUnmounted,
  ref
} from "vue"

import {
  useRoute
} from "vue-router"

import {
  getCentre,
  submitCrowdReport
} from "@/services/centreService"

const route = useRoute()

const centre = ref(null)

const loading = ref(true)
const errorMessage = ref("")
const reportMessage = ref("")
const submittingReport = ref(false)

let refreshTimer = null

async function loadCentre(
  showLoader = true
) {
  if (showLoader) {
    loading.value = true
  }

  errorMessage.value = ""

  try {
    centre.value =
      await getCentre(
        route.params.id
      )
  } catch (error) {
    errorMessage.value =
      error.response?.data?.error ||
      "Unable to load this hawker centre."
  } finally {
    if (showLoader) {
      loading.value = false
    }
  }
}

async function reportCrowd(level) {
  submittingReport.value = true

  reportMessage.value = ""
  errorMessage.value = ""

  try {
    const result =
      await submitCrowdReport(
        centre.value.id,
        level
      )

    centre.value.crowd =
      result.crowd

    reportMessage.value =
      "Thanks! Your crowd report has been submitted."
  } catch (error) {
    errorMessage.value =
      error.response?.data?.error ||
      "Unable to submit the crowd report."
  } finally {
    submittingReport.value = false
  }
}

function formatDate(isoDate) {
  if (!isoDate) {
    return ""
  }

  const [
    year,
    month,
    day
  ] = isoDate.split("-")

  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day)
  )

  return date.toLocaleDateString(
    "en-SG",
    {
      day: "numeric",
      month: "short",
      year: "numeric"
    }
  )
}

function stallStatusLabel(status) {
  const labels = {
    open: "Open",
    sold_out: "Sold out",
    closed_early: "Closed early",
    closed: "Closed"
  }

  return (
    labels[status] ||
    status ||
    "Unknown"
  )
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
  loadCentre()

  refreshTimer = setInterval(
    () => loadCentre(false),
    30000
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
  <main
    class="container py-4 py-md-5"
  >
    <RouterLink
      to="/centres"
      class="back-link"
    >
      ← All hawker centres
    </RouterLink>

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
    </div>

    <div
      v-else-if="errorMessage && !centre"
      class="alert alert-danger mt-4"
    >
      {{ errorMessage }}
    </div>

    <template
      v-else-if="centre"
    >
      <section
        class="hero-card mt-4 mb-4"
      >
        <div class="row g-0">
          <div
            v-if="centre.photoUrl"
            class="col-12 col-lg-5"
          >
            <img
              :src="centre.photoUrl"
              :alt="centre.name"
              class="hero-photo"
            />
          </div>

          <div class="col">
            <div class="hero-content">
              <div
                class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-start gap-3"
              >
                <div>
                  <p
                    class="section-kicker mb-1"
                  >
                    HAWKER CENTRE
                  </p>

                  <h1
                    class="hh-display mb-2"
                  >
                    {{ centre.name }}
                  </h1>

                  <p
                    class="text-muted mb-0"
                  >
                    {{ centre.address }}
                  </p>
                </div>

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

              <div
                class="centre-stats mt-4"
              >
                <div>
                  <small>
                    Food stalls
                  </small>

                  <strong>
                    {{
                      centre.foodStalls ??
                      "—"
                    }}
                  </strong>
                </div>

                <div>
                  <small>
                    Market stalls
                  </small>

                  <strong>
                    {{
                      centre.marketStalls ??
                      "—"
                    }}
                  </strong>
                </div>

                <div>
                  <small>
                    Crowd
                  </small>

                  <strong>
                    {{
                      centre.crowd?.label ||
                      "No recent reports"
                    }}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div
        v-if="!centre.isOpen && centre.currentClosure"
        class="alert closure-alert"
      >
        <strong>
          This centre is currently closed.
        </strong>

        <div>
          {{
            centre.currentClosure.label
          }}:
          {{
            formatDate(
              centre.currentClosure.start
            )
          }}
          –
          {{
            formatDate(
              centre.currentClosure.end
            )
          }}
        </div>

        <div
          v-if="centre.currentClosure.remarks"
        >
          {{
            centre.currentClosure.remarks
          }}
        </div>
      </div>

      <div
        v-if="errorMessage"
        class="alert alert-danger"
      >
        {{ errorMessage }}
      </div>

      <div
        v-if="reportMessage"
        class="alert alert-success"
      >
        {{ reportMessage }}
      </div>

      <div class="row g-4">
        <div class="col-12 col-lg-7">
          <section
            class="content-card mb-4"
          >
            <h2
              class="h4 fw-bold mb-3"
            >
              How crowded is it?
            </h2>

            <div
              class="current-crowd mb-4"
              :class="
                crowdClass(
                  centre.crowd?.level
                )
              "
              data-testid="crowd-summary"
            >
              <strong>
                {{
                  centre.crowd?.label ||
                  "No recent reports"
                }}
              </strong>

              <span>
                {{
                  centre.crowd?.count || 0
                }}
                recent
                report<span
                  v-if="
                    (centre.crowd?.count || 0) !== 1
                  "
                >s</span>
              </span>
            </div>

            <p class="text-muted">
              If you are at the centre, tell others how many seats are available.
            </p>

            <div
              class="row g-2"
            >
              <div class="col-12 col-sm-4">
                <button
                  type="button"
                  class="btn crowd-button crowd-button-plenty w-100"
                  :disabled="
                    submittingReport ||
                    !centre.isOpen
                  "
                  @click="
                    reportCrowd('plenty')
                  "
                >
                  Plenty
                </button>
              </div>

              <div class="col-12 col-sm-4">
                <button
                  type="button"
                  class="btn crowd-button crowd-button-few w-100"
                  :disabled="
                    submittingReport ||
                    !centre.isOpen
                  "
                  @click="
                    reportCrowd('few')
                  "
                >
                  Few
                </button>
              </div>

              <div class="col-12 col-sm-4">
                <button
                  type="button"
                  class="btn crowd-button crowd-button-full w-100"
                  :disabled="
                    submittingReport ||
                    !centre.isOpen
                  "
                  @click="
                    reportCrowd('full')
                  "
                >
                  Full
                </button>
              </div>
            </div>

            <p
              class="small text-muted mt-3 mb-0"
            >
              Crowd reports from the last 60 minutes are used.
            </p>
          </section>

          <section
            class="content-card"
          >
            <h2
              class="h4 fw-bold mb-3"
            >
              Stalls
            </h2>

            <p
              v-if="
                !centre.stalls ||
                centre.stalls.length === 0
              "
              class="text-muted mb-0"
            >
              Stall information has not been added for this centre yet.
            </p>

            <div
              v-else
              class="stall-list"
            >
              <div
                v-for="stall in centre.stalls"
                :key="
                  stall._id ||
                  stall.id ||
                  stall.name
                "
                class="stall-row"
              >
                <div>
                  <strong>
                    {{ stall.name }}
                  </strong>

                  <div
                    v-if="
                      stall.unit_no ||
                      stall.unitNo
                    "
                    class="small text-muted"
                  >
                    {{
                      stall.unit_no ||
                      stall.unitNo
                    }}
                  </div>
                </div>

                <span
                  class="stall-status"
                >
                  {{
                    stallStatusLabel(
                      stall.status
                    )
                  }}
                </span>
              </div>
            </div>
          </section>
        </div>

        <div class="col-12 col-lg-5">
          <section
            class="content-card mb-4"
          >
            <h2
              class="h4 fw-bold mb-3"
            >
              Closure schedule
            </h2>

            <p
              v-if="
                !centre.closurePeriods ||
                centre.closurePeriods.length === 0
              "
              class="text-muted"
            >
              No scheduled closures are listed.
            </p>

            <div
              v-else
              class="closure-list"
            >
              <div
                v-for="
                  closure in centre.closurePeriods
                "
                :key="
                  `${closure.label}-${closure.start}`
                "
                class="closure-row"
              >
                <strong>
                  {{ closure.label }}
                </strong>

                <span>
                  {{
                    formatDate(
                      closure.start
                    )
                  }}
                  –
                  {{
                    formatDate(
                      closure.end
                    )
                  }}
                </span>

                <small
                  v-if="closure.remarks"
                  class="text-muted"
                >
                  {{ closure.remarks }}
                </small>
              </div>
            </div>
          </section>

          <section
            class="content-card mb-4"
          >
            <h2
              class="h4 fw-bold mb-3"
            >
              Today's shout-outs
            </h2>

            <p
              v-if="
                !centre.shoutouts ||
                centre.shoutouts.length === 0
              "
              class="text-muted mb-0"
            >
              No shout-outs today.
            </p>

                        <div v-else>
              <div
                v-for="shoutout in centre.shoutouts"
                :key="
                  shoutout._id ||
                  shoutout.id
                "
                class="shoutout"
              >
                <div
                  class="d-flex justify-content-between align-items-start gap-2 mb-1"
                >
                  <strong>
                    {{
                      shoutout.stall_name ||
                      "Unknown stall"
                    }}
                  </strong>

                  <small
                    v-if="shoutout.stall_unit_no"
                    class="text-muted"
                  >
                    {{ shoutout.stall_unit_no }}
                  </small>
                </div>

                <p class="mb-0">
                  {{ shoutout.message }}
                </p>
              </div>
            </div>
          </section>

          <section
            v-if="centre.description"
            class="content-card"
          >
            <h2
              class="h4 fw-bold mb-3"
            >
              About this centre
            </h2>

            <p class="mb-0">
              {{ centre.description }}
            </p>
          </section>
        </div>
      </div>
    </template>
  </main>
</main>
</template>

<style scoped>
.back-link {
  color: var(--hh-kopi);
  text-decoration: none;
  font-weight: 700;
}

.back-link:hover {
  color: var(--hh-red);
}

.hero-card,
.content-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow:
    0 6px 24px
    rgba(59, 42, 32, 0.08);
}

.hero-photo {
  width: 100%;
  height: 100%;
  min-height: 260px;
  object-fit: cover;
}

.hero-content {
  padding: 2rem;
}

.section-kicker {
  color: var(--hh-red);
  font-weight: 800;
  letter-spacing: 0.12em;
  font-size: 0.8rem;
}

.status-badge {
  border-radius: 999px;
  padding: 0.5rem 0.8rem;
  font-size: 0.8rem;
  font-weight: 800;
}

.status-open {
  background: #ccebd8;
  color: #17603a;
}

.status-closed {
  background: #f7ceca;
  color: #8f211c;
}

.centre-stats {
  display: grid;
  grid-template-columns:
    repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.centre-stats div {
  background: var(--hh-steel);
  border-radius: 12px;
  padding: 0.85rem;
}

.centre-stats small {
  display: block;
  color: #777;
  margin-bottom: 0.2rem;
}

.centre-stats strong {
  display: block;
}

.content-card {
  padding: 1.5rem;
}

.closure-alert {
  background: #fff0ee;
  color: #8f211c;
  border: 0;
}

.current-crowd {
  border-radius: 14px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
}

.current-crowd strong {
  font-size: 1.2rem;
}

.current-crowd span {
  font-size: 0.85rem;
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
  background: #eeeeee;
  color: #555;
}

.crowd-button {
  font-weight: 800;
  border-radius: 10px;
}

.crowd-button-plenty {
  background: #ccebd8;
  color: #17603a;
}

.crowd-button-few {
  background: #fff0b8;
  color: #705500;
}

.crowd-button-full {
  background: #f7ceca;
  color: #8f211c;
}

.stall-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
  padding: 0.85rem 0;
  border-bottom:
    1px solid #eeeeee;
}

.stall-row:last-child {
  border-bottom: 0;
}

.stall-status {
  background: var(--hh-steel);
  border-radius: 999px;
  padding: 0.35rem 0.65rem;
  font-size: 0.75rem;
  font-weight: 700;
}

.closure-row {
  display: flex;
  flex-direction: column;
  padding: 0.8rem 0;
  border-bottom:
    1px solid #eeeeee;
}

.closure-row:last-child {
  border-bottom: 0;
}

.shoutout {
  background: #fff4e3;
  border-left:
    4px solid var(--hh-red);
  padding: 0.8rem;
  border-radius: 8px;
  margin-bottom: 0.75rem;
}

@media (max-width: 575.98px) {
  .centre-stats {
    grid-template-columns: 1fr;
  }

  .hero-content {
    padding: 1.25rem;
  }
}
</style>