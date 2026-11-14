# Tasks: installable site (tai.naindev.com)

One task at a time, test first. Update the `Session state` block in `spec.md` after closing each one.

- [x] **T01** `[A]` Contract test `PwaInstallTests`, written first and seen failing.
  - **Covers**: REQ-081, REQ-082, REQ-083
  - **Done when**: the four tests fail with no manifest, icons or tags, and pass after T02 and T03.
- [x] **T02** `[A]` Manifest and icons from `favicon.svg` into `Tai.Client/public`.
  - **Covers**: REQ-081, REQ-082
  - **Done when**: the manifest and icon tests pass; the install verification script reports no failure on
    `dist/`.
- [x] **T03** `[A]` Head tags in `Tai.Client/index.html`.
  - **Covers**: REQ-083
  - **Done when**: the shell test passes; Chrome reports no installability error on `dist/`.
- [ ] **T04** `[H]` After the merge: confirm `https://tai.naindev.com/manifest.webmanifest` answers the file and
  not the SPA fallback, then install on an Android phone and an iPhone.
  - **Covers**: REQ-081 to REQ-083
  - **Done when**: the icon shows the mark uncropped, the label reads `NainTAI`, the window has no browser bar.
