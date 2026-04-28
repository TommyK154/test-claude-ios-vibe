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
9. **Plan-mode specifically:** parallel `Explore` agents + a long
   silent post-agent analysis + one big `Write` for the plan file is
   a reliable way to stall. Build the plan incrementally — seed a
   skeleton first (one small `Write`), then fill each section with
   separate `Edit` calls with a one-sentence status between each.
   If you already have findings from earlier Explore agents, cite
   them inline; don't re-spawn agents "to be thorough."

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
`main` is at PR #39 merged (commit `906cc8d`). End-to-end feature
state through this point:

- FAA ArcGIS five-layer chart picker (Satellite, VFR Sectional, VFR
  Terminal, IFR Low, IFR High) with coverage + range + TAC-proximity
  gates and per-reason INOP sticker labels (`INOP (US only) /
  (<30 NM only) / (no TAC)`) tilted at ±3° golden-ratio rotations.
- Pennant-handle dual-thumb alt filter with apex-on-track alignment
  and breathing-room top margin between it and the chevron ALT BAND
  quick-filter chips immediately above.
- Pause-polling on tab-hide for selected-plane, military-registry,
  bulk-fetch, and countdown timers.
- `touch-action: pan-x pan-y` on body blocking iOS Safari page-level
  pinch-zoom (the `user-scalable=no` viewport meta is ignored by iOS
  Safari since iOS 10; `touch-action` is honored).
- **Airport search now bundles every airport on Earth** — ~72 K rows
  from OurAirports (Unlicense), ~5.5 MB raw / ~1.7 MB gzipped, lazy
  search index in `app.js` (`buildAirportIndex()`), per-keystroke
  search <5 ms even at full bundle size. Live-lookup
  (`fetchAirportLive`) and the dead `aviationapi.com` upstream are
  fully retired.
- Route cache is `state.routes[callsign]` (not `callsign|hex` —
  PR #35 reverted that compound key). Geography cross-check
  (CLAUDE.md §Known Issues) remains the named next step for the
  observed misrouting cases.

### Open PRs
- **None.**

### Stale / orphan branches
Most cleanup is delete-local-only since the repo auto-deletes
remote branches on merge. Safe to `git branch -D` after pulling
the latest main:
- `feat/backlog-combo-6-4-1-5` — PR #34 (merged).
- `fix/route-cache-and-pause-on-hide` — PR #35 (merged).
- `fix/ui-polish-items-3-6-7a` — PR #36 (merged).
- `fix/live-airport-strict-coord-parse` — PR #38 (merged).
- `docs/handoff-session-wrap` — PR #37 (merged).
- `fix/airports-bundle-ourairports` — PR #39 (merged).
- `claude/review-handoff-principles-a3YKd` — never opened as a PR;
  content stale (superseded by PR #37 + this PR). Safe to delete
  remotely too.

### Active planning artifact
`/root/.claude/plans/inherited-leaping-candy.md` holds the most
recent in-session plan(s). That file lives in Claude's workspace
and will *not* survive a session switch. The canonical backlog copy
is §7 below — keep them in sync when you revise either.

### Deferred admin (user will do from mobile)
- Swap default branch → `main` (currently `claude/habit-tracker-app-bs1bz`
  per legacy). Blocks deletion of the legacy branch itself.
- Delete `claude/habit-tracker-app-bs1bz` after the swap.

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

### Airports dataset regeneration (PR #39)

`airports.js` is generated from the OurAirports public-domain dataset
(license: Unlicense). The generator lives at `tools/build-airports.js`
and is run locally; the output is committed. It is *not* invoked at
deploy time — GitHub Pages serves the committed file as-is.

Refresh recipe (run on a machine with `node` and outbound network):

1. `mkdir -p /tmp/ourairports`
2. `curl -fLo /tmp/ourairports/airports.csv https://raw.githubusercontent.com/davidmegginson/ourairports-data/main/airports.csv`
3. `curl -fLo /tmp/ourairports/countries.csv https://raw.githubusercontent.com/davidmegginson/ourairports-data/main/countries.csv`
4. `node tools/build-airports.js`
5. `node --check airports.js` (sanity)
6. `git diff --stat airports.js` — review delta is reasonable.
7. Commit + PR.

In a sandbox without arbitrary outbound network: only
`raw.githubusercontent.com` was confirmed reachable in 2026-04-26 —
`davidmegginson.github.io` returned `host_not_allowed`. Use the raw
GitHub URL form above; don't rely on the `*.github.io` Pages mirror
of the same dataset.

The script:
- filters out `type === "closed"` (~13 K decommissioned fields),
- falls back to OurAirports' `ident` field when `icao_code` is empty
  (recovers idents like `KCMA` / `KO22` / `KSZP` whose icao_code is
  blank but whose ident is what users actually type),
- rounds lat/lon to 4 decimals (~10 m precision),
- sorts by importance (`large_airport` → `medium_airport` →
  `small_airport` → `seaplane_base` → `heliport` → `balloonport`),
  then by ICAO/IATA. Importance-first ordering surfaces commercial
  airports ahead of small GA fields for prefix / substring searches.

Output size envelope: ~5–6 MB raw, ~1.7 MB gzipped, ~72 K rows.
Loaded async via the existing `<script src="airports.js">` tag.
The lazy `buildAirportIndex()` in `app.js` builds Maps + first-letter
buckets on first search-input focus (~20 ms); search-as-you-type is
sub-frame after that.

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

## 7. Backlog — next-PR candidates

Current roadmap (post-PR-35 session). Ordered by leverage/risk; each
is scoped as its own PR. Detailed scope for each lives in the plan
file `/root/.claude/plans/inherited-leaping-candy.md` while it
persists; when it's gone, this list is the canonical memory.

### Closed / in-flight
- ✅ **Chevron BAND quick-filter** — shipped in PR #34.
- ✅ **Viewport zoom reset** — shipped in PR #34, strengthened with
  body `touch-action: pan-x pan-y` in a follow-up.
- ✅ **MARKER HIDDEN removal** — shipped in PR #34.
- ✅ **Range slider redesign (first attempt)** — digital ± steppers
  shipped in PR #34 then reverted; native `<input type="range">`
  restored. Future redesign still open but **no chosen direction**.
- ✅ **Pause polling on tab hide** — shipped in PR #35.
- ✅ **Route cache keyed on callsign+hex** — shipped in PR #35 then
  reverted after neither observed failure case mapped to that
  mechanism. See CLAUDE.md §Known Issues for the current multi-
  mechanism framing and the geography cross-check as the named next
  step.
- ✅ **UI polish (items 3, 6)** — shipped in PR #36.
- ✅ **KSZP wrong-location** — strict-numeric guard + interim manual
  KSZP row shipped in PR #38; both now superseded by PR #39's full
  bundle (KSZP resolves natively from OurAirports data).
- ✅ **Global airport bundle + lazy search index** — shipped in PR #39.
  72 K airports bundled, dead `fetchAirportLive`/aviationapi.com path
  retired, `buildAirportIndex()` in app.js keeps search sub-frame.
  See §6 "Airports dataset regeneration" for refresh recipe.

### Pending / planned
- 🔴 **PR B — Pinch-deselect bug.** Root cause isolated. When a
  two-finger pinch ends by one finger lifting, `setupRadarDrag`
  passes `null` as downTarget into `enterPan` (`app.js:3463` and
  `app.js:3413`), losing the remaining pointer's interactive-tap
  flag. A no-drag release then trips `maybeDeselectOnBackgroundTap`
  and deselects the plane. Fix: preserve each pointer's
  `downTargetInteractive` on `enterPinch`, pass the remaining one
  through on the handoff. ~15 lines JS + 1 new gesture invariant
  in CLAUDE.md.
- 🔴 **PR C — Route geography cross-check.** Named next step in
  CLAUDE.md §Known Issues. At render time, if both `route.origin`
  and `route.destination` are > ~1000 NM from the plane's current
  position, suppress the route line + card block. Mechanism-agnostic
  — catches both observed cases regardless of root cause. ~25 lines
  + one helper.
- 🔴 **PR D — DR diagnostic instrumentation.** User reports the
  selected plane sometimes jumps several miles ahead between
  refreshes. Hypothesis: 120-s dead-reckoning cap + high groundspeed
  extrapolates before the next fetch lands, or speed/heading update
  without `baseAt` reset during the 6-s selected-poll lock window.
  Ring-buffer log + tap-to-copy payload mirroring the existing tile
  diag. Instrumentation-only, no behavior change. Follow-up **PR E**
  for the targeted fix.
- 🔴 **PR F — Pending-track loading stub.** Subtle dashed line off
  the selected plane's tail while `state.historicalFetched[hex]` is
  false. Fades out when the real trail arrives. ~30 lines JS + 15
  CSS.
- 🔴 **PR G — Day/night terminator.** Gradient-filled nighttime
  polygon over the radar, subsolar-point math recomputed every 60 s.
  Pure math, no new deps. Largest feature PR; ship last. Visual
  reference: ForeFlight / SkyDemon / Windy.com use opacity-gradient
  with no hard edge.

### Out of scope until a use case forces it
- **Multi-band altitude filter** — contiguous-only / bitset-swap /
  hybrid options all reshape the existing single-range predicate.
  See CLAUDE.md §Known Issues. Deferred.
- **Range slider redesign (new direction)** — needs a design pick
  before code.
- **Long-standing items from README Future Work + CLAUDE.md Known
  Issues**: loiter detection, track-divergence alerts, callsign-
  switch detection, squawk-change history, "dark" reappearance,
  anchor-drift, distress push, lead-line contrast, weather overlay,
  momentum-on-pan, double-tap zoom, authenticated OpenSky, further
  JS subdivision, CSP meta tag, OpenSky cross-flight waypoint
  filter. Pick any time.

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
- PR #32: VFR Terminal as 4th chart layer. Range + TAC-proximity
  availability gate. Per-layer availability function.
- PR #33: Added this HANDOFF.md for session-to-session context transfer.
- PR #34: "Backlog combo" — four items, one PR. Shipped: MARKER
  HIDDEN removal, chevron BAND quick-filter (tap → slider tween),
  viewport zoom lock (initially via meta, later strengthened via
  body `touch-action: pan-x pan-y`). Attempted and reverted in-PR:
  native range slider replaced with digital ± stepper control —
  user rejected the coarse-control trade. Native slider restored
  before merge.
- PR #35: Route-cache key reconsidered + pause polling on tab hide.
  Originally shipped `callsign|hex` compound cache key; reverted in
  the same PR after review surfaced that neither documented failure
  case (QXE2316, UAL2192) mapped to the cross-aircraft-collision
  mechanism the key was defending against. Rewrote CLAUDE.md §Known
  Issues to frame the route bug as multiple un-diagnosed mechanisms;
  named the geography cross-check as the strongest next step. Net
  ship: pause-on-hide extension covering `state.selectedPollTimer`
  and `state.militaryRefreshTimer` alongside the pre-existing
  refresh + countdown timers.
- PR #36: UI polish — alt-slider pennant apex-on-track with new
  `.alt-range-row` top margin for visual separation from the ALT
  BAND row above; INOP sticker per-reason labels reading "INOP
  (US only) / (<30 NM only) / (no TAC)"; sticker rotations tightened
  to ±3° with a golden-ratio magnitude sequence; BAND → ALT BAND
  rename.
- PR #37: Wrap session handoff into HANDOFF.md (§3 stream-timeout
  rule 9 for plan mode, §5 / §7 / §10 freshened) so a fresh session
  lands with accurate context. Doc-only.
- PR #38: KSZP wrong-location investigation. Strict-numeric guard
  in `fetchAirportLive` + sanity guard (range, null-island);
  diagnosed `aviationapi.com` as DNS-unreachable; manual KSZP
  airports.js entry as the user-visible fix while the live path
  was dying.
- PR #39: Replace `airports.js` with the full OurAirports public-
  domain bundle (72,075 rows, ~1.7 MB gzipped). Adds
  `tools/build-airports.js` (local-only generator, not a deploy-time
  build). New lazy `buildAirportIndex()` with Maps + first-letter
  buckets. Removes ~80 lines of dead live-lookup scaffolding
  (`fetchAirportLive`, `parseDMS`, `strictNum`, `state.airportLive`,
  `isCodeShaped`, `canonQuery`, `maybeLiveLookup`, dropdown
  pending-state branches). Search now covers every airport on
  Earth with sub-frame keystroke latency. KSZP folds into the
  regenerated bundle naturally; the manual entry from PR #38 is
  no longer needed.

Commits land on focused feature branches. Never commit to `main`
directly.

---

If anything in this doc is outdated, update it in your next PR.
