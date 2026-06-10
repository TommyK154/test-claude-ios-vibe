#!/usr/bin/env node
//
// tools/build-airports.js — regenerate the bundled `airports.js` from the
// OurAirports public-domain dataset (https://ourairports.com/data/, license
// Unlicense). Run locally; commit the regenerated airports.js. NOT executed
// at deploy time — GitHub Pages serves the committed file as-is.
//
// Inputs (download to ./tmp/ourairports/ before running, or pass paths):
//   1. https://raw.githubusercontent.com/davidmegginson/ourairports-data/main/airports.csv
//   2. https://raw.githubusercontent.com/davidmegginson/ourairports-data/main/countries.csv
//
// Output: ../airports.js next to this script's parent (the repo root).
//
// Schema preservation: the output's row format is identical to the existing
// `[iata, icao, name, city, country, lat, lon]` so app.js's getAirports()
// (the consumer at app.js search & nearestAirport call sites) doesn't need
// to change. Coordinates are rounded to 4 decimals (~10 m at the equator).
//
// Usage:
//   node tools/build-airports.js \
//     [airports.csv path] [countries.csv path] [output airports.js path]
//
//   defaults:
//     airports.csv  → /tmp/ourairports/airports.csv
//     countries.csv → /tmp/ourairports/countries.csv
//     output        → ./airports.js

"use strict";

var fs = require("fs");
var path = require("path");

var argv = process.argv.slice(2);
var airportsCsv  = argv[0] || "/tmp/ourairports/airports.csv";
var countriesCsv = argv[1] || "/tmp/ourairports/countries.csv";
var outputPath   = argv[2] || path.resolve(__dirname, "..", "airports.js");

// --- minimal RFC-4180 CSV parser (returns rows of string[]) ---------------
// Handles quoted fields, escaped quotes (""), embedded commas, and CRLF.
function parseCsv(text) {
  var rows = [];
  var row = [];
  var field = "";
  var inQuotes = false;
  for (var i = 0; i < text.length; i++) {
    var c = text.charCodeAt(i);
    if (inQuotes) {
      if (c === 34 /* " */) {
        if (i + 1 < text.length && text.charCodeAt(i + 1) === 34) {
          field += "\"";
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += text[i];
      }
    } else {
      if (c === 34) inQuotes = true;
      else if (c === 44 /* , */) { row.push(field); field = ""; }
      else if (c === 13 /* \r */) { /* swallow */ }
      else if (c === 10 /* \n */) {
        row.push(field); field = "";
        rows.push(row); row = [];
      } else field += text[i];
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  // strip trailing empty row from final newline
  if (rows.length && rows[rows.length - 1].length === 1 && rows[rows.length - 1][0] === "") {
    rows.pop();
  }
  return rows;
}

function csvToObjects(text) {
  var rows = parseCsv(text);
  if (!rows.length) return [];
  var header = rows[0];
  var out = new Array(rows.length - 1);
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    var obj = {};
    for (var j = 0; j < header.length; j++) obj[header[j]] = r[j] != null ? r[j] : "";
    out[i - 1] = obj;
  }
  return out;
}

// --- helpers --------------------------------------------------------------
function round4(n) {
  // Round to 4 decimals; keep sign. Trims to 10 m precision.
  return Math.round(n * 10000) / 10000;
}

function jsString(s) {
  // JSON.stringify handles all escape sequences we need (including non-ASCII
  // city / airport names). Output is double-quoted JSON string.
  return JSON.stringify(s);
}

// --- main -----------------------------------------------------------------
function main() {
  var airportsRaw  = fs.readFileSync(airportsCsv, "utf8");
  var countriesRaw = fs.readFileSync(countriesCsv, "utf8");

  var countries = csvToObjects(countriesRaw);
  var countryByCode = Object.create(null);
  for (var i = 0; i < countries.length; i++) {
    var c = countries[i];
    if (c.code) countryByCode[c.code] = c.name || c.code;
  }

  var airports = csvToObjects(airportsRaw);

  // Importance order so search-bucket iteration surfaces commercial /
  // larger fields before tiny GA strips. Without this, a query like
  // "RIO" would hit "Las Vegas Airport in Rio Dulce, Guatemala" before
  // any Rio de Janeiro airport, simply because the alphabetical-ICAO
  // sort puts MGRD ahead of SBGL.
  var TYPE_RANK = {
    "large_airport":  0,
    "medium_airport": 1,
    "small_airport":  2,
    "seaplane_base":  3,
    "heliport":       4,
    "balloonport":    5
  };

  // Pattern that recognizes 3-4 character alphanumeric airport identifiers
  // we'd accept as the "icao slot" when icao_code is empty. Catches K-prefix
  // US idents like KCMA, KO22, KSZP whose icao_code field in OurAirports is
  // empty but whose ident is what users actually type.
  var IDENT_AS_ICAO_RE = /^[A-Z0-9]{3,4}$/;

  var rows = [];
  var skipped = { closed: 0, badCoord: 0, nullIsland: 0 };
  for (var k = 0; k < airports.length; k++) {
    var a = airports[k];
    if (a.type === "closed") { skipped.closed++; continue; }

    var lat = parseFloat(a.latitude_deg);
    var lon = parseFloat(a.longitude_deg);
    if (!isFinite(lat) || !isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
      skipped.badCoord++; continue;
    }
    if (lat === 0 && lon === 0) { skipped.nullIsland++; continue; }

    var iata    = (a.iata_code  || "").trim();
    var icao    = (a.icao_code  || "").trim();
    if (!icao && a.ident && IDENT_AS_ICAO_RE.test(a.ident)) icao = a.ident;
    var name    = (a.name       || "").trim();
    var city    = (a.municipality || "").trim();
    var country = countryByCode[a.iso_country] || a.iso_country || "";

    var rank = TYPE_RANK[a.type];
    if (rank == null) rank = 6;

    rows.push({
      iata: iata, icao: icao, name: name, city: city, country: country,
      lat: round4(lat), lon: round4(lon), rank: rank
    });
  }

  // Sort by importance, then by primary identifier (ICAO preferred), then
  // by name as a deterministic tie-breaker. Importance-first sort means
  // search-bucket iteration order naturally puts major airports ahead of
  // small ones for prefix / substring matches.
  rows.sort(function (a, b) {
    if (a.rank !== b.rank) return a.rank - b.rank;
    var ai = a.icao || "", bi = b.icao || "";
    if (ai && bi) return ai.localeCompare(bi);
    if (ai && !bi) return -1;
    if (!ai && bi) return 1;
    var aa = a.iata || "", bb = b.iata || "";
    if (aa && bb) return aa.localeCompare(bb);
    if (aa && !bb) return -1;
    if (!aa && bb) return 1;
    return (a.name || "").localeCompare(b.name || "");
  });

  var generatedAt = new Date().toISOString().slice(0, 10);
  var lines = [];
  lines.push("// Airport dataset generated from OurAirports (https://ourairports.com/data/).");
  lines.push("// License: Unlicense (public domain).");
  lines.push("// Regenerated " + generatedAt + " by tools/build-airports.js.");
  lines.push("// Loaded async via a separate <script> tag; app.js reads window.__airports");
  lines.push("// and falls back to its inline AIRPORTS_FALLBACK list until this file lands.");
  lines.push("// Row format: [IATA, ICAO, Name, City, Country, Lat, Lon]. Coords ~10 m precision.");
  lines.push("// Closed airports excluded; small-field US GA included.");
  lines.push("// To regenerate, see HANDOFF.md §6 “Airports dataset regeneration”.");
  lines.push("window.__airports = [");
  for (var r = 0; r < rows.length; r++) {
    var row = rows[r];
    var sep = r === rows.length - 1 ? "" : ",";
    lines.push(
      "[" +
        jsString(row.iata) + "," +
        jsString(row.icao) + "," +
        jsString(row.name) + "," +
        jsString(row.city) + "," +
        jsString(row.country) + "," +
        row.lat + "," +
        row.lon +
      "]" + sep
    );
  }
  lines.push("];");
  lines.push("try { window.dispatchEvent(new Event(\"airports-loaded\")); } catch (e) {}");
  lines.push(""); // trailing newline

  fs.writeFileSync(outputPath, lines.join("\n"));

  process.stderr.write(
    "Wrote " + outputPath + "\n" +
    "  rows kept:    " + rows.length + "\n" +
    "  closed skipped: " + skipped.closed + "\n" +
    "  bad coords:   " + skipped.badCoord + "\n" +
    "  null island:  " + skipped.nullIsland + "\n" +
    "  size:         " + (fs.statSync(outputPath).size / (1024 * 1024)).toFixed(2) + " MB\n"
  );
}

main();
