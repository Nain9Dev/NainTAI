# 60 — Runbook

## Local development

```bash
npm install
npm run dev
```

The dev server listens on `http://localhost:5173`, which is in the API's development CORS
allowlist.

Without an API running, the application still works: reads fall back to `public/data` and
attempts are kept locally. That is exactly what the deployed demo does.

To develop against the API, start it first — see its `docs/60-runbook.md` — and confirm:

```bash
curl -s http://localhost:5298/api/health/db
```

## Verification

```bash
npm run verify
```

Runs typecheck, lint, unit tests and the production build in that order. Nothing is done
until it passes.

Individually:

```bash
npm run typecheck
```

```bash
npm run lint
```

```bash
npm run test
```

## Configuration

| Variable | Where | Default | Notes |
| :--- | :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `.env`, `.env.production` | `http://localhost:5298/api` | `/api` is appended if missing |
| `BASE_URL` | Vite | `/` | Prefixes the offline catalogue path |

Vite inlines `VITE_*` variables at build time, so changing one means rebuilding. Nothing
secret can live here: it ships in the bundle.

## Deployment

`npm run build` emits a static bundle to `dist/`. Any static host serves it.

Two rules the host has to satisfy:

1. **SPA fallback.** Unknown paths must serve `index.html`, or a reload on `/analytics`
   returns a 404.
2. **The origin must be in the API's CORS allowlist.** `AllowCredentials` forbids a
   wildcard, so it has to be listed exactly.

## Diagnosing failures

| Symptom | Likely cause | Action |
| :--- | :--- | :--- |
| Header stuck on `MODO LOCAL` with the API running | CORS, or the wrong `VITE_API_BASE_URL` | Check the browser console. A blocked request and an unreachable server look identical to `fetch` |
| Writes return 403 | Missing or stale CSRF token | The client adopts a rotated token automatically; a persistent 403 means the API's cache lost the session |
| Signed out on every reload | The session cookie is not being stored | Over plain HTTP the API must run with `AuthCookies:CrossSite=false`, or the browser discards a `Secure` cookie |
| An exam reappears unexpectedly | `sessionStorage` still holds it | Expected within a tab; see OQ-002 |
| Statistics differ from the API | Local unsynced attempts are merged in | Check the pending count in the connection banner |

## Known limits

- **No service worker.** The offline catalogue only works once the bundle is cached by the
  browser. A first visit with no network shows nothing. Tracked as T-016.
- **The offline catalogue drifts.** `public/data/preguntas.json` is a copy of the seed and
  nothing keeps it in step with the database. See OQ-003.
- **363 kB bundle**, 116 kB gzipped, unsplit. See OQ-004.
- **Guest history never reaches the server.** Merged locally, but not portable. See OQ-001.
