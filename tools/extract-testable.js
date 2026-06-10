// Local-only test helper (never served; see tools/build-airports.js for
// the precedent). Slices the TESTABLE-PURE block out of app.js as text,
// evaluates it, and returns the pure helpers so node tests can exercise
// the exact code the browser runs — no build step, no module system.
"use strict";

var fs = require("fs");
var path = require("path");

var START = "// ==== TESTABLE-PURE-START ====";
var END = "// ==== TESTABLE-PURE-END ====";

function loadTestable() {
  var src = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
  var a = src.indexOf(START);
  var b = src.indexOf(END);
  if (a === -1 || b === -1 || b <= a) {
    throw new Error("TESTABLE-PURE sentinels not found in app.js");
  }
  var block = src.slice(a + START.length, b);
  /* eslint-disable no-new-func */
  var factory = new Function(
    block +
    "\nreturn { NM_TO_KM: NM_TO_KM, num: num, haversineNm: haversineNm," +
    " ROUTE_ELLIPSE_FACTOR: ROUTE_ELLIPSE_FACTOR," +
    " ROUTE_ELLIPSE_SLACK_NM: ROUTE_ELLIPSE_SLACK_NM," +
    " routePlausibility: routePlausibility," +
    " FLIGHT_DEFAULTS: FLIGHT_DEFAULTS," +
    " flightSessionStep: flightSessionStep };"
  );
  return factory();
}

module.exports = { loadTestable: loadTestable };
