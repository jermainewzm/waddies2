
# HawkerHop

Group hawker centre decisions, settled. One code for the whole group, everyone's
diet and budget considered, and a shortlist of centres where everyone can eat.

Live at: https://hawkerhop-one.vercel.app

---

## Features

- **Makan Plan** — create a plan, share a 6-digit code, friends join with their
  location, diet and budget. The group swipes on a shortlist and the most-liked
  centre wins. Each member then gets their own route there.
- **Centre Search** — browse a centre's stalls and dishes, filter by diet and
  price, and add a centre to the group's picks.
- **Live Centre Status** — NEA closure data plus crowd reports from diners at
  the centre.
- **Hawker Dashboard** — stall owners set their status, rest days, menu and
  shout-outs.
- **Hawker & admin accounts** — new hawkers apply for a stall, admins approve.

---

## Tech stack

Vue 3 + Vite · Express 5 · MongoDB Atlas (Mongoose) · Leaflet ·
OneMap API (geocoding and routing) · NEA hawker centre data from data.gov.sg ·
Vitest · Playwright · Deployed on Vercel

---

## Setup

### Prerequisites

Node 18+, pnpm, a MongoDB Atlas cluster, a OneMap account

### Install

```
cd server && pnpm install
cd ../client && pnpm install
```

### Environment variables

Create `server/.env` (see `server/.env.example`):

```
DB=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/hawkerhop
ONEMAP_EMAIL=your_onemap_email
ONEMAP_PASSWORD=your_onemap_password
PORT=8000
```

The client needs no `.env`. The Vite dev server proxies `/api` to
`localhost:8000` (see `vite.config.js`), and in production Vercel rewrites
`/api` to the server service on the same domain.

### Seeding — run in this order

```
cd server
node seed/seed.js              # 123 NEA hawker centres + demo admins
node seed/seed-test-stalls.js  # example stalls and dishes at every centre
node seed/seed-shoutouts.js    # sample shout-outs
```

Order matters: the stall seed needs the centres, and the shout-out seed needs
the stalls.

The hawker centres are real, imported from NEA's dataset. The stalls, dishes
and shout-outs are fictional examples, since real stall menus and prices aren't
publicly available — real hawkers add their own through the Hawker Dashboard.

### Running

```
cd server && pnpm start     # http://localhost:8000
cd client && pnpm dev       # http://localhost:5173
```

### Demo logins

- **Admin:** `admin_001` (created by `seed.js`)
- **Hawker:** any `HAWKER_xxx` id from the `stalls` collection, plus that
  stall's exact name

---

## Tests

```
cd server && pnpm test                    # Vitest — shortlist and swipe logic
cd client && pnpm exec playwright test    # Playwright — end-to-end flows
```

The Playwright tests use the real API, so the Express server must be running
on port 8000.

**Unit tests** (`server/tests/`) cover the pure logic: the group midpoint,
distance, the diet and budget rules, centre closures, candidate selection,
and the results tally with its travel-distance tie-break.

**End-to-end tests** (`client/e2e/`) cover the full flows in a real browser,
including two people joining the same plan from separate browser contexts.

---

## How the shortlist works

1. **Midpoint** — average of every member's pin.
2. **Open** — centres closed on the plan's date (NEA cleaning, repairs) are
   dropped.
3. **Distance** — the 15 nearest centres to the midpoint become candidates.
4. **Diet and budget** — a centre is kept only if every member has at least one
   dish they can eat within their budget.
5. **Ranking** — candidates are scored as distance, plus a price penalty, plus
   a crowd penalty if the plan starts within two hours. Lowest score first.
6. **Picks** — centres the group added through Centre Search are kept
   regardless, and appear before the suggestions.

The group then swipes, and the centre with the most yeses wins. Ties are broken
by the shortest total travel distance for the whole group.

---

## Deployment

Deployed on Vercel as a multi-service project configured in `vercel.json`:
`/api/*` routes to the Express service, everything else to the Vue client.

The client service needs its own rewrite to `/index.html`, or any direct URL
(for example a shared plan lobby link) returns a 404 before the app loads.

MongoDB Atlas network access is set to allow all IPs, because Vercel's
serverless functions don't have fixed addresses.

---

## AI use

**Visual design — AI-generated, used largely as produced**

- The colour palette and design tokens in `client/src/assets/main.css`
- Shared component styles: buttons, cards, chips, form inputs
- All SVG illustrations: the food-friend avatars and icons in
  `components/HawkerArt.vue`, the animated kopitiam scene in
  `components/HawkerScene.vue`, and the background patterns in
  `client/src/assets/`
- The CSS keyframe animations in `HawkerScene.vue`

**Tests**

- The Vitest unit tests in `server/tests/` were generated with AI from our own
  function signatures, then checked and extended by us.
- Playwright selectors were found using Playwright's codegen recorder; the test
  structure and assertions are ours.

**Written by us**

- All application logic: the shortlist funnel (midpoint, closure checks, diet
  and budget matching, crowd and price ranking), the OneMap routing
  integration, the plan/join/swipe/results flow, every backend endpoint, and
  the NEA data import and seed scripts.

> **[Teammates: add your own sections here.]**

---

## Known limitations

- **Hawker and admin login is identification, not authentication.** An ID is
  stored in localStorage and sent as a header; there are no passwords or
  tokens. A production version would need proper authentication.
- **Member locations are validated against a bounding box**, so a pin in the
  Straits or just across the Causeway is accepted. OneMap then can't route from
  it, and the journey page offers Google Maps as a fallback.
- **Members can't change their diet or budget after joining.** They would need
  to rejoin or start a new plan.
- **NEA's data has closure dates but not opening hours**, so a plan at 4am
  produces a shortlist of centres that are closed. We warn on the create page
  rather than blocking it.
- **The host is whoever joins first.** This matches the usual flow — you create
  a plan, add your own details, then share the code — but it isn't enforced.
- **Live updates use polling, not websockets.** The lobby and swipe pages
  refresh every five seconds, so changes appear within that window rather than
  instantly.

---

## Team

| Feature | Owner |
|---|---|
| Makan Plan, shortlist logic, routing | Zhe Ming & Shawn |
| Swipe to Match, hawker & admin accounts | Alecia |
| Live Centre Status | Yash |
| Hawker Dashboard | Dikshaa |
| Centre Search | Angel |
