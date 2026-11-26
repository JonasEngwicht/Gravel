// Anreicherung (AP5) – Kommandozeile. Ablauf und Regeln: scripts/anreicherung.mjs
//   node scripts/anreichern.mjs pilot                 Pilotliste (5 Metros samt Umland, Yards mit Website)
//   node scripts/anreichern.mjs extrahieren [ordner]  Rohseiten (Standard data/anreicherung/roh) → data/anreicherung.json
//   node scripts/anreichern.mjs stand                 Abdeckung je Pilot-Metro (Ziel: ≥ 60 % mit Materialfeld)
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ladeYards } from './verzeichnis.mjs';
import { extrahieren } from './anreicherung.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATEI = join(ROOT, 'data/anreicherung.json');
// Pilot: die fünf Metros mit den meisten Einträgen, je 30 Meilen um die Stadtmitte
export const PILOT = [
  ['Houston', 'TX', 29.7604, -95.3698], ['Dallas', 'TX', 32.7767, -96.797], ['Phoenix', 'AZ', 33.4484, -112.074],
  ['Austin', 'TX', 30.2672, -97.7431], ['San Antonio', 'TX', 29.4241, -98.4936],
];
const RADIUS_MI = 30;
const meilen = (a, b) => {
  const r = (d) => (d * Math.PI) / 180;
  const x = Math.sin(r(b[0] - a[0]) / 2) ** 2 + Math.cos(r(a[0])) * Math.cos(r(b[0])) * Math.sin(r(b[1] - a[1]) / 2) ** 2;
  return 2 * 3958.8 * Math.asin(Math.sqrt(x));
};
export function pilotYards(yards) {
  const out = [];
  for (const [stadt, staat, lat, lng] of PILOT) {
    for (const y of yards) {
      if (y.kind === 'gravel-pit' || y.address.state !== staat || !y.contact?.website) continue;
      if (meilen([lat, lng], [y.location.lat, y.location.lng]) <= RADIUS_MI) out.push({ metro: `${stadt}, ${staat}`, y });
    }
  }
  return out;
}

const lade = () => (existsSync(DATEI) ? JSON.parse(readFileSync(DATEI, 'utf8')) : { yards: {} });
const [befehl, arg] = process.argv[1] === fileURLToPath(import.meta.url) ? process.argv.slice(2) : ['import'];
const yards = befehl === 'import' ? [] : ladeYards(join(ROOT, 'data/yards'));

if (befehl === 'pilot') {
  const liste = pilotYards(yards);
  const zelle = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
  mkdirSync(join(ROOT, 'review'), { recursive: true });
  writeFileSync(join(ROOT, 'review/anreicherung-pilot.csv'), [['metro', 'id', 'name', 'stadt', 'website'], ...liste.map(({ metro, y }) => [metro, y.id, y.name, y.address.city, y.contact.website])]
    .map((z) => z.map(zelle).join(',')).join('\n') + '\n');
  console.log(`review/anreicherung-pilot.csv: ${liste.length} Yards mit Website in ${PILOT.length} Metros`);
} else if (befehl === 'extrahieren') {
  const ordner = arg || join(ROOT, 'data/anreicherung/roh');
  const daten = lade();
  let n = 0;
  for (const f of readdirSync(ordner).filter((x) => x.endsWith('.json'))) {
    const { pages } = JSON.parse(readFileSync(join(ordner, f), 'utf8'));
    const r = extrahieren(pages || []);
    const id = f.replace(/\.json$/, '');
    if (Object.keys(r).length > 1) { daten.yards[id] = r; n++; } else delete daten.yards[id];
  }
  daten._meta = { beschreibung: 'Fakten von den Websites der Yards (AP5). Nur was dort steht; je Feld Quelle und Abrufdatum unter quellen.', erzeugt: new Date().toISOString().slice(0, 10) };
  writeFileSync(DATEI, JSON.stringify(daten, null, 1) + '\n');
  console.log(`data/anreicherung.json: ${n} Yards mit Fakten aus ${ordner}`);
} else if (befehl === 'stand') {
  const daten = lade();
  const proMetro = {};
  for (const { metro, y } of pilotYards(yards)) {
    proMetro[metro] ||= [0, 0];
    proMetro[metro][0]++;
    if (daten.yards[y.id]?.sortiment?.length) proMetro[metro][1]++;
  }
  for (const [m, [n, ok]] of Object.entries(proMetro)) console.log(`${m.padEnd(16)} ${ok}/${n} (${Math.round((100 * ok) / n)} %)`);
} else if (befehl !== 'import') {
  console.log('Befehle: pilot | extrahieren [ordner] | stand');
}
