// Exercises flightSessionStep (the specific-plane tracker's takeoff /
// landing detector) with synthetic traces. Run with:
//   node tools/test-flight-session.js
"use strict";

var lib = require("./extract-testable.js").loadTestable();
var step = lib.flightSessionStep;

var failures = 0;
function check(name, cond, detail) {
  if (cond) {
    console.log("  ok  " + name);
  } else {
    failures++;
    console.error("FAIL  " + name + (detail ? " — " + detail : ""));
  }
}

// Run a trace through the machine, collecting events.
function run(samples, startState) {
  var st = startState || null;
  var events = [];
  samples.forEach(function (s) {
    var r = step(st, s);
    st = r.next;
    if (r.event) events.push(r.event);
  });
  return { state: st, events: events };
}
// Sample shorthand: [tMin, gsKt, altFt, onGround]
function s(tMin, gs, alt, ground) {
  return { t: tMin * 60000, lat: 37 + tMin * 0.01, lon: -122, gsKt: gs, altFt: alt, vertRate: null, onGround: !!ground };
}

// ---------------------------------------------------------------------
console.log("Clean takeoff roll -> climb:");
var to = run([
  s(0, 0, 0, true),    // parked
  s(1, 12, 0, true),   // taxi
  s(2, 65, 100, false),// rotation — first qualifying sample
  s(3, 90, 600, false),// confirm
  s(4, 110, 1500, false)
]);
check("exactly one event", to.events.length === 1, JSON.stringify(to.events));
check("it is a takeoff", to.events[0] && to.events[0].type === "takeoff");
check("stamped at the FIRST airborne sample (t=2min)",
  to.events[0] && to.events[0].t === 2 * 60000, String(to.events[0] && to.events[0].t));
check("ends airborne", to.state.phase === "airborne");

console.log("Landing with one spurious onGround bounce:");
var land = run([
  s(0, 120, 3000, false),
  s(1, 100, 1500, false),
  s(2, 70, 300, false),
  s(3, 55, 50, true),    // touchdown — first qualifying sample
  s(4, 80, 200, false),  // bogus bounce record (debounce must absorb... )
  s(5, 30, 0, true),
  s(6, 8, 0, true)
], { phase: "airborne", count: 0, pending: null });
check("exactly one landing", land.events.length === 1 &&
  land.events[0].type === "landing", JSON.stringify(land.events));
check("ends on ground", land.state.phase === "ground");

console.log("Touch-and-go produces two full cycles:");
var tng = run([
  s(0, 0, 0, true),
  s(1, 70, 100, false), s(2, 90, 500, false),   // takeoff #1
  s(3, 60, 100, false),
  s(4, 40, 0, true), s(5, 35, 0, true),          // landing #1
  s(6, 70, 100, false), s(7, 95, 600, false),    // takeoff #2
  s(8, 100, 1200, false),
  s(9, 40, 0, true), s(10, 10, 0, true)          // landing #2
]);
var kinds = tng.events.map(function (e) { return e.type; }).join(",");
check("takeoff,landing,takeoff,landing", kinds === "takeoff,landing,takeoff,landing", kinds);

console.log("Mid-flight data gap causes no spurious events:");
var gap = run([
  s(0, 200, 8000, false),
  s(45, 190, 9000, false),  // 45-min gap, still airborne
  s(46, 195, 9000, false)
], { phase: "airborne", count: 0, pending: null });
check("no events across the gap", gap.events.length === 0, JSON.stringify(gap.events));
check("still airborne", gap.state.phase === "airborne");

console.log("Ground taxi at 30 kt never takes off:");
var taxi = run([
  s(0, 0, 0, true), s(1, 30, 0, true), s(2, 30, 0, false), s(3, 25, 0, true)
]);
check("no events", taxi.events.length === 0, JSON.stringify(taxi.events));
check("stays ground", taxi.state.phase === "ground");

console.log("Single bad airborne record on the ground is debounced:");
var blip = run([
  s(0, 0, 0, true),
  s(1, 80, 500, false),  // one bad record
  s(2, 0, 0, true),
  s(3, 0, 0, true)
]);
check("no takeoff from a one-sample blip", blip.events.length === 0, JSON.stringify(blip.events));

console.log("First-ever sight mid-flight emits in-air (origin unknown):");
var mid = run([s(0, 240, 11000, false), s(1, 240, 11000, false)]);
check("one in-air event", mid.events.length === 1 && mid.events[0].type === "in-air",
  JSON.stringify(mid.events));
check("then airborne with no extra events", mid.state.phase === "airborne");

console.log("First-ever sight on the ground emits nothing:");
var fg = run([s(0, 0, 0, true)]);
check("no event", fg.events.length === 0);
check("ground phase", fg.state.phase === "ground");

// ---------------------------------------------------------------------
if (failures) {
  console.error("\n" + failures + " assertion(s) failed");
  process.exit(1);
}
console.log("\nAll flight-session assertions passed.");
