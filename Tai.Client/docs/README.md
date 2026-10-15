# Documentation

This project follows **Spec Driven Development (SDD)**: every change starts in a document,
not in the code. Code that contradicts an `Approved` document is a defect, not a decision.

## Reading order

Start with `00-charter.md`, then `20-architecture.md`, then the requirement in
`10-requirements.md` you are about to touch.

| Lifecycle phase | Document | Contents |
| :--- | :--- | :--- |
| Planning | [`00-charter.md`](00-charter.md) | Goal, scope, non-goals, constraints, success criteria |
| Analysis | [`10-requirements.md`](10-requirements.md) | Requirements `REQ-###` in EARS notation |
| Analysis | [`11-open-questions.md`](11-open-questions.md) | Unresolved ambiguity. Blocks the requirement it references |
| Design | [`20-architecture.md`](20-architecture.md) | Layers, boundaries and state ownership |
| Design | [`21-design-system.md`](21-design-system.md) | Tokens, components and the rules behind them |
| Design | [`30-decisions/`](30-decisions/) | `ADR-####-*.md` with status `Proposed`, `Approved` or `Superseded` |
| Development | [`40-tasks.md`](40-tasks.md) | Tasks `T-###` with a "done when" criterion |
| Development | [`41-blockers.md`](41-blockers.md) | External dependencies, listed before writing code |
| Testing | [`50-traceability.md`](50-traceability.md) | Every requirement and the test that proves it |
| Deployment | [`60-runbook.md`](60-runbook.md) | Start-up, configuration, known limits |
| Maintenance | [`90-changelog.md`](90-changelog.md) | History of relevant changes |

## Feature workspaces

Work in progress lives in `specs/NNN-feature-name/` with `spec.md` (requirements in EARS
notation), `plan.md` (design) and `tasks.md` (verifiable tasks). Once consolidated, the
requirements move into `10-requirements.md`.

## Working rules

1. Every change starts in the specification. A request not covered by `10-requirements.md`
   gets a requirement added first.
2. One task at a time, with the test written before the implementation.
3. A requirement without a test that covers it is not done, whatever the code says.
4. Significant decisions become an ADR in `Proposed` status. Only the repository owner
   promotes one to `Approved`.
5. Session handoff is mandatory: before running out of context, dump the state (done,
   verified, next, blocked) into the active `tasks.md`.

## Task labels

| Label | Meaning |
| :--- | :--- |
| `[A]` | The agent completes it alone |
| `[M]` | Mixed: the agent does its part, a human action closes it |
| `[H]` | Human only: accounts, credentials, payments, business decisions |

## Related repository

The API this client consumes lives in
[SistemaOposicionesTAI](https://github.com/Nain9Dev/SistemaOposicionesTAI), which follows
the same documentation structure.
