# IS216 Group Project Proposal — **HawkerHop** 🍜

> *"Never walk to a closed hawker centre again. Decide where to makan, together."*

---

## 1. Problem Definition

### The problem
Hawker culture is part of daily life in Singapore, but deciding **where and when to eat** is full of avoidable friction:

| Pain point | What actually happens |
|---|---|
| **Surprise closures** | NEA hawker centres close several times a year for cleaning and for longer periods for repairs/upgrading. People only find out when they arrive. |
| **Stall-level uncertainty** | Even when the centre is open, a specific stall may be sold out, closed early, or on leave. There is no single place to check. |
| **Weather** | Sudden afternoon rain makes uncovered or far-off centres a bad choice, but people only check the weather separately. |
| **Group indecision** | "Where to eat?" in a group chat drags on. Friends live in different areas and nobody wants to be the one to decide. |
| **Hawkers lack a digital channel** | Many stallholders are older and not on social media, so they can't easily tell regulars "sold out today" or "back on Monday". |

### Facts to support the problem (verify and cite in slides)
The rubric asks for a problem "supported by facts". Collect these from primary sources and put the citations on your problem slide:

- Singapore's hawker culture was inscribed on UNESCO's Representative List of Intangible Cultural Heritage (Dec 2020): source is the UNESCO/NHB website.
- The number of NEA-managed hawker centres and their scheduled closure dates are in NEA's **"Dates of Hawker Centres Closure"** dataset on data.gov.sg. Count how many closure days happen per quarter.
- The ageing of hawkers and the succession problem: source is NEA / Straits Times / CNA reports.
- **Your own mini-survey (strongly recommended):** 20–30 SMU students. Ask "Have you ever gone to a hawker centre or stall that turned out to be closed?" and "How long does your group take to decide where to eat?". Original data is a strong differentiator in the presentation.

### Goals
1. Show the real-time open/closed status of every hawker centre, using official data.
2. Let stallholders broadcast their live status with minimal effort.
3. Help friend groups decide on a centre quickly and fairly.
4. Factor in weather and travel for every recommendation.

### Constraints
- Must use free API tiers: marker testing is about 5–6 calls per feature per day, so cache API responses in MongoDB.
- Stall-level data is not public, so it is seeded for about 3 pilot centres and then crowd-sourced or owner-updated.
- Must work from iPhone 6 (375px) up to the Bootstrap XL breakpoint, as tested in Chrome DevTools.

---

## 2. Solution Overview

HawkerHop is a Vue web app with three user roles:

| Role | Can do |
|---|---|
| **Guest** | Browse centres, see open/closed status, weather, map |
| **Diner (logged in)** | Favourites, reviews, crowd reports, create/join Makan Plans, notifications |
| **Stall Owner (logged in)** | Claim a stall, update live status (Open / Sold Out / Closed Early / On Leave), edit menu |

### Core features (each is one user journey and gets E2E tests)

| # | Feature | What makes it A+-level |
|---|---|---|
| F1 | **Hawker Explorer** | Map and list of all centres with an **"Open today?"** badge computed from NEA closure data, a 2-hr weather forecast per area, and filters (open now, near me, covered). |
| F2 | **Stall Pages + Owner Dashboard** | Role-based access. Owners update status in one tap. Diners see "Updated 12 mins ago". |
| F3 | **Live Crowd Reports** | Diners report queue length (Short/Medium/Long). Reports **decay over time**, so a 90-minute-old report counts for less than a fresh one (weighted average). |
| F4 | **Makan Plan (group decision)** ⭐ | Create a plan, share an invite link, and friends join and enter their location. The app computes the **geographic midpoint**, suggests the nearest **open** centres (downgrading uncovered ones if rain is forecast), and friends **vote** live. The winner gets OneMap routing for each member. |
| F5 | **Favourites & Notifications** | Favourite a stall and get an in-app notification when it goes back to "Open" or when a favourite centre has an upcoming closure. |
| F6 | **Reviews & Ratings** | 1–5 stars plus a comment per stall, with an average shown on the stall page. One review per user per stall. |

⭐ F4 is the "challenging problem" the A+ band asks for. It combines multiple APIs, geo-computation, multi-user state, and business rules in a single feature.

---

## 3. Technology Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | **Vue 3** (Vite, Vue Router, Pinia) | Course framework; examinable |
| Styling | **Bootstrap 5** + custom SCSS theme | Responsive grid; covers the 18% styling component |
| Map | **Leaflet** with OneMap basemap tiles | Free, local look |
| Backend | **Node.js + Express** (MVC, `exports.methodName` controllers) | Builds on IS113 |
| Database | **MongoDB Atlas** + **Mongoose** | Builds on IS113 |
| Auth | **bcrypt + express-session** (connect-mongo store) | Same pattern as IS113 |
| Server-rendered page | **EJS** for a printable **Stall QR poster** (`/poster/:stallId`) | Uses IS113 EJS meaningfully. Owners print a QR code that diners scan to open the stall page. |
| E2E testing | **Playwright** | Stable `data-testid` selectors, seeded test DB |
| Unit testing (bonus) | **Vitest** | Tests for the crowd-decay and midpoint functions |
| CI (bonus) | **GitHub Actions** | Runs tests on every PR; branch protection on `main` |
| Deployment | **Render** (single Express service serving the Vue `dist/` build) | One origin, so no CORS or cross-site cookie problems with sessions. `index.html` sits at the server root, as the brief requires. |

### External APIs (via async `fetch`)
| API | Used for |
|---|---|
| **data.gov.sg: Dates of Hawker Centres Closure** | Open/closed status (F1, F4, F5) |
| **data.gov.sg: 2-hour Weather Forecast** | Rain-aware suggestions (F1, F4) |
| **OneMap Search API** | Geocoding postal codes and addresses (F4) |
| **OneMap Routing API** | Directions for each plan member (F4) |

**Caching strategy:** the backend fetches the closure dataset once a day and weather every 30 minutes, and stores both in MongoDB. The frontend calls your own API, not the external APIs directly. This protects the free quota and makes E2E tests stable. Mention this in the presentation, since it shows clear design thinking.

### Data models (Mongoose)
```
User        { name, email, passwordHash, role: 'diner'|'owner', favourites: [stallId] }
Centre      { name, address, lat, lng, isCovered, closures: [{ start, end, reason }] }
Stall       { centreId, name, unit, cuisine, ownerId, status, statusUpdatedAt, menu: [...] }
CrowdReport { stallId, userId, level: 1|2|3, createdAt }
Review      { stallId, userId, rating, comment, createdAt }   // unique index (stallId, userId)
MakanPlan   { code, hostId, members: [{ userId, lat, lng }], candidates: [centreId], votes: [{ userId, centreId }], status }
Notification{ userId, message, link, read, createdAt }
```

---

## 4. Work Allocation (6 Members)

Each member **owns one vertical feature end to end** (Vue components, Express routes/controller, Mongoose model, and E2E tests for it), **plus one cross-cutting responsibility**. Everyone codes, everyone presents, and ownership is clear for peer evaluation.

| Member | Feature ownership (full-stack) | Cross-cutting role | Presents |
|---|---|---|---|
| **M1: Team Lead** | Auth: register/login/logout, roles, route guards, session middleware | **Project manager + DevOps**: GitHub Projects board, branch protection, Render deployment, README | Intro + problem (with survey data) |
| **M2** | **F1 Hawker Explorer**: map, list, filters, closure logic | **API integration lead**: data.gov.sg caching jobs, OneMap token handling | Explorer demo + API integration |
| **M3** | **F2 Stall Pages + Owner Dashboard** + EJS QR poster | **Data lead**: seed script for pilot centres/stalls, Atlas setup | Owner flow demo |
| **M4** | **F3 Crowd Reports** + **F6 Reviews** | **Backend quality**: input validation, error-handling middleware, Vitest unit tests | Crowd + reviews demo, data store |
| **M5** | **F4 Makan Plan** ⭐: midpoint, candidate ranking, voting, routing | **Algorithm owner**: documents the ranking logic for the presentation | Makan Plan demo (the showstopper) |
| **M6** | **F5 Favourites & Notifications** | **UI/UX + Testing lead**: Bootstrap theme, shared components (Navbar, StatusBadge, Toast), responsive checks at 375 / 576 / 768 / 992 / 1200px, Playwright setup + CI | Design, responsiveness, testing |

**Pairing for review:** M1↔M2, M3↔M4, M5↔M6. Every PR needs one approval from your pair before merging.

### GitHub collaboration (show this on a slide)
- **Issues** for every task, labelled `feature` / `bug` / `test`, and assigned to the owner.
- **GitHub Projects** kanban (Backlog → In Progress → Review → Done).
- **Feature branches** (`feat/makan-plan`) → **Pull Request** → pair review → merge. No direct pushes to `main`.
- **Actions** runs Vitest + Playwright on each PR.
- Use **Discussions** or the PR comments for decisions, so there is a written record.

---

## 5. Timeline

| Week | Milestone | Deliverable |
|---|---|---|
| 4–5 | Team formed, idea locked, survey sent out | Repo + board set up, Figma wireframes (M6) |
| 6 | Skeleton: Express MVC, Vue router, auth, seed data | Deployed "hello world" on Render (M1) |
| 7 | **Peer eval #1** · F1 Explorer working with real closure data | |
| 8 | Proposal submitted (Sun 23:59) · F2 and F3 in progress | |
| 9 | **Progress Pitch**: live demo of **F1 Explorer** (open/closed badge + weather) | 5-min pitch |
| 10 | F4 Makan Plan + F5 + F6 complete | Feature freeze on Friday |
| 11 | **Peer eval #2** · E2E tests for all features, responsive polish, bug bash | |
| 12 | **Submit Fri 09:00** (aim for Thu night) | zip: app + README.txt + slides |
| 13 | Presentation (12 + 3 min) | YouTube video (unlisted, 1080p) linked on the title slide |

---

## 6. Rubric Mapping: How We Hit A+

| Component (weight) | A+ requirement | How HawkerHop meets it |
|---|---|---|
| **Problem solving (20%)** | Challenging problem, highly appropriate solution | Real official data + a multi-user group-decision feature with geo logic; the problem is backed by survey and NEA data |
| **Working app (27%)** | No bugs, zero-effort usability | Loading/empty/error states on every page, toasts for feedback, confirmation before destructive actions, consistent nav (follows the 10 UI rules of thumb linked in the rubric) |
| **Styling (18%)** | Beautiful, fully responsive incl. orientations | Custom Bootstrap theme (hawker-inspired palette), mobile-first, map collapses to a list on small screens, tested at every breakpoint in portrait and landscape |
| **Testing (10%)** | Main journeys covered, stable selectors, clear README | ~15–20 Playwright tests across F1–F6 + auth, `data-testid` selectors, DB reset + seed before each run, and a one-command `npm run test:e2e` documented in README |
| **Presentation (20%)** | Crystal clear + ≥1 bonus point | Tight story (problem → demo → tech); bonus points listed below |
| **Q&A (5%)** | | Every member can explain their own feature's code |

### Bonus points (beyond minimum requirements)
- GitHub Actions CI with Vitest unit tests + Playwright
- Server-side API caching layer
- Role-based access control (diner vs owner)
- EJS-rendered printable QR posters
- PWA installable on phones (optional stretch goal)

---

## 7. Suggested 12-Minute Presentation Flow

| Time | Section | Speaker |
|---|---|---|
| 0:00–1:30 | Hook ("Ever arrived at a closed hawker centre?") + facts + survey results | M1 |
| 1:30–3:00 | Explorer demo + how the closure/weather APIs are integrated | M2 |
| 3:00–4:30 | Stall owner flow + QR poster (EJS) | M3 |
| 4:30–6:00 | Crowd reports (decay logic) + reviews; data store explanation | M4 |
| 6:00–8:30 | **Makan Plan live demo** with 2 devices voting | M5 |
| 8:30–10:30 | Favourites/notifications, design system, responsiveness, testing + CI | M6 |
| 10:30–12:00 | GitHub workflow, tech beyond requirements, AI usage, wrap-up | M1 |

---

## 8. Submission Checklist

- [ ] `index.html` served from the server root
- [ ] README.txt: setup steps, **live Render URL**, dummy accounts (1 diner, 1 owner), how to run tests, libraries used, **parts that relied on AI/LLM**
- [ ] Slides (.pptx/.pdf) with the YouTube link on the title slide
- [ ] Credit third-party libraries in code comments and slides
- [ ] Render free tier sleeps when idle: open the site a few minutes before the demo to wake it
- [ ] Final check in Chrome DevTools from iPhone 6 up to the XL breakpoint
