# ADR-0004 — One hand-written API client, no generated one

- **Status:** Approved
- **Date:** 2026-09-08
- **Supersedes:** the Orval setup added alongside the TanStack Query migration

## Context

The repository carried an Orval configuration generating a React Query client into
`src/api/generated/`, from a checked-in `swagger.json`.

None of it was imported. The application called a hand-written client instead. Meanwhile the
`swagger.json` it was generated from predated the API's `/api/preguntas` endpoints, so the
generated code described a surface that no longer matched the server.

It was also broken: it imported a `custom-instance` module that had been removed, so a
typecheck failed on six files nothing depended on.

## Decision

Delete the generated output and the Orval configuration. Keep `swagger.json`, refreshed
from the live API, as the checked-in record of the contract.

The hand-written client stays because it does things a generator cannot express:

- falling back to the bundled catalogue when the API is unreachable,
- queueing writes to IndexedDB and replaying them,
- single-flight session rotation with one retry ([ADR-0003](ADR-0003-single-flight-refresh.md)),
- attaching the CSRF header and adopting a rotated token,
- pushing connection state into a store so the interface stops polling.

Wrapping a generated client to add all of that means maintaining both. Two ways to call one
API is worse than one way that does the job.

## Consequences

- The typecheck passes, and the bundle no longer carries dead modules.
- `swagger.json` documents the real surface and can be handed to any consumer.
- Contract drift is now caught by the type errors that appear when a response shape changes,
  rather than by regeneration. For a client and an API maintained by the same author, that
  is an acceptable trade.
- If a second consumer of this API appears, generating a typed client for it becomes worth
  reconsidering.
