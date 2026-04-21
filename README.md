# Flight Tracker

A tiny, dependency-free ADS-B flight radar that runs entirely in the browser.

Live at **https://tommyk154.github.io/test-claude-ios-vibe/**

## Features

- Pick a preset city, use device geolocation, or enter any lat/lon
- Adjustable range from 10 NM to 250 NM
- Radar-style SVG visualization with range rings and a compass rose
- Aircraft plotted by bearing/distance and oriented by true heading
- Tap any aircraft for callsign, altitude, speed, heading, distance, squawk, hex
- Auto-refresh every 30 seconds (pauses when the tab is hidden)
- Fetches from `opendata.adsb.fi` with `api.adsb.lol` and OpenSky Network as fallbacks

## Technical

- Single `index.html` file with embedded CSS and JavaScript
- Zero dependencies, no build step, no CDN links
- Works opened directly from the filesystem or served from GitHub Pages
- Mobile-first layout, 44px tap targets, safe-area aware for iPhone

## Run it

Open the URL above on any modern browser. On iPhone Safari, use the Share
icon → **Add to Home Screen** for a fullscreen, app-like experience.

## Ship tracking (optional)

Ship (AIS) tracking uses [aisstream.io](https://aisstream.io/apikeys). It's
free but requires your own API key:

1. Sign up at `https://aisstream.io/apikeys` (~30 seconds).
2. Copy the generated key.
3. On the radar, tap the **⚙** button in the header.
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
