# Habits

A tiny, single-file habit tracker that runs entirely in the browser.

## Features

- Add custom habits with a name and emoji icon
- Tap to check off habits each day
- Current streak count and a 7-day dot timeline per habit
- Today's completion progress bar
- All data stored locally via `localStorage` — no backend, no accounts

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
