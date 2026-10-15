# ADR-0006 — A read degrades to the bundled catalogue on a server error, not only on a network failure

- **Status:** Approved
- **Date:** 2026-09-08

## Context

The client falls back to `public/data` when a request cannot leave the device. That covers
being offline, and it is what the hybrid architecture was designed around.

It did not cover the API answering with something it cannot serve. The `catch` block only
ran on a thrown `fetch`; a response with a 4xx or 5xx status became an `ApiError` and was
rethrown untouched, no fallback considered.

That gap showed up in production. The deployed API predated the `/api/preguntas` endpoints,
so every read returned 404:

```
GET /api/preguntas/bloque/1?cantidad=50      404
GET /api/preguntas/disponibilidad?bloque=all 404
```

The application had a full offline catalogue sitting in the bundle and showed the candidate
nothing. An unreachable server degraded gracefully; a *reachable* server missing an endpoint
broke the page — the worse outcome from the less severe failure.

## Decision

A `GET` with a bundled fallback degrades when the status means the API cannot serve the
request:

| Status | Why it degrades |
| :--- | :--- |
| 404 | The deployed API does not know this endpoint. Version skew, which is precisely when the catalogue earns its place |
| 408, 429 | Timed out or throttled. Stale content beats making the candidate wait |
| 5xx | It knows the endpoint and cannot serve it |

**Not** 400, 401, 403 or 409. Those are answers, not failures. Hiding an expired session
behind the offline catalogue would turn "sign in again" into "here are some questions", and
the candidate would go on practising while nothing they did was being recorded.

The connection indicator switches to offline, so the interface says what happened rather
than pretending the data is live.

## Consequences

- A version skew between the client and the API degrades instead of breaking. Verified by
  building against the stale production URL: the exam starts, questions come from the
  catalogue, and the banner reads "Sin conexión con el servidor".
- Authentication and validation failures still surface, which is what they are for.
- A 404 from a genuinely wrong path is now masked for reads with a fallback. The tradeoff is
  accepted: those paths are typed and exercised by the browser pass, whereas version skew
  happens on every deployment.
- `shouldDegradeToStatic` is exported and tested, so the policy is a stated rule rather than
  a condition buried in a request handler.
