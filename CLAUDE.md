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
- `state.selectedPlaneData` — **authoritative** render source for the
  selected plane. `renderRadar` filters the selected hex out of
  `state.planes` and always draws it from here, so the icon never
  disappears between a bulk-fetch replacement and a `pollSelected`
  refresh. Kept fresh by both the 5 s `/hex/{hex}` fast-poll AND by the
  30 s bulk fetch (merged in-place when present). This is what lets the
  user pan anywhere on the map and follow the plane's path without
  losing it.
- `state.lastSelectedPlane` + `state.lastSelectedAt` — 30 s grace buffer.
  When the user deselects, the plane marker stays drawn (no trail /
  route / vector) for up to 30 s or until the next bulk fetch
  re-includes it, whichever comes first. Prevents the "deselect makes
  the plane disappear" jump.
- `state.ships` — current ship state keyed by MMSI.
- `state.tracks[hex]` / `state.shipTracks[mmsi]` — accumulated position
  history; capped to 500 / 200 samples respectively; historical points
  marked with `historical: true`.
- `state.routes[callsign]` — cached route lookups.
- `state.aircraftOwner[hex]` — cached `adsbdb.com/v0/aircraft/{hex}` result
  with a `label` set if the operator matches a notable-keyword pattern.
- `state.military` — set of known military ICAO24 hexes.
- `state.aisKey` — user's aisstream key (from localStorage).
- `state.aisMessageCount` / `state.aisFirstMsgAt` / `state.aisMsgTypes` /
  `state.aisLastMsgType` / `state.aisBbox` — AIS diagnostics used by the
  settings panel's `renderAisDiag` block to distinguish "silent area"
  from "broken subscription" from "parse path dropping frames".
- `state.selectedHex` / `state.selectedMmsi` — current selection (mutually
  exclusive; changing one clears the other + `state.selectedPlaneData`).

### Gesture invariants

`setupRadarDrag` is the ONLY place pan / pinch state lives. Any regression
here tends to break pan (snap-back), selection (tap doesn't register), or
both. When editing:

1. **Single source of truth**: `mode` is `"idle" | "pan" | "pinch"`. All
   transitions go through `enterPan`, `enterPinch`, `commitPan`,
   `commitPinch`, or `resetAll`. Never mutate `mode` / `panStart` /
   `pinchStart` outside these functions.
2. **Snapshot pointer position BEFORE deleting it from `pointers`**.
   `commitPan(lastPt)` needs it for the final dx/dy math. If you delete
   first and read `pointers[panStart.pointerId]` afterwards, dx/dy
   collapse to 0 and the map snaps back to the pan origin on release.
3. **Every exit path from pan or pinch releases all pointer captures**
   (`releasePointerCapture`). A captured pointer that is never released
   suppresses subsequent `click` events on plane/ship markers, breaking
   tap-to-select.
4. **`pointercancel` always `resetAll`s**. iOS delivers it when the
   system takes over a gesture (multi-app switcher, Safari edge-swipe).
5. **Recover on stuck pointerdown**: if a fresh pointerdown arrives
   while `mode !== "idle"` and `pointerCount() === 0`, `resetAll()`
   before starting the new gesture. Defends against dropped
   pointerup/pointercancel events.
6. **Pinch → pan handoff**: when one finger lifts during pinch,
   `commitPinch()` first, then `enterPan` with the remaining pointer's
   CURRENT `{x, y}` — this gives the next pointermove dx=0 instead of
   the accumulated delta from during the pinch.

### Render ordering

`renderRadar` draws planes from (in priority order):
1. `state.planes` — filter out `state.selectedHex` so the selected plane
   is never double-drawn.
2. `state.selectedPlaneData` — pushed in if `state.selectedHex` is set.
   Authoritative render for the selected plane.
3. `state.lastSelectedPlane` — pushed in if `Date.now() - state.lastSelectedAt < 30000`
   and the hex isn't already in the iteration. Grace buffer after deselect.

`renderOverlays` uses `getSelectedPlane()` which returns
`state.selectedPlaneData` first (authoritative), and only falls back to
`state.planes` as a secondary defence. Trail / route / trend vector are
never drawn for `lastSelectedPlane` — deselect strips overlays by design.

### Deselection

Three entry points, all routing through `deselectAll()`:
- Tap the ✕ close button on the selected card.
- Tap on empty radar background (`maybeDeselectOnBackgroundTap`,
  triggered by a no-drag `commitPan` whose `downTarget` wasn't a
  `[data-hex]` / `[data-mmsi]` element).
- Tap the same plane / ship again (legacy toggle preserved).

`deselectAll` stashes `selectedPlaneData` into `lastSelectedPlane`,
stamps `lastSelectedAt`, nulls the selection, then fires `fetchNow()`
immediately so the plane re-appears from the bulk fetch as fast as
possible (bypasses the 30 s auto-refresh cadence).

### Interaction

Radar SVG handles pan (single finger) and pinch-to-zoom (two fingers)
on the same gesture surface via `setupRadarDrag`. See "Gesture invariants"
above for the rules the state machine enforces. Whole square shows live
data; the concentric rings are pure distance references (no clip-path).

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
  threshold tuning against real holding patterns. See README "Future Work".

## Known Issues / In-flight investigations

- **AIS end-to-end unverified**: user reports ships never appear despite a
  connected key. The `renderAisDiag` settings-panel block now surfaces
  bbox, message counts by MessageType, last frame type, and ship count —
  use it to narrow down whether it's the subscription, the parse, or the
  render. `state.aisLoggedSamples` also logs the first 3 parsed messages
  to `console.log` for Safari Web Inspector / iOS debugging.

## Roadmap

See the "Future Work" section of `README.md` for the single source of
truth on what's on deck. Carrying forward right now: loiter detection,
day/night terminator, track-divergence alerts, callsign-switch detection,
anchor-drift, momentum-on-pan. Don't let these fall off the list between
sessions.

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
