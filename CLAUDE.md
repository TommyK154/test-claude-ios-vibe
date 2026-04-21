# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

A small, dependency-free web app deployed via GitHub Pages. Two pages:

- `index.html` — habit tracker (embedded CSS/JS, `localStorage`-only).
- `tracker.html` — ADS-B flight radar (embedded CSS/JS, fetches live data
  from `opendata.adsb.fi` with fallback to `api.adsb.lol`).

Each page is self-contained — HTML, CSS, and JavaScript all embedded. Both
must work when opened directly from the filesystem (except the tracker needs
network access for the ADS-B APIs).

## Constraints

- No build step. No bundler. No package.json.
- No bundled dependencies, CDN scripts, or web fonts.
  - Runtime fetches to the ADS-B APIs from `tracker.html` are allowed.
- Habit state persists in `localStorage` under the key `habits.v1`.
- Mobile-first. Tap targets stay at or above 44×44 CSS px.
- Keep the palette calm: off-white background, dark text, sage accent.
  `tracker.html` reuses the same palette and adds a dark radar panel.
- Respect `prefers-reduced-motion`.
- Keep the two pages' headers/nav consistent so navigating between them
  feels like one app.

## Editing

- Prefer editing the existing page files in place over adding new ones.
- Any non-API assets must be committed to the repo (no CDNs).
- Keep the self-contained-per-page invariant: HTML, CSS, JS all inline.

## Verification

There are no automated tests. After changes, open the pages in a browser and
exercise the relevant flows:

- `index.html`: add habit, check/uncheck, streak rollover, delete, reload
  (persistence), empty state, nav chip → tracker.
- `tracker.html`: preset selection, geolocation, custom lat/lon, range slider,
  auto-refresh countdown, tap-to-select on radar and list, API fallback
  (the page must still render an error state if both APIs fail), back to home.
