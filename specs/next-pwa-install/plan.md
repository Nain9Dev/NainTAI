# Implementation plan: installable site (tai.naindev.com)

Status: Implemented, not merged

## What gets published

The client is a Vite single-page app deployed by Vercel from `Tai.Client` (there is no deploy workflow).
Vite copies `Tai.Client/public/` to the root of `dist/` unchanged, so the manifest and icons are published
as files at `/manifest.webmanifest` and `/icons/*`. Vercel serves a matching file before `rewrites`, and
`vercel.json` has no legacy `routes` list, so it is left untouched.

## Files

- `Tai.Client/public/manifest.webmanifest`: the manifest (FR1, FR2).
- `Tai.Client/public/icons/`: `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`,
  `apple-touch-icon.png` (FR2, FR3).
- `Tai.Client/index.html`: manifest link, apple-touch-icon and the four web-app meta tags (FR3). The page
  already has `theme-color` `#090a0f`.
- `tests/Oposiciones.UnitTests/PwaInstallTests.cs`: the contract test (see below).
- Docs: `REQ-081` to `REQ-084` in `Tai.Client/docs/10-requirements.md`, evidence in `50-traceability.md`,
  task `T-030` in `40-tasks.md`, entry in `90-changelog.md`.

## Test placement

`.github/workflows/ci.yml` runs `dotnet test src/Oposiciones.sln` and, for the client, only `npm run build`.
The Vitest suite (`npm test`, part of `npm run verify`) is not run by CI, so the contract test is an xUnit
test in the suite CI does run. It locates `Tai.Client` by walking up from the test binaries, parses the
manifest with `System.Text.Json`, reads the PNG IHDR for the sizes and matches the head tags in `index.html`
with regular expressions. It adds no dependency. Opacity and the safe zone are not tested: the install
verification script checks them on the built folder.

## Icons

Source mark: `Tai.Client/public/favicon.svg` (transparent, blue and cyan strokes). Regenerate with:

```
node make-install-icons.mjs --source Tai.Client/public/favicon.svg --out Tai.Client/public/icons \
  --bg "#090a0f" --maskable-scale 0.56 --apple-scale 0.7 --any-bg "#090a0f"
```

Maskable scale 0.56 fits the whole square mark inside the 40% safe-zone circle. Apple scale 0.7 leaves
padding around the bare glyph; the "any" icons sit on a rounded `#090a0f` tile.

## Verification

1. `dotnet test src/Oposiciones.sln -c Release`
2. `npm run verify` in `Tai.Client` (typecheck, lint, Vitest, build)
3. Install verification script and Chrome installability probe on `Tai.Client/dist`.
