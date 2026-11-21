#!/usr/bin/env node
// Führt die Kandidaten aus offenen Quellen zusammen und schreibt data/offene-quellen.json (Aufbau wie im Hofladen-Repo):
//  - Auswahl: eindeutiger Name + Konfidenz, unsichere Kandidaten nur mit Bestätigung über die eigene Website
//  - keine Doppelungen zwischen den Quellen (< 150 m oder bis 2 km mit ähnlichem Namen)
//  - stabile IDs: bereits veröffentlichte Einträge gewinnen
//  - Schutz: liefert der Lauf 30 % weniger Einträge als zuvor, wird nichts überschrieben (ERLAUBE_SCHWUND=1 erzwingt es)
//
// Aufruf: node scripts/import-quellen.mjs <roh.json> [<roh2.json> …] [--ziel data/offene-quellen.json]
//         [--pruefung data/website-pruefung.json] [--pruefliste <datei>] [--bericht <datei.md>]
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { ladeZips, STATES } from './lib.mjs';
import { distanzKm } from '../static/helfer.js';
import { QUELLEN, quellenId, istYard, brauchtPruefung, sauberName, kontakt, adresse, zusammenfuehren } from './quellen.mjs';

const args = process.argv.slice(2);
const OPTIONEN = ['--ziel', '--pruefung', '--pruefliste', '--bericht'];
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const rohPfade = args.filter((a, i) => !a.startsWith('--') && !OPTIONEN.includes(args[i - 1]));
if (!rohPfade.length) { console.error('Aufruf: node scripts/import-quellen.mjs <roh.json> [...]'); process.exit(1); }
const zielPfad = opt('--ziel', new URL('../data/offene-quellen.json', import.meta.url));
const pruefPfad = opt('--pruefung', new URL('../data/website-pruefung.json', import.meta.url));
const stand = new Date().toISOString().slice(0, 10);
const PRUEFUNG_TAGE = 180;

const bisher = existsSync(zielPfad) ? JSON.parse(readFileSync(zielPfad, 'utf8')) : { eintraege: [] };
const bisherIds = new Set(bisher.eintraege.map((e) => e.id));
const pruefung = existsSync(pruefPfad) ? JSON.parse(readFileSync(pruefPfad, 'utf8')) : {};
const frisch = (p) => p && (Date.now() - Date.parse(p.stand)) / 864e5 <= PRUEFUNG_TAGE;

// Fehlende Adressteile über die nächste ZIP ergänzen (GeoNames)
const { zips } = ladeZips(new URL('../data/quellen/zip-us.txt', import.meta.url).pathname, new URL('../data/quellen/zip-us-beispiel.txt', import.meta.url).pathname);
const zipRaster = new Map();
for (const z of zips.values()) { const k = `${Math.floor(z.lat)}:${Math.floor(z.lon)}`; if (!zipRaster.has(k)) zipRaster.set(k, []); zipRaster.get(k).push(z); }
function naechsteZip(lat, lon) {
  let best = null, bestD = Infinity;
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++)
    for (const z of zipRaster.get(`${Math.floor(lat) + i}:${Math.floor(lon) + j}`) || []) {
      const d = distanzKm(lat, lon, z.lat, z.lon); if (d < bestD) { bestD = d; best = z; }
    }
  return bestD <= 40 ? best : null;
}

const quellenInfo = {}, orte = [];
for (const p of rohPfade) {
  const roh = JSON.parse(readFileSync(p, 'utf8'));
  const q = roh.quelle;
  if (!QUELLEN[q]) { console.error(`Unbekannte Quelle ${q} in ${p}`); process.exit(1); }
  quellenInfo[q] = { release: roh.release || null, stand, kandidaten: roh.orte.length };
  for (const o of roh.orte) {
    if (!Number.isFinite(o.lat) || !Number.isFinite(o.lon) || !o.name) continue;
    const x = { ...o, quelle: q, qid: String(o.id), id: quellenId(q, String(o.id)), name: sauberName(o.name), k: kontakt(o), a: adresse(o) };
    const w = x.k.website && pruefung[x.k.website];
    if (w?.ok && frisch(w)) x.webGeprueft = w.stand;
    orte.push(x);
  }
}

// Prüfliste für scripts/websites-pruefen.mjs
const pruefliste = opt('--pruefliste', null);
if (pruefliste) {
  const liste = [...new Set(orte.filter((o) => brauchtPruefung(o) && o.k.website && !frisch(pruefung[o.k.website])).map((o) => o.k.website))];
  writeFileSync(pruefliste, JSON.stringify(liste));
  console.log(`Prüfliste: ${liste.length} Websites.`);
  process.exit(0);
}

const ausgewaehlt = zusammenfuehren(orte.filter(istYard), (o) => (bisherIds.has(o.id) ? -10 : 0) + QUELLEN[o.quelle].rang);
const eintraege = [];
for (const o of ausgewaehlt) {
  const z = naechsteZip(o.lat, o.lon);
  const state = STATES[o.a.state] ? o.a.state : z?.state;
  const city = o.a.city || z?.ort;
  if (!state || !STATES[state] || !city) continue;
  eintraege.push({
    id: o.id, name: o.name, status: 'active',
    address: { street: o.a.street, city, state, zip: o.a.zip || z?.zip || null },
    location: { lat: +o.lat.toFixed(6), lng: +o.lon.toFixed(6) },
    contact: { ...(o.k.telefon ? { phone: o.k.telefon } : {}), ...(o.k.website ? { website: o.k.website } : {}) },
    materials: [],
    source: { type: 'public-list', name: QUELLEN[o.quelle].name, license: QUELLEN[o.quelle].lizenz, checked: o.webGeprueft || stand },
    ...(o.weitere.length ? { alsoIn: o.weitere } : {}),
  });
}
eintraege.sort((a, b) => a.id.localeCompare(b.id));

// Bericht für den Probelauf: Kategorien und Beispiele, um Regeln und Kategorien zu schärfen
const bericht = opt('--bericht', null);
if (bericht) {
  const kats = new Map();
  for (const o of orte) { const k = o.kat || '(keine)'; const e = kats.get(k) || { n: 0, yard: 0, bsp: [] }; e.n++; if (istYard(o)) e.yard++; if (e.bsp.length < 5) e.bsp.push(o.name); kats.set(k, e); }
  const zeilen = [...kats.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 60)
    .map(([k, e]) => `| ${k} | ${e.n} | ${e.yard} | ${e.bsp.join('; ').replace(/\|/g, '/')} |`);
  writeFileSync(bericht, `# Probelauf offene Quellen (${stand})\n\nKandidaten: ${orte.length}, ausgewählt: ${eintraege.length}, Website-Prüfung nötig: ${orte.filter(brauchtPruefung).length}\n\n| Kategorie | Kandidaten | davon Yard | Beispiele |\n|---|---:|---:|---|\n${zeilen.join('\n')}\n\n## Ausgewählt (Stichprobe)\n\n${eintraege.slice(0, 80).map((e) => `- ${e.name} – ${e.address.city}, ${e.address.state}${e.contact.website ? ` – ${e.contact.website}` : ''}`).join('\n')}\n`);
  console.log(`Bericht: ${bericht}`);
}

const schwund = bisher.eintraege.length && eintraege.length < bisher.eintraege.length * 0.7;
if (schwund && !process.env.ERLAUBE_SCHWUND) {
  console.error(`Abbruch: ${eintraege.length} statt bisher ${bisher.eintraege.length} Einträge (mehr als 30 % weniger). ERLAUBE_SCHWUND=1 erzwingt das Schreiben.`);
  process.exit(1);
}
writeFileSync(zielPfad, JSON.stringify({ stand, quellen: quellenInfo, eintraege }, null, 0).replace(/\},\{"id"/g, '},\n{"id"') + '\n');
console.log(`Offene Quellen: ${orte.length} Kandidaten, ${eintraege.length} Yards übernommen.`);
