# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

An ADS-B flight radar web app deployed via GitHub Pages. Three source files
at the repo root, loaded in this order:

- `index.html` — HTML skeleton + `<link>` to `app.css` + `<script>` to `app.js`.
- `app.css` — all styles.
- `app.js` — all runtime logic, wrapped in a single IIFE.

No build step, no bundler, no `package.json`. Pages serves the three files
as-is. Browser caches CSS and JS independently.

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
4. **`pointercancel` always `resetAll`s AND calls `e.preventDefault()`**.
   iOS delivers it when the system takes over a gesture (multi-app
   switcher, Safari edge-swipe). Missing preventDefault lets Safari
   hold the gesture instead of returning control to us.
5. **Recover on stuck pointerdown**: on every pointerdown, first
   `sweepStalePointers(1000)` (prune any pointer whose `.t` timestamp
   is older than 1 s — a live finger emits moves). If the sweep empties
   pointers but `mode !== "idle"`, `resetAll()` before starting the
   new gesture. Defends against dropped pointerup/pointercancel events.
6. **Pinch → pan handoff**: when one finger lifts during pinch,
   `commitPinch()` first, then `enterPan` with the remaining pointer's
   CURRENT `{x, y}` — this gives the next pointermove dx=0 instead of
   the accumulated delta from during the pinch.
7. **Every stored pointer carries a `.t` timestamp** updated on every
   pointermove. In `pointermove` during `mode === "pinch"`, if the
   *other* stored pointer's `.t` is older than 400 ms, iOS almost
   certainly ate its `pointerup` — synthesize the lift, `commitPinch()`,
   then `enterPan` for the remaining finger. Without this, a single
   dropped pointerup locks the gesture in pinch mode forever and the
   user's "continues to zoom when I try to pan, can't tap planes"
   bug regresses.

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

### Motion ticker (dead reckoning)

`deadReckonTick` runs at 1 Hz and advances every plane / ship's *display*
lat/lon forward using its own `gsKt`+`trackDeg` (planes) or `sog`+`cog`
(ships). This is what makes the radar feel alive at every zoom level
even though real data only arrives every 10–30 s.

Invariants:

- **`baseLat` / `baseLon` / `baseAt`** are the last ground-truth
  position + timestamp. Reset by: the bulk fetch handler (for every
  plane in the fresh `state.planes`), `pollSelected` (for the
  in-bbox entry + `state.selectedPlaneData`), and the AIS message
  handler (for each ship's new lat/lon).
- Dead-reckoned positions are **display only**. `accumulateTracks()`
  uses raw-fetched lat/lon so trails remain ground truth.
- Guardrails: skip if `gsKt == null`, `trackDeg == null`, `onGround`
  true, or speed < 0.3 kt. Cap extrapolation at 120 s (planes) /
  300 s (ships) — older bases mean stale data we shouldn't keep
  blindly advancing.
- Fresh fetches cause a sub-NM visible jog as the estimate snaps to
  reality; on a 50 NM radar that's imperceptible.

### Refresh cadence

Bulk-fetch interval is source-aware via `currentRefreshMs()`:

- `REFRESH_MS_FAST = 10000` — when `state.activeSource` is `adsb.fi`
  or `adsb.lol`.
- `REFRESH_MS_FALLBACK = 30000` — when the active source matches
  `/proxy|opensky/i` (tighter rate limits, anonymous OpenSky credit
  budget).

`state.activeSource` is set to `result.source.name` at the end of the
fetch success handler. The status bar displays the current rate
("10s" or "30s") so the user can see at a glance which mode is active.

Selected-plane fast-poll stays at 5 s, now only 2× bulk (vs. 6× before).

### AIS subscription

aisstream free tier only streams the subscribed bounding box. The bbox
must track the map center, otherwise you listen to empty water far from
where you're looking.

- **`onCenterChanged()` at `index.html:1465` is the choke point**.
  Every code path that mutates `state.center` (preset buttons,
  airport search, custom lat/lon input, geolocation, re-center
  button) MUST route through it. `onCenterChanged` calls
  `resubscribeAis()` at the end.
- **`resubscribeAis()` updates `state.aisBbox`** to the newly-computed
  bbox AND resets per-subscription counters (`aisMessageCount`,
  `aisFirstMsgAt`, `aisMsgTypes`, `aisLastMsgType`, `aisLoggedSamples`,
  `aisNoTrafficTimer`). Without this, the settings-panel diagnostic
  strip would keep showing the stale bbox and count.
- aisstream accepts a mid-stream subscription frame on the same
  WebSocket — no need to close/reopen. If that ever stops working,
  fall back to `disconnectAisStream()` + `connectAisStream()`.

### Contact-list filter & sort

`state.listFilter` / `state.listSort` / `state.listSortDesc` (planes)
and `state.shipFilter` / `state.shipSort` / `state.shipSortDesc`
(ships) drive the chip UI above the list. All six are persisted to
`localStorage` under `list.*` keys.

- Filter predicates ALWAYS pass the currently-selected contact,
  regardless of the active filter, so the card↔list link never breaks.
- Chip UI is in the `#listControls` element, populated by
  `renderListControls()` and re-rendered whenever state changes via
  `setListOption(key, value)`.
- The ship chip row is only emitted when `state.showSea && state.aisKey`,
  so single-layer (air-only) users aren't cluttered with ship controls.
- Tapping the same sort chip twice toggles asc/desc. Numeric sorts
  (ALT, SPD) default to desc on first tap; text / distance sorts
  default to asc.

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

## Diagnostics

- **`COPY DIAGNOSTIC` button** in the settings panel snapshots session state
  to the clipboard as JSON. Used for bug reports — pasted output includes
  viewport, range, active fetch source / cadence, last fetch & error, plane &
  ship counts, list filter/sort state, `trendMin`, selected contact with
  sampled track (first 10 + last 10 points), **`selectedRoute`** (raw
  `state.routes[callsign]` entry for verifying adsbdb.com responses against
  rendered output), `selectedMissLog`, and AIS bbox + message counters. When
  a user reports a bug, ask them to paste the diagnostic rather than describe
  symptoms — it's the ground truth.
- **Privacy rules for the diagnostic payload** — the app is public on GitHub,
  so bug reports must not leak personal fingerprint:
  - `navigator.userAgent` is **never** included (OS + browser + device
    fingerprint).
  - `state.center.lat` / `state.center.lon` and `ais.bbox` coords are
    **rounded to 3 decimals** (≈370 ft / 0.06 NM). Enough to identify
    neighborhood / metro area for debugging, not enough to identify a home.
  - `state.aisKey` is **never** included.
  - Plane / ship positions in track samples stay at full precision — they're
    public aviation / maritime data, not the user's location.
  - When adding new fields to `copyDiagnostic`, audit them against this list.
    Err on the side of omitting anything device- or location-specific.

## Known Issues / In-flight investigations

- **AIS end-to-end**: PR #10 fixed the bbox-doesn't-update-on-center-change
  bug that was the most likely cause of the "no ships appear" symptom.
  If a busy port still reads `msgs 0` after PR #10 (the bbox diagnostic
  matches the map but no traffic arrives), the problem is on aisstream's
  side — key tier, verification, or the subscription-frame format — not
  in our code. Log the diagnostic state from the settings panel and move
  to investigate the account rather than the client.
- **OpenSky cross-flight waypoints**: `fetchHistoricalTrack` uses
  `opensky-network.org/api/tracks/all?icao24=...&time=0` which occasionally
  returns waypoints from *prior flights* of the same ICAO24 (same hex,
  different flight, sometimes weeks earlier). Sorted merge by timestamp
  can't distinguish them — they just appear as points in the track with
  impossible-to-reach intervening geography. Mitigation (PR #11): the
  trail renderer skips any segment whose implied groundspeed exceeds
  800 kt. These impossible legs are almost always cross-flight artifacts.
  Do NOT "clean up" by dropping this filter. Raw `state.tracks` is kept
  intact so other future features (e.g. loiter scoring) can apply their
  own plausibility rules.
- **Pinch-to-zoom regression (user-reported, unreproduced)**: after PR #10,
  zoom sometimes behaves erratically (direction reverse on second pinch, or
  zoom "continues" while the user tries to pan). Leading hypothesis: the
  400 ms stale-partner synthetic-lift inside `pointermove` during pinch
  (`setupRadarDrag`) is too aggressive — a human pause of one finger mid-
  pinch trips the path that synthesizes a `pointerup` and hands off to pan.
  Waiting on a clean repro before changing the threshold; user is watching
  for the specific conditions. When changing, test that the ORIGINAL PR #10
  bug (iOS eating `pointerup` → "continues to zoom, can't tap") does not
  regress — that's what the sweep was added to fix.

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
- Three source files only: `index.html`, `app.css`, `app.js`. Keep CSS in
  `app.css`, JS in `app.js`; don't re-inline into `index.html`. Don't add a
  fourth source file without a PR that justifies the split.

## Editing

- HTML structure goes in `index.html`. Styles go in `app.css`. Runtime logic
  goes in `app.js`. Keep each concern in its own file.
- Any non-API assets must be committed to the repo (no CDNs).

## Verification

There are no automated tests. After changes, open `index.html` in a browser
and exercise: preset selection, geolocation, custom lat/lon, range slider,
auto-refresh countdown, tap-to-select on radar and list, API fallback
(the page must still render an error state if both APIs fail).
