// Datenqualität des Verzeichnisses (Optimierungsplan AP4).
// Die Dateien in data/yards bleiben unverändert (Original). Beim Laden werden
//   - Fehlkategorien ausgeschlossen (Küchen-/Arbeitsplatten-, Fliesen-, Grabstein-Betriebe …),
//   - Postfach-Adressen markiert (mailbox: true – nachrangig, zählen nicht als Yard),
//   - Anzeigenamen bereinigt (GROSSSCHREIBUNG, Keyword-Zusätze; Original in name_original),
//   - Dubletten (gleiche Telefonnummer oder Adresse und ähnlicher Name) zusammengeführt.
// Grenzfälle landen in review/verdachtsfaelle.csv (npm run review) – Jonas prüft sie von Hand.

// Klare Fehlkategorien nach Namen: werden nicht veröffentlicht
const AUSSCHLUSS_NAME = [
  [/\b(cabinets?|counter ?tops?|kitchens?|vanit(y|ies))\b/i, 'Küchen-/Arbeitsplatten-Betrieb'],
  [/\b(flooring|floor repair|floors)\b/i, 'Bodenbelag-Betrieb'],
  [/\b(headstones?|memorials?|cemetery monuments?)\b/i, 'Grabstein-Betrieb'],
  [/\blevantina\b/i, 'Naturstein-Platten für Arbeitsplatten (Levantina)'],
];
// Einzelfälle, die im Audit vom 26.11.2026 als Arbeitsplatten-Betrieb aufgefallen sind
const AUSSCHLUSS_ID = {
  'az-phoenix-premium-stone-center': 'Arbeitsplatten-Betrieb (Audit 26.11.2026)',
};
// Grenzfälle: bleiben drin, kommen aber auf die Verdachtsliste
const VERDACHT_NAME = [
  [/\btiles?\b/i, 'Fliesen im Namen – Fliesenhandel?'],
  [/\b(marble|granite|quartz)\b(?! sand)/i, 'Marmor/Granit im Namen – Arbeitsplatten?'],
  [/\bmonuments?\b/i, 'Monument im Namen – Grabsteine?'],
  [/\birrigation\b/i, 'Bewässerungshändler – Schüttgut unklar'],
];
const VERDACHT_ID = {
  'ca-concord-carrara-stone-center-inc': '„Stone Center“ mit Marmor-Namen – Arbeitsplatten?',
  'ca-pittsburg-hung-hsi-stone-center': '„Stone Center“ – Arbeitsplatten?',
  'tx-houston-designer-stone-center': '„Designer Stone Center“ – Arbeitsplatten?',
  'tx-houston-designer-stone-center-7221-wynnwood-ln': '„Designer Stone Center“ – Arbeitsplatten?',
  'va-vienna-easy-stone-center': '„Stone Center“ – Arbeitsplatten?',
};
// Ausnahme: Namen, in denen die Muster zum echten Firmennamen gehören
const KEIN_VERDACHT = /graniterock|granite city|granite falls|granite (sand|gravel|rock)|parry co quartz/i;

// Bereinigte Anzeigenamen, wo keine Regel greift (Keyword-Namen)
const NAMEN = {
  'tx-katy-landscape-supply-in-texas-cmxoutdoor': 'CMX Outdoor',
  'nc-burlington-king-mulch-landscape-supply-in-burlington-nc': 'King Mulch',
  'nc-greensboro-stone-center-landscape-and-masonry-in-greensboro-nc': 'Stone Center – Landscape & Masonry',
  'ct-new-milford-new-milford-farms-a-garick-subsidiary-providing-high-quality-sustainable-soils-mulches-compost-and-more': 'New Milford Farms',
  'nc-harrisburg-tarheel-bark-a-garick-subsidiary-soils-mulches-aggregates-and-more': 'Tarheel Bark',
  'ca-palmdale-75th-street-decorative-landscape-material-in-palmdale-ca': '75th Street Decorative Landscape Material',
  'mn-rosemount-set-and-the-mulch-store-empire-township-wm': 'SET & The Mulch Store – Empire Township',
};

const POSTFACH = /\b(PMB|P\.?\s?O\.?\s+Box|Post Office Box)\b/i;
const BUERO = /\b(Ste|Suite)\.?\s*#?\s*(\d{3,})/i;

const KLEIN = new Set(['and', 'of', 'the', 'in', 'at', 'for', 'a', 'an', 'on', 'by']);
const GROSS = new Set(['LLC', 'INC', 'LLP', 'USA', 'US', 'II', 'III', 'IV']);
/** GROSSSCHREIBUNG → Title Case. Kurze Kürzel ohne Vokale (CMX, BMS) und LLC bleiben groß. */
export function titelSchreibung(name) {
  if (name !== name.toUpperCase() || !/[A-Z]{3}/.test(name)) return name;
  return name.split(/(\s+|-|\/|&)/).map((w, i) => {
    if (/^\s+$|^[-/&]$/.test(w) || !w) return w;
    const kern = w.replace(/[^A-Za-z]/g, '');
    if (GROSS.has(kern) && kern !== 'INC') return w;
    if (kern.length <= 3 && !/[AEIOUY]/.test(kern)) return w;
    if (i > 0 && KLEIN.has(kern.toLowerCase())) return w.toLowerCase();
    return w.charAt(0) + w.slice(1).toLowerCase();
  }).join('').replace(/\bInc\b/g, 'Inc');
}

/** Anzeigename: Override, sonst Title Case und " | " → " – " */
export function anzeigeName(y) {
  if (NAMEN[y.id]) return NAMEN[y.id];
  return titelSchreibung(y.name).replace(/\s*\|\s*/g, ' – ').replace(/\s+/g, ' ').trim();
}

/** Prüft einen Eintrag. Ergebnis: { ausschluss, verdacht[], mailbox, name } */
export function pruefen(y) {
  const r = { ausschluss: null, verdacht: [], mailbox: false, name: anzeigeName(y) };
  if (y.kind === 'gravel-pit') return r; // MSHA-Daten: keine Namens- oder Adressprüfung
  r.ausschluss = AUSSCHLUSS_ID[y.id] || AUSSCHLUSS_NAME.find(([re]) => re.test(y.name))?.[1] || null;
  if (!r.ausschluss && !KEIN_VERDACHT.test(y.name)) {
    for (const [re, grund] of VERDACHT_NAME) if (re.test(y.name)) r.verdacht.push(grund);
  }
  if (VERDACHT_ID[y.id]) r.verdacht.push(VERDACHT_ID[y.id]);
  const strasse = y.address?.street || '';
  if (POSTFACH.test(strasse)) { r.mailbox = true; r.verdacht.push('Postfach-Adresse (PMB/PO Box) – kein Hofgelände'); }
  else if (BUERO.test(strasse) && !y.chain) r.verdacht.push('Hohe Suite-Nummer – Büro statt Hof?');
  if (r.name !== y.name.replace(/\s+/g, ' ').trim()) r.verdacht.push(`Name bereinigt (Original: ${y.name})`);
  return r;
}

// ---------- Dubletten ----------
const ALLGEMEIN = new Set(('landscape landscaping supply supplies center centers mulch mulches gravel sand stone stones rock rocks '
  + 'materials material aggregate aggregates inc llc co company corp the and of yard yards products depot soil soils topsoil '
  + 'garden nursery building bulk sales services service enterprises group').split(' '));
const woerter = (n) => n.toLowerCase().replace(/&/g, ' ').replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !ALLGEMEIN.has(w));
const aehnlich = (a, b) => {
  const wa = woerter(a), wb = woerter(b);
  if (!wa.length || !wb.length) return a.toLowerCase().replace(/[^a-z0-9]/g, '') === b.toLowerCase().replace(/[^a-z0-9]/g, '');
  return wb.some((w) => wa.includes(w));
};
const telKey = (y) => (y.contact?.phone ? `${y.contact.phone.replace(/\D/g, '').slice(-10)}|${y.address.city.toLowerCase()}` : null);
const adrKey = (y) => (y.address?.street ? `${y.address.street.toLowerCase().replace(/\b(ste|suite)\b.*$/, '').replace(/[^a-z0-9]/g, '')}|${y.address.zip}` : null);
const vollstaendig = (y) => (y.address?.street ? 1 : 0) + (y.contact?.phone ? 1 : 0) + (y.contact?.website ? 2 : 0) + ((y.materials || []).length ? 3 : 0) + (y.hours ? 2 : 0);

/**
 * Findet Dubletten unter Yards (ohne Kiesgruben).
 * Zusammengeführt wird, wenn Telefon UND Adresse gleich sind oder eines davon gleich ist und die Namen sich ähneln.
 * Gleiche Adresse/Telefon bei unähnlichem Namen → nur Verdacht.
 * @returns {{ weg: Map<id, {behalten: id, grund}>, verdacht: Map<id, string> }}
 */
export function dubletten(yards) {
  const liste = yards.filter((y) => y.kind !== 'gravel-pit');
  const weg = new Map(), verdacht = new Map();
  const paare = new Map();
  for (const key of [telKey, adrKey]) {
    const gruppen = new Map();
    for (const y of liste) { const k = key(y); if (k) { if (!gruppen.has(k)) gruppen.set(k, []); gruppen.get(k).push(y); } }
    for (const g of gruppen.values()) for (let i = 0; i < g.length; i++) for (let j = i + 1; j < g.length; j++) {
      const id = [g[i].id, g[j].id].sort().join('|');
      paare.set(id, [g[i], g[j]]);
    }
  }
  for (const [a, b] of [...paare.values()].sort(([a1], [a2]) => a1.id.localeCompare(a2.id))) {
    if (weg.has(a.id) || weg.has(b.id)) continue;
    const beides = telKey(a) && telKey(a) === telKey(b) && adrKey(a) && adrKey(a) === adrKey(b);
    if (beides || aehnlich(a.name, b.name)) {
      const [behalten, raus] = vollstaendig(b) > vollstaendig(a) || (vollstaendig(b) === vollstaendig(a) && b.id < a.id) ? [b, a] : [a, b];
      weg.set(raus.id, { behalten: behalten.id, grund: `Dublette von ${behalten.name} (${behalten.id}) – zusammengeführt` });
    } else {
      verdacht.set(a.id, `Gleiche ${telKey(a) === telKey(b) ? 'Telefonnummer' : 'Adresse'} wie ${b.name} (${b.id}) – Dublette?`);
    }
  }
  return { weg, verdacht };
}

/**
 * Wendet alles an: gibt die veröffentlichten Yards zurück (bereinigt) und die Prüfliste.
 * @returns {{ yards: object[], liste: {id, name, stadt, staat, grund, aktion, url}[] }}
 */
export function bereinigen(alle) {
  const liste = [];
  const zeile = (y, grund, aktion) => liste.push({ id: y.id, name: y.name, stadt: y.address.city, staat: y.address.state, grund, aktion, url: y.contact?.website || '' });
  const behalten = [];
  for (const y of alle) {
    const p = pruefen(y);
    if (p.ausschluss) { zeile(y, p.ausschluss, 'ausgeschlossen'); continue; }
    for (const g of p.verdacht) zeile(y, g, g.startsWith('Postfach') ? 'nachrangig, zählt nicht als Yard' : g.startsWith('Name bereinigt') ? 'Name angepasst' : 'geprüft werden');
    if (p.name !== y.name) { y.name_original = y.name; y.name = p.name; }
    if (p.mailbox) y.mailbox = true;
    behalten.push(y);
  }
  const d = dubletten(behalten);
  for (const [id, grund] of d.verdacht) zeile(behalten.find((y) => y.id === id), grund, 'geprüft werden');
  const yards = [];
  for (const y of behalten) {
    const w = d.weg.get(y.id);
    if (w) { zeile(y, w.grund, 'ausgeblendet'); continue; }
    yards.push(y);
  }
  return { yards, liste };
}
