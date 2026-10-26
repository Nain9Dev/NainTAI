# Tasks: visual landing and seeded demo

One task at a time, test first. Update the `Session state` block in `spec.md` after closing each one.

- [x] **T01** `[A]` Pure demo seed: attempts, streak, daily goal, review queue.
  - **Covers**: REQ-063, REQ-064
  - **Done when**: `demo/seed.test.ts` passes (shape, determinism, date relativity, scale, coherence).
- [x] **T02** `[A]` Chart helpers: line and area paths, calendar grid, ring offset.
  - **Covers**: REQ-071
  - **Done when**: `utils/chart.test.ts` passes.
- [x] **T03** `[A]` Demo session: stash, seed, restore; store additions (`isDemo`, `replaceAll`); guide steps.
  - **Covers**: REQ-063, REQ-066, REQ-067, REQ-068
  - **Done when**: `demo/session.test.ts` and `demo/guide.test.ts` pass; existing store tests still pass.
- [x] **T04** `[A]` Routing and landing: public `/`, visitor header, landing sections with the real-component preview.
  - **Covers**: REQ-060, REQ-061, REQ-062, REQ-072
  - **Done when**: typecheck and lint pass; landing checked in the browser at 1440 px and 390 px.
- [x] **T05** `[A]` Demo banner, guide and login entry point.
  - **Covers**: REQ-065, REQ-066, REQ-068
  - **Done when**: browser pass: start, guide ticks, leaving restores the landing.
- [x] **T06** `[A]` Home overview: figures, action cards, mastery by block.
  - **Covers**: REQ-070
  - **Done when**: the demo home opens populated at both widths.
- [x] **T07** `[A]` Performance screen: trend line with pass mark, consistency calendar, block meters.
  - **Covers**: REQ-071
  - **Done when**: charts render with text alternatives; a guest with no data still shows the empty state.
- [x] **T08** `[A]` Motion and polish pass: reveal, counters, ring and line animation, reduced-motion check.
  - **Covers**: REQ-072
  - **Done when**: reduced-motion capture shows every section; axe has no violations.
- [x] **T09** `[A]` Verification and capture: `npm run verify`, Lighthouse, axe, 1280x720 captures, traceability and changelog rows.
  - **Covers**: acceptance criteria
  - **Done when**: all green and the numbers are in the report.
- [x] **T11** `[A]` Found on the way: record a finished exam once across reloads (REQ-030), header below the suite bar (REQ-075), SPA fallback for the host (REQ-074), route code splitting.
  - **Covers**: REQ-030, REQ-074, REQ-075
  - **Done when**: `useStudyStore.test.ts` and `deploy.test.ts` pass; header checked at 390 px.
- [ ] **T10** `[H]` Owner reviews, approves and decides when to commit, open the pull request and deploy (the production site follows `main`); confirm the Vercel root directory is `Tai.Client`.
  - **Needs from owner**: review, commit and pull request go-ahead, the Vercel setting, deploy.
