import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { area, totalArea, calculate, cost, pickupTrips, coverage, roundUpTo } from "../src/calc/core.js";
import { haversineMi, findYards, medianPrice } from "../src/directory/distance.js";

const { materials } = JSON.parse(readFileSync(new URL("../data/materials.json", import.meta.url)));
const mat = (id) => materials.find((m) => m.id === id);
const close = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);

test("areas", () => {
  assert.equal(area("rectangle", { length: 10, width: 10 }), 100);
  close(area("circle", { diameter: 10 }), Math.PI * 25);
  assert.equal(area("triangle", { base: 10, height: 4 }), 20);
  close(area("ring", { outerDiameter: 6, innerDiameter: 2 }), Math.PI * 8);
  assert.equal(totalArea([
    { shape: "rectangle", dims: { length: 10, width: 5 } },
    { shape: "area", dims: { sqft: 25 } },
  ]), 75);
});

test("mulch rule of thumb: sqft x depth / 324 = cubic yards", () => {
  const r = calculate({ sqft: 324, depthIn: 3, material: mat("hardwood-mulch"), wastePct: 0 });
  close(r.cy, 3);
  close(r.cuFt, 81);
  assert.equal(r.bags, 41); // 81 cu ft / 2 cu ft bags, rounded up
});

test("gravel 10x10 ft at 2 in ≈ 0.62 cy and ≈ 0.86 t", () => {
  const r = calculate({ sqft: 100, depthIn: 2, material: mat("pea-gravel"), wastePct: 0 });
  close(r.cy, 0.617, 0.001);
  close(r.tons, 0.864, 0.001);
  assert.equal(r.orderTons, 1);
});

test("waste buffer is applied", () => {
  const r = calculate({ sqft: 324, depthIn: 3, material: mat("hardwood-mulch") }); // default 10 %
  close(r.cy, 3.3);
});

test("cost bulk vs bags", () => {
  const r = calculate({ sqft: 324, depthIn: 3, material: mat("hardwood-mulch"), wastePct: 0 });
  const c = cost(r, { perCy: 40, perBag: 4, deliveryFee: 75 });
  assert.equal(c.bulkByCy, 3 * 40 + 75);
  assert.equal(c.bags, 41 * 4);
});

test("pickup trips limited by weight for gravel", () => {
  const r = calculate({ sqft: 300, depthIn: 3, material: mat("pea-gravel"), wastePct: 0 });
  // 2.78 cy * 1.4 t = 3.89 t = 7,778 lb -> 6 trips at 1,500 lb
  assert.equal(pickupTrips(r), 6);
});

test("coverage inverse", () => close(coverage({ cy: 1, depthIn: 3 }), 108));
test("roundUpTo", () => {
  assert.equal(roundUpTo(2.01, 0.5), 2.5);
  assert.equal(roundUpTo(2.5, 0.5), 2.5);
});

test("invalid input throws", () => {
  assert.throws(() => calculate({ sqft: 0, depthIn: 3, material: mat("topsoil") }));
});

test("distance Denver -> Boulder ≈ 24 mi", () => {
  const d = haversineMi([39.7392, -104.9903], [40.015, -105.2705]);
  assert.ok(d > 22 && d < 27, `${d}`);
});

test("findYards filters by material, radius and delivery; featured first", () => {
  const base = { status: "active", materials: [{ id: "hardwood-mulch", price: { amount: 30, unit: "cy" } }] };
  const yards = [
    { ...base, id: "near", location: { lat: 39.74, lng: -104.99 }, delivery: { available: true, radius_mi: 10 } },
    { ...base, id: "far", location: { lat: 40.015, lng: -105.27 }, delivery: { available: true, radius_mi: 50 }, listing: { tier: "featured" } },
    { ...base, id: "no-delivery", location: { lat: 39.75, lng: -104.98 }, delivery: { available: false } },
    { ...base, id: "closed", status: "closed", location: { lat: 39.74, lng: -104.99 } },
    { status: "active", id: "no-mulch", materials: [{ id: "pea-gravel" }], location: { lat: 39.74, lng: -104.99 } },
  ];
  const origin = [39.7392, -104.9903];
  const pickup = findYards({ origin, materialId: "hardwood-mulch" }, yards).map((r) => r.yard.id);
  assert.deepEqual(pickup, ["far", "near", "no-delivery"]);
  const delivered = findYards({ origin, materialId: "hardwood-mulch", needsDelivery: true }, yards).map((r) => r.yard.id);
  assert.deepEqual(delivered, ["far", "near"]);
});

test("medianPrice", () => {
  const y = (amount) => ({ materials: [{ id: "topsoil", price: { amount, unit: "cy" } }] });
  assert.equal(medianPrice([y(30), y(50), y(40)], "topsoil", "cy"), 40);
  assert.equal(medianPrice([y(30), y(40)], "topsoil", "cy"), 35);
  assert.equal(medianPrice([], "topsoil", "cy"), null);
});

// ---------- AP6 ----------
import { dumpTruckLoads, bulkVsBags } from "../src/calc/core.js";
const MATS = JSON.parse((await import("node:fs")).readFileSync(new URL("../data/materials.json", import.meta.url))).materials;
const matId = (id) => MATS.find((m) => m.id === id);

test("bestehende Schicht wird abgezogen (Auffrischen)", () => {
  const voll = calculate({ sqft: 200, depthIn: 3, material: matId("hardwood-mulch"), wastePct: 0 });
  const auf = calculate({ sqft: 200, depthIn: 3, existingIn: 1, material: matId("hardwood-mulch"), wastePct: 0 });
  assert.equal(auf.netDepthIn, 2);
  assert.ok(Math.abs(auf.cy - (voll.cy * 2) / 3) < 1e-9);
  assert.throws(() => calculate({ sqft: 200, depthIn: 2, existingIn: 2, material: matId("hardwood-mulch") }));
});

test("Verdichtungszuschlag für Fill Dirt, Crusher Run und Bettungssand", () => {
  for (const [id, pct] of [["fill-dirt", 20], ["crusher-run", 15], ["paver-sand", 10]]) assert.equal(mat(id).compaction_pct, pct, id);
  const r = calculate({ sqft: 324, depthIn: 12, material: matId("fill-dirt") });
  // 324 sq ft × 1 ft = 12 cu yd × 1,05 Abfall × 1,20 Verdichtung
  assert.ok(Math.abs(r.cy - 12 * 1.05 * 1.2) < 1e-9);
  assert.equal(r.compactionPct, 20);
  assert.equal(calculate({ sqft: 324, depthIn: 12, material: matId("fill-dirt"), compactionPct: 0, wastePct: 0 }).cy, 12);
  assert.equal(calculate({ sqft: 100, depthIn: 3, material: matId("hardwood-mulch") }).compactionPct, 0);
});

test("LKW-Ladungen: Gewicht oder Volumen begrenzt", () => {
  assert.equal(dumpTruckLoads({ tons: 28, cy: 20 }), 2);
  assert.equal(dumpTruckLoads({ tons: 6, cy: 20 }), 2); // Mulch: Volumen begrenzt
  assert.equal(dumpTruckLoads({ tons: 14, cy: 10 }), 1);
});

test("Sack vs. lose Ware: Ersparnis", () => {
  assert.deepEqual(bulkVsBags({ bulkByCy: 120, bags: 200 }), { bulk: 120, bags: 200, saving: 80, cheaper: "bulk" });
  assert.equal(bulkVsBags({ bulkByCy: 120 }), null);
  assert.equal(bulkVsBags({ bags: 50, bulkByTon: 90, bulkByCy: 80 }).cheaper, "bags");
});
