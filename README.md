# Air & Sea Tactical Radar

A dependency-free browser radar for live ADS-B air traffic and (optionally)
AIS vessel traffic, rendered over real satellite imagery. Three source files
(`index.html` + `app.css` + `app.js`), no build step.

Live at **https://tommyk154.github.io/test-claude-ios-vibe/**

## Features

### Map & interaction
- Real-world ESRI satellite tiles with a labels overlay, rendered at
  retina-oversampled zoom for crisp imagery on mobile.
- Pan the radar by dragging; pinch on the map with two fingers to change
  range (5 – 500 NM, logarithmic slider below the map mirrors the gesture).
- Pre-loaded tile buffer (~40 % beyond the active circle) so short pans
  don't hit empty space.
- Vignette between the radar circle and the square corners marks where
  data coverage extends. Contacts render across the full square, not just
  the circle, so tracks don't get cut off at the edge.
- Auto-request geolocation on first load; collapsible location panel with
  airport search (IATA / ICAO / city across ~130 bundled airports).

### Aircraft (ADS-B)
- Fetches from `opendata.adsb.fi` with `api.adsb.lol`, OpenSky Network,
  and three CORS-proxied fallbacks for resilience behind privacy layers.
- Auto-refresh every 30 seconds, contacts sorted by distance.
- Tap any aircraft to pin details (callsign, altitude, speed, heading,
  distance, squawk, hex, photo via planespotters.net).
- **5-minute trend vector** (G1000-style) projects speed-scaled forward
  position for the selected plane.
- **Fading cyan trail** shows accumulated position history; pre-populated
  from OpenSky's `tracks/all` endpoint on selection for the last several
  minutes of historical data, then extended live via a 5-second fast-poll.
- **Sticky selection** — once you tap a plane, its trail, route line, and
  icon stay drawn at their real geographic coordinates no matter where
  you pan the map. Follow an incoming flight's path from its destination
  all the way back to its origin without ever losing the trail.
- **Planned route** from `api.adsbdb.com` draws a magenta dashed line
  origin → current → destination when route data is known.
- **Emergency squawks** (7500 / 7600 / 7700) pulse red with a labeled
  HIJACK / RADIO FAIL / EMERGENCY banner.
- **Military aircraft** from `adsb.fi/mil` render in warning-orange with
  a MIL banner in the selected card.
- **Notable callsigns** (AIR FORCE ONE, NATO, SENTRY, REACH, NASA, etc.)
  are flagged inline against a curated ~50-entry table. Anything not in
  the curated list gets an operator lookup from `api.adsbdb.com`, so any
  registered USAF / NAVY / NATO / NASA / DHS aircraft is still labeled.
- **Anomaly chips** on the selected card call out supersonic speeds,
  very-high-altitude cruise (FL550+), low-slow surveillance profiles,
  and extreme vertical rates.
- **Loading status row** on the card shows when track history, route
  lookup, and photo are still fetching so you can tell "waiting" from
  "not coming".
- **Three ways to deselect** a plane: tap the ✕ on the details card, tap
  the empty radar background, or tap the same plane again. After deselect
  the plane marker stays on the map for a 30 s grace period so it doesn't
  pop off the instant you dismiss the overlay.
- **Dead-reckoning motion** — every plane marker advances every second
  using its own reported heading and ground speed, so all contacts on
  the map move smoothly between fetches, not just the selected one.
  Fresh fetches override the estimate; trails remain ground-truth.
- **10-second bulk refresh** on direct APIs (adsb.fi, adsb.lol); falls
  back to 30 s automatically when streaming through CORS proxies or
  OpenSky to respect tighter rate limits. Current rate is shown in the
  status bar.
- **Contact-list filter & sort.** The list under the radar has filter
  chips (ALL · AIR · GROUND · MIL · NOTABLE · ⚠) and sort chips
  (DIST · ALT · SPD · A–Z, each with an asc/desc toggle). Ships get
  their own filter row (ALL · UNDERWAY · ANCHORED · DISTRESS) when an
  AIS key is set. Choices persist across reloads.

### Ships (AIS, optional)
- Ship tracking streams from `aisstream.io` via WebSocket when you paste
  a free API key into the settings panel (top-right gear icon).
- Amber hull-shaped markers oriented by course over ground.
- Selected ship card decodes country of registration from the MMSI prefix,
  decodes navigational status (at anchor, aground, AIS-SART, etc.), and
  shows SOG / COG / heading / destination / live accumulated trail.
- Abnormal or distress statuses (not under command, aground, AIS-SART)
  raise a red alert banner.
- `AIR / SEA / BOTH` segmented toggle filters which layer shows.
- The settings panel surfaces aisstream errors directly (bad key, malformed
  subscription, unverified account). After 30 seconds of "connected but
  silent", the status downgrades to "NO TRAFFIC IN AREA" so silent failures
  don't masquerade as a slow day.
- **Diagnostic strip** under the ais status line shows the subscribed
  bounding box, message count by `MessageType`, the most recent frame type,
  and how many ships are currently known. If messages are flowing but no
  markers appear, the bbox is most likely mismatched with the current map
  center — pan to a busy port (Rotterdam, Singapore, Houston) and wait.

## Status (as of PR #11)

- Gesture system (pan, pinch, pinch→pan handoff, tap-to-select,
  tap-to-deselect) is stable. PR #10 added stale-pointer pruning so the
  state machine recovers from iOS Safari occasionally eating a
  `pointerup` during multi-touch.
- Sticky selection, 30 s deselect grace buffer, loading status row,
  SIGINT anomaly chips, notable-callsign banners (curated + external
  operator lookup), MMSI nav-status decode all shipping.
- Dead-reckoning motion ticker + 10 s fast-mode bulk refresh ship in
  PR #10 — global contact motion between fetches, not just selected.
- AIS subscription now re-subscribes on every map-center change. The
  diagnostic strip in settings reflects the live bbox and per-subscription
  message counts.
- Contact-list filter + sort (plane and ship) ships in PR #10. PR #11
  renames the plane-filter row label to `FILTER` and the airborne chip
  to `FLYING` to resolve a collision with the top-level `AIR` mode toggle.
- PR #11: trail render skips any segment implying >800 kt groundspeed,
  cleaning up OpenSky cross-flight waypoint artifacts that drew as
  zigzag tendrils across the map.
- PR #11: dead-reckoning NaN guards stop a single bad fetch from
  NaN-poisoning the display coordinate and silently culling the selected
  plane marker.
- PR #11: off-box selected plane renders as an edge chevron with
  callsign + bearing/distance so the user never loses their selection
  when panning away.

## Known Issues (open)

- AIS end-to-end: if a particular busy port still shows `msgs 0` in the
  diagnostic after PR #10, the subscription-shape fix isn't the root
  cause and we need to dig into the aisstream account / tier / key
  verification. Log the diagnostic state and move to that investigation.
- Loiter detection is not yet implemented (roadmap item).

## Future Work

Ordered roughly by likely ship sequence.

### SIGINT
- **Loiter detection** — flag aircraft with a path-length / net-displacement
  ratio > 3 over ≥ 5 min at < 5 NM displacement. Requires threshold tuning
  against real holding patterns, medevac circles, and ISR orbits to avoid
  false positives.
- **Track-divergence alerts** — compare filed route (from `adsbdb`) vs
  actual position; flag if > 50 NM off course.
- **Callsign switching** — detect when a single ICAO24 hex changes callsign
  mid-flight (often a mission / identity change).
- **Squawk-change history** — log 7500 / 7600 / 7700 transitions over the
  session, not just the current value.
- **"Dark" reappearance** — flag aircraft that drop off ADS-B and reappear
  after > 30 min (potential intermittent-transponder signal).

### Maritime
- **Anchor-drift detection** — vessels broadcasting "at anchor" but drifting
  outside normal anchorages.
- **Distress push** — AIS-SART / aground / not-under-command vessels get
  top-of-list placement, not just a banner.

### Visual
- **Day/night terminator** — render a shaded SVG polygon over the map
  following the solar terminator. Pure math (subsolar lat/lon from UTC),
  recompute every 60 s. No external API; no feature dependency.
- **Weather radar overlay** (stretch, optional).

### Gesture / interaction
- **Momentum on pan release** — decay velocity for an Apple-Maps feel
  instead of the current hard stop.
- **Double-tap to zoom in** — Apple-Maps convention.

### Performance / data
- **Authenticated OpenSky credentials** (optional) — would let us
  sustain sub-10 s polling on that source without blowing the anonymous
  credit budget.
- **Pause polling when the tab is hidden** — save data when the page is
  in a background tab.

### Refactor follow-ups (from PR #17 three-file split)
- **Further JS subdivision** — split `app.js` into `state.js` / `fetch.js`
  / `render.js` / `gesture.js` / `ais.js`. Requires picking a module
  pattern (ES modules via `<script type="module">` vs. shared-namespace
  IIFE). Separate PR because it changes evaluation semantics.
- **Content-Security-Policy `<meta>` tag** — defense-in-depth against
  injection. Needs careful testing against every fetch origin
  (adsb.fi, adsb.lol, opensky-network, corsproxy.io, allorigins, ESRI
  tiles, aisstream, planespotters, adsbdb).
- **Dead-code sweep** — post-refactor, now that the file layout has
  settled, spot and remove any unused helpers.

## Technical

- Three source files: `index.html` (HTML skeleton), `app.css` (styles), `app.js` (IIFE).
- Zero build-time dependencies, no CDN script tags.
- Works opened directly from the filesystem or served from GitHub Pages.
- Mobile-first layout, 44 px tap targets, safe-area aware for iPhone.
- Runtime data sources:
  - `opendata.adsb.fi`, `api.adsb.lol`, `opensky-network.org` — live ADS-B
  - `opensky-network.org/api/tracks` — historical aircraft path
  - `server.arcgisonline.com` — ESRI satellite + labels tile services
  - `api.adsbdb.com` — flight route (origin/destination) on tap
  - `api.planespotters.net` — aircraft photo on tap
  - `aisstream.io` — maritime AIS (user-supplied key, WebSocket)

## Run it

Open the URL above on any modern browser. On iPhone Safari, use the Share
icon → **Add to Home Screen** for a fullscreen, app-like experience.

## Ship tracking (optional)

Ship (AIS) tracking uses [aisstream.io](https://aisstream.io/apikeys). It's
free but requires your own API key:

1. Sign up at `https://aisstream.io/apikeys` (~30 seconds).
2. Copy the generated key.
3. On the radar, tap the **settings** (sliders) icon in the header.
4. Paste your key into the input, tap **SAVE**.

The key is stored only in your browser's `localStorage` (under
`aisstream.key`) and is only sent directly to aisstream.io's WebSocket. You
can wipe it at any time with the **CLEAR** button in the same panel.

Once saved, a segmented `BOTH / AIR / SEA` toggle appears above the radar
to switch between layers. Ships appear in amber with course/heading/speed.

## Data

Flight data is fetched live from public ADS-B APIs on every refresh and is
not stored. AIS ship data is only live while the WebSocket is connected.
No analytics, no accounts, no backend — everything runs in your browser.
