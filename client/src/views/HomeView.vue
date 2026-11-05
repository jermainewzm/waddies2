<script setup>
import { ref, onMounted } from "vue"
import { RouterLink } from "vue-router"
import { getCentres } from "../services/centreService"   //same helper as the Centres page
import HawkerScene from "../components/HawkerScene.vue" //animated kopitiam scene

const steps = [
  { number: 1, colour: "var(--tomato)", title: "Gather the gang",
    text: "Start a plan and send the 6-digit code. Everyone adds where they're coming from, their diet and budget." },
  { number: 2, colour: "var(--sky)", title: "Swipe in secret",
    text: "Everyone's picks plus the best nearby centres become swipe cards. Swipe on your own phone, no peeking at friends' votes." },
  { number: 3, colour: "var(--pandan)", title: "Shiok, makan!",
    text: "Results reveal together. Most yeses wins, and everyone sees how long it takes them to get there." }
]

//live centre status: a few open centres and how crowded they are right now
const LIVE_COUNT = 5
const liveCentres = ref([])     //ie. [{ id, name, address, crowd: { level, label } }]
const openCount = ref(0)        //how many centres are open today
const closedToday = ref(0)      //how many are closed today (NEA cleaning / works)
const liveLoading = ref(true)
const liveError = ref('')

//open centres, the ones people reported on first (more interesting), keep a few
async function loadLive() {
  try {
    const data = await getCentres()   //every centre, so the closed ones can be counted too
    const openCentres = data.centres.filter(centre => centre.isOpen)
    openCount.value = openCentres.length
    closedToday.value = data.centres.length - openCentres.length
    const reported = openCentres.filter(centre => centre.crowd && centre.crowd.level)
    const notReported = openCentres.filter(centre => !centre.crowd || !centre.crowd.level)
    liveCentres.value = [...reported, ...notReported].slice(0, LIVE_COUNT)
  } catch {   //the error itself isn't needed, we just show a friendly message
    liveError.value = "Can't load the centres right now."
  } finally {
    liveLoading.value = false
  }
}

//crowd level -> colour class (same names as the Centres page)
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

onMounted(loadLive)

//hawker demo: tap a status to see the pill change
const statuses = [
  { value: "open", label: "Open", pill: "🟢 Open now" },
  { value: "sold_out", label: "Sold out", pill: "🍽 Sold out today" },
  { value: "closed_early", label: "Closed early", pill: "🔒 Closed early" }
]
const stallStatus = ref("open")

function statusPill() {
  return statuses.find(status => status.value === stallStatus.value).pill
}
</script>

<template>
  <main>
    <!-- hero: title, buttons and the kopitiam scene -->
    <section class="hero bg-cups">
      <div class="page hero-inner">
        <p class="handwritten tagline">for every group chat that cannot decide</p>

        <h1>
          <span class="outline" style="color: var(--tomato)">Makan</span>
          <span class="outline" style="color: var(--sky)">where</span>
          <span class="outline tilt" style="color: var(--paper)">ah?</span>
        </h1>

        <p class="hero-lead">
          One code for the whole gang. Everyone swipes in secret, and HawkerHop
          lands you at a hawker centre that's open, fits every diet and budget,
          and isn't packed.
        </p>

        <div class="hero-buttons">
          <RouterLink class="btn big red" to="/plan/new">Start a Makan Plan</RouterLink>
          <RouterLink class="btn big" to="/plan/join">Join with a code</RouterLink>
        </div>

        <div>
          <HawkerScene />
        </div>
      </div>
    </section>

    <!-- how it works (awnings hang between sections: red, green, yellow, red) -->
    <section class="section bg-tiles has-awning">
      <div class="awning awning-strip strip-tomato"></div>
      <div class="page">
        <h2 class="section-title outline" style="color: var(--sun)">How it works</h2>
        <p class="section-lead">
          Three steps from "anything also can" to everybody sitting down together.
        </p>

        <div class="steps">
          <div v-for="step in steps" v-bind:key="step.title" class="card step">
            <!-- number bobs up and down, each one a bit later than the last -->
            <span
              class="step-number"
              v-bind:style="{ backgroundColor: step.colour, animationDelay: step.number * 0.3 + 's' }"
            >{{ step.number }}</span>
            <h3>{{ step.title }}</h3>
            <p>{{ step.text }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- live centre status: real data from the server, shown like a kopitiam board -->
    <section class="section bg-hdb has-awning">
      <div class="awning awning-strip strip-pandan"></div>
      <div class="page live two-col">
        <div class="intro">
          <p class="live-badge"><span class="live-dot"></span> LIVE</p>
          <h2 class="section-title outline" style="color: var(--paper)">Live centre status</h2>
          <p class="section-lead left">Open today, and how crowded right now, from what diners reported in the last hour.</p>
          <p v-if="closedToday > 0" class="closed-fact">🧹 {{ closedToday }} hawker {{ closedToday === 1 ? 'centre is' : 'centres are' }} closed today for cleaning or works. HawkerHop leaves {{ closedToday === 1 ? 'it' : 'them' }} out of your plan.</p>
          <RouterLink class="btn big yellow" to="/centres">See all {{ openCount > 0 ? openCount + ' open' : '' }} centres →</RouterLink>
        </div>

        <div class="board">
          <p class="board-title handwritten">Today at the centres</p>
          <p v-if="liveLoading" class="board-empty handwritten">Checking…</p>
          <p v-else-if="liveError" class="board-empty handwritten">{{ liveError }}</p>
          <!-- one row per centre, each links to that centre's page -->
          <template v-else>
            <RouterLink
              v-for="centre in liveCentres"
              v-bind:key="centre.id"
              v-bind:to="`/centres/${centre.id}`"
              class="board-row"
            >
              <span class="board-name">{{ centre.name }}</span>
              <span class="board-crowd" v-bind:class="crowdClass(centre.crowd.level)">
                <span class="crowd-dot"></span>{{ centre.crowd.label }}
              </span>
            </RouterLink>
          </template>
        </div>
      </div>
    </section>

    <!-- hawker dashboard: tap a status to change the pill -->
    <section class="section bg-hooks has-awning">
      <div class="awning awning-strip strip-sun"></div>
      <div class="page two-col">
        <div class="intro">
          <h2 class="section-title outline" style="color: var(--sun)">Hawkers, one tap only</h2>
          <p class="section-lead left">Sold out early? Taking a rest day? Tell everyone planning a makan session before they make the trip.</p>
          <RouterLink class="btn big yellow" to="/hawker/dashboard">For Hawkers →</RouterLink>
        </div>

        <div class="card stall-demo">
          <div class="stall-head">
            <svg class="stall-face" viewBox="0 0 100 100" aria-hidden="true"><use href="#av-toast"/></svg>
            <div>
              <h3>Ah Seng Kaya Toast</h3>
              <p class="unit">#01-15 · Maxwell</p>
            </div>
          </div>

          <p class="status-label">Today's status</p>
          <div class="status-row">
            <button
              v-for="status in statuses"
              v-bind:key="status.value"
              type="button"
              class="btn sm"
              v-bind:class="{ pressed: stallStatus === status.value }"
              v-on:click="stallStatus = status.value"
            >{{ status.label }}</button>
          </div>

          <p class="status-pill" v-bind:class="stallStatus">{{ statusPill() }}</p>
          <p class="small-note">Makan Plans skip stalls that are sold out or closed.</p>
        </div>
      </div>
    </section>

    <!-- settle already lah -->
    <section class="section bg-cups settle has-awning">
      <div class="awning awning-strip strip-tomato"></div>
      <div class="page settle-inner">
        <div class="friends">
          <svg v-for="friend in ['av-milo', 'av-tissue', 'av-toast', 'av-waffle']"
            v-bind:key="friend"
            class="friend"
            viewBox="0 0 100 110"
            aria-hidden="true"
          ><use v-bind:href="'#' + friend"/></svg>
        </div>

        <!-- two bubbles take turns (fade in, fade out) -->
        <div class="bubble-spot">
          <p class="bubble handwritten bubble-1">"Anything also can lah…"</p>
          <p class="bubble handwritten bubble-2">"Okay, HawkerHop decide!"</p>
        </div>

        <h2 class="outline settle-title">Settle already <span class="tilt-word">lah!</span></h2>
        <p class="section-lead">Takes 2 minutes. No app download, no sign up.</p>
        <div class="hero-buttons">
          <RouterLink class="btn big red" to="/plan/new">Start a Makan Plan</RouterLink>
          <RouterLink class="btn big" to="/plan/join">Join with a code</RouterLink>
        </div>
      </div>
    </section>

  </main>
</template>

<style scoped>
/* ---------- hero ---------- */
.hero {
  padding-top: 40px;
  padding-bottom: 60px;
  overflow: hidden;
}

.hero-inner {
  text-align: center;
}

.tagline {
  display: inline-block;
  padding: 6px 18px;
  border: 3px solid var(--ink);
  border-radius: 25px;
  background: var(--paper);
  font-size: 24px;
  transform: rotate(-2deg);
}

.hero h1 {
  margin-top: 14px;
  font-size: clamp(40px, 7vw, 100px);
  line-height: .92;
}

.hero h1 span {
  display: inline-block;
}

.hero-lead {
  margin: 18px auto 0;
  max-width: 920px;
  font-size: 21px;
}

.hero-buttons {
  margin-top: 28px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px;
}

/* "ah?" keeps wiggling */
.tilt {
  animation: wiggle 2.4s ease-in-out infinite;
}

@keyframes wiggle {
  0%, 100% { transform: rotate(-5deg); }
  50%      { transform: rotate(3deg); }
}

/* used by the step numbers and the hawker's face */
@keyframes bob {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-8px); }
}

/* ---------- sections (shared) ---------- */
.section {
  padding-top: 80px;
  padding-bottom: 80px;
}

.section-title {
  font-size: clamp(40px, 6vw, 72px);
  text-align: center;
}

.section-lead {
  max-width: 640px;
  margin: 12px auto 0;
  font-size: 20px;
  font-weight: 700;
  text-align: center;
}

/* 1 column on phones, 2 side by side from tablets */
.two-col {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 40px;
  align-items: center;
}

/* ---------- awnings between sections ---------- */
.has-awning {
  position: relative;
  padding-top: 110px;   /* room for the awning above the title */
}

/* full width across the top of the section (main.css draws the awning itself) */
.awning-strip {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  border-left: 0;
  border-right: 0;
  border-radius: 0;
  background: repeating-linear-gradient(90deg, var(--stripe) 0 50px, var(--paper) 50px 100px);
}

/* the wavy edge, in the same two colours */
.awning-strip::after {
  margin-left: 0;
  margin-right: 0;
  background:
    radial-gradient(circle at 25px 0, var(--stripe) 24px, transparent 25px) 0 0 / 100px 26px repeat-x,
    radial-gradient(circle at 75px 0, var(--paper) 24px, transparent 25px) 0 0 / 100px 26px repeat-x;
}

/* stripe colour for each awning */
.strip-sun    { --stripe: var(--sun); }
.strip-tomato { --stripe: var(--tomato); }
.strip-sky    { --stripe: var(--sky); }
.strip-pandan { --stripe: var(--pandan); }

/* ---------- how it works ---------- */
.steps {
  display: flex;
  flex-wrap: wrap;
  gap: 34px;
  margin-top: 56px;
}

.step {
  position: relative;
  flex: 1;
  min-width: 260px;
  padding: 34px 26px 28px;
  transition: transform .2s ease;
}

.step:hover {
  transform: translateY(-6px) rotate(-2deg);
}

.step h3 {
  font-size: 32px;
  margin-bottom: 8px;
}

.step-number {
  position: absolute;
  top: -24px;
  left: 20px;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4px solid var(--ink);
  border-radius: 50%;
  font-size: 26px;
  font-weight: 800;
  animation: bob 2s ease-in-out infinite;
}

/* ---------- live centre status ---------- */
.live-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 8px;
  padding: 2px 12px;
  background: var(--paper);
  border: 3px solid var(--ink);
  border-radius: 999px;
  font-weight: 800;
}

/* red dot that pulses like a "recording" light */
.live-dot {
  width: 12px;
  height: 12px;
  background: var(--tomato);
  border-radius: 50%;
  animation: pulse 1.4s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50%      { transform: scale(.6); opacity: .4; }
}

/* the kopitiam board: white board with a wooden frame */
.board {
  padding: 18px 20px 12px;
  background: var(--paper);
  border: 10px solid #A8693A;
  border-radius: 18px;
  box-shadow: 8px 8px 0 var(--ink);
  color: var(--ink);
  transform: rotate(1deg);
}

.board-title {
  margin: 0 0 8px;
  font-size: 28px;
  text-align: center;
}

.board-empty {
  margin: 12px 0;
  font-size: 22px;
  text-align: center;
  animation: blink 1.2s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50%      { opacity: .4; }
}

/* one row per centre: name on the left, crowd on the right */
.board-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 10px 4px;
  border-top: 2px dashed var(--line);
  color: var(--ink);
  text-decoration: none;
  transition: transform .2s ease;
}

.board-row:hover {
  transform: translateX(6px);
}

.board-name {
  font-weight: 800;
}

.board-crowd {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: 'Gochi Hand', cursive;
  font-size: 19px;
}

.crowd-dot {
  width: 12px;
  height: 12px;
  border: 2px solid var(--ink);
  border-radius: 50%;
  background: #ECE8E1;
}

.crowd-plenty .crowd-dot { background: #3CC47C; }
.crowd-few .crowd-dot    { background: #FFD23F; }
.crowd-full .crowd-dot   { background: #FF5A4E; }

/* text on the left next to a demo (tablets and up) */
.section-lead.left {
  text-align: left;
  margin-left: 0;
}

/* ---------- hawker demo ---------- */
.bg-hooks .section-lead {
  margin-bottom: 24px;
}

.stall-demo {
  padding: 24px;
  transform: rotate(1.5deg);
}

.stall-head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stall-face {
  width: 64px;
  height: 64px;
  animation: bob 2.4s ease-in-out infinite;
}

.stall-head h3 {
  font-size: 26px;
}

.unit {
  margin: 0;
  font-weight: 700;
  color: var(--muted);
}

.status-label {
  margin: 18px 0 6px;
  font-weight: 800;
}

.status-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.status-row .btn.pressed {
  background: var(--ink);
  color: var(--paper);
}

/* the pill changes colour smoothly (transition) when the status changes */
.status-pill {
  align-self: flex-start;   /* only as wide as its text (bootstrap's .card stretches it) */
  margin: 18px 0 0;
  padding: 8px 18px;
  border: 3px solid var(--ink);
  border-radius: 999px;
  font-size: 20px;
  font-weight: 800;
  transition: background-color .3s ease;
}

.status-pill.open         { background: #DDF7E8; }
.status-pill.sold_out     { background: #FFE3C2; }
.status-pill.closed_early { background: #FFE1DE; }

.small-note {
  margin: 10px 0 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--muted);
}

/* ---------- settle already lah ---------- */
.settle {
  overflow: hidden;
}

.settle-inner {
  text-align: center;
}

.friends {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.friend {
  width: 84px;
  height: 92px;
  transform-origin: bottom center;   /* tilt from their feet */
  animation: side-to-side 1s ease-in-out infinite;   /* same timing for all = in sync */
}

@keyframes side-to-side {
  0%, 100% { transform: rotate(-10deg); }
  50%      { transform: rotate(10deg); }
}

.bubble-spot {
  position: relative;
  height: 56px;
  margin: 8px 0 14px;
}

.bubble {
  position: absolute;
  left: 50%;
  width: 300px;
  margin: 0 0 0 -150px;
  padding: 8px 14px;
  background: var(--paper);
  border: 3px solid var(--ink);
  border-radius: 20px;
  font-size: 22px;
}

/* each bubble shows for half the loop */
.bubble-1 { animation: take-turns 6s ease-in-out infinite; }
.bubble-2 { animation: take-turns 6s ease-in-out 3s infinite; opacity: 0; }

@keyframes take-turns {
  0%, 45%  { opacity: 1; transform: translateY(0); }
  50%, 95% { opacity: 0; transform: translateY(8px); }
  100%     { opacity: 1; transform: translateY(0); }
}

.settle-title {
  font-size: clamp(48px, 9vw, 110px);
  color: var(--tomato);
}

.tilt-word {
  display: inline-block;
  color: var(--paper);
  animation: wiggle 2.4s ease-in-out infinite;
}

/* ---------- bigger screens ---------- */
/* tablet (768px+) */
@media (min-width: 768px) {
  .two-col {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 56px;
  }

  .two-col .section-title {
    text-align: left;
  }
}

/* phones: everything smaller and closer together so there's less scrolling */
@media (max-width: 767px) {
  .tagline { font-size: 17px; }
  .hero { padding-top: 24px; padding-bottom: 36px; }
  .hero-lead { font-size: 16px; margin-top: 12px; }
  .hero-buttons { margin-top: 18px; gap: 10px; }
  .hero-buttons .btn.big { padding: 10px 12px; font-size: 16px; border-radius: 14px; box-shadow: 4px 4px 0 var(--ink); }

  .section { padding-top: 36px; padding-bottom: 36px; }
  .has-awning { padding-top: 84px; }
  .section-title { font-size: 38px; }
  .section-lead { font-size: 16px; margin-top: 6px; }
  .two-col { gap: 20px; }
  .intro { text-align: center; }   /* title, text and button centred on phones */
  .intro .section-lead { text-align: center; margin-left: auto; }

  /* steps: number on the left instead of on top, less padding */
  .steps { gap: 12px; margin-top: 18px; }
  .step { min-width: 0; flex-basis: 100%; padding: 12px 14px 12px 68px; box-shadow: 5px 5px 0 var(--ink); }
  .step:hover { transform: none; }
  .step h3 { font-size: 22px; margin-bottom: 2px; }
  .step p { font-size: 15px; margin: 0; }
  .step-number { top: 14px; left: 12px; width: 44px; height: 44px; font-size: 20px; border-width: 3px; }

  /* live status: smaller board */
  .board { padding: 14px 14px 8px; border-width: 8px; }
  .board-title { font-size: 24px; }
  .board-crowd { font-size: 17px; }
  .intro .btn.big { padding: 10px 16px; font-size: 18px; }

  .bg-hooks .section-lead { margin-bottom: 14px; }
  .stall-demo { padding: 16px; }
  .stall-face { width: 48px; height: 48px; }
  .stall-head h3 { font-size: 21px; }
  .status-pill { font-size: 17px; margin-top: 12px; }

  .friend { width: 52px; height: 57px; }
  .bubble-spot { height: 46px; margin: 4px 0 6px; }
  .bubble { width: 260px; margin-left: -130px; font-size: 18px; padding: 6px 12px; }
}

/* anyone who turns off animations in their settings: nothing moves */
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}

.bg-cups  { background-color: var(--sun); }
.bg-hdb   { background-color: var(--sky); }
.bg-hooks { background-color: var(--pandan); }
.bg-tiles { background-color: var(--cream); }

/* the live fact under "Live centre status" */
.closed-fact {
  max-width: 640px;
  margin: 10px 0 18px;
  font-size: 16px;
  font-weight: 700;
}

@media (max-width: 767px) {
  .closed-fact {
    margin-left: auto;
    margin-right: auto;
    font-size: 15px;
    text-align: center;
  }
}
</style>