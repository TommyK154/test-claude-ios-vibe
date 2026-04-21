# Air & Sea Tactical Radar

A single-file, dependency-free browser radar for live ADS-B air traffic and
(optionally) AIS vessel traffic, rendered over real satellite imagery.

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

## Technical

- Single `index.html` file with embedded CSS and JavaScript.
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
