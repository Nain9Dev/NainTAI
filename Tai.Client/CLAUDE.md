@AGENTS.md

# Claude Code specifics

The canonical instructions are in [`AGENTS.md`](AGENTS.md), imported above. Only Claude Code
adjustments belong here.

## Before starting

Read `docs/README.md`, then the requirement in `docs/10-requirements.md` you are about to
touch, then the handoff section at the bottom of `docs/40-tasks.md`.

## Long-running commands

`npm run dev` blocks. Start it with `run_in_background: true` and wait with a poll rather
than a fixed sleep:

```bash
until curl -s -m3 http://localhost:5173 >/dev/null 2>&1; do sleep 2; done
```

## Verifying in a browser

The dev server runs on `http://localhost:5173`, which is already in the API's development
CORS allowlist. Anything touching the exam flow or the session needs a real browser pass:
the unit tests cover pure logic only.

Useful checks that do not need a screenshot:

```bash
curl -s http://localhost:5298/api/health/db
```

Read the accessibility tree rather than screenshotting when checking labels and roles — it
is what a screen reader actually sees, and it is cheaper.

## Shell notes

Heredocs containing backticks or `$` interpolation are fragile here. Use the Write tool for
source files and keep the shell for npm, git and curl.
