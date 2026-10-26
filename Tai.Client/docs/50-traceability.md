# 50 — Traceability

Every requirement and the evidence for it. A requirement without a test is not done,
whatever the code says.

Suites:

- **Unit** — `npm run test` (158 tests, Vitest, Node environment). Pure logic: marking,
  aggregation, normalisation, the degradation policy, the demo seed and session, the chart
  geometry and the deployment configuration. There is no jsdom, so components are covered by
  the browser pass until T-012.
- **Browser** — a manual pass against a live API, recorded below.
- **Types** — `npm run typecheck`. Contract drift against the API surfaces here.

## Exam setup

| Requirement | Evidence | Suite |
| :--- | :--- | :--- |
| REQ-001 | `SYLLABUS_BLOCKS` order; `domain.test.ts > blockDisplayName` | Unit |
| REQ-002 | `useDisponibilidad` hook; browser pass showed the count under the block field | Browser |
| REQ-003 | The shortfall callout in `SetupForm` | Browser |
| REQ-004 | `SECONDS_PER_QUESTION`; browser pass showed 09:00 for ten questions | Browser |
| REQ-005 | `client.ts` static fallback plus the offline callout | Browser |
| REQ-006 | `client.test.ts` — degrades on 404, 408, 429 and 5xx; browser pass against the stale production API started an exam from the catalogue | Unit + Browser |
| REQ-007 | `client.test.ts` — does not degrade on 400, 401, 403 or 409 | Unit |

## Exam engine

| Requirement | Evidence | Suite |
| :--- | :--- | :--- |
| REQ-010 | Browser pass: palette rendered ten items, each labelled answered or not | Browser |
| REQ-011 | Browser pass: `ArrowRight` advanced, `A`–`D` selected | Browser |
| REQ-012 | The `INPUT`/`TEXTAREA`/`SELECT` guard in `useExamKeyboard` | — |
| REQ-013 | The early return in `answerQuestion` when the mode is study | — |
| REQ-014 | `showsKey` is false in exam mode until review | Browser |
| REQ-015 | The timeout branch in `tick` | — |
| REQ-016 | The elapsed-milliseconds anchor in `useExamTimer` | — |
| REQ-017 | The confirmation before finishing with blanks | — |
| REQ-018 | `sessionStorage` persistence via `partialize` | — |
| REQ-019 | `sessionStorage` rather than `localStorage` | — |

## Marking

| Requirement | Evidence | Suite |
| :--- | :--- | :--- |
| REQ-020 | `scoring.test.ts` — 8 tests over the scale | Unit |
| REQ-021 | `scoring.test.ts > returns zero rather than NaN for an empty exam` | Unit |
| REQ-022 | Browser pass: correct, wrong, blank, net points and elapsed time all shown | Browser |
| REQ-023 | `finishedAt` fixed in the store; no clock read during render | — |
| REQ-024 | `revealAnswers` on `QuestionCard` | Browser |

## Progress

| Requirement | Evidence | Suite |
| :--- | :--- | :--- |
| REQ-030 | `useStudyStore.test.ts` — the `recorded` flag is set once, persisted to `sessionStorage` and cleared by the next exam. The `hasSubmitted` ref alone did not survive a reload: reloading the results screen filed the same exam again (found 2026-10-26, six extra attempts in one session) | Unit + Browser |
| REQ-031 | The `pendienteSincronizar` branch in `useSubmitIntento` | — |
| REQ-032 | `offlineQueue.enqueue` on `QueuedOfflineError` | — |
| REQ-033 | `MAX_ATTEMPTS` in the queue | — |
| REQ-034 | The `discard` outcome on a 4xx | — |
| REQ-035 | `analytics.test.ts > aggregates attempts held only in this browser` | Unit |
| REQ-036 | `analytics.test.ts > adds offline attempts to the server totals`, `> weights the average by attempt count` | Unit |
| REQ-037 | `analytics.test.ts > groups the same block written as an ordinal and as a roman code`; `domain.test.ts` — 12 tests | Unit |
| REQ-038 | `analytics.test.ts > ignores samples too small to call a weak spot` | Unit |

## Session

| Requirement | Evidence | Suite |
| :--- | :--- | :--- |
| REQ-040 | `useAuthStore.hydrate` calling `/auth/me` on boot | Browser |
| REQ-041 | The 401 branch in `client.request` | — |
| REQ-042 | The `refreshInFlight` promise — [ADR-0003](30-decisions/ADR-0003-single-flight-refresh.md) | — |
| REQ-043 | `setToken` inside `refreshSession` | — |
| REQ-044 | The `auth:unauthorized` listener in the auth store | — |
| REQ-045 | The `finally` block in `logout` | — |
| REQ-046 | The error message is passed through from `ProblemDetails` unchanged | — |

## Interface

| Requirement | Evidence | Suite |
| :--- | :--- | :--- |
| REQ-050 | `tokens.css` values match naindev.com; browser pass compared against the portfolio | Browser |
| REQ-051 | `public/fonts`, `fonts.css`, no Google Fonts request | — |
| REQ-052 | Icon plus border plus hidden text on every feedback state | — |
| REQ-053 | `useId` in `FieldShell`; the browser pass read the accessibility tree | Browser |
| REQ-054 | `prefers-reduced-motion` guards plus the global override | — |
| REQ-055 | `useConnectionStore`, no polling interval anywhere | — |
| REQ-056 | Browser pass at 375×812; the disclosure menu toggled correctly | Browser |
| REQ-057 | `role="status"` with a text alternative in `LoadingSkeleton` | — |

## Public landing and demo

| Requirement | Evidence | Suite |
| :--- | :--- | :--- |
| REQ-060 | `/` in `PUBLIC_ROUTES`; `Home` renders `Landing` without a session. Browser pass: a clean visitor opens the landing, not sign-in | Browser |
| REQ-061 | Browser pass: value proposition, both actions and the preview in the first screen at 1280×720 and 390×844 | Browser |
| REQ-062 | `FEATURES` lists the six functions; each opens its screen in the demo. Browser pass | Browser |
| REQ-063 | `seed.test.ts` — 16 tests: attempts across three weeks, live streak, goal in progress, review queue, nothing empty | Unit |
| REQ-064 | `seed.test.ts > moves with the calendar`, `> returns identical data for identical input`; the demo path calls no endpoint | Unit |
| REQ-065 | `DemoBanner`; browser pass: visible on every screen with the three actions | Browser |
| REQ-066 | `session.test.ts` — 10 tests: stash, restore, double start, empty visitor, unreadable stash, leaving without a demo. `ACCOUNT_ROUTES` closes the demo before sign-in or registration | Unit + Browser |
| REQ-067 | Browser pass: a finished quick round raised the attempt count and the review queue | Browser |
| REQ-068 | `guide.test.ts` — 9 tests over steps, progress and the store; browser pass: steps ticked as done | Unit + Browser |
| REQ-070 | Browser pass: the home opens on goal, figures, three actions and four block rings | Browser |
| REQ-071 | `chart.test.ts` — 19 tests over line, area, ring and calendar geometry; browser pass; `role="img"` text alternatives | Unit + Browser |
| REQ-072 | axe: 0 violations in 10 states; reduced-motion capture shows every section; keyframes sit under `prefers-reduced-motion: no-preference` | Browser |
| REQ-073 | The demo reads only `/data/preguntas.json`; its screens render with the API unreachable | Browser |
| REQ-074 | `deploy.test.ts` — the rewrite to `/index.html`. Production answered 404 for `/login`, `/analytics`, `/perfil` and `/register` on 2026-10-26 (checked with `curl`); needs the Vercel root directory set, see `41-blockers.md` | Unit |
| REQ-075 | Browser pass at 390 px: brand and menu button visible below the bar (before: both at y 4–38 px under a 38 px bar) | Browser |

## Browser verification, 2026-10-26

Production build served by `vite preview`, driven through the DevTools protocol, API unreachable.

| Step | Result |
| :--- | :--- |
| Landing, 1440 px and 390 px | Hero, preview, six functions, three steps and the closing call to action render; no horizontal scroll |
| Demo start | Opens the home populated: 15 of 20 today, 9-day streak, 17 attempts, mean grade 5,28, block III flagged |
| Quick round | Five questions, feedback with icon, border and text; results screen; review queue 7 to 10 |
| Performance screen | Trend line with the pass mark, 16 active days in the calendar, block meters |
| Leave the demo | Returns to the landing; the visitor's own data restored |
| Lighthouse (`/`) | Desktop performance 100, accessibility 100; mobile performance 92, accessibility 100 (LCP 2,9 s) |
| axe-core 4.13, WCAG 2.0 to 2.2 A and AA | 0 violations on landing, sign-in, demo home, guide open and demo performance, at both widths |
| Reduced motion | No section left invisible; the line, rings and counters show their final state |
| Console | No application errors; `ERR_CONNECTION_REFUSED` only for the absent API, as expected |

## Browser verification, 2026-09-08

Run against the API on `localhost:5298` with a freshly migrated PostgreSQL 16.

| Step | Result |
| :--- | :--- |
| Registration | Session established, header switched to `CONECTADO` |
| Setup | Block I, ten questions, exam mode |
| Exam start | Countdown began at 09:00; the palette rendered ten unanswered items |
| Keyboard | `ArrowRight` advanced; `A`–`D` selected; the palette tracked each answer |
| Finish | 10,00 / 10, "Apto", 10 correct, 0 wrong, 0 blank, 01:11 elapsed |
| Persistence | `intentosusuario` held one row: 10/0/0, grade 10.00, block normalised from `1` to `I` |
| Dashboard | One attempt, 100% accuracy, per-block bar, weakest block identified |
| Mobile | 375×812 stacked correctly; the disclosure menu toggled `aria-expanded` and its label |
| Console | No errors |

## Degradation verification, 2026-09-08

Built with `VITE_API_BASE_URL` pointing at the deployed production API, which predates the
`/api/preguntas` endpoints and answers 404 to every read.

| Step | Result |
| :--- | :--- |
| Guest entry | Reached the setup form |
| Generate a ten-question exam on block I | Exam started from the bundled catalogue |
| Connection indicator | `MODO LOCAL` |
| Banner | "Sin conexión con el servidor — Puedes seguir practicando: el temario está disponible sin conexión." |
| Questions | Block I only, filtered client side from the full catalogue |

Before this change the same run produced an unusable page and three 404s in the console.
That is the incident this behaviour exists to prevent.

## Coverage gaps

Requirements with no suite are verified by reading the code. Closing them needs a component
test runner with a DOM — tracked as `T-012` in [`40-tasks.md`](40-tasks.md). The gaps are
listed rather than assumed away.
