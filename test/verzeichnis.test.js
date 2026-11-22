import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { ladeYards, verzeichnisSeiten, slugify, BASIS, befuellt, seiteBefuellt, MIN_STADT } from "../scripts/verzeichnis.mjs";
import { SEITEN } from "../scripts/seiten.mjs";

const YARD_DIR = fileURLToPath(new URL("../data/yards", import.meta.url));
const yards = ladeYards(YARD_DIR);
const MAT = JSON.parse(readFileSync(new URL("../data/materials.json", import.meta.url)));
const matById = Object.fromEntries(MAT.materials.map((m) => [m.id, m]));

// Einfache Helfer statt der echten aus build.mjs: Inhalt egal, Struktur und JSON-LD zählen
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const kopf = (s) => `<head>${s.noindex ? '<meta name="robots" content="noindex, follow">' : ""}<title>${esc(s.title)}</title><script type="application/ld+json">${JSON.stringify(s.ld)}</script></head>`;
const fuss = () => "";
const rechner = () => '<form class="rechner" id="rechner"></form>';
const bauen = (site) => verzeichnisSeiten(ladeYards(YARD_DIR), { kopf, fuss, esc, rechner, matById, SITE: site });

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
  // Übersicht + Staaten + Städte + ein Eintrag pro Yard + Kiesgruben-Übersicht + Kiesgruben je Staat
  const staedte = new Set(yards.map((y) => `${y.address.state}/${slugify(y.address.city)}`));
  const staaten = new Set(yards.map((y) => y.address.state));
  const grubenStaaten = new Set(yards.filter((y) => y.kind === "gravel-pit").map((y) => y.address.state));
  assert.equal(seiten.length, 1 + staaten.size + staedte.size + yards.length + 1 + grubenStaaten.size);
});

test("Cloudflare: weniger als 20.000 Dateien im Build", () => {
  const zips = readdirSync(new URL("../data/zip-centroids", import.meta.url)).length;
  const assets = readdirSync(new URL("../static", import.meta.url)).length + 4 + zips; // + core.js, materials.json, yards.json, cities.json, ZIP-Dateien
  const gesamt = bauen({ baseUrl: null }).length + SEITEN.length + assets + 2; // + 404.html, robots.txt
  assert.ok(gesamt < 19500, `${gesamt} Dateien`);
});

test("nur befüllte Verzeichnisseiten werden indexiert", () => {
  const seiten = bauen({ baseUrl: "https://example.com" });
  const nachPfad = new Map(seiten.map((s) => [s.pfad, s]));
  for (const s of seiten) assert.equal(/noindex/.test(s.html), !s.index, s.pfad);
  // Stadtseiten: mindestens MIN_STADT Einträge mit Telefon oder Website
  const proStadt = new Map();
  for (const y of yards) {
    const p = `${BASIS}${y.address.state.toLowerCase()}/${slugify(y.address.city)}/`;
    proStadt.set(p, (proStadt.get(p) || 0) + (befuellt(y) ? 1 : 0));
  }
  for (const [p, n] of proStadt) assert.equal(nachPfad.get(p).index, n >= MIN_STADT, p);
  // Unternehmensseiten: vollständige Kontaktdaten; Kiesgruben ohne Kontakt nicht
  const eigene = ladeYards(YARD_DIR);
  const mitPfad = new Map(verzeichnisSeiten(eigene, { kopf, fuss, esc, rechner, matById, SITE: { baseUrl: "https://example.com" } }).map((s) => [s.pfad, s]));
  for (const y of eigene) assert.equal(mitPfad.get(y._pfad).index, seiteBefuellt(y), y._pfad);
  assert.ok(yards.some((y) => y.kind === "gravel-pit" && !seiteBefuellt(y)));
  assert.ok(seiten.filter((s) => s.index).length > 1000);
});

test("Kiesgruben: eigene Seiten je Staat, alle mit Typ gravel-pit aus MSHA", () => {
  const gruben = yards.filter((y) => y.kind === "gravel-pit");
  assert.ok(gruben.length > 2000);
  for (const y of gruben) {
    assert.ok(y.source.dataset.startsWith("msha"), y.id);
    assert.ok(["Active", "Intermittent"].includes(y.msha[0].status), y.id);
  }
  const seiten = bauen({ baseUrl: null });
  assert.ok(seiten.some((s) => s.pfad === `${BASIS}gravel-pits/`));
  assert.ok(seiten.some((s) => s.pfad === `${BASIS}tx/gravel-pits/`));
});

test("strukturierte Daten der Verzeichnisseiten sind gültiges JSON", () => {
  const seiten = bauen({ baseUrl: null });
  for (const s of seiten.filter((_, i) => i % 50 === 0)) {
    const ld = JSON.parse(s.html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
    assert.ok(Array.isArray(ld) && ld.length >= 1, s.pfad);
  }
});
