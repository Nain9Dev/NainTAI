@AGENTS.md

# Claude Code specifics

The canonical instructions are in [`AGENTS.md`](AGENTS.md), imported above. Only
Claude Code adjustments belong here.

## Before starting

Read `docs/README.md`, then the requirement in `docs/10-requirements.md` you are about to
touch, then the handoff section at the bottom of `docs/40-tasks.md`.

## Long-running commands

`dotnet run` blocks. Start the API with `run_in_background: true` and wait for readiness
with a poll rather than a fixed sleep:

```bash
until curl -s -m3 http://localhost:5298/api/health/db | grep -q '"ok"'; do sleep 2; done
```

Stop it before rebuilding — a running instance locks the output assemblies and the build
fails with MSB3027.

## Disposable database

Port 5432 on this machine may belong to another project. Always use 55432:

```bash
docker run -d --name tai-verify-db -e POSTGRES_PASSWORD=verify -e POSTGRES_USER=verify -e POSTGRES_DB=oposicionestai -p 55432:5432 postgres:16-alpine
```

Reset between verification runs without re-migrating:

```bash
docker exec tai-verify-db psql -U verify -d oposicionestai -c "TRUNCATE intentosusuario, attemptanswers, attempts, testquestions, tests, refreshtokens, usuarios RESTART IDENTITY CASCADE;"
```

## Shell notes

Heredocs containing C# raw string literals (`"""`) and `$` interpolation are fragile in this
environment. Use the Write tool for source files and reserve the shell for builds, tests and
git.

## Web Client (Tai.Client)

The web client lives in `Tai.Client/` (React 19 + TypeScript, pinned to `tai.localhost:5290`).
Always verify client changes with:

```bash
npm --prefix Tai.Client run verify
```
