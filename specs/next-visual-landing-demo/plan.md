# Implementation plan: visual landing and seeded demo

Status: In progress

## Modules

All paths under `Tai.Client/src`. Pure logic lives in modules without React so it is testable under the Node-only Vitest setup.

- **`demo/seed.ts`** (pure): `buildDemoSeed(today, questions)` returns attempts, streak, daily goal, answered-today and a review queue. Deterministic (fixed PRNG seed), date-relative, applies the official scale (+1 / −0,33) the same way `toLocalAttempt` does. Covers REQ-063, REQ-064.
- **`demo/session.ts`**: `startDemo(questions)` and `endDemo()` orchestrate the stores. Stashes real guest progress in `nain_tai_pre_demo_v1` before seeding and restores it on exit; storage is injected for tests. Covers REQ-063, REQ-066.
- **`demo/guide.ts`** (pure) and **`store/useDemoStore.ts`**: the checklist steps and which are done, persisted with the demo flag. Covers REQ-068.
- **Stores**: `useAuthStore` gains `isDemo`, `startDemo`, `endDemo` flags persisted; `useAnalyticsStore.replaceAll` and `useProgressionStore.replaceAll` accept a snapshot. No change to existing actions.
- **`utils/chart.ts`** (pure): line and area path from trend points, pass-mark y, calendar grid for the last N weeks from attempt dates, ring dash offset. Covers REQ-071.
- **Routing**: `__root.tsx` adds `/` to the public routes; `routes/index.tsx` renders `Landing` when the visitor has neither a user nor guest mode, otherwise the home. Covers REQ-060.
- **`features/landing/*`**: `Landing`, `ProductPreview` (real `Card`, `Metric`, ring and block bars rendered with `buildDemoSeed` output, no screenshots), `FeatureGrid`, `HowItWorks`, `FinalCta`. Covers REQ-061, REQ-062.
- **`components/layout/Header`**: visitor variant (anchors, "Iniciar sesión", "Probar la demo") versus the signed-in navigation. **`DemoBanner`** and **`DemoGuide`** inside `BaseLayout`. Covers REQ-065, REQ-068.
- **`features/overview/*`**: `OverviewKpis`, `ActionCards` (quick round, review mistakes, official exam) and `BlockMastery` (rings) on the home above the existing setup form. Covers REQ-070.
- **`features/analytics/*`**: `TrendLineChart`, `ConsistencyCalendar` replace the bar trend; `BlockBar` keeps its meter semantics and gains the ring variant. Covers REQ-071.
- **Login**: a prominent "Probar la demo" action above the form. Covers REQ-062.
- **Styles**: new tokens only where missing (gradients, glass surface); each component has a CSS module; all keyframes sit behind `prefers-reduced-motion: no-preference`. Covers REQ-072.

## Data model changes

None server side. Client storage: `nain_tai_pre_demo_v1` (stash), `nain_tai_demo_v1` (guide progress), `isDemo` in the persisted auth state `nain_tai_auth_v1`. Persisted-state version is unchanged: an absent `isDemo` reads as false.

## Key decisions

- **Decision**: the demo is a seeded guest session, not a special account or a backend feature.
  - **Discarded alternative**: a shared demo account (needs credentials in a public client, breaks REQ-064 and offline use); a separate demo build (two products to keep in sync).
  - **Rationale**: REQ-035 already makes guests first-class and local; seeding reuses every screen unchanged, so what the visitor sees is the real product.
- **Decision**: the product preview on the landing renders real components with seed output.
  - **Discarded alternative**: a screenshot or a video (goes stale, heavy, not accessible).
  - **Rationale**: it cannot drift from the product and costs no transfer beyond the bundle.
- **Decision**: a checklist guide instead of an anchored spotlight tour.
  - **Discarded alternative**: coach marks anchored to elements (fragile across routes, viewports and the sticky header).
  - **Rationale**: works on a phone, keyboard friendly, and doubles as the feature index.
- **Decision**: charts are inline SVG built by pure functions.
  - **Discarded alternative**: a chart library (new dependency, bundle weight; OQ-004 already worries about size).
- **ADR**: none required; no contract, security rule or storage format of an Approved ADR changes.

## Test strategy

- Unit (Vitest, pure): seed (shape, determinism, date relativity, scale, streak and daily goal coherent, weakest block, review queue from given questions, empty queue when none), demo session (stash and restore, double start, end), chart helpers (paths, pass mark, calendar buckets, ring offset), guide step completion.
- Existing suites stay green; `npm run verify` is the gate.
- Browser pass (recorded in `50-traceability.md`): landing, demo start, each guide step, finish an exam, reset, at 1440 px and 390 px, reduced motion, axe and Lighthouse.
