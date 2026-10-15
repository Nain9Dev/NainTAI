# ADR-0009 — Monorepo Consolidation with Decoupled Client

Status: Proposed
Date: 2026-10-15

## Context

The Spanish TAI examination simulator was historically split across two separate repositories:
1. `SistemaOposicionesTAI` (.NET 10 Clean Architecture API and PostgreSQL schema).
2. `tai-study-system-js` (React 19 + TypeScript SPA web client).

Consequences of the split architecture:
- Contract desynchronization: The client repository was forced to check in a frozen 32 KB `swagger.json` file to maintain types and fallback shapes.
- Fragmented governance: Two separate `docs/` structures, two `AGENTS.md` files, and decoupled traceability matrices describing the same end product.
- Divergence from the NainDev standard: In `API-Gestion-Financiera`, `Microservicio-Notificaciones`, `3d-ai-conformance-demo`, `ProspectAI`, and `Gestion-Autoescuela-Python`, full products (DB, backend, and client) are delivered as modular monoliths in unified repositories.

## Decision

Consolidate the web client (`tai-study-system-js`) into `SistemaOposicionesTAI` under `Tai.Client/` using `git subtree` to preserve full commit history and author attribution.

1. **Monorepo Structure:**
   - Database migrations in `db/*.sql`.
   - Backend projects in `src/Oposiciones.*`.
   - Backend tests in `tests/Oposiciones.UnitTests`.
   - Frontend client in `Tai.Client/`.
2. **Ports & Hosts Allocation:**
   - Consolidated in `dev-ports.json`:
     - Client Web: `5290` (preview `5291`), hostname `tai.localhost`.
     - Backend API: `5298` (HTTPS `5299`), hostname `tai.localhost:5298`.
     - Database: PostgreSQL on port `55432` (or `5292`).
3. **Preserved Frontend Stack:**
   - Retain React 19 + TypeScript + Zustand + TanStack Query + IndexedDB offline mode, which is already fully verified with 96 passing unit tests and clean Vite production builds.
4. **Independent Deployment:**
   - The API continues deploying via Dockerfile to Render (or VPS).
   - The web client deploys to Vercel (`tai.naindev.com`) by configuring the Vercel Root Directory to `Tai.Client`.

## Consequences

- Contract changes, database migrations, and UI views can be tested and committed atomically.
- Total automated tests in a single repository: 180 tests (84 backend xUnit tests + 96 client Vitest tests).
- The standalone `tai-study-system-js` repository will be marked as archived/read-only with a redirection notice to this monorepo.
