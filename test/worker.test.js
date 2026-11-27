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

test("IndexNow meldet nur neue und geänderte URLs und merkt sich den Stand", async () => {
  const { indexNowMelden } = await import("../src/worker.js");
  const liste = { baseUrl: "https://gravelandmulch.com", key: "abc123", urls: { "https://gravelandmulch.com/": "h1", "https://gravelandmulch.com/a/": "h2" } };
  const kv = new Map();
  const env = {
    ASSETS: { fetch: async () => new Response(JSON.stringify(liste)) },
    INDEXNOW: { get: async (k) => (kv.has(k) ? JSON.parse(kv.get(k)) : null), put: async (k, v) => kv.set(k, v) },
  };
  const anfragen = [];
  const holen = async (url, init) => { anfragen.push([url, JSON.parse(init.body)]); return new Response("", { status: 202 }); };

  assert.deepEqual(await indexNowMelden(env, holen), { gemeldet: 2 });
  assert.equal(anfragen[0][0], "https://api.indexnow.org/indexnow");
  assert.deepEqual(anfragen[0][1], { host: "gravelandmulch.com", key: "abc123", keyLocation: "https://gravelandmulch.com/abc123.txt", urlList: Object.keys(liste.urls) });

  assert.deepEqual(await indexNowMelden(env, holen), { gemeldet: 0 });
  assert.equal(anfragen.length, 1);

  liste.urls["https://gravelandmulch.com/a/"] = "h3";
  assert.deepEqual(await indexNowMelden(env, holen), { gemeldet: 1 });
  assert.deepEqual(anfragen[1][1].urlList, ["https://gravelandmulch.com/a/"]);
});

test("IndexNow speichert bei Fehler nichts, damit der nächste Lauf es erneut versucht", async () => {
  const { indexNowMelden } = await import("../src/worker.js");
  const kv = new Map();
  const env = {
    ASSETS: { fetch: async () => new Response(JSON.stringify({ baseUrl: "https://gravelandmulch.com", key: "k", urls: { "https://gravelandmulch.com/": "h" } })) },
    INDEXNOW: { get: async () => null, put: async (k, v) => kv.set(k, v) },
  };
  await assert.rejects(indexNowMelden(env, async () => new Response("bad key", { status: 403 })), /403/);
  assert.equal(kv.size, 0);
});

test("Seiten ohne Schrägstrich am Ende: 301 auf die Variante mit Schrägstrich, Dateien nicht", async () => {
  const r = await hol("https://gravelandmulch.com/mulch-calculator?m=x");
  assert.equal(r.status, 301);
  assert.equal(r.headers.get("Location"), "https://gravelandmulch.com/mulch-calculator/?m=x");
  // www + fehlender Schrägstrich: ein einziger Sprung
  const w = await hol("http://www.gravelandmulch.com/mulch-calculator");
  assert.equal(w.status, 301);
  assert.equal(w.headers.get("Location"), "https://gravelandmulch.com/mulch-calculator/");
  assert.equal((await hol("https://gravelandmulch.com/assets/app.js")).status, 200);
  assert.equal((await hol("https://gravelandmulch.com/sitemap.xml")).status, 200);
});

test("Cache: Dateien mit Build-Version ein Jahr, Schrift und Bilder eine Woche, HTML und Daten ohne feste Dauer", async () => {
  const asset = { ASSETS: { fetch: async () => new Response("x", { headers: { "Content-Type": "text/css" } }) } };
  const kopf = async (url, e = asset) => (await worker.fetch(new Request(url), e)).headers.get("Cache-Control");
  assert.equal(await kopf("https://gravelandmulch.com/assets/style.css?v=202611280000"), "public, max-age=31536000, immutable");
  assert.equal(await kopf("https://gravelandmulch.com/assets/app.js?v=202611280000"), "public, max-age=31536000, immutable");
  assert.equal(await kopf("https://gravelandmulch.com/assets/schichten.svg"), "public, max-age=604800");
  assert.equal(await kopf("https://gravelandmulch.com/assets/bitter-700.woff"), "public, max-age=604800");
  assert.equal(await kopf("https://gravelandmulch.com/assets/core.js"), null);
  assert.equal(await kopf("https://gravelandmulch.com/assets/materials.json"), null);
  assert.equal(await kopf("https://gravelandmulch.com/mulch-calculator/", env), null);
  // Fehlerseiten nie lange cachen
  const fehlt = { ASSETS: { fetch: async () => new Response("nope", { status: 404 }) } };
  assert.equal(await kopf("https://gravelandmulch.com/assets/weg.css?v=1", fehlt), null);
});
