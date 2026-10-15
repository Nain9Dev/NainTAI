# ADR-0003 — One session rotation at a time

- **Status:** Approved
- **Date:** 2026-09-08

## Context

The access token lasts an hour. When it expires, the client should rotate it and carry on
rather than dumping the candidate back at sign-in.

The dashboard fires several queries at once — statistics, history, availability. If the
token expired between page loads, they all return 401 at the same moment.

The API rotates refresh tokens and treats a replay as evidence of theft: presenting an
already-rotated token revokes **every** session belonging to that user. That is the correct
behaviour for a stolen token, and it is exactly what five concurrent rotations look like
from the server's side.

So the naive fix — retry the request after refreshing — turns an expired token into a forced
sign-out across all the candidate's devices.

## Decision

The API client holds a single in-flight rotation promise. Every caller that hits a 401 waits
on the same promise; only one request reaches `/api/auth/refresh`.

If the rotation succeeds, the original request is replayed once and the new CSRF token is
stored. If it fails, an `auth:unauthorized` event clears the local session.

Rotation is attempted only for paths outside `/auth/`: a 401 from `login` means the password
was wrong, and retrying it would be pointless.

## Consequences

- An expired token is invisible to the candidate.
- The theft-detection path stays as aggressive as it should be, because the client no longer
  trips it by accident.
- Exactly one retry. A request that fails twice surfaces the error rather than looping.
- The rotation promise is cleared in a `finally`, so a failed rotation does not wedge the
  client into a state where every subsequent 401 resolves against a stale rejected promise.
