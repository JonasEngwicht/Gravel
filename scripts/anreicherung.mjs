// Anreicherung der Yards mit Fakten von ihren eigenen Websites (Optimierungsplan AP5).
//
// Ablauf:
//   1. node scripts/anreichern.mjs pilot          → review/anreicherung-pilot.csv: Yards mit Website in den Pilot-Metros
//   2. Websites abrufen (Firecrawl: Startseite + Products/Materials + Delivery + Contact, max. 5 Seiten, robots.txt beachten)
//      und je Yard als data/anreicherung/roh/<id>.json ablegen: { "pages": [{ "url", "markdown", "fetched_at" }] }
//   3. node scripts/anreichern.mjs extrahieren    → data/anreicherung.json (nur Fakten, keine Texte der Yards)
//   4. npm run build                              → Firmen-, Stadt- und Material-Seiten zeigen die Daten
//
// Regeln: Nur übernehmen, was auf der Website des Yards steht. Nichts raten – unbekannt bleibt leer.
// Jedes Feld trägt die Seite, auf der es gefunden wurde (url) und das Abrufdatum (checked_at).

// Feste Material-Felder (Reihenfolge = Anzeige). Muster werden auf Kleinbuchstaben-Text angewendet.
export const SORTIMENT = [
  ['mulch', 'Mulch', /\b(mulch(es)?|bark (nuggets|chips|mulch)|wood chips)\b/],
  ['gravel', 'Gravel', /\bgravel\b/],
  ['crushed-stone', 'Crushed stone', /\b(crushed (stone|rock|granite|limestone|concrete)|#\s?57 stone|57 stone|crusher run|road base|base rock)\b/],
  ['river-rock', 'River rock', /\b(river (rock|stone)|creek rock)\b/],
  ['pea-gravel', 'Pea gravel', /\bpea gravel\b/],
  ['topsoil', 'Topsoil', /\b(top ?soil|screened soil|garden soil|soil blends?)\b/],
  ['fill-dirt', 'Fill dirt', /\b(fill dirt|select fill|fill soil|clean fill)\b/],
  ['sand', 'Sand', /\b(sand)\b(?! ?(stone|blast))/],
  ['compost', 'Compost', /\bcompost\b/],
  ['decorative-rock', 'Decorative rock', /\b(decorative (rock|stone)|landscape rock|lava rock|decomposed granite)\b/],
  ['flagstone-boulders', 'Flagstone & boulders', /\b(flagstones?|boulders?)\b/],
];
export const SORTIMENT_LABEL = Object.fromEntries(SORTIMENT.map(([id, label]) => [id, label]));

const JA = {
  bulk: /\b(in bulk|bulk (materials?|mulch|gravel|soil|rock|stone|sand|delivery)|by the (cubic )?yard|per (cubic )?yard|by the ton|per ton|by the scoop)\b/,
  bagged: /\b(bagged|by the bag|per bag|bags? of (mulch|soil|gravel|sand))\b/,
  delivery: /\b(we deliver|delivery (is )?available|free delivery|delivery (fees?|charges?|rates?|areas?|service)|schedule (a |your )?delivery|same[- ]day delivery|we offer delivery|delivered to your)\b/,
  pickup: /\b(pick[- ]?up (is )?available|self[- ]load|we('| wi)ll load|we load (your|trucks|trailers)|load your (truck|trailer)|bring your (truck|trailer))\b/,
  public: /\b(open to the public|homeowners (are )?welcome|public welcome|retail customers|sell(s)? to (homeowners|the public)|homeowners and contractors|contractors and homeowners)\b/,
};
const NEIN = {
  delivery: /\b(no delivery|we do not deliver|we don'?t deliver|pick[- ]?up only)\b/,
  public: /\b(contractors only|wholesale only|trade only|to the trade only|not open to the public)\b/,
};

const TAGE = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const TAG_RE = '(mon(?:day)?|tue(?:s|sday)?|wed(?:nesday)?|thu(?:rs?|rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)';
const ZEIT_RE = '(\\d{1,2})(?::(\\d{2}))?\\s*(a\\.?m\\.?|p\\.?m\\.?)';
const tagIndex = (t) => TAGE.indexOf(t.slice(0, 3));
const uhr = (h, m, ap) => { let x = +h % 12; if (/p/i.test(ap)) x += 12; return `${String(x).padStart(2, '0')}:${m || '00'}`; };

/** Öffnungszeiten aus Text: „Mon–Fri 7am–5pm, Sat 8:00 AM - 2:00 PM, Sunday: Closed“ → { mon: '07:00-17:00', …, sun: 'closed' } */
export function oeffnungszeiten(text) {
  const t = text.toLowerCase().replace(/[–—]/g, '-');
  const re = new RegExp(`${TAG_RE}(?:\\s*(?:-|to|thru|through)\\s*${TAG_RE})?\\.?\\s*:?\\s*(?:${ZEIT_RE}\\s*(?:-|to)\\s*${ZEIT_RE}|(closed))`, 'gi');
  const out = {};
  for (const m of t.matchAll(re)) {
    const von = tagIndex(m[1]); const bis = m[2] ? tagIndex(m[2]) : von;
    if (von < 0 || bis < von) continue;
    const wert = m[9] ? 'closed' : `${uhr(m[3], m[4], m[5])}-${uhr(m[6], m[7], m[8])}`;
    for (let i = von; i <= bis; i++) if (!out[TAGE[i]]) out[TAGE[i]] = wert;
  }
  return Object.keys(out).length >= 2 ? out : null; // eine einzelne Zeile ist zu unsicher
}

const PREIS_RE = /\$\s?(\d{1,4}(?:\.\d{2})?)\s*(?:\/|per|a)\s*(cubic yard|cu\.?\s?yd\.?|yard|yd\.?|ton|bag)\b/gi;
const EINHEIT = (u) => (/ton/i.test(u) ? 'ton' : /bag/i.test(u) ? 'bag' : 'cy');

/** Preisbeispiele: nur Zahlen mit Einheit und einem Material im selben Satzteil davor */
export function preise(text) {
  const out = [];
  for (const m of text.matchAll(PREIS_RE)) {
    const davor = text.slice(Math.max(0, m.index - 80), m.index).toLowerCase();
    const mat = [...SORTIMENT].reverse().find(([, , re]) => re.test(davor));
    if (!mat) continue;
    const e = { material: mat[0], amount: +m[1], unit: EINHEIT(m[2]) };
    if (!out.some((x) => x.material === e.material && x.unit === e.unit)) out.push(e);
  }
  return out.slice(0, 6);
}

/**
 * Extrahiert Fakten aus den abgerufenen Seiten eines Yards.
 * @param {{url: string, markdown: string, fetched_at: string}[]} seiten
 * @returns Datensatz für data/anreicherung.json (leere Felder fehlen)
 */
export function extrahieren(seiten) {
  const r = { quellen: {} };
  const merke = (feld, s) => { if (!r.quellen[feld]) r.quellen[feld] = { url: s.url, checked_at: String(s.fetched_at).slice(0, 10) }; };
  for (const s of seiten) {
    const t = String(s.markdown || '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').toLowerCase();
    for (const [id, , re] of SORTIMENT) if (re.test(t)) { (r.sortiment ||= []).includes(id) || r.sortiment.push(id); merke('sortiment', s); }
    if (JA.bulk.test(t) && r.bulk == null) { r.bulk = true; merke('bulk', s); }
    if (JA.bagged.test(t) && r.bagged == null) { r.bagged = true; merke('bagged', s); }
    if (NEIN.delivery.test(t)) { r.delivery = false; merke('delivery', s); } else if (JA.delivery.test(t) && r.delivery == null) { r.delivery = true; merke('delivery', s); }
    if (JA.pickup.test(t) && r.pickup == null) { r.pickup = true; merke('pickup', s); }
    if (NEIN.public.test(t)) { r.sells_to_public = false; merke('sells_to_public', s); } else if (JA.public.test(t) && r.sells_to_public == null) { r.sells_to_public = true; merke('sells_to_public', s); }
    const h = !r.hours && oeffnungszeiten(t);
    if (h) { r.hours = h; merke('hours', s); }
    const p = preise(String(s.markdown || ''));
    if (p.length) { r.price_examples = [...(r.price_examples || []), ...p.filter((x) => !(r.price_examples || []).some((y) => y.material === x.material && y.unit === x.unit))].slice(0, 6); merke('price_examples', s); }
  }
  if (r.sortiment) r.sortiment.sort((a, b) => SORTIMENT.findIndex(([x]) => x === a) - SORTIMENT.findIndex(([x]) => x === b));
  return r;
}

/** Hängt die Anreicherung an die Yards (Feld y.web). OSM-Öffnungszeiten (y.hours) bleiben Vorrang. */
export function anwenden(yards, daten) {
  for (const y of yards) {
    const d = daten?.yards?.[y.id];
    if (!d) continue;
    y.web = d;
    if (!y.hours && d.hours) y.hours = Object.fromEntries(Object.entries(d.hours).filter(([, v]) => v !== 'closed'));
    if (y.delivery?.available == null && d.delivery != null) y.delivery = { ...(y.delivery || {}), available: d.delivery };
    if (d.pickup && y.self_load == null) y.self_load = true;
  }
  return yards;
}

/** Hat der Yard mindestens ein Materialfeld aus der Anreicherung? (Pilot-Ziel: ≥ 60 %) */
export const angereichert = (y) => !!(y.web?.sortiment?.length);
