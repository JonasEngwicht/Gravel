import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { extrahieren, oeffnungszeiten, preise, anwenden } from "../scripts/anreicherung.mjs";
import { ladeYards, verzeichnisSeiten, BASIS, seiteBefuellt } from "../scripts/verzeichnis.mjs";

const YARD_DIR = fileURLToPath(new URL("../data/yards", import.meta.url));
const MAT = JSON.parse(readFileSync(new URL("../data/materials.json", import.meta.url)));
const matById = Object.fromEntries(MAT.materials.map((m) => [m.id, m]));
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const kopf = (s) => `<head>${s.noindex ? '<meta name="robots" content="noindex, follow">' : ""}<title>${esc(s.title)}</title><script type="application/ld+json">${JSON.stringify([...s.ld, ...(s.faq?.length ? [{ "@type": "FAQPage" }] : [])])}</script></head>`;
const h = { kopf, fuss: () => "", esc, rechner: () => '<form class="rechner"></form>', matById, SITE: { baseUrl: "https://example.com" } };

const seite = (markdown, url = "https://yard.example/") => ({ url, markdown, fetched_at: "2026-11-26T10:00:00Z" });

test("Extraktion: Materialien, Lieferung, Abholung, Öffentlichkeit – nur was dasteht", () => {
  const r = extrahieren([
    seite("# Products\nWe sell **bulk mulch**, pea gravel, river rock and screened topsoil by the cubic yard. Bagged mulch also available."),
    seite("## Delivery\nWe deliver within 25 miles. Homeowners welcome! Bring your truck or trailer and we'll load it.", "https://yard.example/delivery"),
  ]);
  assert.deepEqual(r.sortiment, ["mulch", "gravel", "river-rock", "pea-gravel", "topsoil"]);
  assert.equal(r.bulk, true);
  assert.equal(r.bagged, true);
  assert.equal(r.delivery, true);
  assert.equal(r.pickup, true);
  assert.equal(r.sells_to_public, true);
  assert.equal(r.quellen.delivery.url, "https://yard.example/delivery");
  assert.equal(r.quellen.sortiment.checked_at, "2026-11-26");
  const leer = extrahieren([seite("Welcome to our family business since 1985. Call us today!")]);
  assert.deepEqual(Object.keys(leer), ["quellen"]);
  assert.equal(extrahieren([seite("Sorry, we do not deliver. Pick-up only.")]).delivery, false);
  assert.equal(extrahieren([seite("Wholesale only – contractors only.")]).sells_to_public, false);
});

test("Öffnungszeiten und Preise", () => {
  assert.deepEqual(oeffnungszeiten("Hours: Monday - Friday 7:00 AM - 5:00 PM, Saturday 8am-2pm, Sunday: Closed"), {
    mon: "07:00-17:00", tue: "07:00-17:00", wed: "07:00-17:00", thu: "07:00-17:00", fri: "07:00-17:00", sat: "08:00-14:00", sun: "closed" });
  assert.equal(oeffnungszeiten("Open Monday 7am-5pm"), null);
  assert.deepEqual(preise("Hardwood mulch $32/yard. Pea gravel – $48 per ton. Delivery $75."), [
    { material: "mulch", amount: 32, unit: "cy" }, { material: "pea-gravel", amount: 48, unit: "ton" }]);
});

test("Anzeige: Firmen-, Stadt- und Material-Seiten mit angereicherten Daten", () => {
  const yards = ladeYards(YARD_DIR, { anreicherung: { yards: {} } });
  const katy = yards.filter((y) => y.address.state === "TX" && y.address.city === "Katy" && y.kind !== "gravel-pit" && y.address.street).slice(0, 4);
  assert.ok(katy.length >= 3);
  const daten = { yards: Object.fromEntries(katy.map((y, i) => [y.id, {
    sortiment: i === 3 ? ["sand"] : ["mulch", "gravel", "topsoil"], bulk: true, delivery: i < 2, hours: { mon: "07:00-17:00", tue: "07:00-17:00" },
    price_examples: i === 0 ? [{ material: "mulch", amount: 32, unit: "cy" }] : undefined,
    quellen: { sortiment: { url: "https://yard.example/products", checked_at: "2026-11-26" }, price_examples: { url: "https://yard.example/prices", checked_at: "2026-11-26" } } }])) };
  anwenden(yards, daten);
  assert.ok(katy.every((y) => seiteBefuellt(y)), "angereicherte Firmenseiten werden indexierbar");
  const seiten = verzeichnisSeiten(yards, h);
  const nach = new Map(seiten.map((s) => [s.pfad, s]));
  const firma = nach.get(katy[0]._pfad);
  assert.ok(firma.index);
  assert.match(firma.html, /<h3>Materials<\/h3><ul class="chips"><li>Mulch<\/li><li>Gravel<\/li><li>Topsoil<\/li>/);
  assert.match(firma.html, /According to its website, it sells mulch, gravel and topsoil in bulk and delivers\./);
  assert.match(firma.html, /Mulch: \$32 per cubic yard/);
  const ld = JSON.parse(firma.html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]).find((x) => x["@type"] === "HomeAndConstructionBusiness");
  assert.equal(ld.hasOfferCatalog.itemListElement.length, 3);
  assert.equal(ld.openingHoursSpecification[0].opens, "07:00");
  assert.equal(ld.makesOffer[0].priceSpecification.price, 32);
  const stadt = nach.get(`${BASIS}tx/katy/`);
  assert.match(stadt.html, /data-chips/);
  assert.match(stadt.html, /whose websites we checked, 3 sell mulch, 3 sell gravel or stone, 3 sell topsoil and 2 deliver\./);
  assert.match(stadt.html, /Where can I buy bulk mulch in Katy\?/);
  assert.match(stadt.html, /Who delivers gravel in Katy\?/);
  assert.match(stadt.html, /data-m="mulch gravel topsoil delivery"/);
  assert.match(stadt.html, /data-karte=/);
  const mulch = nach.get(`${BASIS}tx/katy/mulch/`);
  assert.ok(mulch && mulch.index && mulch.typ === "materials");
  assert.match(mulch.html, /<title>Bulk Mulch in Katy, TX – 3 Yards, Delivery &amp; Pickup<\/title>/);
  assert.ok(!nach.has(`${BASIS}tx/katy/sand/`));
  // ohne Daten: keine Material-Seiten, kein Filter
  const ohne = verzeichnisSeiten(ladeYards(YARD_DIR, { anreicherung: { yards: {} } }), h);
  assert.ok(!ohne.some((s) => s.typ === "materials"));
  assert.doesNotMatch(ohne.find((s) => s.pfad === `${BASIS}tx/katy/`).html, /data-chips/);
});

test("Pilotliste: 5 Metros, nur Yards mit Website", async () => {
  const { pilotYards, PILOT } = await import("../scripts/anreichern.mjs");
  const liste = pilotYards(ladeYards(YARD_DIR));
  assert.equal(new Set(liste.map((x) => x.metro)).size, PILOT.length);
  assert.ok(liste.every(({ y }) => y.contact?.website && y.kind !== "gravel-pit"));
});
