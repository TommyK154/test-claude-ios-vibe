# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

A single-file ADS-B flight radar web app. Everything lives in `index.html` at
the repo root — HTML, CSS, and JavaScript embedded. Deployed via GitHub Pages.

Runtime data comes from `opendata.adsb.fi`, with `api.adsb.lol` and
`opensky-network.org` as automatic fallbacks (all free, CORS-enabled, no
auth required). The fetch layer picks the right response parser per source
(`normalizeReadsb` for the first two, `normalizeOpenSky` for the last).

## Constraints

- No build step. No bundler. No package.json.
- No bundled dependencies, CDN scripts, or web fonts.
  - Runtime fetches to the ADS-B APIs are allowed.
- Mobile-first. Tap targets stay at or above 44×44 CSS px.
- Calm palette: off-white background, dark text, sage accent, dark radar panel.
- Respect `prefers-reduced-motion`.
- Keep the single-file invariant: HTML, CSS, JS all inline in `index.html`.

## Editing

- Prefer editing `index.html` in place over adding new files.
- Any non-API assets must be committed to the repo (no CDNs).

## Verification

There are no automated tests. After changes, open `index.html` in a browser
and exercise: preset selection, geolocation, custom lat/lon, range slider,
auto-refresh countdown, tap-to-select on radar and list, API fallback
(the page must still render an error state if both APIs fail).
