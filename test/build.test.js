import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { SEITEN } from "../scripts/seiten.mjs";

const pub = (p) => new URL("../public/" + p, import.meta.url);
execFileSync(process.execPath, [new URL("../scripts/build.mjs", import.meta.url).pathname], { stdio: "ignore" });

test("jede Seite wird gebaut und hat Titel, H1 und Rechner", () => {
  for (const s of SEITEN) {
    const f = pub(s.pfad.slice(1) + "index.html");
    assert.ok(existsSync(f), s.pfad);
    const html = readFileSync(f, "utf8");
    assert.match(html, /<title>[^<]{10,}<\/title>/);
    assert.equal((html.match(/<h1>/g) || []).length, 1, s.pfad);
    assert.match(html, /id="rechner"/);
    assert.ok(s.title.length <= 65, `Titel zu lang: ${s.pfad}`);
  }
});

test("Assets und robots.txt vorhanden", () => {
  for (const p of ["assets/app.js", "assets/core.js", "assets/style.css", "assets/materials.json", "404.html", "robots.txt"]) assert.ok(existsSync(pub(p)), p);
});

test("Standardmaterial jeder Seite existiert", () => {
  const { materials } = JSON.parse(readFileSync(new URL("../data/materials.json", import.meta.url)));
  for (const s of SEITEN) assert.ok(materials.some((m) => m.id === s.material), s.pfad);
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
  const sitemap = readFileSync(pub("sitemap.xml"), "utf8");
  assert.ok((sitemap.match(/<loc>/g) || []).length > 1000);
  const start = readFileSync(pub("index.html"), "utf8");
  assert.match(start, new RegExp(`<link rel="canonical" href="${baseUrl}/">`));
  assert.doesNotMatch(start, /noindex/);
});

test("Imprint und Privacy Policy: vorhanden, verlinkt, noindex, nicht in der Sitemap", () => {
  const { operator } = JSON.parse(readFileSync(new URL("../site.config.json", import.meta.url)));
  for (const p of ["imprint", "privacy"]) {
    const html = readFileSync(pub(`${p}/index.html`), "utf8");
    assert.match(html, /noindex/);
    assert.ok(html.includes(operator.email) && html.includes(operator.name), p);
  }
  assert.match(readFileSync(pub("index.html"), "utf8"), /href="\/imprint\/".*href="\/privacy\/"/s);
  if (existsSync(pub("sitemap.xml"))) assert.doesNotMatch(readFileSync(pub("sitemap.xml"), "utf8"), /imprint|privacy/);
});

test("kein Speichern auf dem Gerät (sonst Einwilligung nach § 25 TDDDG nötig)", () => {
  for (const f of ["app.js", "finder.js"]) assert.doesNotMatch(readFileSync(pub(`assets/${f}`), "utf8"), /localStorage\.|sessionStorage\.|document\.cookie/, f);
});
