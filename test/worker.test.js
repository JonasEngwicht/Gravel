import { test } from "node:test";
import assert from "node:assert/strict";
import worker from "../src/worker.js";

const env = { ASSETS: { fetch: async () => new Response("<!doctype html>", { headers: { "Content-Type": "text/html" } }) } };
const hol = (url) => worker.fetch(new Request(url), env);

test("http und www leiten mit einem 301 auf https ohne www um", async () => {
  for (const [von, nach] of [
    ["http://gravelandmulch.com/mulch-calculator/?a=1", "https://gravelandmulch.com/mulch-calculator/?a=1"],
    ["http://www.gravelandmulch.com/", "https://gravelandmulch.com/"],
    ["https://www.gravelandmulch.com/privacy/", "https://gravelandmulch.com/privacy/"],
  ]) {
    const r = await hol(von);
    assert.equal(r.status, 301, von);
    assert.equal(r.headers.get("Location"), nach);
  }
});

test("https: Seite mit HSTS, Zeichensatz und Sicherheitsheadern, ohne noindex", async () => {
  const r = await hol("https://gravelandmulch.com/");
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("Content-Type"), "text/html; charset=utf-8");
  assert.match(r.headers.get("Strict-Transport-Security"), /max-age=31536000/);
  assert.equal(r.headers.get("X-Content-Type-Options"), "nosniff");
  assert.equal(r.headers.get("X-Robots-Tag"), null);
});

test("workers.dev bleibt noindex, localhost wird nicht umgeleitet", async () => {
  assert.match((await hol("https://gravel.example.workers.dev/")).headers.get("X-Robots-Tag"), /noindex/);
  const lokal = await hol("http://localhost:8787/");
  assert.equal(lokal.status, 200);
  assert.equal(lokal.headers.get("Strict-Transport-Security"), null);
});

test("Einwilligung nötig für EU/EWR/UK/CH und unbekanntes Land, nicht für USA", async () => {
  const { brauchtEinwilligung } = await import("../src/worker.js");
  for (const land of ["DE", "FR", "NO", "GB", "CH", undefined]) assert.equal(brauchtEinwilligung(land), true, String(land));
  for (const land of ["US", "CA", "MX"]) assert.equal(brauchtEinwilligung(land), false, land);
});

test("HTML bekommt data-eu je nach Land", async () => {
  const gesetzt = [];
  globalThis.HTMLRewriter = class {
    on(sel, h) { this.h = h; return this; }
    transform(r) { const el = { setAttribute: (k, v) => gesetzt.push([k, v]) }; this.h.element(el); return r; }
  };
  try {
    const hol2 = (land) => worker.fetch(Object.assign(new Request("https://gravelandmulch.com/"), { cf: { country: land } }), env);
    await hol2("US"); await hol2("DE");
    assert.deepEqual(gesetzt, [["data-eu", "0"], ["data-eu", "1"]]);
  } finally { delete globalThis.HTMLRewriter; }
});
