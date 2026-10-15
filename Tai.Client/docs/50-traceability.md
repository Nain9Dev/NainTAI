# 50 — Traceability

Every requirement and the evidence for it. A requirement without a test is not done,
whatever the code says.

Suites:

- **Unit** — `npm run test` (60 tests, Vitest). Pure logic: marking, aggregation,
  normalisation and the degradation policy.
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
| REQ-030 | The `hasSubmitted` ref in `ExamResults`; the database held exactly one row after the browser pass | Browser |
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
