# 21 — Design system

The visual language is [naindev.com](https://www.naindev.com)'s. Both properties are
published under the same identity, so an interface that reads as a different product
undermines them both.

## Why the previous set had to go

The old `tokens.css` defined its own vocabulary — `--bg-primary`, `--accent-cyan`,
`--text-secondary` — while the components referenced the portfolio's names: `--color-surface`,
`--color-line`, `--color-success`, `--color-text-muted`.

Those references resolved to nothing. A good part of the interface was rendering with
browser defaults, and because CSS fails silently, nothing reported it. One vocabulary now,
and it is the portfolio's.

## Tokens

Defined in `src/styles/tokens.css`.

| Group | Tokens | Notes |
| :--- | :--- | :--- |
| Surfaces | `--color-background`, `--color-background-soft`, `--color-surface`, `--color-surface-strong`, `--color-surface-raised` | `#090a0f` base, matching the portfolio exactly |
| Text | `--color-text`, `--color-text-soft`, `--color-text-muted` | |
| Lines | `--color-line`, `--color-line-strong` | White at 8% and 15%, so they sit on any surface |
| Brand | `--color-primary`, `--color-primary-strong`, `--color-primary-ink` | |
| Feedback | `--color-success`, `--color-danger`, `--color-warning`, each with a `-soft` fill and a `-line` border | Three values per state so nothing depends on hue alone |
| Depth | `--shadow-card`, `--shadow-glow`, `--shadow-panel` | |
| Radii | `--radius-small` … `--radius-pill` | |
| Typography | `--font-sans` (Inter), `--font-display` (Outfit), `--font-mono` | |
| Motion | `--ease-spring`, `--ease-out`, `--transition-fast`, `--transition-base` | |

## The ambient background

Three layers, all in CSS, all decorative:

1. Three radial gradients over the base colour, drifting on a 24-second loop.
2. A 4rem engineering grid at 1.8% opacity, masked out towards the footer.
3. A glow that follows the pointer, driven by two custom properties written from
   `BaseLayout`.

The pointer glow is coalesced into an animation frame — `pointermove` fires far more often
than the screen refreshes — and skipped entirely on coarse pointers and when the viewer
prefers reduced motion. React never re-renders for it.

## Typography

Inter for body text, Outfit for display, both self-hosted under `public/fonts` and copied
from the portfolio so the two properties render identically.

Loading them from Google Fonts cost a DNS lookup, a TLS handshake and a render-blocking
round trip to a third-party origin before the first paint — and the previous setup did it
twice, once in `index.html` and again through an `@import` in the stylesheet. Only the
weights actually used ship. The two faces above the fold are preloaded.

## Components

| Component | Role | Notes |
| :--- | :--- | :--- |
| `Button` | Actions | Gradient primary, lift on hover, press on active. 44px minimum target |
| `Card` | Panels | Raised gradient surface with a corner glow, so a dark card does not vanish into a dark page |
| `Field` (`Select`, `TextField`) | Form controls | `useId` wires label, hint and error. The previous `Select` took an optional `id` and pointed `htmlFor` at it, so every call site that omitted it produced a label attached to nothing |
| `Callout` | Inline notices | Icon plus border plus hue. `role="alert"` when the tone is danger |
| `Metric` | Single figures | Unit separated so it does not compete with the number |
| `LoadingSkeleton` | Placeholders | `role="status"` with a text alternative: a shimmer says nothing to a screen reader |
| `ConnectionBanner` | Connection state | Subscribes to the store; no polling |

## Accessibility rules

These are requirements, not preferences. An exam is answered from the keyboard by someone
under time pressure.

1. **Never colour alone.** Right and wrong carry an icon, a border and a hidden text
   alternative. Roughly one man in twelve has a colour vision deficiency.
2. **Visible focus everywhere.** A 3px ring with 4px offset on every interactive element.
3. **Real form semantics.** `useId`-generated associations, `aria-describedby`,
   `aria-invalid`, and a `fieldset` with a `legend` for the mode choice.
4. **Announce what changes.** Results carry `aria-live="polite"`; the countdown announces
   only in its final two minutes, because announcing every second makes the page unusable.
5. **Respect reduced motion.** Every decorative animation is behind
   `prefers-reduced-motion: no-preference`, plus a global override.
6. **Keyboard shortcuts yield.** Arrow keys and A–D never fire while focus is in a field.

## Layout

`.shell` is `min(100% - 3rem, 78rem)`, the same as the portfolio. The header is sticky
glass at `6rem`, collapsing to a disclosure menu below `60rem`. Metric grids use
`repeat(auto-fit, minmax(13rem, 1fr))` so they reflow without breakpoints.
