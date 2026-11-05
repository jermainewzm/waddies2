# HawkerHop

Group hawker centre decisions, settled. One code for the whole group, everyone's diet and budget considered, and a shortlist of centres where everyone can eat.

**Live at:** https://hawkerhop-one.vercel.app

---

## Features

- **Makan Plan** — create a plan, share a 6-digit code, friends join with their location, diet and budget. The group swipes on a shortlist and the most-liked centre wins. Each member then gets their own route there.
- **Centre Search** — browse a centre's stalls and dishes, filter by diet and price, and add a centre to the group's picks.
- **Live Centre Status** — NEA closure data plus crowd reports from diners at the centre.
- **Hawker Dashboard** — stall owners set their status, rest days, menu and shout-outs.
- **Hawker & admin accounts** — new hawkers apply for a stall, admins approve.

---

## Tech stack

Vue 3 + Vite · Express 5 · MongoDB Atlas (Mongoose) · Leaflet · OneMap API (geocoding and routing) · NEA hawker centre data from data.gov.sg · Vitest · Playwright · Deployed on Vercel

---

## Setup

### Prerequisites

- Node.js 22 (22.18.0+) or Node.js 24 (24.12.0+)
- pnpm 12.8.1
- A MongoDB Atlas cluster
- A OneMap account

### Install

Install the server and client dependencies:

```bash
cd server
pnpm install

cd ../client
pnpm install
```

### Environment variables

The app needs a MongoDB database and a OneMap account. Both are free.

1. **MongoDB Atlas** (https://www.mongodb.com/atlas)
   - Create a free cluster.
   - Under Database Access, add a database user with a password.
   - Under Network Access, add your IP address (or `0.0.0.0/0`).
   - Click Connect → Drivers and copy the connection string. Add the database name `hawkerhop` before the `?`, e.g.
     `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/hawkerhop?retryWrites=true&w=majority`

2. **OneMap** (https://www.onemap.gov.sg/apidocs/register)
   - Register for an API account (choose "Research / Student Projects"), then set a password. The server only needs that email and password: it logs in and renews the access token by itself, so no token goes in `.env`.

3. **Create `server/.env`** (copy `server/.env.example`). These four are the only variables the app uses:

```env
DB=<your connection string from step 1>
ONEMAP_EMAIL=<your OneMap email>
ONEMAP_PASSWORD=<your OneMap password>
PORT=8000
```

The client needs no `.env`. In development, Vite forwards any `/api` request to the backend on `localhost:8000` (see `vite.config.js`). In production, Vercel sends `/api` to the server on the same domain.

Without OneMap, you can still join a plan by dropping a pin on the map, but looking up a postal code and the journey page's directions won't work, and the Makan Plan, Swipe and most Centre Search tests will fail.

### Seeding

Run the seed scripts in this order:

```bash
cd server

node seed/seed.js
node seed/seed-test-stalls.js
node seed/seed-test-shoutouts.js
```

Order matters: the stall seed needs the centres, and the shout-out seed needs the stalls.

The hawker centres are real, imported from NEA's dataset (food centres only: market-only centres with no cooked-food stalls are skipped). The stalls, dishes and shout-outs are fictional examples, since real stall menus and prices aren't publicly available. Real hawkers can add their own through the Hawker Dashboard.

### Running

Open two terminals.

**Terminal 1: Start the backend**

```bash
cd server
pnpm dev
```

Backend: http://localhost:8000

**Terminal 2: Start the frontend**

```bash
cd client
pnpm dev
```

Frontend: http://localhost:5173

### Demo logins

**Admin**

- ID: `admin_001` (created by `seed.js`)

**Hawker**

- ID: `HAWKER_001`
- Stall name: `Sunrise Chicken Rice` (Adam Road Food Centre, created by `seed-test-stalls.js`)

Hawker login uses the hawker ID and the stall name (spelled in full; neither is case-sensitive).

---

## Tests

### Backend unit tests

Run the Vitest unit tests:

```bash
cd server
pnpm test
```

The tests run once and exit after completion.

Unit tests (`server/tests/`) cover:

- **Shortlist and results:** the group midpoint, distance, the diet and budget rules, centre closures, candidate selection, and the results tally with its travel-distance tie-break.
- **Centre Search:** which stalls are open on the plan's date and why the others are closed, which members have nothing to eat, that only food centres are listed, and every rule for adding a centre to the group's picks (members only, open on the plan's date, no duplicates, max 10, not after swiping starts).
- **Hawkers:** hawker ID format, hawker login, and updating stall status and rest days.
- **Shout-outs:** working out "today" in Singapore time.

### Frontend component tests

```bash
cd client
pnpm test:unit
```

`client/src/components/__tests__/CentreMenu.spec.js` checks the Centre Search menu on its own: cheapest price per stall, opening and closing stalls, closed-stall reasons, and the empty-state messages.

### Frontend end-to-end tests

The Playwright tests (`client/e2e/`) drive the app in a real browser. Playwright starts the Vite dev server itself, but **not** the backend.

**1. Install the browser (once)**

```bash
cd client
pnpm exec playwright install chromium
```

**2. Start the backend** in its own terminal and leave it running (the database must be seeded, see [Seeding](#seeding)):

```bash
cd server
pnpm dev
```

Wait for `API running on http://localhost:8000`. Without it, the plan tests fail, and the terminal running Vite shows `ECONNREFUSED` (it couldn't reach the backend).

Some tests also need OneMap credentials (`ONEMAP_EMAIL` and `ONEMAP_PASSWORD`) in `server/.env`, see [Environment variables](#environment-variables). Joining with a postal code and loading journey routes both go through OneMap, so without them the Makan Plan, Swipe and most Centre Search tests fail at "Location set".

**3. Run the tests** from `client/`:

```bash
pnpm exec playwright test --project=chromium
```

We run Chromium only because the project briefing says the app is graded in Google Chrome. It is the only browser set up in `playwright.config.js`, so `--project=chromium` is optional for now (`pnpm exec playwright test` runs the same tests).

Other useful commands:

```bash
pnpm exec playwright test <file-name> --project=chromium  # one spec file, e.g. swipe or centre-search
pnpm exec playwright test --project=chromium --ui         # watch tests run step by step
pnpm exec playwright test --project=chromium --workers=2  # fewer tests at once, if the backend is slow
pnpm exec playwright show-report                          # open the HTML report of the last run
```

A full run takes about 2 minutes. The two-person tests are the slowest, because building the shortlist and loading the swipe cards both query the database.

**What the E2E tests cover**

The last column says where each test gets its data:

- **Real**: the test talks to the actual Express server and MongoDB, so it only passes if the frontend, backend and database all work together. These tests need the backend running.
- **Mocked**: the test swaps the API for fixed fake responses (with `page.route`), so it only checks how the page displays data. It doesn't need the backend.
- **None**: the test never calls the API (e.g. the 404 page).

| Spec | User journey | Server |
|---|---|---|
| `makan-plan.spec.js` | Host creates a plan and gets a 6-digit code, joins with a map pin; a friend joins with a postal code; the host's lobby picks up the friend; the host starts swiping and both people land on the swipe page | Real |
| `leaflet-map.spec.js` | Host creates a plan and joins by clicking the Leaflet map | Real |
| `swipe.spec.js` | Both people say yes to every card: both see the same winner ("2 of 2"), the waiting screen shows "1 of 2 finished", "Take me there!" opens the journey page and "See live seats" opens the winning centre. Both skip every card: both see "No match this time" and no "Take me there!" button | Real |
| `validation.spec.js` | 404 page and its "Back to home" link; a code that isn't 6 digits; a code that doesn't exist; a lobby for a missing plan shows an error and an "Enter another code" link; a budget under $5 shows an error | Real for the last three, none for the first two |
| `url-validation.spec.js` | Typing URLs by hand: a saved member ID that's no longer in the plan doesn't cause a redirect loop; a fake plan code says the plan wasn't found; the journey page explains why there's no route yet; leaving the swipe page doesn't pull you back | Real |
| `centres.spec.js` | Centre list, closed centres, crowd reports, shout-outs, cards stacking at 375px, the list sorted by name and split into pages | Mocked |
| `centre-search.spec.js` | One person creates a plan, joins with a postal code and adds a centre to the picks; with two people, the host adds the nearest centre and the friend sees it ✅ without being told who picked it; a friend's pick shows up on the host's page without reloading; no code, a fake code, a broken link or the server being down shows an error; the back button returns to the lobby; searching by centre name, dish and max price | Real, mocked for the server-down test |
| `landing.spec.js` | "Start a Makan Plan" and "Join with a code" open the right pages; the live centre status links to all centres | Real |
| `hawker-login.spec.js` | A valid hawker logs in; a wrong stall name is refused; both fields are required; the hawker ID is not case-sensitive | Real |
| `hawker-dashboard.spec.js` | A logged-in hawker sees the dashboard, their stall's details, and can update the stall status | Real |
| `hawker-application.spec.js` | A new hawker opens the application page; required fields are checked; an application is submitted | Real |
| `admin.spec.js` | A valid admin logs in; an invalid admin ID is refused; the dashboard lists hawker applications | Real |

**How the tests are built**

- **Two people, two browser contexts.** The plan, swipe and Centre Search tests open two separate browser contexts, so the host and the friend each have their own `localStorage`, like two different phones.
- **Real backend vs mocks.** The full journeys (create → join → swipe → result) use the real server, because the point is to check that everything works together. Pages that only display data (`centres.spec.js`) are mocked, so they're fast and don't depend on what's in the database. `centre-search.spec.js` also uses `page.route` once, to make the API fail on purpose and check the "server can't be reached" message.
- **Stable selectors.** Tests find elements the way a user does (`getByRole` with the button, link or heading text). Where text changes from run to run, they use `data-testid` (`plan-code`, `swipe-counter`, `winner-name`). Centre Search's tests read the chosen centre's name from its `.centre-name` heading, since it depends on which centre is nearest.
- **Repeatable without hardcoding.** The number of swipe cards depends on the plan, so the swipe tests read "Centre 1 of N" and loop N times instead of clicking a fixed number of times.
- **Negative checks.** Tests also assert what must *not* happen, for example staying on the join page after a bad code, and no "Take me there!" button when there is no match.
- **Waiting for polling.** The lobby, swipe and Centre Search pages refresh every 5 seconds, so checks that depend on another person's action use longer timeouts (10–30 seconds), and the two-person tests raise the test limit with `test.setTimeout`.

**Database note**

The tests that use the real backend write real records on every run: plans named "saturday lunch", "centre search lunch" and "e2e lunch", hawker applications named "Playwright Test Stall", and an approved application named "Playwright Approval Stall" plus a number, which also adds a new stall and hawker ID. The hawker dashboard test also changes `HAWKER_001`'s stall status. To keep demo data clean, point `DB` in `server/.env` at a separate test database before running them, or delete these records afterwards.

---

## How the shortlist works

1. **Midpoint** — average of every member's pin.
2. **Open** — centres closed on the plan's date (NEA cleaning, repairs) are dropped.
3. **Distance** — the 15 nearest centres to the midpoint become candidates.
4. **Diet and budget** — a centre is kept only if every member has at least one dish they can eat within their budget.
5. **Ranking** — candidates are scored as distance, plus a price penalty, plus a crowd penalty if the plan starts within two hours. Lowest score first.
6. **Picks** — centres the group added through Centre Search (up to 10) always become swipe cards and come first, followed by up to 5 of the best nearby centres. A pick that is also one of those 5 isn't replaced, so there can be fewer.

The group then swipes, and the centre with the most yeses wins. Ties are broken by the shortest total travel distance for the whole group.

---

## Deployment

Deployed on Vercel as a multi-service project configured in `vercel.json`:

- `/api/*` routes to the Express service.
- Everything else routes to the Vue client.

The client service needs its own rewrite to `/index.html`, or any direct URL (for example, a shared plan lobby link) returns a 404 before the app loads.

MongoDB Atlas network access is set to allow all IPs, because Vercel's serverless functions don't have fixed addresses.

---

## AI use

### Visual design — AI-generated, used largely as produced

- The colour palette and design tokens in `client/src/assets/main.css`.
- Shared component styles: buttons, cards, chips, form inputs.
- All SVG illustrations: the food-friend avatars and icons in `components/HawkerArt.vue`, the animated kopitiam scene in `components/HawkerScene.vue`, and the background patterns in `client/src/assets/`.

### Code

- `decodePolyline()` in `client/src/views/JourneyView.vue`, which turns OneMap's encoded route geometry into map coordinates, was written with AI.

- **Boilerplate code generation (starter code and code snippets):** AI was used across the project to generate starter code and snippets, which we then adapted, extended and tested ourselves. 
- **Explaining coding errors and debugging hints:** while building HawkerHop, we asked AI for hints on problems, then wrote and tested the code ourselves e.g.:
  - **Ignoring out-of-date menu responses** (`loadMenu()` in `client/src/views/CentreSearch.vue`). If you choose centre A and then quickly choose B, A's menu can arrive after B's. The page remembers which centre each request was for and ignores any answer for a centre you've already moved away from, so A's menu never shows under B's name.

### Tests

- The Vitest unit tests in `server/tests/` were written by us first, then cross-checked with AI.
- `client/e2e/makan-plan.spec.js` and `leaflet-map.spec.js` are ours, with selectors found using Playwright's codegen recorder.

### Documentation

- This README was written with AI help (Claude), then checked against the code and edited by us.

### Written by us

- All application logic: the shortlist funnel (midpoint, closure checks, diet and budget matching, crowd and price ranking), the OneMap routing integration (apart from the polyline decoding above), the plan/join/swipe/results flow, every backend endpoint, and the NEA data import and seed scripts.

---

## Known limitations

- **Hawker and admin access uses prototype-level identification, not full authentication.** HawkerHop's hawker onboarding and admin approval flow is a simplified prototype, not a recreation of Singapore's official hawker tenancy process. The "admin" represents an internal HawkerHop team role that approves which stalls may manage content in the app.

  Because this is only a prototype-level onboarding flow, hawker and admin access uses ID-based gating rather than full authentication: an ID is stored in localStorage and sent as a header, with no passwords or tokens. A production version would require stronger authentication, such as secure accounts, authenticated sessions or tokens, or integration with official identity systems.
- **Member locations are validated against a bounding box**, so a pin in the Straits or just across the Causeway is accepted. OneMap then can't route from it, and the journey page offers Google Maps as a fallback.
- **Members can't change their diet or budget after joining.** They would need to rejoin or start a new plan.
- **NEA's data has closure dates but not opening hours**, so a plan at 4am produces a shortlist of centres that are closed. We warn on the create page rather than blocking it.
- **The host is whoever joins first.** This matches the usual flow — you create a plan, add your own details, then share the code — but it isn't enforced.

---

## Team

| Feature | Owner |
|---|---|
| Makan Plan, shortlist logic, routing | Zhe Ming & Shawn |
| Swipe to Match | Shawn |
| Hawker & admin accounts | Alecia |
| Live Centre Status | Yash |
| Hawker Dashboard | Dikshaa |
| Centre Search | Angeline |
