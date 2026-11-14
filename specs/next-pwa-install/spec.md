# Installable site (Android and iOS) for tai.naindev.com

Status: Implemented, not merged

## Objective

A visitor on a phone can install `https://tai.naindev.com/` from the browser and open it like an app: its own
icon and name on the home screen and a window with no browser bar. Android Chrome and iOS Safari are the
targets. The shared contract and the verified browser criteria are in the portfolio spec
(`specs/next-pwa-install/spec.md` of `Nain9Dev/nain9dev.github.io`); this document is the part specific to this
site. Requirements `REQ-081` to `REQ-084` are in `Tai.Client/docs/10-requirements.md`.

Names approved by the owner on 2026-11-13: `short_name` `NainTAI`, `name` `NainTAI · Simulacros TAI`.

## Functional requirements (EARS)

- **FR1** (REQ-081): When a visitor opens the site on a phone, the system shall publish
  `/manifest.webmanifest` with `id`, `start_url` and `scope` as `/`, `display` `standalone`, `lang` `es`,
  `dir` `ltr`, the names above, the page's meta description verbatim, and `theme_color` and
  `background_color` `#090a0f` (the page's own `theme-color`). It shall not declare
  `prefer_related_applications`.
- **FR2** (REQ-082): The manifest shall declare three PNG icons in `/icons/` that exist at the declared size:
  192 px and 512 px with purpose `any`, and 512 px with purpose `maskable`, opaque edge to edge with the mark
  inside the centred circle of radius 40% of the width.
- **FR3** (REQ-083): The static shell (`Tai.Client/index.html`, the only document the client serves) shall
  link the manifest and `/icons/apple-touch-icon.png` (180 px, opaque), and carry
  `mobile-web-app-capable` and `apple-mobile-web-app-capable` set to `yes`, `apple-mobile-web-app-title` set
  to `NainTAI` and `apple-mobile-web-app-status-bar-style` set to `black` (a dark page).
- **FR4** (REQ-084): The site shall register no service worker and cache nothing for install.

## Edge cases and error handling

- Vercel serves an existing static file before it applies `rewrites`, so the catch-all
  `/(.*)` to `/index.html` in `Tai.Client/vercel.json` does not swallow `/manifest.webmanifest` or `/icons/*`.
  The file uses `rewrites` and `headers` only: no legacy `routes`, no change needed.
- The catch-all header rule keeps `Cache-Control: max-age=0, must-revalidate` for the manifest and the icons, so
  a redrawn mark reaches installed devices. They are outside `/assets/`, which is immutable for a year.
- The static shell has no Content-Security-Policy, so a same-origin manifest is allowed.
- The favicon is a transparent mark; the install icons put it on the `#090a0f` page background so it stays
  legible on any launcher colour.
- Offline: an installed window without network shows the browser's own offline screen.

## Out of scope

- A service worker, offline pages or any cache (owner decision of 2026-11-13). Task T-016 in
  `Tai.Client/docs/40-tasks.md` (service worker for the offline catalogue) is a separate, still open item.
- An in-page install button or iOS instructions; screenshots for the richer Android dialog; a store package.

## Acceptance criteria

- `dotnet test src/Oposiciones.sln -c Release` passes with `PwaInstallTests` (the client has no test step in
  CI, so the contract test lives in the .NET suite, which CI runs). `npm run verify` in `Tai.Client` passes.
- Chrome reports no installability error for the built `Tai.Client/dist`.
- After the deploy, the live manifest answers 200 with a manifest media type, and the owner installs the site
  on an Android phone and an iPhone: the icon shows the mark uncropped and the label reads `NainTAI`.

## Session state

<!-- Session handoff: keep current. What is done, what is verified, what is next, what is blocked. -->
- Last updated: 2026-11-14
- Done: T01 to T03.
- Verified: new tests red before the change, green after; `npm run verify`, `dotnet test`, install verification
  script and Chrome installability probe all clean on the built `dist/`.
- Next: T04 after the merge (live manifest media type, install on both phones).
- Blocked: nothing. T04 needs the owner's phones.
