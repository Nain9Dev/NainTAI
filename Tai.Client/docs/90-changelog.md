# 90 — Changelog

## 2026-09-08 — Degrade on server errors

The deployed API predates the `/api/preguntas` endpoints, so every read returned 404 and the
application showed the candidate nothing — with a full offline catalogue sitting in the
bundle, unused.

### Fixed

- **A read now degrades on a server error, not only on a network failure.** The fallback
  only ran when `fetch` threw; a 404 or a 5xx became an error and was rethrown. An
  unreachable server degraded gracefully while a reachable one missing an endpoint broke the
  page, which is the worse outcome from the less severe failure — ADR-0006.
  400, 401, 403 and 409 still surface: they are answers, and hiding an expired session
  behind the catalogue would let the candidate practise while nothing was being recorded.
- **The offline queue opened IndexedDB on import.** That made the module unloadable wherever
  IndexedDB is absent — it threw in Node, so `client.ts` could not be tested at all — and in
  a browser it created a database for every visitor, including those who never go offline.
  Now opened on first use, with an explicit `initialize()` at start-up to publish the
  pending count.

### Verification

Built against the stale production URL and run in a browser: the exam starts from the
bundled catalogue, the indicator reads `MODO LOCAL`, and the banner explains why. The same
run previously produced an unusable page and three 404s in the console.

60 unit tests, including the degradation policy.

## 2026-09-08 — Client rewrite

### Fixed — the interface was rendering on undefined values

`tokens.css` defined one vocabulary while the components referenced another. Roughly a
dozen custom properties resolved to nothing, so cards had no surface colour, dividers no
line colour and correct answers no feedback colour. An undefined custom property fails
silently, which is why it never showed up as an error.

Adopted naindev.com's design system wholesale — ADR-0001.

### Fixed — behaviour

- **A reload mid-exam lost everything.** The exam now persists to `sessionStorage` —
  ADR-0005.
- **Exam mode had no timer**, despite the countdown being what distinguishes it from study
  mode. Added, anchored to wall-clock time so a throttled background tab cannot gain
  minutes.
- **The store's navigation actions were never called.** The engine rendered every question
  on one page. Now one at a time, with a palette and keyboard navigation.
- **Guests saw "no statistics available"** while their attempts sat unread in local
  storage. The dashboard now computes local statistics and merges them with the server's.
- **Per-block statistics split in half**, because the API returns `"I"` and the bundled
  catalogue stores `"1"`. Normalised at every boundary.
- **The score was tallied twice** — once on submit and again on each render — which is
  exactly how two figures drift apart. Computed once from the answer sheet.
- **Elapsed time crept upward** on the results screen, because the clock was read during
  render. Fixed at the moment the exam closes.
- **A 401 signed the candidate out** instead of rotating the session. It now rotates once
  and replays, single-flight — ADR-0003.
- **Two polling intervals**, one per second and one per two seconds, could disagree about
  the connection state. Replaced with a store.
- **The offline queue had no attempt limit**, so one poisoned entry blocked everything
  behind it on every reconnection.

### Fixed — found by the tests written for this change

- A whitespace-only block selector normalised to an empty string instead of the wildcard,
  which would have shown up as a nameless row in the statistics.
- The mobile menu button showed a close icon while the menu was shut.

### Changed

- Aligned with the API's new contract: paginated history, a request body that carries no
  grade, `/auth/me` for session rehydration, `/preguntas/disponibilidad`.
- `Select` now generates its own id. It previously took an optional `id` and pointed
  `htmlFor` at it, so every call site that omitted it produced a label attached to nothing.
- Typefaces self-hosted. They were being loaded from Google Fonts twice, once in
  `index.html` and again through an `@import`.
- Accessibility: visible focus rings, a `fieldset` with a `legend` for the mode choice,
  live regions on results, feedback conveyed by icon and border as well as hue, and
  `prefers-reduced-motion` honoured throughout.
- Sign-out navigates through the router instead of `window.location`, which was discarding
  the application state and re-downloading the bundle.

### Removed

- `src/api/generated/` and `orval.config.ts` — never imported, generated from a stale
  contract, and broken after `custom-instance.ts` was removed — ADR-0004.
- `App.tsx`, `App.css` and the Vite template assets, still shipping in the bundle.
- `hooks/useApi.ts`, superseded by TanStack Query.
- `vercel.backup.json` and the `.tanstack` cache.

### Added

- Vitest with 48 tests over marking, aggregation and block normalisation.
- `npm run verify`: typecheck, lint, test, build.
- A question palette, keyboard navigation, a review mode and a trend chart.
- Full SDD documentation under `docs/`, including five ADRs.

### Verification

`npm run verify` passes. A browser pass against a live API on a freshly migrated database
covered registration, the full exam flow, persistence, the dashboard and the mobile layout,
with no console errors — recorded in `50-traceability.md`.
