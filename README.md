# Habits + Flights

A tiny, dependency-free web app with two pages:

- **`index.html`** — habit tracker (daily check-offs, streaks, localStorage)
- **`tracker.html`** — live ADS-B flight radar (aircraft within range of any
  point, auto-refreshed from the free `adsb.fi` / `adsb.lol` public APIs)

Both run entirely in the browser with no build step.

## Habits

- Add custom habits with a name and emoji icon
- Tap to check off habits each day
- Current streak count and a 7-day dot timeline per habit
- Today's completion progress bar
- All data stored locally via `localStorage` — no backend, no accounts

## Flights

- Pick a preset city, use device geolocation, or enter any lat/lon
- Adjustable range, 10 – 250 NM
- Radar-style SVG visualization with range rings and compass labels
- Aircraft plotted by bearing/distance and oriented by heading
- Tap any aircraft for callsign, altitude, speed, heading, distance, squawk, hex
- Auto-refresh every 30 s (pauses when the tab is hidden)
- Falls back from `adsb.fi` to `adsb.lol` on failure

## Design

- Mobile-first layout tuned for iPhone (safe-area aware)
- Calm palette: off-white background, dark text, sage-green accent
- Minimum 44px tap targets throughout
- Smooth CSS transitions and a satisfying check animation
- Respects `prefers-reduced-motion`

## Technical

- Single `index.html` file with embedded CSS and JavaScript
- Zero dependencies, no build step, no CDN links
- Works opened directly from the filesystem or served from GitHub Pages

## Run it

Open `index.html` in any modern browser, or deploy via GitHub Pages:

1. Push to the default branch.
2. In the repo settings, enable Pages and set the source to the branch root (`/`).
3. Visit the published URL on your phone and add it to the home screen.

## Data

Habits are persisted under the `habits.v1` key in `localStorage`. Clearing your
browser data will remove them. There is no sync across devices.

Flight data is fetched live from public ADS-B APIs on every refresh and is not
stored anywhere.
