# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

A single-file ADS-B flight radar web app. Everything lives in `index.html` at
the repo root — HTML, CSS, and JavaScript embedded. Deployed via GitHub Pages.

### Runtime data sources

ADS-B: `opendata.adsb.fi` primary, with `api.adsb.lol`, `opensky-network.org`
(bbox endpoint), plus three CORS-proxied fallbacks
(`corsproxy.io`, `api.allorigins.win`). The fetch layer picks the right
response parser per source (`normalizeReadsb` for readsb-format APIs,
`normalizeOpenSky` for OpenSky's positional arrays).

Selected-aircraft enhancements:
- Fast-poll via `/v2/hex/{hex}` every 5 s while selected — higher-resolution
  track accumulation than the 30 s bulk refresh can provide.
- Historical path: `opensky-network.org/api/tracks/all?icao24=...&time=0`
  on selection; results merged into `state.tracks[hex]` so the trail
  extends back several minutes before the user started watching.
- Photo: `api.planespotters.net/pub/photos/hex/{hex}`.
- Route: `api.adsbdb.com/v0/callsign/{callsign}`.
- Military registry: `opendata.adsb.fi/api/v2/mil` refreshed every 2 min
  into `state.military`.

Map imagery: `server.arcgisonline.com` ESRI `World_Imagery` base +
`Reference/World_Boundaries_and_Places` labels overlay. Tile zoom is
oversampled by +1 on high-DPR screens for retina-crisp rendering.

Optional ship tracking: `aisstream.io` (WebSocket). User supplies their own
API key via the settings panel; key is stored only in `localStorage` under
`aisstream.key`. Ship positions stream into `state.ships` (by MMSI), with
per-vessel live trails in `state.shipTracks[mmsi]`. If no key is present,
ship UI is hidden and only ADS-B is shown.

### State model (in `index.html`)

- `state.center` — `{lat, lon, label, id}` for the current radar center.
- `state.rangeNm` — 5 – 500 NM, logarithmic slider + pinch control.
- `state.planes` — latest ADS-B snapshot (bbox-scoped).
- `state.selectedPlaneData` — sticky snapshot of the selected plane. Kept
  fresh by the 5 s `/hex/{hex}` fast-poll so the plane's icon, trail, and
  route stay drawn even when it's outside the current bbox — the user can
  pan anywhere on the map to follow the plane's path without losing it.
- `state.ships` — current ship state keyed by MMSI.
- `state.tracks[hex]` / `state.shipTracks[mmsi]` — accumulated position
  history; capped to 500 / 200 samples respectively; historical points
  marked with `historical: true`.
- `state.routes[callsign]` — cached route lookups.
- `state.aircraftOwner[hex]` — cached `adsbdb.com/v0/aircraft/{hex}` result
  with a `label` set if the operator matches a notable-keyword pattern.
- `state.military` — set of known military ICAO24 hexes.
- `state.aisKey` — user's aisstream key (from localStorage).
- `state.aisMessageCount` / `state.aisFirstMsgAt` — AIS diagnostics used
  by the settings panel to distinguish "silent area" from "broken subscription".
- `state.selectedHex` / `state.selectedMmsi` — current selection (mutually
  exclusive; changing one clears the other + `state.selectedPlaneData`).

### Interaction

Radar SVG handles pan (single finger) and pinch-to-zoom (two fingers)
on the same gesture surface via `setupRadarDrag`. Uses an explicit
state machine with modes `"idle"`, `"pan"`, `"pinch"`; transitions go
through `enterPan`, `enterPinch`, `commitPan`, `commitPinch`, and
`resetAll`. Pinch ending with one finger still down hands off cleanly
to pan (remaining finger's current position becomes the new pan
baseline, so the next move has dx=0). `pointercancel` always returns
to idle and releases all captures — iOS can deliver it when the system
intercepts a gesture. Whole square shows live data; the concentric
rings are pure distance references (no clip-path).

### SIGINT layer

- Emergency squawks (7500/7600/7700) render a pulsing red halo and an
  alert banner on the selected card.
- Military aircraft registry from `adsb.fi/mil` (refreshed every 2 min)
  keys `state.military`; matches render in warning-orange.
- Notable-callsign table (`NOTABLE_CALLSIGNS` array, ~50 entries) does
  inline exact/prefix matching every render; no network.
- Notable-operator fallback: `api.adsbdb.com/v0/aircraft/{hex}` on
  selection; the `registered_owner` field is regex-matched against
  `NOTABLE_OPERATOR_KEYWORDS` (AIR FORCE, NAVY, NATO, NASA, DHS, etc.).
- Anomaly chips on the selected card flag supersonic speed, FL550+
  altitude, low-slow surveillance, and high vertical rates.
- Ship nav-status decode (`NAV_STATUS_TEXT`) surfaces AIS NavigationalStatus;
  values in `NAV_STATUS_ALERT` (not under command / aground / AIS-SART)
  raise a red alert banner.
- Loiter detection is explicitly **deferred to a future PR** — needs
  threshold tuning against real holding patterns.

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
