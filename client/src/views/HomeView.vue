<script setup>
import { RouterLink } from "vue-router"

const steps = [
  { number: 1, colour: "var(--tomato)", title: "Gather the gang",
    text: "Start a plan and send the 6-digit code. Everyone adds where they're coming from, their diet and budget." },
  { number: 2, colour: "var(--sky)", title: "Swipe in secret",
    text: "We shortlist up to 5 open centres that suit everyone. Swipe on your own phone, no peeking at friends' votes." },
  { number: 3, colour: "var(--pandan)", title: "Shiok, makan!",
    text: "Results reveal together. Most yeses wins, and everyone sees how long it takes them to get there." }
]
</script>

<template>
  <main>
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
        Insert the dining animations here 
      </div>
      
    </section>

    <section class="section bg-tiles">
      <div class="page">
        <h2 class="section-title outline" style="color: var(--sun)">How it works</h2>
        <p class="section-lead">
          Three steps from "anything also can" to everybody sitting down together.
        </p>

        <div class="steps">
          <div v-for="step in steps" v-bind:key="step.title" class="card step">
            <span class="step-number" v-bind:style="{backgroundColor: step.colour}"> {{ step.number }}</span>
            <h3>{{ step.title }}</h3>
            <p>{{ step.text }}</p>
          </div>
        </div>
      </div></section>
    <section class="section bg-hdb"><div class="page">INSERT MAKAN PLAN INTERFACE HERE </div></section>
    <section class="section bg-hooks"><div class="page">INSERT HAWKER DASHBOARD HERE</div></section>
    <section class="section bg-cups"><div class="page">INSERT 'SETTLE ALREADY LAH' SECTION HERE</div></section>
  </main>
</template>

<style scoped>
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
  font-size: clamp(44px, 10vw, 150px); /* makes the font responsive (min, value, max)*/
  line-height: .92;
}

.hero h1 span {
  display: inline-block;
}

.tilt {
  transform: rotate(-5deg);
}

.hero-lead {
  margin: 22px auto 0;
  max-width: 640px;
  font-size: 22px;
}

.hero-buttons {
  margin-top: 28px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px;
}

.steps {
  display: flex;
  flex-wrap: wrap;
  gap: 34px;
  margin-top: 56px;
}

.step {
  position: relative;
  flex: 1;
  min-width: 300px;
  padding: 34px 26px 28px;
  transition: transform 0.2s ease;
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
}

@media (max-width: 760px) {
  .tagline { font-size: 19px; }
  .hero-lead { font-size: 18px; }
}

.bg-cups  { background-color: var(--sun); }
.bg-hdb   { background-color: var(--sky); }
.bg-stools{ background-color: var(--pink); }
.bg-hooks { background-color: var(--pandan); }
.bg-tiles { background-color: var(--cream); }
</style>