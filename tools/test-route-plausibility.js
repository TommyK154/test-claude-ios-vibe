// Validates the route geography cross-check against the two documented
// real-world misrouting incidents (CLAUDE.md "Route lookups
// misrepresenting today's flight") plus positive controls. Run with:
//   node tools/test-route-plausibility.js
//
// History note: the first heuristic considered (and recorded in
// CLAUDE.md) was "suppress when BOTH endpoints are > 1000 NM from the
// plane". This test suite falsified it before it shipped: a CORRECT
// SFO->JFK filing is suppressed at mid-cruise over Nebraska (both
// endpoints ~1100 NM away), and the QXE2316 incident is never caught
// (its wrong endpoints are all within California). The shipped check is
// the ellipse rule instead: a plane flying a route satisfies
// dOrigin + dDest ~= routeLength, so suppress when the sum exceeds
// routeLength * 1.25 + 250 NM. The "fixed-radius breaks long-haul"
// case is kept below as a regression test.
"use strict";

var lib = require("./extract-testable.js").loadTestable();
var routePlausibility = lib.routePlausibility;
var haversineNm = lib.haversineNm;

var failures = 0;
function check(name, cond, detail) {
  if (cond) {
    console.log("  ok  " + name);
  } else {
    failures++;
    console.error("FAIL  " + name + (detail ? " — " + detail : ""));
  }
}
function route(o, d) {
  return {
    state: "ok",
    origin: { lat: o[0], lon: o[1] },
    destination: { lat: d[0], lon: d[1] }
  };
}
function fmt(r) {
  return "reason=" + r.reason +
    " dO=" + Math.round(r.dOriginNm || -1) +
    " dD=" + Math.round(r.dDestNm || -1) +
    " len=" + Math.round(r.routeLenNm || -1) +
    " max=" + Math.round(r.maxSumNm || -1);
}

// Airport coordinates used throughout.
var SJC = [37.3626, -121.929];
var LAX = [33.9416, -118.4085];
var PHL = [39.8744, -75.2424];
var ORD = [41.9742, -87.9073];
var SFO = [37.6188, -122.3754];
var JFK = [40.6413, -73.7781];
var SAN = [32.7338, -117.1933];
var RDM = [44.2541, -121.15];

// ---------------------------------------------------------------------
// Incident 1 — UAL2192, 2026-04-23. N17327 (hex A12710) on approach at
// SFO (350 ft, ~1 NM from center) broadcasting UAL2192; adsbdb returned
// the PHL->ORD filing for that callsign while the aircraft actually flew
// UA822 MEX->SFO (stale filing / stale transponder callsign). A plane at
// SFO is ~2100 NM from PHL and ~1500 NM from ORD; the PHL->ORD route is
// only ~590 NM long. Sum 3600 >> 590*1.25+250: geometrically impossible.
console.log("Incident UAL2192 @ SFO (route PHL->ORD):");
var r1 = routePlausibility(route(PHL, ORD), SFO[0], SFO[1]);
check("suppressed (ok=false)", r1.ok === false, fmt(r1));
check("reason off-ellipse", r1.reason === "off-ellipse", fmt(r1));
check("sum far exceeds allowance",
  r1.dOriginNm + r1.dDestNm > 3 * r1.maxSumNm, fmt(r1));

// ---------------------------------------------------------------------
// Incident 2 — QXE2316, 2026-04-22. App showed SJC->LAX while N628QX
// (hex ae5a1c) flew SAN->RDM. The wrong filing's endpoints are inside
// California, so no plausibility check can catch the whole flight —
// near SAN the plane is genuinely close to LAX, and over the Central
// Valley it is genuinely close to SJC. The ellipse rule catches the
// LATE leg: by RDM the plane is ~415 NM from SJC and ~635 NM from LAX
// against a 268 NM route (allowance ~585 NM). The early leg is
// documented below as NOT detectable by geometry — that class needs the
// route diagnostics (callsign-change log) to diagnose, not geometry.
console.log("Incident QXE2316 (route SJC->LAX, plane on SAN->RDM leg):");
var wrong = route(SJC, LAX);
var atSan = routePlausibility(wrong, SAN[0], SAN[1]);
check("NOT caught at SAN — plane is genuinely near LAX", atSan.ok === true, fmt(atSan));
var atValley = routePlausibility(wrong, 38.5, -121.5);
check("NOT caught over Central Valley — genuinely near SJC", atValley.ok === true, fmt(atValley));
var atRdm = routePlausibility(wrong, RDM[0], RDM[1]);
check("CAUGHT by arrival at RDM", atRdm.ok === false, fmt(atRdm));
check("reason off-ellipse", atRdm.reason === "off-ellipse", fmt(atRdm));
var nearRdm = routePlausibility(wrong, 42.5, -121.4); // ~100 NM south of RDM
check("CAUGHT descending into RDM (~100 NM out)", nearRdm.ok === false, fmt(nearRdm));

// ---------------------------------------------------------------------
// Positive controls — correct filings must never be suppressed.
console.log("Positive controls:");
var good = route(SFO, JFK);
[
  ["at origin SFO", SFO],
  ["mid-cruise over Nebraska", [41.5, -98.0]],
  ["at destination JFK", JFK],
  ["descending ~60 NM from JFK", [40.9, -74.9]]
].forEach(function (pt) {
  var r = routePlausibility(good, pt[1][0], pt[1][1]);
  check("correct SFO->JFK filing ok " + pt[0], r.ok === true, fmt(r));
});

// REGRESSION: the rejected fixed-radius heuristic ("both endpoints
// > 1000 NM away") would suppress a correct long-haul filing at
// mid-cruise. Prove the shipped rule does not share the flaw, and that
// the mid-cruise point really does sit > 1000 NM from both endpoints.
var midNeb = routePlausibility(good, 41.5, -98.0);
check("mid-cruise is >1000 NM from BOTH endpoints (the old rule would suppress)",
  midNeb.dOriginNm > 1000 && midNeb.dDestNm > 1000, fmt(midNeb));
check("ellipse rule keeps it visible", midNeb.ok === true, fmt(midNeb));

// A 200 NM weather deviation off the direct track stays visible.
var deviated = routePlausibility(good, 38.2, -98.0); // well south of the GC track
check("200+ NM weather deviation ok", deviated.ok === true, fmt(deviated));

// Short-hop control: SJC->LAX filing with the plane ON that route.
var shortGood = routePlausibility(wrong, 35.7, -120.2); // roughly mid SJC->LAX
check("correct short-hop filing ok mid-route", shortGood.ok === true, fmt(shortGood));

// Never suppress what we can't check.
var noCoords = { state: "ok", origin: { iata: "???" }, destination: { iata: "???" } };
var rn = routePlausibility(noCoords, SFO[0], SFO[1]);
check("null-coords route passes", rn.ok === true && rn.reason === "no-coords", fmt(rn));
check("missing route passes", routePlausibility(null, SFO[0], SFO[1]).ok === true);
var rp = routePlausibility(good, null, null);
check("missing plane position passes", rp.ok === true && rp.reason === "no-coords", fmt(rp));

// Sanity pin on the distance helper itself.
check("haversine sanity: SFO->JFK ~2240 NM",
  Math.abs(haversineNm(SFO[0], SFO[1], JFK[0], JFK[1]) - 2240) < 40,
  String(haversineNm(SFO[0], SFO[1], JFK[0], JFK[1])));

// ---------------------------------------------------------------------
if (failures) {
  console.error("\n" + failures + " assertion(s) failed");
  process.exit(1);
}
console.log("\nAll route-plausibility assertions passed.");
