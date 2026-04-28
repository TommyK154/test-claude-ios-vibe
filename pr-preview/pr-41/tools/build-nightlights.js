#!/usr/bin/env node
//
// tools/build-nightlights.js — regenerate the bundled `nightlights.js`
// from Natural Earth's public-domain Cultural vector dataset
// (https://www.naturalearthdata.com/, public domain). Run locally;
// commit the regenerated nightlights.js. NOT executed at deploy time —
// GitHub Pages serves the committed file as-is.
//
// Inputs (download with curl before running, or pass paths):
//   1. https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_urban_areas.geojson
//   2. https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_populated_places_simple.geojson
//
// Output: ../nightlights.js next to this script's parent (the repo root).
//
// Output schema:
//   window.NIGHT_LIGHTS = {
//     urban: [
//       { b:[minLon,minLat,maxLon,maxLat], r:[[lon,lat],[lon,lat],...] },
//       ...
//     ],
//     cities: [
//       [lon, lat, popK],   // popK = Math.round(pop_max / 1000)
//       ...
//     ]
//   };
//
// Coordinate precision: 2 decimals (~1.1 km at the equator). Urban polygons
// are rendered as low-opacity warm fills, not crisp outlines, so 1 km is
// already over-resolution. City lights are rendered as radial gradients
// whose softening blur is bigger than 1 km at any practical radar zoom.
//
// Usage:
//   node tools/build-nightlights.js \
//     [urban_areas.geojson] [populated_places_simple.geojson] [output path]
//
//   defaults:
//     urban  → /tmp/ne/urban_areas.geojson
//     places → /tmp/ne/places.geojson
//     output → ./nightlights.js

"use strict";

var fs = require("fs");
var path = require("path");

var argv = process.argv.slice(2);
var urbanPath  = argv[0] || "/tmp/ne/urban_areas.geojson";
var placesPath = argv[1] || "/tmp/ne/places.geojson";
var outputPath = argv[2] || path.resolve(__dirname, "..", "nightlights.js");

function round2(n) { return Math.round(n * 100) / 100; }

// Douglas-Peucker simplification on a ring. epsilon in degrees.
// Keeps the shape's silhouette (the part that matters for a soft warm fill)
// while collapsing micro-jitter that would otherwise dominate the file size.
function dpSimplify(points, eps) {
  if (points.length < 4) return points;
  var keep = new Uint8Array(points.length);
  keep[0] = 1; keep[points.length - 1] = 1;
  var stack = [[0, points.length - 1]];
  var eps2 = eps * eps;
  while (stack.length) {
    var seg = stack.pop();
    var s = seg[0], e = seg[1];
    var ax = points[s][0], ay = points[s][1];
    var bx = points[e][0], by = points[e][1];
    var dx = bx - ax, dy = by - ay;
    var den = dx * dx + dy * dy;
    var maxD = -1, idx = -1;
    for (var i = s + 1; i < e; i++) {
      var px = points[i][0], py = points[i][1];
      var num;
      if (den === 0) {
        var ex = px - ax, ey = py - ay;
        num = ex * ex + ey * ey;
      } else {
        var cross = dx * (py - ay) - dy * (px - ax);
        num = cross * cross / den;
      }
      if (num > maxD) { maxD = num; idx = i; }
    }
    if (maxD > eps2) {
      keep[idx] = 1;
      stack.push([s, idx]);
      stack.push([idx, e]);
    }
  }
  var out = [];
  for (var k = 0; k < points.length; k++) if (keep[k]) out.push(points[k]);
  return out;
}

// Outer ring only. Holes (lakes inside cities, etc.) are dropped — we render
// these as low-opacity warm fills, holes don't read at this opacity.
function processPolygonRing(ring) {
  // Pass 1: round each [lon, lat] to 2 decimals, drop consecutive duplicates.
  var rounded = [];
  var lastLon = null, lastLat = null;
  for (var i = 0; i < ring.length; i++) {
    var lon = round2(ring[i][0]);
    var lat = round2(ring[i][1]);
    if (lon === lastLon && lat === lastLat) continue;
    rounded.push([lon, lat]);
    lastLon = lon; lastLat = lat;
  }
  if (rounded.length < 3) return null;
  // Pass 2: Douglas-Peucker. eps = 0.015° ≈ 1.6 km — invisible at the
  // opacity we render these. Cuts the post-round point count by roughly 5×.
  var out = dpSimplify(rounded, 0.015);
  // A polygon needs at least 3 distinct points; otherwise drop it.
  if (out.length < 3) return null;
  // Compute axis-aligned bounding box for the renderer's bbox-cull pass.
  var minLon = out[0][0], maxLon = out[0][0];
  var minLat = out[0][1], maxLat = out[0][1];
  for (var k = 1; k < out.length; k++) {
    if (out[k][0] < minLon) minLon = out[k][0];
    else if (out[k][0] > maxLon) maxLon = out[k][0];
    if (out[k][1] < minLat) minLat = out[k][1];
    else if (out[k][1] > maxLat) maxLat = out[k][1];
  }
  return { b: [minLon, minLat, maxLon, maxLat], r: out };
}

function extractRings(feature) {
  var g = feature.geometry;
  if (!g) return [];
  if (g.type === "Polygon") {
    if (!g.coordinates || !g.coordinates[0]) return [];
    var p = processPolygonRing(g.coordinates[0]);
    return p ? [p] : [];
  }
  if (g.type === "MultiPolygon") {
    var out = [];
    for (var i = 0; i < g.coordinates.length; i++) {
      if (!g.coordinates[i] || !g.coordinates[i][0]) continue;
      var pp = processPolygonRing(g.coordinates[i][0]);
      if (pp) out.push(pp);
    }
    return out;
  }
  return [];
}

function main() {
  var urbanRaw  = fs.readFileSync(urbanPath, "utf8");
  var placesRaw = fs.readFileSync(placesPath, "utf8");

  var urban = JSON.parse(urbanRaw);
  var places = JSON.parse(placesRaw);

  // ------- urban polygons -------
  // Drop tiny urban patches (< 5 sqkm). At a typical 50 NM radar range a 5
  // sqkm patch is 0.05% of the visible area — well below the threshold
  // where a low-opacity warm fill would read as anything beyond noise.
  var AREA_FLOOR_SQKM = 5;
  var rings = [];
  var inputPoly = 0, droppedByArea = 0, outputPoly = 0;
  for (var i = 0; i < urban.features.length; i++) {
    inputPoly++;
    var feat = urban.features[i];
    var area = feat.properties && feat.properties.area_sqkm;
    if (typeof area === "number" && area < AREA_FLOOR_SQKM) { droppedByArea++; continue; }
    var rs = extractRings(feat);
    for (var k = 0; k < rs.length; k++) rings.push(rs[k]);
  }
  outputPoly = rings.length;

  // ------- populated places -------
  // Keep only meaningful population centers. pop_max < 50K is below the
  // threshold where a single point glow reads as a light at radar zoom —
  // most of those are villages and would be invisible regardless.
  var POP_FLOOR = 50000;
  var cities = [];
  for (var j = 0; j < places.features.length; j++) {
    var pf = places.features[j];
    var prop = pf.properties || {};
    var pop = prop.pop_max;
    if (typeof pop !== "number" || !isFinite(pop) || pop < POP_FLOOR) continue;
    var lon, lat;
    if (typeof prop.longitude === "number" && typeof prop.latitude === "number") {
      lon = prop.longitude;
      lat = prop.latitude;
    } else if (pf.geometry && pf.geometry.type === "Point" && pf.geometry.coordinates) {
      lon = pf.geometry.coordinates[0];
      lat = pf.geometry.coordinates[1];
    } else continue;
    if (!isFinite(lon) || !isFinite(lat)) continue;
    cities.push([round2(lon), round2(lat), Math.round(pop / 1000)]);
  }

  // Sort by population descending so the renderer can early-exit at small
  // pop floors when zoomed wide (tiny cities don't show on a 500 NM range).
  cities.sort(function (a, b) { return b[2] - a[2]; });

  // ------- emit -------
  var generatedAt = new Date().toISOString().slice(0, 10);
  var lines = [];
  lines.push("// Night-lights dataset generated from Natural Earth (https://www.naturalearthdata.com/).");
  lines.push("// License: public domain (no attribution required).");
  lines.push("// Regenerated " + generatedAt + " by tools/build-nightlights.js.");
  lines.push("// Loaded lazily by app.js when the user enables the night overlay.");
  lines.push("// urban: [{ b:[minLon,minLat,maxLon,maxLat], r:[[lon,lat],...] }, ...]  ~" + outputPoly + " polygons");
  lines.push("// cities: [[lon, lat, popK], ...] sorted desc by popK  ~" + cities.length + " cities");
  lines.push("// Coords rounded to 2 decimals (~1.1 km).");
  lines.push("window.NIGHT_LIGHTS = {");

  // Urban polygons.
  lines.push("urban:[");
  for (var u = 0; u < rings.length; u++) {
    var ring = rings[u];
    var coordsStr = "[";
    for (var v = 0; v < ring.r.length; v++) {
      if (v) coordsStr += ",";
      coordsStr += "[" + ring.r[v][0] + "," + ring.r[v][1] + "]";
    }
    coordsStr += "]";
    var bbStr = "[" + ring.b[0] + "," + ring.b[1] + "," + ring.b[2] + "," + ring.b[3] + "]";
    var sep = u === rings.length - 1 ? "" : ",";
    lines.push("{b:" + bbStr + ",r:" + coordsStr + "}" + sep);
  }
  lines.push("],");

  // Cities.
  lines.push("cities:[");
  for (var c = 0; c < cities.length; c++) {
    var sep2 = c === cities.length - 1 ? "" : ",";
    lines.push("[" + cities[c][0] + "," + cities[c][1] + "," + cities[c][2] + "]" + sep2);
  }
  lines.push("]");
  lines.push("};");
  lines.push("try { window.dispatchEvent(new Event(\"nightlights-loaded\")); } catch (e) {}");
  lines.push("");

  fs.writeFileSync(outputPath, lines.join("\n"));

  process.stderr.write(
    "Wrote " + outputPath + "\n" +
    "  urban polygons input:    " + inputPoly + "\n" +
    "  dropped (area < " + AREA_FLOOR_SQKM + " sqkm): " + droppedByArea + "\n" +
    "  urban polygons output:   " + outputPoly + "\n" +
    "  cities (pop>=" + POP_FLOOR + "):    " + cities.length + "\n" +
    "  size:                    " + (fs.statSync(outputPath).size / (1024 * 1024)).toFixed(2) + " MB\n"
  );
}

main();
