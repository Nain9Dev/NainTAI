# AGENTS.md — TAI study system (web client)

Canonical instructions for any agent working in this repository. Read this before writing
code, then read [`docs/README.md`](docs/README.md).

## Working method

This repository follows **Spec Driven Development**. Every change starts in a document.

1. If a request is not covered by `docs/10-requirements.md`, add the requirement first.
2. One task at a time, from `docs/40-tasks.md`, with the test written before the code.
3. A requirement with no evidence in `docs/50-traceability.md` is not done.
4. Record significant decisions as an ADR in `docs/30-decisions/` with status `Proposed`.
   Only the repository owner promotes one to `Approved`.
5. `docs/` is the source of truth. Code contradicting an `Approved` document is a defect.
6. Before running out of context, dump the state into the handoff section of
   `docs/40-tasks.md`.

## Language

Everything that lands in the repository is written in **English**: code, identifiers, file
names, branches, commits, comments, documentation and tests.

The exception is text the candidate reads. The interface is Spanish, because the audience
is Spanish civil-service candidates. API error messages are user-facing and stay in Spanish.

Wire-format identifiers already in Spanish (`aciertos`, `bloque`, `respuestaCorrecta`) are
**not** renamed for style. They are a published contract with a deployed API.

## Architecture rules

See [`docs/20-architecture.md`](docs/20-architecture.md).

| Rule | Why |
| :--- | :--- |
| Server data belongs to TanStack Query | It is a cache of something we do not own |
| Client state belongs to Zustand | Exam, session, connection, local attempts |
| Only `api/client.ts` touches the network | Fallback, queueing and rotation live in one place |
| Components present, hooks decide | A component that fetches cannot be reasoned about in isolation |
| Business rules live in `utils/` | Pure functions, unit-testable without a DOM |

## Non-negotiables

Each of these was a real defect. Do not undo them.

- **The client previews the grade; the server decides it** — ADR-0002. Never send a computed
  grade to the API.
- **One session rotation at a time** — ADR-0003. Concurrent rotations make the API revoke
  every session the candidate has.
- **The exam lives in `sessionStorage`** — ADR-0005. Not memory, not `localStorage`.
- **Block codes are normalised at every boundary.** `"1"`, `"I"` and `"i"` are one block.
- **No colour-only state.** Icon, border or text as well.
- **Every control is labelled** through `Field`, which generates its own ids.
- **No polling for state a store can push.**
- **The timer is anchored to wall-clock time**, never to its own tick count.

## Design system

The visual language is naindev.com's, adopted wholesale — ADR-0001. Details in
[`docs/21-design-system.md`](docs/21-design-system.md).

Use the tokens in `src/styles/tokens.css`. Do not introduce a parallel vocabulary: that is
what broke the interface before, and CSS gives no warning when a custom property is
undefined.

## Verification

Nothing is done until this passes:

```bash
npm run verify
```

Typecheck, lint, unit tests, production build. For anything touching the exam flow or the
session, also run it in a browser against a live API — the pass recorded in
`docs/50-traceability.md` is the reference.

## Commits

Conventional Commits, subject in English: `<type>(<scope>): <description>`.

Types: `feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `build`, `ci`, `chore`.
Contract breaks carry `!`. No dates in the message — git already records them.

Do not commit or push unless explicitly asked.

## Secrets

Vite inlines every `VITE_*` variable into the bundle. Nothing secret can go in `.env`.
