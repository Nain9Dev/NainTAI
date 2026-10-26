# 40 — Tasks

Labels: `[A]` the agent completes it alone · `[M]` mixed, a human action closes it ·
`[H]` human only.

## Done

| Id | Task | Label | Done when |
| :--- | :--- | :--- | :--- |
| T-001 | Adopt the naindev.com design system | `[A]` | ✅ Every custom property a component references now exists |
| T-002 | Self-host the typefaces | `[A]` | ✅ No third-party font request on the critical path |
| T-003 | Rebuild the exam engine: one question at a time, palette, keyboard | `[A]` | ✅ The store's navigation actions are finally used |
| T-004 | Countdown anchored to wall-clock time, with auto-submit | `[A]` | ✅ Exam mode is timed; a background tab cannot gain minutes |
| T-005 | Persist the exam to `sessionStorage` | `[A]` | ✅ A reload mid-exam restores the answer sheet and the clock |
| T-006 | Make the dashboard work for guests and offline | `[A]` | ✅ Local attempts are read, not just written |
| T-007 | Single-flight session rotation with one retry | `[A]` | ✅ An expired token no longer signs the candidate out everywhere |
| T-008 | Replace polling with a connection store | `[A]` | ✅ Two intervals removed; the header and the banner cannot disagree |
| T-009 | Align the client with the API contract | `[A]` | ✅ Paginated history, `IntentoRequest` without a grade, `/auth/me` |
| T-010 | Remove the dead generated client and the Vite template leftovers | `[A]` | ✅ `npm run typecheck` passes |
| T-011 | Unit tests over marking, aggregation and normalisation | `[A]` | ✅ 48 tests, all green |
| T-013 | Accessibility pass: labels, focus, live regions, reduced motion | `[A]` | ✅ Every control is labelled; no state depends on colour alone |
| T-020 | Degrade to the bundled catalogue on a server error, not only on a network failure | `[A]` | ✅ Verified against the stale production API: the exam starts instead of breaking |
| T-021 | Open IndexedDB on first use rather than on import | `[A]` | ✅ The module loads in Node, and no database is created for a visitor who never goes offline |
| T-022 | Public landing with a product preview built from the real components | `[A]` | ✅ REQ-060 to REQ-062; checked at 1440 and 390 px |
| T-023 | Seeded demo: example data, stash and restore, banner, guide | `[A]` | ✅ REQ-063 to REQ-068; 35 unit tests |
| T-024 | Home overview and performance charts (line with pass mark, consistency calendar, block rings) | `[A]` | ✅ REQ-070, REQ-071; 19 chart tests |
| T-025 | Record a finished exam once across reloads | `[A]` | ✅ REQ-030; the `recorded` flag lives in the persisted study state |
| T-026 | SPA fallback and asset caching for Vercel | `[A]` | ✅ REQ-074 in the repository; `[H]` to confirm the root directory, see `41-blockers.md` |
| T-027 | Header below the NainDev suite bar; phone header on one row | `[A]` | ✅ REQ-075 |
| T-028 | Split route components into chunks | `[A]` | ✅ First-visit JavaScript about 114 kB gzipped, below the 116 kB of the old single bundle, with a much richer landing |

## Next

| Id | Task | Label | Done when |
| :--- | :--- | :--- | :--- |
| T-012 | Component tests with Testing Library and jsdom | `[A]` | The requirements with no suite in `50-traceability.md` have automated coverage |
| T-014 | End-to-end tests with Playwright | `[A]` | The browser pass recorded in `50-traceability.md` runs on every push |
| T-015 | CI workflow running `npm run verify` | `[M]` | Green on a pull request. Needs the owner to enable Actions |
| T-016 | Service worker so the offline catalogue survives a cold start | `[A]` | The application opens with no network on a first visit |
| T-018 | Show the queue's contents, not just its depth | `[A]` | A candidate can see which exams are waiting to sync |
| T-019 | Decide what to do when an exam is abandoned mid-flight | `[M]` | See OQ-002 in `11-open-questions.md` |

## Session handoff

**State as of 2026-10-26** (branch `feat/visual-landing-demo`, worktree `D:/wt/SistemaOposicionesTAI-feat-visual-landing-demo`, nothing committed)

- **Done:** T-022 to T-028 (feature workspace `specs/next-visual-landing-demo/`). `npm run verify`
  passes. The landing, the seeded demo, the home overview and the new charts are in; T-017 is
  closed by T-028.
- **Verified:** production build in a real browser at 1440 and 390 px; axe-core 0 violations in
  10 states; Lighthouse `/` desktop 100 and mobile 92; reduced motion. Recorded in
  `50-traceability.md`.
- **Found and fixed on the way:** reloading the results screen filed the exam again (REQ-030);
  the suite bar hid the brand and the menu button on a phone (REQ-075); production answers 404
  for every route except `/` (REQ-074, needs the owner).
- **Next:** owner review, commit and pull request; deploy; check that Vercel's root directory is
  `Tai.Client`. Then T-012 (component tests) and T-014 (Playwright), which would turn this
  session's browser pass into automated coverage.
- **Blocked:** REQ-074 is only effective once the hosting setting is confirmed `[H]`.

**State as of 2026-09-08**

- **Done:** the rewrite above. `npm run verify` passes: typecheck, lint, 48 unit tests,
  production build.
- **Verified:** by a browser pass against a live API on a freshly migrated database, not by
  inspection. Full exam flow, persistence, dashboard and mobile layout — recorded in
  `50-traceability.md`. Two bugs surfaced during it and are fixed: the mobile menu icon was
  inverted, and a whitespace-only block selector normalised to an empty string instead of
  the wildcard.
- **Next:** the client is ready; what is missing is on the API side. Until the Render
  service is redeployed from `main`, the application runs on the bundled catalogue and
  says so. Then T-012 and T-014.
- **Blocked:** nothing. See [`41-blockers.md`](41-blockers.md).
