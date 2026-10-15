# ADR-0001 — Adopt the naindev.com design system wholesale

- **Status:** Approved
- **Date:** 2026-09-08

## Context

The client shipped its own token vocabulary — `--bg-primary`, `--accent-cyan`,
`--text-secondary` — while its components referenced the portfolio's names:
`--color-surface`, `--color-line`, `--color-success`, `--color-text-muted`,
`--color-primary-strong`.

Those references resolved to nothing. Cards had no surface colour, dividers no line colour,
correct and wrong answers no feedback colour. Because an undefined custom property fails
silently, the interface simply rendered with browser defaults and nothing reported it.

Separately, the two properties are published under the same identity and the client links
back to the portfolio in its own header. Looking like a different product undermines both.

## Decision

Adopt naindev.com's design system as-is: its exact token values, its typographic scale, its
ambient background treatment, and its component idioms — gradient primary buttons that lift
on hover, panels with a corner glow, monospaced uppercase section labels, the navigation
underline that grows from nothing.

The typefaces are copied into `public/fonts` and self-hosted, rather than loaded from
Google Fonts as the client previously did in two places at once.

Three tokens are added that the portfolio does not need, because it never has to tell a
candidate they got something wrong: a `-soft` fill and a `-line` border for each of the
success, danger and warning states.

## Consequences

- Every custom property a component references now exists.
- The two properties render identically, down to the background gradient timing.
- Removing Google Fonts drops a DNS lookup, a TLS handshake and a render-blocking
  third-party round trip from the critical path, and keeps the request out of a tracker's
  logs.
- The design system is now a copy, not a shared package. A change to the portfolio does not
  propagate. Extracting it is only worth doing if a third property appears.
- Feedback states carry three values each, which is what lets the interface convey right and
  wrong without depending on hue.
