# Visual landing and seeded demo for tai.naindev.com

Status: In progress

## Objective

Owner request of 2026-10-26: `https://tai.naindev.com` is a portfolio showpiece for NainDev, but a visitor sees only a sign-in form and nothing of the product. Make the first screen impressive, intuitive and simple, and let anyone see every function working in under a minute without an account. Requirements `REQ-060` to `REQ-073` are in `Tai.Client/docs/10-requirements.md`.

## Baseline (2026-10-26, production)

- `/` redirects every visitor to `/login?redirect=%2F`: a card with two fields and a small "continúa como invitado" link.
- Guest mode already exists and works (REQ-035): local attempts, local statistics, streak, daily goal and a review queue, all persisted in the browser. A new guest opens a dashboard of zeros and empty states, so nothing is shown.
- Design tokens, typefaces, ambient background and primitives (`Card`, `Button`, `Metric`, `Callout`, `LoadingSkeleton`) are in place and aligned with naindev.com (ADR-0001).
- Unit suite is pure logic under Vitest in a Node environment: there is no jsdom, so new logic is kept in pure modules and tested there; component tests are T-012.

## Functional requirements (EARS)

- **FR1** (REQ-060, REQ-061, REQ-062): When a visitor with no session opens `/`, the system shall render the landing: value proposition, primary action "Probar la demo", secondary "Iniciar sesión", a product preview and a section per product function with a link that opens that function in the demo.
- **FR2** (REQ-063, REQ-064, REQ-073): When the visitor starts the demo, the system shall seed a guest session with synthetic, date-relative, deterministic data and open the home overview.
- **FR3** (REQ-065, REQ-066): While the demo is active, the system shall show a notice with "Reiniciar demo" and "Crear cuenta"; resetting removes the example data, restores guest progress that existed before the demo and returns to `/`.
- **FR4** (REQ-067): When a demo visitor finishes an exam, the system shall add it to the seeded history.
- **FR5** (REQ-068): While the demo is active, the system shall show a guide of what to try, marking each step done as the visitor does it.
- **FR6** (REQ-070): The home shall open on an overview: daily goal, streak, mastery by block and the three study actions (quick round, review mistakes, official mock exam).
- **FR7** (REQ-071): The performance screen shall show a grade trend line with the pass mark, a consistency calendar and mastery by block, each with a text alternative.
- **FR8** (REQ-072): New animation shall be disabled under reduced motion; new screens shall pass the existing accessibility rules.

## Edge cases and error handling

- A visitor who signed out of an account may still hold unsynced local attempts. Starting the demo stashes them (`nain_tai_pre_demo_v1`) and restores them when the demo ends, so no real progress is overwritten.
- A visitor who is already a guest or signed in never sees the landing; the demo is only reachable from it.
- The seed needs questions for the review queue. They come from the bundled catalogue; when it cannot be read, the review queue starts empty and everything else still seeds.
- Demo attempts have negative ids like any local attempt (the API only issues positive ones) and are never queued for the server.
- Starting the demo twice replaces the example data rather than stacking it.

## Out of scope

- A product tour with spotlight anchoring (the guide is a checklist, which is robust across routes and viewports).
- Component tests with jsdom (T-012) and end-to-end tests (T-014): a browser pass is recorded in `50-traceability.md` instead.
- Backend changes: the demo uses no endpoint that does not already exist.
- New dependencies.

## Acceptance criteria

- `npm run verify` passes in `Tai.Client`.
- Landing and demo home checked in a real browser at 1440 px and 390 px; axe reports no serious violations; Lighthouse performance on the landing reported.
- A clean 1280x720 capture of the landing and of the demo home saved for the portfolio.

## Session state

<!-- Session handoff: keep current. What is done, what is verified, what is next, what is blocked. -->
- Last updated: 2026-10-26, session naintai-visual (worktree `D:/wt/SistemaOposicionesTAI-feat-visual-landing-demo`, branch `feat/visual-landing-demo`, cut from `main`; the August branch `naindev/project-flexibility-scalability-npxrmq` is stale and was not used)
- Done: T01 to T09 and T11. Requirements REQ-060 to REQ-075 are Implemented in `Tai.Client/docs/10-requirements.md`, with evidence in `50-traceability.md`, tasks and handoff in `40-tasks.md`, changelog, design system and blockers updated. Nothing committed.
- Verified: `npm run verify`; production build in a browser at 1440 and 390 px; axe 0 violations in 10 states; Lighthouse `/` desktop 100, mobile 92, accessibility 100; reduced motion.
- Found on the way: reloading the results screen re-recorded the exam (fixed, REQ-030); the suite bar hid the header on a phone (fixed, REQ-075); production answers 404 for every route except `/` (REQ-074, needs the hosting setting).
- Next: owner review, commit and pull request, deploy.
- Blocked: Vercel root directory must be `Tai.Client` for REQ-074 to take effect (`[H]`).
