// Auswahl und Abgleich von Kandidaten aus offenen Quellen (reine Funktionen, siehe tests/quellen.test.mjs).
// Übernommen aus scripts/quellen.mjs im Hofladen-Repo, Regeln für US-Landscape-Supply-Yards neu.
// Wichtigste Unterscheidung: Supply Yards (verkaufen Material) ≠ Landschaftsbau-Firmen (Dienstleistung).
import { distanzKm } from '../static/helfer.js';
import { slugify } from './lib.mjs';

// Rang: kleiner = bevorzugt, wenn mehrere Quellen denselben Yard kennen
export const QUELLEN = {
  overture: { praefix: 'o', name: 'Overture Maps Foundation', url: 'https://overturemaps.org/', lizenz: 'CDLA-Permissive-2.0 / Apache-2.0', rang: 1 },
  foursquare: { praefix: 'f', name: 'Foursquare Open Source Places', url: 'https://opensource.foursquare.com/os-places/', lizenz: 'Apache-2.0', rang: 2 },
};
export function quellenId(quelle, id) {
  const q = QUELLEN[quelle];
  return q ? `${q.praefix}-${slugify(id)}` : null;
}

// Namen, die eindeutig auf einen Yard hinweisen
export const STRONG = /landscape (supply|supplies|materials?|depot|center|centre|warehouse)|(sand|stone|rock|soil|mulch|gravel|topsoil|dirt|boulder) (yard|supply|supplies|depot|center|company|co\b|sales|store)|sand (&|and) gravel|rock (&|and) (mulch|stone|soil)|mulch (&|and) (stone|rock|soil)|stone (&|and) (soil|mulch)|rock ?yard|stone ?yard|mulch ?yard|bulk (mulch|materials?|landscape|rock|stone)|aggregates?\b|topsoil|quarry sales/i;
// Klingt passend, reicht aber allein nicht (nur mit passender Kategorie und hoher Konfidenz oder Website-Bestätigung)
export const WEAK = /landscape|mulch|stone|rock|gravel|soil|quarry|nursery|garden (center|centre)|hardscape/i;
// Keine Yards: Dienstleister, Ketten, Fremdes – auch wenn der Name passt
export const NOT_YARD = /landscaping (services?|co\b|company|contractors?|llc|inc\b|design|maintenance)|landscape (design|architect|architecture|contractors?|maintenance|services?|management|lighting|install)|lawn (care|service|maintenance)|tree (service|care|trimming)|irrigation (repair|service)|sprinkler|snow (removal|plow)|pool|concrete (contractor|pumping|services?|construction)|paving (contractor|company)|excavating|excavation|demolition|dumpster|junk|septic|plumbing|roofing|fencing contractor|rental|storage|church|school|university|museum|park\b|cemetery|apartments?|realty|real estate|\b(home depot|lowe'?s|walmart|menards|ace hardware|true value|tractor supply|costco|sam'?s club)\b/i;
// Kategorien (Overture/Foursquare), die zu einem Yard passen – vorläufig, im Probelauf prüfen
export const KAT_YARD = /landscape_supply|landscaping_supply|building_supply|building_material|stone_and_masonry|stone_supplier|masonry_supply|aggregate|gravel|sand_and_gravel|garden_center|nursery|quarry|home_improvement_store|hardware_store/i;
export const KAT_DIENST = /landscaping\b|landscape_architect|lawn_service|gardener|tree_service|contractor|construction_company/i;

export const MIN_KONF_STARK = 0.7;
export const MIN_KONF_SCHWACH = 0.8;
export const MIN_KONF_PRUEFUNG = 0.5;

export function istYard(o) {
  const name = o.name || '';
  if (!name || NOT_YARD.test(name)) return false;
  const kat = o.kat || '', katYard = KAT_YARD.test(kat), katDienst = KAT_DIENST.test(kat) && !katYard;
  if (STRONG.test(name)) {
    if (o.konf < MIN_KONF_STARK) return false;
    return !katDienst || o.webGeprueft != null; // „XY Landscape Supply“ als Landschaftsbauer einsortiert: nur mit Website-Bestätigung
  }
  if (WEAK.test(name)) return o.konf >= MIN_KONF_SCHWACH && katYard && o.webGeprueft != null;
  return false;
}
// Würde mit Website-Bestätigung aufgenommen: Kandidat für scripts/websites-pruefen.mjs
export function brauchtPruefung(o) {
  return o.konf >= MIN_KONF_PRUEFUNG && !istYard(o) && istYard({ ...o, konf: 1, webGeprueft: 'x' });
}

// Hinweise auf Verkauf von Schüttgut auf der Startseite eines Yards (Dienstleister schreiben eher „services“, „design“)
const WEBSITE_JA = /bulk (mulch|materials?|rock|stone|soil|gravel)|per (cubic )?yard|\/\s?(cu\.? ?)?yd\b|per ton\b|\/\s?ton\b|landscape (supply|supplies|materials)|(mulch|rock|stone|soil|gravel) (yard|delivery|delivered)|we (deliver|load)|self[- ]load|pick ?up (your )?(load|order)|by the (yard|scoop|ton)/i;
export function websiteBestaetigt(html) {
  return WEBSITE_JA.test(String(html || '').replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' '));
}

// Namen vergleichbar machen: kennzeichnende Wörter ohne Gattungsbegriffe
const FUELL = new Set(['landscape', 'landscaping', 'supply', 'supplies', 'material', 'materials', 'the', 'and', 'inc', 'llc',
  'co', 'company', 'corp', 'ltd', 'yard', 'yards', 'center', 'depot', 'sales', 'store', 'mulch', 'stone', 'rock', 'soil',
  'gravel', 'sand', 'topsoil', 'bulk', 'aggregate', 'aggregates', 'garden', 'nursery', 'of', 'at', 'by', 'for']);
export function namenWoerter(name) {
  return String(name || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').split(/[^a-z0-9]+/)
    .map((w) => w.replace(/s$/, '')).filter((w) => w.length >= 3 && !FUELL.has(w) && !FUELL.has(`${w}s`) && !/^\d+$/.test(w));
}
export function namenAehnlich(a, b) {
  const wa = namenWoerter(a), wb = namenWoerter(b);
  return wa.some((x) => wb.some((y) => x === y || (Math.min(x.length, y.length) >= 5 && (x.includes(y) || y.includes(x)))));
}
// Gleicher Ort? Sehr nah beieinander oder in der Nähe mit ähnlichem Namen (Regeln aus Hofladen)
export function gleicherYard(a, b) {
  const d = distanzKm(a.lat, a.lon, b.lat, b.lon);
  if (d <= 0.15) return true;
  if (!a.name || !b.name || d > 4) return false;
  if (d <= 2) return namenAehnlich(a.name, b.name);
  const wb = namenWoerter(b.name);
  return namenWoerter(a.name).some((w) => w.length >= 8 && wb.includes(w));
}

// Räumlicher Index (0,02°-Raster ≈ 2 km)
export function rasterIndex(liste) {
  const r = new Map();
  const key = (lat, lon) => `${Math.floor(lat * 50)}:${Math.floor(lon * 50)}`;
  const add = (e) => { const k = key(e.lat, e.lon); if (!r.has(k)) r.set(k, []); r.get(k).push(e); };
  liste.forEach(add);
  return {
    nahe(lat, lon) {
      const la = Math.floor(lat * 50), lo = Math.floor(lon * 50), out = [];
      for (let i = la - 2; i <= la + 2; i++) for (let j = lo - 3; j <= lo + 3; j++) out.push(...(r.get(`${i}:${j}`) || []));
      return out;
    },
    add,
  };
}

// Namen aus Firmendaten aufräumen („ABC LANDSCAPE SUPPLY LLC“ → „ABC Landscape Supply LLC“)
export function sauberName(n) {
  let s = String(n || '').replace(/\s+/g, ' ').replace(/´|`/g, '’').trim().split(' | ')[0].trim();
  if (s === s.toUpperCase()) s = s.toLowerCase().replace(/\b\p{L}/gu, (c) => c.toUpperCase());
  return s.replace(/\bLlc\b/g, 'LLC').replace(/\bInc\b/g, 'Inc').replace(/\b(And|Of|The)\b(?!$)/g, (w, x, i) => (i === 0 ? w : w.toLowerCase()));
}

// Verzeichnisse und Plattformen sind keine Website des Yards
const FREMD = /(^|\.)(yelp|angi|angieslist|homeadvisor|thumbtack|bbb|yellowpages|manta|mapquest|google|goo|facebook|fb|instagram|linktr|nextdoor|houzz|porch|chamberofcommerce|buzzfile|dnb|zoominfo|hellogravel|mygravelbuddy|aggregatemarkets)\./i;
function url(u) {
  if (!u) return null;
  u = String(u).trim();
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u.replace(/^\/+/, '');
  try { const x = new URL(u); if (!/^https?:$/.test(x.protocol)) return null; x.username = ''; x.password = ''; return x.href; } catch { return null; }
}
// US-Telefonnummern einheitlich als (303) 555-0100
export function telefon(p) {
  let z = String(p || '').replace(/\D/g, '');
  if (z.length === 11 && z.startsWith('1')) z = z.slice(1);
  if (z.length !== 10 || /^[01]/.test(z)) return null;
  return `(${z.slice(0, 3)}) ${z.slice(3, 6)}-${z.slice(6)}`;
}
export function kontakt(o) {
  const host = (u) => new URL(u).hostname.replace(/^www\./, '');
  const webs = (o.websites || []).map(url).filter((u) => u && !/\.(pdf|docx?)(\?|#|$)/i.test(u));
  return {
    website: webs.find((u) => !FREMD.test(`.${host(u)}`)) || null,
    telefon: (o.phones || []).map(telefon).find(Boolean) || null,
    email: (o.emails || []).map((m) => String(m).trim().toLowerCase()).find((m) => /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/.test(m)) || null,
  };
}
export function adresse(o) {
  const zip = String(o.plz || '').trim().slice(0, 5);
  const strasse = o.strasse && /\d/.test(o.strasse) && o.strasse.length <= 80 ? String(o.strasse).trim() : null;
  return { street: strasse, city: o.ort ? String(o.ort).trim() : null, state: o.region ? String(o.region).trim().toUpperCase() : null, zip: /^\d{5}$/.test(zip) ? zip : null };
}

// Doppelte Datensätze zusammenführen; vorrang(o): kleinere Zahl gewinnt (bereits veröffentlichte IDs bleiben stabil)
export function zusammenfuehren(liste, vorrang = () => 0) {
  const sortiert = [...liste].sort((a, b) => vorrang(a) - vorrang(b) || b.konf - a.konf || String(a.id).localeCompare(String(b.id)));
  const idx = rasterIndex([]), behalten = [];
  for (const o of sortiert) {
    const gleich = idx.nahe(o.lat, o.lon).find((k) => gleicherYard(k, o));
    if (gleich) {
      gleich.weitere.push(o.id);
      for (const f of ['website', 'telefon', 'email']) if (!gleich.k[f] && o.k[f]) gleich.k[f] = o.k[f];
      if (!gleich.a.street && o.a.street) gleich.a = o.a;
      continue;
    }
    const neu = { ...o, weitere: [] };
    idx.add(neu); behalten.push(neu);
  }
  return behalten;
}
