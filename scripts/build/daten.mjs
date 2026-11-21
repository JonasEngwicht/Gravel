// Build, Teil „daten“: alle Datenquellen laden, zusammenführen und ableiten.
// Vorrang wie bei Hofladen (schwach → stark): offene Quellen → eigene Einträge (data/yards/) → Betreiber (später).
import { readFileSync, readdirSync, existsSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { STATES, slugify, ladeZips } from '../lib.mjs';

export const ROOT = fileURLToPath(new URL('../..', import.meta.url));
// BUILD_OUT, BUILD_GEN und YARDS_DIR nur für Tests (Build mit Testdaten in ein Temp-Verzeichnis)
export const OUT = process.env.BUILD_OUT || join(ROOT, 'public');
export const GEN = process.env.BUILD_GEN || join(ROOT, 'src', 'generated');
const json = (p, fallback) => (existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : fallback);

export const cfg = json(join(ROOT, 'site.config.json'));
export const BUILD_DATUM = process.env.BUILD_DATUM || new Date().toISOString().slice(0, 10);
// Version für Cache-Busting (?v=) aus dem Inhalt der Browser-Dateien
const STATIC = join(ROOT, 'static');
export const VERSION = createHash('sha1')
  .update(readdirSync(STATIC).filter((f) => /\.(js|css)$/.test(f)).sort().map((f) => readFileSync(join(STATIC, f))).join('\u0000'))
  .digest('hex').slice(0, 8);

export const { materials, categories, projects } = json(join(ROOT, 'data', 'materials.json'));
export const MATERIAL = new Map(materials.map((m) => [m.id, m]));

// ---------- ZIP-Daten (GeoNames) ----------
const { zips, beispiel } = ladeZips(join(ROOT, 'data', 'quellen', 'zip-us.txt'), join(ROOT, 'data', 'quellen', 'zip-us-beispiel.txt'));
export const ZIPS = zips;
if (beispiel) console.warn('Hinweis: data/quellen/zip-us.txt fehlt – nur Beispiel-ZIPs (Workflow „ZIP-Daten aktualisieren“).');

// ---------- Yards ----------
// data/offene-quellen.json: Kandidaten aus Overture/Foursquare/OSM (scripts/import-quellen.mjs), bereits geprüft
const offen = process.env.YARDS_DIR ? [] : json(join(ROOT, 'data', 'offene-quellen.json'), { eintraege: [] }).eintraege;
// data/yards/*.json: eigene Einträge; Dateien mit „_“ am Anfang sind Beispiele und werden nie veröffentlicht
const YARD_DIR = process.env.YARDS_DIR || join(ROOT, 'data', 'yards');
const eigene = existsSync(YARD_DIR)
  ? readdirSync(YARD_DIR).filter((f) => f.endsWith('.json') && !f.startsWith('_')).map((f) => json(join(YARD_DIR, f)))
  : [];

const nachId = new Map();
for (const y of offen) nachId.set(y.id, { ...y, quelle: y.source?.type || 'public-list' });
for (const y of eigene) nachId.set(y.id, { ...(nachId.get(y.id) || {}), ...y });

function pruefe(y) {
  const fehler = [];
  if (!y.id || !y.name) fehler.push('id/name fehlt');
  if (!STATES[y.address?.state]) fehler.push(`unbekannter Bundesstaat ${y.address?.state}`);
  if (!y.address?.city) fehler.push('Ort fehlt');
  if (!Number.isFinite(y.location?.lat) || !Number.isFinite(y.location?.lng)) fehler.push('Koordinaten fehlen');
  for (const m of y.materials || []) if (!MATERIAL.has(m.id)) fehler.push(`unbekanntes Material ${m.id}`);
  if (fehler.length) throw new Error(`Yard ${y.id || y.name}: ${fehler.join(', ')}`);
}

export const yards = [...nachId.values()]
  .filter((y) => (y.status || 'active') === 'active')
  .map((y) => {
    pruefe(y);
    const state = y.address.state;
    const citySlug = slugify(y.address.city);
    const slug = y.slug ? `${y.slug}-${citySlug}-${state.toLowerCase()}` : slugify(`${y.name} ${y.address.city} ${state}`);
    return { ...y, materials: y.materials || [], state, citySlug, slug, pfad: `/yard/${slug}/`,
      stadtPfad: `/landscape-supply/${state.toLowerCase()}/${citySlug}/` };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

// Slugs müssen eindeutig sein (sonst überschreiben sich Seiten)
const doppelt = yards.map((y) => y.slug).filter((s, i, a) => a.indexOf(s) !== i);
if (doppelt.length) throw new Error(`Doppelte Yard-Slugs: ${[...new Set(doppelt)].join(', ')}`);

// ---------- Städte und Bundesstaaten ----------
export const staedte = new Map(); // stadtPfad → { name, state, slug, yards }
for (const y of yards) {
  if (!staedte.has(y.stadtPfad)) staedte.set(y.stadtPfad, { name: y.address.city, state: y.state, slug: y.citySlug, pfad: y.stadtPfad, yards: [] });
  staedte.get(y.stadtPfad).yards.push(y);
}
export const staaten = new Map(); // Kürzel → { code, name, pfad, staedte }
for (const s of staedte.values()) {
  if (!staaten.has(s.state)) staaten.set(s.state, { code: s.state, name: STATES[s.state], pfad: `/landscape-supply/${s.state.toLowerCase()}/`, staedte: [] });
  staaten.get(s.state).staedte.push(s);
}
for (const st of staaten.values()) st.staedte.sort((a, b) => b.yards.length - a.yards.length || a.name.localeCompare(b.name));

// Ausgabe leeren
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
mkdirSync(GEN, { recursive: true });
console.log(`Daten: ${yards.length} Yards in ${staedte.size} Städten, ${staaten.size} Bundesstaaten, ${ZIPS.size} ZIPs, ${materials.length} Materialien`);
