# 10 — Requirements

EARS notation: **when** `<trigger>`, the system **shall** `<response>`. Each requirement is
traced to a test in [`50-traceability.md`](50-traceability.md).

## Exam setup

| Id | Requirement | Status |
| :--- | :--- | :--- |
| REQ-001 | When a candidate opens the application, the system shall offer the four official syllabus blocks plus a whole-syllabus option, in curriculum order. | Implemented |
| REQ-002 | When a block is selected, the system shall report how many questions are available for it. | Implemented |
| REQ-003 | When fewer questions are available than requested, the system shall say so before the exam starts rather than silently generating a shorter one. | Implemented |
| REQ-004 | When exam mode is selected, the system shall show the time that will be allotted, at 54 seconds per question. | Implemented |
| REQ-005 | When the API is unreachable, the system shall generate the exam from the bundled catalogue and say that it is doing so. | Implemented |
| REQ-006 | When the API answers a read with 404, 408, 429 or a 5xx, the system shall fall back to the bundled catalogue rather than failing, because a deployed API missing an endpoint should degrade like an absent one. | Implemented |
| REQ-007 | When the API answers with 400, 401, 403 or 409, the system shall surface the error rather than hiding it behind the catalogue. | Implemented |

## Exam engine

| Id | Requirement | Status |
| :--- | :--- | :--- |
| REQ-010 | When an exam is running, the system shall present one question at a time with a palette showing which are answered. | Implemented |
| REQ-011 | When the candidate presses an arrow key, the system shall move between questions; when they press A to D, it shall select that option. | Implemented |
| REQ-012 | When a keystroke is aimed at a form field, the system shall not intercept it as a shortcut. | Implemented |
| REQ-013 | When in study mode, the system shall reveal the answer immediately and shall not allow the answer to be changed afterwards. | Implemented |
| REQ-014 | When in exam mode, the system shall hide the answer key until the exam is finished. | Implemented |
| REQ-015 | When the countdown reaches zero, the system shall close the exam and mark unanswered questions as blank. | Implemented |
| REQ-016 | When the tab is backgrounded and its timers are throttled, the countdown shall stay anchored to wall-clock time. | Implemented |
| REQ-017 | When the candidate finishes an exam with unanswered questions, the system shall ask for confirmation before closing it. | Implemented |
| REQ-018 | When the page is reloaded mid-exam, the system shall restore the answer sheet, the position and the remaining time. | Implemented |
| REQ-019 | When an exam is abandoned and the tab is closed, the system shall not restore it in a new session. | Implemented |

## Marking

| Id | Requirement | Status |
| :--- | :--- | :--- |
| REQ-020 | When an exam is finished, the system shall apply the official INAP scale (+1.00, −0.33, 0.00) and shall never show a negative grade. | Implemented |
| REQ-021 | When an exam has no questions, the system shall show zero rather than `NaN`. | Implemented |
| REQ-022 | When results are shown, the system shall report correct, wrong, blank, net points and elapsed time. | Implemented |
| REQ-023 | When the results screen is open, the elapsed time shall stay fixed rather than continuing to count. | Implemented |
| REQ-024 | When the candidate asks to review, the system shall show every question with the correct option and their own answer. | Implemented |

## Progress

| Id | Requirement | Status |
| :--- | :--- | :--- |
| REQ-030 | When an exam is finished, the system shall record exactly one attempt, even under React's double-invoked effects in development. | Implemented |
| REQ-031 | When the candidate is signed in, the system shall send the attempt to the API and shall not keep a duplicate local copy. | Implemented |
| REQ-032 | When the attempt cannot be sent, the system shall queue it, keep a local copy, and replay it when connectivity returns. | Implemented |
| REQ-033 | When a queued request keeps failing, the system shall discard it after a bounded number of attempts rather than blocking the queue. | Implemented |
| REQ-034 | When a queued request is rejected with a 4xx, the system shall discard it: replaying it will never succeed. | Implemented |
| REQ-035 | When the candidate is a guest, the system shall keep attempts in this browser and compute their statistics locally. | Implemented |
| REQ-036 | When a signed-in candidate has attempts both on the server and locally, the system shall merge them, weighting averages by attempt count. | Implemented |
| REQ-037 | When grouping by block, the system shall treat the ordinal, the roman code and their case variants as the same block. | Implemented |
| REQ-038 | When a block has too small a sample, the system shall not name it as the candidate's weakest. | Implemented |

## Session

| Id | Requirement | Status |
| :--- | :--- | :--- |
| REQ-040 | When the application loads with a remembered profile, the system shall confirm with the API whether the session is still valid. | Implemented |
| REQ-041 | When a request returns 401, the system shall attempt one session rotation and replay the request before giving up. | Implemented |
| REQ-042 | When several requests fail with 401 at once, the system shall perform a single rotation, because the API treats a replayed refresh token as theft and revokes every session. | Implemented |
| REQ-043 | When a session is rotated, the system shall adopt the new CSRF token. | Implemented |
| REQ-044 | When the session cannot be recovered, the system shall clear the local profile and return to sign-in. | Implemented |
| REQ-045 | When the candidate signs out, the system shall clear local state even if the API call fails. | Implemented |
| REQ-046 | When sign-in fails, the system shall show the API's message unchanged, which does not reveal whether the account exists. | Implemented |

## Interface

| Id | Requirement | Status |
| :--- | :--- | :--- |
| REQ-050 | The system shall use the naindev.com visual language: tokens, typography, the ambient background and the component treatments. | Implemented |
| REQ-051 | The system shall self-host its typefaces rather than loading them from a third party. | Implemented |
| REQ-052 | When a state is conveyed by colour, the system shall also convey it by icon, border or text. | Implemented |
| REQ-053 | Every form control shall be associated with its label, its hint and its error message. | Implemented |
| REQ-054 | When the viewer prefers reduced motion, the system shall suppress decorative animation. | Implemented |
| REQ-055 | When the connection state changes, the system shall reflect it without polling. | Implemented |
| REQ-056 | The interface shall be operable on a 375-pixel-wide viewport. | Implemented |
| REQ-057 | When content is loading, the system shall announce it to assistive technology rather than only showing a placeholder. | Implemented |

## Public landing and demo

Feature workspace: `specs/next-visual-landing-demo/`. The deployed application is a showpiece:
a visitor must understand what it does and see it working within a minute, without an account.

| Id | Requirement | Status |
| :--- | :--- | :--- |
| REQ-060 | When a visitor with no session opens `/`, the system shall show a public landing page instead of redirecting to sign-in. Every other route keeps requiring a session or guest mode. | Implemented |
| REQ-061 | The first screen of the landing shall state the value proposition, offer "Probar la demo" and "Iniciar sesión", and show a product preview built from the real interface components with example data. | Implemented |
| REQ-062 | The landing shall present every product function (official-scale mock exams, study mode, review of mistakes, performance by block, streak and daily goal, offline use) and let the visitor open each one in the demo. | Implemented |
| REQ-063 | When the visitor starts the demo, the system shall open a guest session seeded with example data: attempts across the last three weeks, a practice streak, a daily goal in progress and a review queue, so that no screen opens empty. | Implemented |
| REQ-064 | The demo data shall be synthetic, generated deterministically relative to the current date, and shall never be sent to the API. | Implemented |
| REQ-065 | While the demo is active, the system shall show a persistent notice that the data is an example, with actions to reset the demo and to create an account. | Implemented |
| REQ-066 | When the demo is reset or left, the system shall remove the example data, restore any guest progress that existed before it started, and return to the landing. | Implemented |
| REQ-067 | When a demo visitor finishes an exam, the system shall record it like any guest attempt and show it in the seeded history. | Implemented |
| REQ-068 | While the demo is active, the system shall offer a guide listing what to try and mark each step done as the visitor does it. | Implemented |

## Product presentation

| Id | Requirement | Status |
| :--- | :--- | :--- |
| REQ-070 | The home of a guest or signed-in candidate shall open on an overview: today's goal and streak, the three study actions, and mastery by block. | Implemented |
| REQ-071 | The performance screen shall show the grade trend as a line chart with the pass mark, a consistency calendar of the last weeks, and mastery by block; each shall carry a text alternative. | Implemented |
| REQ-072 | New animation shall run only under `prefers-reduced-motion: no-preference`, and every new screen shall satisfy REQ-052, REQ-053 and REQ-056. | Implemented |
| REQ-073 | The demo shall work with no network: it shall use no account endpoint and shall fall back to the bundled catalogue for questions. | Implemented |
| REQ-074 | When a route of the application is typed, bookmarked or reloaded, the host shall serve the application rather than answer 404. | Implemented |
| REQ-075 | When the NainDev suite bar is present, the sticky header shall sit below it, so the bar never covers the brand or the menu button. | Implemented |
