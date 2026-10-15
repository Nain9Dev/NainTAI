# 00 — Project charter

## Goal

The web client for a TAI civil-service exam simulator. It generates practice exams from the
official syllabus, marks them under the official INAP scale, and shows a candidate where
their study time is best spent.

It also has to look and feel like the rest of [naindev.com](https://www.naindev.com): it is
published under the same identity, and an interface that reads as a different product
undermines both.

## Scope

- Exam setup: syllabus block, exam length, and marking mode.
- Two modes: **study**, which corrects each answer immediately, and **exam**, which mirrors
  the real conditions with a countdown, hidden answers and the official scale.
- Exam engine: one question at a time, a question palette, keyboard navigation, and a timer
  that closes the exam when it expires.
- Results with the full breakdown, and a review pass over the answer key.
- Performance dashboard: average grade, accuracy, per-block breakdown and trend.
- Accounts, guest mode, and offline operation.

## Non-goals

- Content authoring. Questions come from the API or the bundled catalogue.
- Any computation the server owns. The client previews a grade; the server decides it.
- Payments, social features or notifications.
- Server-side rendering. This is a static bundle served from a CDN.

## Constraints

| Constraint | Reason |
| :--- | :--- |
| React 19 with TanStack Router and Query, Vite | Existing stack; the migration is recent and deliberate |
| Must work with no API reachable | The GitHub Pages demo has no backend at all, and candidates study on trains |
| The visual language is naindev.com's | Same identity, same author, published under the same domain |
| The JWT is not readable from JavaScript | The API keeps it in an `HttpOnly` cookie, so the client cannot inspect the session |
| Spanish interface | The audience is Spanish civil-service candidates |

## Success criteria

1. A candidate can sit a full exam — set up, answer, finish, review — against the API, and
   again with the API switched off.
2. The grade shown matches the one the server records, to the cent.
3. Statistics are real for a guest, for a signed-in candidate, and for a signed-in
   candidate who sat exams offline.
4. `npm run verify` passes: typecheck, lint, unit tests and production build.
5. The interface is usable from the keyboard alone, and every state is conveyed by more
   than colour.

## Definition of done

The client is done when a candidate can rely on it in the week before the exam: it works on
a phone with no signal, never loses an answer sheet to a page reload, and tells them
something true about where they stand.
