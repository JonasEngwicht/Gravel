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
