# HANDOFF

Last session: 2026-04-23. This file exists so a fresh Claude session
can continue working on this repo without the prior session's context.

## 1. What this project is

A dependency-free, single-IIFE browser app that renders live aircraft
(ADS-B) and ship (AIS) traffic on a radar over satellite imagery +
FAA aeronautical charts. Deployed to GitHub Pages. Mobile-first.
Three source files (+ `airports.js`). No build step. See `CLAUDE.md`
for binding constraints — read it before editing.

## 2. Tooling constraints for Claude

### You HAVE
- A full checkout of `tommyk154/test-claude-ios-vibe` in your working
  directory.
- GitHub MCP tools scoped to that repo (`mcp__github__*`). Use them
  for all GitHub interactions.
- Read / Edit / Write / Bash on the local checkout.
- `node` for `node --check` JS syntax checks (no test runner).

### You do NOT have
- `gh` CLI. Use MCP instead.
- Outbound external network from Bash — DNS is blocked, so `curl` /
  `wget` to external hosts fail. You cannot probe URLs yourself.
- A way to open a browser. You cannot visually verify UI changes.

### The user's environment
- **Phone only.** iPhone, Safari. No terminal.
- They can tap URLs you hand them.
- They can paste back JSON, screenshots, or the tap-to-copy
  diagnostic string (see §6).
- Do NOT ask them to run curl / scripts.

## 3. Stream idle timeout — critical

The upstream API stream severs after ~60–90 s of no bytes flowing.
"API Error: Stream input timeout." breaks your turn and the user has
to restart. Rules to prevent it:

1. **Preamble first.** Open every turn with one short sentence
   stating what you're about to do, before any tool call. Starts the
   stream immediately. A tool-call-first turn can silently stall.
2. **Chunked reads.** Never `Read` a file >500 lines without `limit`.
   `Grep` to find the right `offset`, then read 40–100 lines.
3. **Prefer `Edit` over `Write`** for files >100 lines. Full
   rewrites marshal a huge payload in one shot; a series of small
   `Edit`s keeps bytes flowing.
4. **Parallelize independent calls.** Put multiple tool_use blocks
   in one message when they don't depend on each other. They run
   concurrently and keep the stream active.
5. **Short status beats.** Between tool calls, drop one-sentence
   updates. Silence looks identical to a dead stream upstream.
6. **Avoid `Agent` spawns for known targets.** Direct `Grep`+`Read`
   is faster than a subagent that takes 60+ s. Reserve agents for
   genuinely multi-file scope.
7. **No multi-minute silent thinking.** If analysis needs time,
   interleave short reads to keep the stream alive.
8. **Break long outputs.** If writing a file >200 lines, consider
   splitting into two `Write`/`Edit` calls with a one-line status
   between them.

These rules are also in the private CLAUDE.md — this copy exists so
a fresh session sees them immediately.

## 4. Markdown rules for the user's chat client

- **Don't wrap URLs in `**`**. Their mobile client renders the
  trailing `**` as part of the URL text and breaks tap-to-open. Use
  bare URLs; they linkify on their own.
- Code fences render fine. Images you inline won't render.
- The user pastes screenshots; they cannot copy/paste file contents
  easily.

## 5. Current state

### Main
`main` is at PR #31 merged — FAA ArcGIS charts live. Four chart
layers wired (Satellite, VFR Sectional, IFR Low, IFR High) with a
coverage-gated INOP sticker + user-friendly diagnostic banner.

### Open PRs
- **PR #32** (`fix/vfr-terminal-layer`) — adds VFR Terminal as a
  4th FAA chart layer, plus a range/TAC-proximity availability gate.
  Three commits: initial swap, `minZoom: 10` fix, availability gate.
  Waiting on user to test at SFO (drag range slider across 30 NM to
  confirm INOP flips live) before merging.

### Branches
- Default branch on GitHub: `claude/habit-tracker-app-bs1bz` (legacy;
  user will swap to `main` via GitHub Settings later — blocks
  deletion of the branch itself). Not urgent; all PRs base against
  `main` correctly.
- Branch protection on `main`: restrict deletion + block force-push
  (enabled this session).

### Deferred admin (user will do from mobile)
- Swap default branch → `main`.
- Delete `claude/habit-tracker-app-bs1bz`.

## 6. Key technical patterns

### FAA ArcGIS tile pipeline

- Org ID: `ssFJjBXIUyZDrSYZ` (FAA Aeronautical Information Services
  on Esri public cloud).
- Services used: `VFR_Sectional`, `VFR_Terminal` (PR #32),
  `IFR_AreaLow`, `IFR_High`.
- Tile URL pattern:
  `https://tiles.arcgis.com/tiles/{org}/arcgis/rest/services/{svc}/MapServer/tile/{z}/{y}/{x}`
  (ArcGIS scheme — `y` before `x`, unlike OSM).
- Metadata probe: append `?f=pjson` to service root URL. Returns
  JSON with `minLOD`, `maxLOD`, `format`.
- Published LOD ranges confirmed via probe:
  - `VFR_Sectional`: 8–12
  - `VFR_Terminal`: 10–12 (narrower, deeper — TACs are detail-dense)
- `IFR_AreaLow` / `IFR_High` assumed 8–12 (not re-probed).

### Chart availability gate (PR #32)

`chartLayerAvailability(layerId, lat, lon, rangeNm)` in `app.js` is
the single source of truth for "can we render this layer here?".
Returns `{ ok: bool, reason?: string }`. Consumed by:
- `renderTiles` — short-circuit + show reason on banner.
- `updateInopStickers` — add `.inop` class when `!ok`.

Gates:
- All chart layers: `isInFaaCoverage(lat, lon)` (rough US bbox).
- VFR Terminal only: `rangeNm > 30 NM` → zoom-in msg;
  `nearestTacDistance > 40 NM` → "no TAC here" msg.
- `TAC_CITIES` array holds ~35 FAA TAC metros (hardcoded from 2026
  FAA publication roster).

### Diagnostic banner + copy (PR #30)

Red banner at top of radar when tiles fail or a chart is
unavailable. Tappable — copies a `key=value` diag string to
clipboard via `navigator.clipboard.writeText`. User pastes it back
to you; parse with regex.

Format: `layer=X err=N/M src=URL inner=URL center=lat,lon range=NM
t=ISO ua=...`.

Built by `buildTileDiag()`, wired up in `setupTileStatusCopy()`.

### INOP sticker

Dymo-style label overlay on chart buttons. Dynamic via
`updateInopStickers()`. Rotations clamped to ±4° with distinct
per-layer angles to look hand-applied:
- sectional: `-3deg`
- vfr-terminal: `1.5deg`
- ifr-low: `4deg`
- ifr-high: `-2.5deg`

CSS at `app.css` search `.map-layer-option.inop`.

### Error/warning text convention

All visible text is user-facing, not developer-facing. Technical
details (URL paths, raw JS errors, internal reason codes) live only
in the tap-to-copy diagnostic payload — never in the banner/label
text the user sees by default. Audit pattern: see PR #30's
"visitor-friendly error/warning strings" commit.

## 7. Backlog — candidates for next PR (user picks)

Tracked in the plan file at `/root/.claude/plans/reflective-petting-newt.md`
(the plan file may not be present in a fresh session — the canonical
list is this one):

1. **Chevron-based altitude quick-filter.** Tap chevron-count icon
   markers (0–4 chev) to filter planes in that altitude band.
   Supplements the existing dual-thumb alt slider. Tapping a chevron
   animates slider thumbs to the band edges. Reuse
   `altitudeChevronCount()`, `renderAltRangeRow()`,
   `updateAltRangeUi()`, `wireAltRangeSlider()`.
2. **README sync.** Fix stale `⚠` → `EMERG` at `README.md:68`; audit
   feature descriptions against current behavior; update Future Work.
3. **Alt filter vertical centering.** Slider line + dual-handle
   pennants don't share a vertical center in the ALT row. Pure CSS.
4. **Full-page refresh zoom reset.** iOS Safari sometimes retains
   a pinch-zoomed perspective across reload. Fix via viewport meta
   or boot-time `document.documentElement.style.zoom = 1`.
5. **Radar zoom slider redesign.** Reimagine `#rangeSlider` (log
   5–500 NM) inspired by aircraft instruments (steam or digital).
   More compact, better granular control.
6. **Delete MARKER HIDDEN banner.** User reports it doesn't work
   correctly. Remove `recordSelectedMiss()`, `renderMissStrip()`,
   `state.selectedMissLog`, all call sites.

Plus long-standing items from `README.md` "Future Work" and
`CLAUDE.md` "Known Issues": loiter detection, day/night terminator,
track-divergence alerts, callsign-switch detection, anchor-drift,
momentum-on-pan, route cache key (QXE2316 cross-flight bug),
OpenSky cross-flight waypoint filter.

## 8. Recipe: open a PR

1. `git checkout main && git pull --ff-only origin main`
2. `git checkout -b {type}/{short-description}` (e.g. `fix/route-cache-key`)
3. Make the edits. Keep scope tight — one focused change per PR.
4. `node --check app.js` (or the file you edited).
5. Commit with a descriptive message.
6. `git push -u origin {branch}`.
7. Open PR via `mcp__github__create_pull_request`:
   - `owner`: `tommyk154`
   - `repo`: `test-claude-ios-vibe`
   - `base`: `main`
   - `head`: your branch
   - Body should include a "Test plan" with phone-friendly checks.
8. User tests on the preview deploy URL:
   `https://tommyk154.github.io/pr-preview/pr-N/`
9. Iterate from their feedback (screenshots, diag paste).
10. User merges via GitHub UI. After merge:
    - `git checkout main && git pull --ff-only origin main`
    - `git branch -d {branch}` (local cleanup).
    - Remote branch auto-deletes on merge (repo setting).

## 9. Recipe: probe an external URL

Since you can't reach external hosts:
1. Hand the user a **bare** URL (no `**` around it).
2. Tell them what to look for (JSON field, status code, image vs
   error text). For long JSON responses, ask them to use Safari's
   "Find on Page" to search a specific key and paste the match.
3. They paste results back. If iOS downloads the file instead of
   rendering (common for tiles), the byte count is usually enough
   signal: ~30–80 KB for PNG/JPEG tiles, <2 KB for error JSON.

## 10. Historical session log

Six PRs in ~24 hours, in order:
- PR #28: UX overhaul + airports bundle (pre-dates this session).
- PR #29: `app.js` refactor — 10 section banners + dead-code sweep
  (dropped `state.showAir` / `state.showSea`, kept
  `selectedMissLog` which turned out to be live diagnostic code).
- PR #30: ChartBundle investigation — `referrerpolicy="no-referrer"`,
  corsproxy.io wrapper, front-loaded banner format, unwrap proxied
  URLs, tap-to-copy diagnostic, visitor-friendly error strings.
  Confirmed ChartBundle itself offline.
- PR #31: Swap to FAA ArcGIS charts. Three chart services live.
  Coverage-gated INOP + `OUT OF COVERAGE · US ONLY` banner. Clamped
  sticker rotations to ±4° with golden-ratio IFR pair.
- PR #32 (open): VFR Terminal as 4th chart layer. Range +
  TAC-proximity availability gate. Per-layer availability function.

Commits land on focused feature branches. Never commit to `main`
directly.

---

If anything in this doc is outdated, update it in your next PR.
