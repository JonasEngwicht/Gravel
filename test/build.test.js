import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { SEITEN } from "../scripts/seiten.mjs";

const pub = (p) => new URL("../public/" + p, import.meta.url);
execFileSync(process.execPath, [new URL("../scripts/build.mjs", import.meta.url).pathname], { stdio: "ignore" });

test("jede Seite wird gebaut und hat Titel, H1 und das passende Werkzeug", () => {
  for (const s of SEITEN) {
    const f = pub(s.pfad.slice(1) + "index.html");
    assert.ok(existsSync(f), s.pfad);
    const html = readFileSync(f, "utf8");
    assert.match(html, /<title>[^<]{10,}<\/title>/);
    assert.equal((html.match(/<h1>/g) || []).length, 1, s.pfad);
    if (s.art === "rechner" || s.art === "ratgeber") assert.match(html, /id="rechner"/, s.pfad);
    if (s.art === "umrechner") assert.match(html, /id="umrechner"/, s.pfad);
    assert.ok(s.title.length <= 65, `Titel zu lang: ${s.pfad}`);
    assert.ok(s.description.length <= 165, `Description zu lang: ${s.pfad}`);
  }
});

test("Pfade und Titel der Seiten sind eindeutig", () => {
  assert.equal(new Set(SEITEN.map((s) => s.pfad)).size, SEITEN.length);
  assert.equal(new Set(SEITEN.map((s) => s.title)).size, SEITEN.length);
});

test("Open Graph, FAQ als Überschrift, keine deutschen Sprungmarken", () => {
  for (const p of ["index.html", "mulch-calculator/index.html", "guides/how-many-bags-of-mulch-in-a-yard/index.html", "landscape-supply/nc/apex/index.html"]) {
    const html = readFileSync(pub(p), "utf8");
    assert.match(html, /<meta property="og:title" content="[^"]+">/, p);
    assert.match(html, /<meta property="og:image" content="[^"]+og\.png">/, p);
    assert.doesNotMatch(html, /id="(gruppe-\d|rechner-titel|nachbarn)"/, p);
  }
  assert.match(readFileSync(pub("mulch-calculator/index.html"), "utf8"), /<summary><h3>/);
  assert.ok(existsSync(pub("assets/og.png")));
});

test("Rechenbeispiel stimmt mit core.js überein", () => {
  // 20 × 10 ft bei 3 in = 200 × 0,25 ÷ 27 = 1,85 cu yd
  assert.match(readFileSync(pub("mulch-calculator/index.html"), "utf8"), /<strong>1\.85 cubic yards<\/strong>/);
});

test("verwandte Seiten verweisen auf existierende Seiten", () => {
  const pfade = new Set(SEITEN.map((s) => s.pfad));
  for (const s of SEITEN) for (const v of s.verwandt || []) assert.ok(pfade.has(v), `${s.pfad} → ${v}`);
});

test("Assets und robots.txt vorhanden", () => {
  for (const p of ["assets/app.js", "assets/core.js", "assets/style.css", "assets/materials.json", "404.html", "robots.txt"]) assert.ok(existsSync(pub(p)), p);
});

test("Standardmaterial jeder Rechner- und Ratgeberseite existiert", () => {
  const { materials, projects } = JSON.parse(readFileSync(new URL("../data/materials.json", import.meta.url)));
  for (const s of SEITEN.filter((x) => x.art !== "info")) assert.ok(materials.some((m) => m.id === s.material), s.pfad);
  for (const p of projects) assert.ok(materials.some((m) => m.id === p.material), p.id);
});

test("strukturierte Daten sind gültiges JSON", () => {
  for (const s of SEITEN) {
    const html = readFileSync(pub(s.pfad.slice(1) + "index.html"), "utf8");
    JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  }
});

test("Suchindex für das Verzeichnis passt zu den Seiten", () => {
  const yards = JSON.parse(readFileSync(pub("assets/yards.json"), "utf8"));
  const staedte = JSON.parse(readFileSync(pub("assets/cities.json"), "utf8"));
  assert.ok(yards.length > 1000 && staedte.length > 100);
  for (const y of yards.filter((_, i) => i % 97 === 0)) {
    assert.equal(y.length, 9);
    assert.ok(existsSync(pub(`landscape-supply/${y[6]}index.html`)), y[6]);
  }
  for (const c of staedte.filter((_, i) => i % 53 === 0)) assert.ok(existsSync(pub(`landscape-supply/${c[2]}index.html`)), c[2]);
  assert.ok(existsSync(pub("assets/zip/770.json")));
});

test("mit Domain: Sitemap, robots.txt und Canonicals", () => {
  const { baseUrl } = JSON.parse(readFileSync(new URL("../site.config.json", import.meta.url)));
  if (!baseUrl) return;
  assert.match(readFileSync(pub("robots.txt"), "utf8"), new RegExp(`Sitemap: ${baseUrl}/sitemap.xml`));
  const index = readFileSync(pub("sitemap.xml"), "utf8");
  assert.match(index, /<sitemapindex/);
  const teile = [...index.matchAll(/<loc>[^<]*\/(sitemap-[a-z-]+\.xml)<\/loc>/g)].map((m) => m[1]);
  assert.ok(teile.includes("sitemap-pages.xml") && teile.includes("sitemap-cities.xml"));
  const urls = teile.flatMap((t) => [...readFileSync(pub(t), "utf8").matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]));
  assert.ok(urls.length > 1000);
  // nur indexierbare Seiten in der Sitemap
  for (const u of urls.filter((_, i) => i % 41 === 0)) {
    const html = readFileSync(pub(u.slice(baseUrl.length + 1) + "index.html"), "utf8");
    assert.doesNotMatch(html, /noindex/, u);
  }
  const start = readFileSync(pub("index.html"), "utf8");
  assert.match(start, new RegExp(`<link rel="canonical" href="${baseUrl}/">`));
  assert.doesNotMatch(start, /noindex/);
});
