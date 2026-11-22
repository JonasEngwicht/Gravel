import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { ladeYards, verzeichnisSeiten, slugify, BASIS } from "../scripts/verzeichnis.mjs";
import { SEITEN } from "../scripts/seiten.mjs";

const YARD_DIR = fileURLToPath(new URL("../data/yards", import.meta.url));
const yards = ladeYards(YARD_DIR);
const MAT = JSON.parse(readFileSync(new URL("../data/materials.json", import.meta.url)));
const matById = Object.fromEntries(MAT.materials.map((m) => [m.id, m]));

// Einfache Helfer statt der echten aus build.mjs: Inhalt egal, Struktur und JSON-LD zählen
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const kopf = (s) => `<head>${s.noindex ? '<meta name="robots" content="noindex">' : ""}<title>${esc(s.title)}</title><script type="application/ld+json">${JSON.stringify(s.ld)}</script></head>`;
const fuss = () => "";
const rechner = () => '<form class="rechner" id="rechner"></form>';
const SACK = JSON.parse(readFileSync(new URL("../data/bag-prices.json", import.meta.url)));
const bauen = (site) => verzeichnisSeiten(ladeYards(YARD_DIR), { kopf, fuss, esc, rechner, matById, SACK, SITE: site });

test("jeder Yard hat Pflichtfelder, gültigen Slug und eine eindeutige id", () => {
  const ids = new Set();
  for (const y of yards) {
    for (const k of ["id", "slug", "name", "status", "address", "location", "materials", "source"]) assert.ok(k in y, `${y.id}: ${k} fehlt`);
    assert.match(y.slug, /^[a-z0-9-]+$/, y.id);
    assert.match(y.address.state, /^[A-Z]{2}$/, y.id);
    assert.match(y.address.zip, /^[0-9]{5}$/, y.id);
    assert.ok(Number.isFinite(y.location.lat) && Number.isFinite(y.location.lng), y.id);
    assert.ok(!ids.has(y.id), `doppelte id ${y.id}`);
    ids.add(y.id);
  }
  assert.ok(yards.length > 1000);
});

test("Dateiname entspricht der id und liegt im Ordner des Bundesstaats", () => {
  for (const st of readdirSync(YARD_DIR, { withFileTypes: true }).filter((d) => d.isDirectory())) {
    for (const f of readdirSync(`${YARD_DIR}/${st.name}`)) {
      const y = JSON.parse(readFileSync(`${YARD_DIR}/${st.name}/${f}`, "utf8"));
      assert.equal(f, `${y.id}.json`);
      assert.equal(st.name, y.address.state.toLowerCase(), f);
    }
  }
});

test("Beispieldatei mit _ wird nicht veröffentlicht", () => {
  assert.ok(!yards.some((y) => y.id === "co-denver-example-landscape-supply"));
});

test("Verzeichnispfade sind eindeutig und Titel nicht doppelt", () => {
  const seiten = bauen({ baseUrl: null });
  const pfade = new Set(), titel = new Set();
  for (const s of seiten) {
    assert.ok(s.pfad.startsWith(BASIS) && s.pfad.endsWith("/"), s.pfad);
    assert.ok(!pfade.has(s.pfad), `doppelter Pfad ${s.pfad}`);
    pfade.add(s.pfad);
    const t = s.html.match(/<title>(.*?)<\/title>/)[1];
    assert.ok(!titel.has(t), `doppelter Titel ${t}`);
    titel.add(t);
    assert.equal((s.html.match(/<h1>/g) || []).length, 1, s.pfad);
  }
  // Übersicht + Staaten + Städte + ein Eintrag pro Yard
  const staedte = new Set(yards.map((y) => `${y.address.state}/${slugify(y.address.city)}`));
  const staaten = new Set(yards.map((y) => y.address.state));
  assert.equal(seiten.length, 1 + staaten.size + staedte.size + yards.length);
});

test("Cloudflare: weniger als 20.000 Dateien im Build", () => {
  const zips = readdirSync(new URL("../data/zip-centroids", import.meta.url)).length;
  const assets = readdirSync(new URL("../static", import.meta.url)).length + 4 + zips; // + core.js, materials.json, yards.json, cities.json, ZIP-Dateien
  const gesamt = bauen({ baseUrl: null }).length + SEITEN.length + assets + 2; // + 404.html, robots.txt
  assert.ok(gesamt < 19500, `${gesamt} Dateien`);
});

test("alle Verzeichnisseiten sind indexierbar, auch ungeprüfte Einträge", () => {
  const seiten = bauen({ baseUrl: "https://example.com" });
  for (const s of seiten) {
    assert.equal(s.index, true, s.pfad);
    assert.doesNotMatch(s.html, /noindex/, s.pfad);
  }
  assert.ok(yards.some((y) => y.status === "unverified"));
});

test("strukturierte Daten der Verzeichnisseiten sind gültiges JSON", () => {
  const seiten = bauen({ baseUrl: null });
  for (const s of seiten.filter((_, i) => i % 50 === 0)) {
    const ld = JSON.parse(s.html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
    assert.ok(Array.isArray(ld) && ld.length >= 1, s.pfad);
  }
});

test("Sackpreise beziehen sich auf vorhandene Materialien und haben Quellen", () => {
  for (const [id, b] of Object.entries(SACK.materials)) {
    assert.ok(matById[id], id);
    assert.ok(b.bag_cu_ft > 0 && b.regular > 0 && b.sale > 0 && b.sale <= b.regular, id);
    assert.ok(b.sources?.length, id);
  }
});

test("Stadtseiten zeigen den Vergleich lose Ware vs. Sack, Yards mit Preis den Sackvergleich", () => {
  const seiten = bauen({ baseUrl: null });
  const stadt = seiten.find((s) => s.pfad === `${BASIS}ga/atlanta/`);
  assert.match(stadt.html, /Bulk vs\. bagged/);
  assert.match(stadt.html, /Only need a few bags\?/);
  const mitPreis = yards.find((y) => y.materials.some((m) => m.price));
  const seite = seiten.find((s) => s.pfad.endsWith(`/${mitPreis.slug}/`) && s.html.includes(esc(mitPreis.name)));
  assert.match(seite.html, /Compared with bags/);
});
