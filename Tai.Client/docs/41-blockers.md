# 41 — Blockers

Everything external the work needs: what it is, where to get it, which variable holds it,
what it unblocks and how to check it is ready.

## Required to run

| Dependency | What it is | Variable | Unblocks | Ready when |
| :--- | :--- | :--- | :--- | :--- |
| Node.js 20+ | Build toolchain | — | Everything | `node --version` |
| API base URL | Where the backend lives | `VITE_API_BASE_URL` | Everything except the offline demo | The header shows `CONECTADO` |

Without the API the application still runs: reads fall back to the bundled catalogue in
`public/data` and attempts are kept locally. That is the deployed GitHub Pages demo.

## Required to develop against the API

| Dependency | Note |
| :--- | :--- |
| A running `Oposiciones.Api` | See its own `docs/60-runbook.md` |
| The client origin in the API's CORS allowlist | `Cors__AllowedOrigins`. `AllowCredentials` forbids a wildcard, so the origin must be listed exactly |

A CORS misconfiguration looks like a network failure from here: the client falls back to
the static catalogue and reports itself offline, because a blocked request and an
unreachable server are indistinguishable to `fetch`.

## Human-only actions

| Id | Action | Why it cannot be automated |
| :--- | :--- | :--- |
| `[H]` | Point `tai.naindev.com` at the deployment | DNS access |
| `[H]` | Set `VITE_API_BASE_URL` in the hosting provider | Account access |
| `[H]` | Enable GitHub Actions | Repository setting, owner only |

## Currently blocking

Nothing. Every `[A]` task in [`40-tasks.md`](40-tasks.md) can proceed locally.
