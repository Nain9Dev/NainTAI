# 11 — Open questions

Unresolved ambiguity. Each entry blocks the requirement it references until answered.

## OQ-001 — How should guest attempts be reconciled after signing up?

**Blocks:** REQ-035, REQ-036

A guest builds up local history. When they later create an account, that history stays
local: the dashboard merges it, so nothing is lost, but it never reaches the server and
never appears on another device.

Uploading it silently is the obvious move and also the wrong one — the server would be
recording exams it cannot vouch for, under a scale it did not apply.

**Options:** leave it local and label it · offer an explicit import on first sign-in ·
upload automatically and flag those rows as client-reported.

**Owner:** repository owner. **Answer by:** before guest mode is promoted as a feature
rather than a fallback.

## OQ-002 — What should happen to an exam abandoned mid-flight?

**Blocks:** T-019

The exam survives a reload but not a closed tab, and navigating away without finishing
leaves it in `sessionStorage` until the tab closes. Coming back to the home route resumes
it, which is right after an accidental reload and surprising an hour later.

**Options:** resume silently as now · ask on return · expire it after a period of
inactivity.

**Owner:** repository owner.

## OQ-003 — Should the offline catalogue be kept in step with the API?

**Blocks:** REQ-005

`public/data/preguntas.json` holds thirty questions and is the same file the API was seeded
from. Nothing keeps them in step: growing the bank server-side leaves the offline demo
frozen at thirty, silently.

**Options:** generate the file from the database at build time · accept the drift and label
the offline catalogue as a sample · drop the static fallback once the API is always
available.

**Owner:** repository owner. **Answer by:** when the question bank grows.

## OQ-004 — Is a 363 kB bundle acceptable?

**Blocks:** T-017

116 kB gzipped, most of it React, TanStack Router and TanStack Query. Fine on a laptop,
noticeable on a phone on mobile data — which is exactly where a candidate revising on a
train will be.

**Options:** split by route · keep it and rely on caching · reconsider the routing library.

**Owner:** repository owner.

## Resolved

| Question | Resolution |
| :--- | :--- |
| Should the client compute the grade? | As a preview only; the server decides. [ADR-0002](30-decisions/ADR-0002-client-previews-server-decides.md) |
| Keep the generated API client? | No. [ADR-0004](30-decisions/ADR-0004-drop-generated-client.md) |
| Where does the exam in progress live? | `sessionStorage`. [ADR-0005](30-decisions/ADR-0005-exam-state-in-session-storage.md) |
| Whose design system? | naindev.com's, adopted wholesale. [ADR-0001](30-decisions/ADR-0001-align-with-naindev-design-system.md) |
