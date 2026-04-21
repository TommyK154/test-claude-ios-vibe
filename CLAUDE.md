# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

A single-file habit tracker web app. Everything lives in `index.html` at the
repo root — HTML, CSS, and JavaScript embedded. It is deployed via GitHub Pages
and must work when opened directly from the filesystem.

## Constraints

- No build step. No bundler. No package.json.
- No external dependencies, CDN scripts, or web fonts.
- All state persists in `localStorage` under the key `habits.v1`.
- Mobile-first. Tap targets stay at or above 44×44 CSS px.
- Keep the palette calm: off-white background, dark text, single accent color.
- Respect `prefers-reduced-motion`.

## Editing

- Prefer editing `index.html` in place over adding new files.
- If new assets are ever required, they must be committed to the repo (no CDNs).
- Keep the single-file invariant: everything inline.

## Verification

There are no automated tests. After changes, open `index.html` in a browser
and exercise: add habit, check/uncheck, streak rollover, delete, reload
(persistence), and the empty state.
