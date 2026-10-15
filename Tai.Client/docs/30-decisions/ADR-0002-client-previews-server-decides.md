# ADR-0002 — The client previews the grade, the server decides it

- **Status:** Approved
- **Date:** 2026-09-08

## Context

Marking existed in three places that could disagree: `calculateINAPScore` in the client,
whatever grade the client chose to send to `POST /api/progreso`, and `AttemptFinish` in the
database — which used raw percentage correct rather than the official scale.

The client's payload was bound straight to the server's domain entity, so it set its own
grade, its own row id and its own user id. A candidate could store a perfect result for an
exam they never sat.

Removing the client-side calculation entirely was the obvious fix, but it breaks two things
the product depends on: the results screen would wait on a round trip before showing the one
number the candidate cares about, and the offline demo — which has no backend at all — could
not mark an exam.

## Decision

Keep the client-side calculation as a **preview**, and make the server authoritative.

- `utils/scoring.ts` mirrors `ScoringService`, pinned to the same constants by tests in both
  repositories.
- The request body carries observations only: correct, wrong, total, block, date. It has no
  field for a grade, a row id or a user id.
- What the dashboard and the history report is what the server returned.
- The only case where a locally computed grade is displayed as final is guest mode, where
  there is no server to ask, and offline mode, where the attempt is flagged as unsynced.

## Consequences

- The candidate sees their grade the instant they press finish.
- The exam still marks correctly with no API reachable at all.
- A tampered client can lie about how many answers it got right, but not about what that is
  worth. Closing the remaining gap needs the server to own the answers too, which is exactly
  what the attempt endpoints do; `/api/progreso` remains the offline-sync path.
- The two implementations can drift. Both are covered by tests asserting the same worked
  examples, and both are in the same author's hands.
