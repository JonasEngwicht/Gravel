// Verzeichnis der Landscape-Supply-Yards: Übersicht, Staats-, Stadt- und Unternehmensseiten.
// Eingabe: data/yards/**/*.json (Dateien mit "_" am Anfang werden übersprungen), Format siehe data/schema/yard.schema.json.
// Ausgabe: Liste von Seiten { pfad, html, index } – build.mjs schreibt sie nach public/ und in die Sitemap.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const BASIS = '/landscape-supply/';

export const STAATEN = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut',
  DE: 'Delaware', DC: 'District of Columbia', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois',
  IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana',
  NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
  NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania',
  RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah',
  VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  PR: 'Puerto Rico', VI: 'U.S. Virgin Islands', GU: 'Guam',
};

export const ARTEN = {
  'landscape-supply': 'Landscape supply yard',
  'mulch-soil': 'Mulch & topsoil yard',
  'stone-yard': 'Stone & rock yard',
  'sand-gravel': 'Sand & gravel',
  quarry: 'Quarry / aggregate producer',
  'gravel-pit': 'Gravel pit (mine record)',
};
// Reihenfolge und Gruppen auf der Stadtseite
const GRUPPEN = [
  { id: 'yards', titel: 'Landscape supply, mulch & stone yards', kurz: 'Yards', arten: ['landscape-supply', 'mulch-soil', 'stone-yard'] },
  { id: 'sand-gravel', titel: 'Sand & gravel suppliers', kurz: 'Sand & gravel', arten: ['sand-gravel', 'quarry'],
    hinweis: 'Some sand & gravel suppliers sell mainly to contractors. Call ahead to ask whether they load trucks for homeowners.' },
  { id: 'gravel-pits', titel: 'Gravel pits (from mine records)', kurz: 'Gravel pits', arten: ['gravel-pit'],
    hinweis: 'Active and intermittent sand & gravel pits from federal mine records (MSHA). These records have no phone numbers or retail details, and many pits only sell to contractors.' },
];

// „Befüllt“: Einträge mit Telefon oder Website. Nur Seiten mit genug solchen Einträgen werden indexiert.
export const MIN_STADT = 3;
export const befuellt = (y) => y.status === 'active' || !!(y.contact?.phone || y.contact?.website);
// Unternehmensseite indexieren: geprüft oder vollständige Kontaktdaten (Adresse, Telefon, Website)
export const seiteBefuellt = (y) => y.status === 'active' || !!(y.address.street && y.contact?.phone && y.contact?.website);
const KETTEN = { siteone: 'SiteOne Landscape Supply', gomulch: 'GoMulch' };
const ketteName = (k) => KETTEN[k] || k.replace(/\b\w/g, (b) => b.toUpperCase());
const istMsha = (y) => !!(y.source?.dataset?.startsWith('msha') || (y.msha || []).some((m) => m.match !== 'inactive-nearby'));

export const slugify = (s) => String(s).normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-+/g, '-');

/** Alle Yards laden (rekursiv), Beispiel- und Entwurfsdateien mit "_" überspringen. */
export function ladeYards(dir) {
  const out = [];
  const lauf = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.name.startsWith('_') || e.name.startsWith('.')) continue;
      const p = join(d, e.name);
      if (e.isDirectory()) lauf(p);
      else if (e.name.endsWith('.json')) out.push(JSON.parse(readFileSync(p, 'utf8')));
    }
  };
  lauf(dir);
  return out.filter((y) => y.status !== 'closed');
}

const R_MI = 3958.8;
function meilen(a, b) {
  const r = (d) => (d * Math.PI) / 180;
  const x = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2;
  return 2 * R_MI * Math.asin(Math.sqrt(x));
}

const MONATE = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const monat = (iso) => { const [j, m] = String(iso).split('-'); return `${MONATE[+m - 1]} ${j}`; };
const TAGE = [['mon', 'Mon'], ['tue', 'Tue'], ['wed', 'Wed'], ['thu', 'Thu'], ['fri', 'Fri'], ['sat', 'Sat'], ['sun', 'Sun']];

/** Gruppiert Yards nach Staat und Stadt und vergibt Pfade. */
export function struktur(yards) {
  const staaten = new Map();
  for (const y of yards) {
    const st = y.address.state;
    const cs = slugify(y.address.city);
    if (!staaten.has(st)) staaten.set(st, { code: st, name: STAATEN[st] || st, slug: st.toLowerCase(), staedte: new Map() });
    const s = staaten.get(st);
    if (!s.staedte.has(cs)) s.staedte.set(cs, { slug: cs, namen: {}, yards: [], staat: s });
    const c = s.staedte.get(cs);
    c.namen[y.address.city] = (c.namen[y.address.city] || 0) + 1;
    c.yards.push(y);
    y._pfad = `${BASIS}${s.slug}/${cs}/${y.slug}/`;
    y._stadt = c;
  }
  for (const s of staaten.values()) for (const c of s.staedte.values()) {
    c.name = Object.entries(c.namen).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
    c.pfad = `${BASIS}${s.slug}/${c.slug}/`;
    c.mitte = { lat: c.yards.reduce((t, y) => t + y.location.lat, 0) / c.yards.length, lng: c.yards.reduce((t, y) => t + y.location.lng, 0) / c.yards.length };
    c.yards.sort(sortierung);
    // Gleichnamige Filialen in einer Stadt: Straße als Unterscheidung in Titel und H1
    const namen = {};
    for (const y of c.yards) namen[y.name] = (namen[y.name] || 0) + 1;
    for (const y of c.yards) y._titel = namen[y.name] > 1 && y.address.street ? `${y.name} (${y.address.street})` : y.name;
    const titel = {};
    for (const y of c.yards) {
      titel[y._titel] = (titel[y._titel] || 0) + 1;
      if (titel[y._titel] > 1) y._titel = `${y._titel} (${titel[y._titel]})`;
    }
  }
  return [...staaten.values()].sort((a, b) => a.name.localeCompare(b.name));
}

// Featured zuerst, dann geprüft vor ungeprüft, dann Overture (mit Kontaktdaten) vor reinen MSHA-Einträgen, dann Name
function sortierung(a, b) {
  const f = (y) => (y.listing?.tier === 'featured' ? 0 : 1);
  const v = (y) => (y.status === 'active' ? 0 : 1);
  const k = (y) => (y.contact?.phone || y.contact?.website ? 0 : 1);
  return f(a) - f(b) || v(a) - v(b) || k(a) - k(b) || a.name.localeCompare(b.name);
}

/**
 * Erzeugt alle Verzeichnisseiten.
 * @param {object} h Helfer aus build.mjs: { kopf, fuss, esc, rechner, SITE }
 */
export function verzeichnisSeiten(yards, h) {
  const { kopf, fuss, esc, rechner, SITE } = h;
  const abs = (p) => (SITE.baseUrl || '') + p;
  const staaten = struktur(yards);
  const seiten = [];
  const stand = yards.map((y) => y.source?.checked).filter(Boolean).sort().pop();

  const brotkrumen = (teile) => ({
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: teile.map(([name, pfad], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(pfad) })),
  });
  const krumenHtml = (teile) => `<nav class="krumen" aria-label="Breadcrumb">${teile.map(([n, p], i) =>
    i === teile.length - 1 ? `<span aria-current="page">${esc(n)}</span>` : `<a href="${p}">${esc(n)}</a>`).join(' › ')}</nav>`;
  const quelleText = (msha) => `<p class="klein quelle">Listing data: © OpenStreetMap contributors, © Overture Maps Foundation (CDLA-Permissive-2.0)${msha ? '; mine records from the U.S. Mine Safety and Health Administration (public domain)' : ''}. Last checked ${esc(monat(stand))}.</p>`;
  const quelle = quelleText(true);
  const sammeln = (liste) => ({ alle: liste.length, voll: liste.filter(befuellt).length, gruben: liste.filter((y) => y.kind === 'gravel-pit').length });

  const ldBetrieb = (y) => ({
    '@context': 'https://schema.org', '@type': 'HomeAndConstructionBusiness', name: y.name, url: abs(y._pfad),
    address: { '@type': 'PostalAddress', ...(y.address.street ? { streetAddress: y.address.street } : {}),
      addressLocality: y.address.city, addressRegion: y.address.state, postalCode: y.address.zip, addressCountry: 'US' },
    geo: { '@type': 'GeoCoordinates', latitude: y.location.lat, longitude: y.location.lng },
    ...(y.contact?.phone ? { telephone: y.contact.phone } : {}),
    ...(y.contact?.website ? { sameAs: [y.contact.website] } : {}),
  });

  const tel = (p) => p.replace(/[^\d+]/g, '');
  const TEL_ICON = '<svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M6.6 10.8a15.2 15.2 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1L6.6 10.8Z"/></svg>';
  const entf = (mi) => `${mi < 10 ? mi.toFixed(1) : Math.round(mi)} mi`;
  const karte = (y, { mitStadt = false, mi } = {}) => `<li class="yard">
  <div class="yard-text">
    <a class="yard-name" href="${y._pfad}">${esc(y.name)}</a>
    <span class="yard-meta"><span class="tag tag-${esc(y.kind || 'x')}">${esc(ARTEN[y.kind] || 'Supplier')}</span>${y.status === 'active' ? ' <span class="tag tag-ok">Verified</span>' : ''}${mi != null ? ` <span class="entf"><span class="sr">· </span>${entf(mi)}</span>` : ''}</span>
    <span class="yard-adr">${esc([y.address.street, mitStadt ? `${y.address.city}, ${y.address.state}` : y.address.city].filter(Boolean).join(', '))}</span>
    ${y.contact?.phone ? `<span class="yard-tel">${esc(y.contact.phone)}</span>` : ''}
    ${y.contact?.website ? `<a class="karte-web" href="${esc(y.contact.website)}" rel="nofollow noopener" target="_blank">Website</a>` : ''}
  </div>
  ${y.contact?.phone ? `<a class="anruf" href="tel:${esc(tel(y.contact.phone))}" aria-label="Call ${esc(y.name)} at ${esc(y.contact.phone)}">${TEL_ICON}<span>Call</span></a>` : ''}
</li>`;
  const finder = () => `<form class="finder" action="${BASIS}" method="get" role="search" data-finder>
  <label class="finder-titel" for="finder-q">Find yards near you</label>
  <div class="finder-zeile">
    <input id="finder-q" name="q" type="search" placeholder="ZIP code or city" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search">
    <button class="knopf" type="submit">Search</button>
  </div>
  <button type="button" class="finder-ort" hidden><svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm9 3h-2.06A7 7 0 0 0 13 5.06V3h-2v2.06A7 7 0 0 0 5.06 11H3v2h2.06A7 7 0 0 0 11 18.94V21h2v-2.06A7 7 0 0 0 18.94 13H21v-2Zm-9 6a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z"/></svg>Use my location</button>
  <div class="finder-ergebnis" aria-live="polite"></div>
</form>`;
  const raster = (eintraege, id) => `<ul class="raster"${id ? ` id="${id}"` : ''}>${eintraege.map(([name, pfad, zahl]) => `<li><a href="${pfad}"><span>${esc(name)}</span> <span class="zahl">${zahl}</span></a></li>`).join('')}</ul>`;

  // ---------- Übersicht ----------
  const alleStaedte = staaten.flatMap((s) => [...s.staedte.values()]);
  const top = [...alleStaedte].sort((a, b) => b.yards.filter(befuellt).length - a.yards.filter(befuellt).length).slice(0, 24);
  {
    const pfad = BASIS;
    const krumen = [['Home', '/'], ['Landscape supply yards', pfad]];
    seiten.push({ pfad, index: true, typ: 'pages', html: `${kopf({ pfad, nav: 'Find a yard', title: 'Landscape Supply Yards Near You – Mulch, Gravel & Stone',
      description: `Find landscape supply yards, mulch yards, stone yards and sand & gravel suppliers in all ${staaten.length} states. ${yards.filter(befuellt).length.toLocaleString('en-US')} suppliers with address, phone and website, plus gravel pits.`,
      ld: [brotkrumen(krumen)] })}
<main>
<section class="held"><div class="breit">${krumenHtml(krumen)}
  <h1>Landscape Supply Yards</h1>
  <p class="unter">${yards.filter(befuellt).length.toLocaleString('en-US')} landscape supply yards, mulch and stone yards and sand &amp; gravel suppliers across the U.S. – for bulk mulch, gravel, stone and topsoil.</p>
</div></section>
<div class="breit">
<section class="liste-karte">
${finder()}
<h2>Browse by state</h2>
${raster(staaten.map((s) => [s.name, `${BASIS}${s.slug}/`, [...s.staedte.values()].reduce((t, c) => t + c.yards.length, 0)]))}
<h2>Cities with the most yards</h2>
${raster(top.map((c) => [`${c.name}, ${c.staat.code}`, c.pfad, c.yards.length]))}
<a class="hinweis-karte abstand" href="${BASIS}gravel-pits/"><strong>Looking for a gravel pit?</strong><span>${yards.filter((y) => y.kind === 'gravel-pit').length.toLocaleString('en-US')} active sand &amp; gravel pits by state →</span></a>
</section>
${quelle}
</div>
</main>
${fuss()}` });
  }

  // ---------- Staaten ----------
  for (const s of staaten) {
    const pfad = `${BASIS}${s.slug}/`;
    const staedte = [...s.staedte.values()].sort((a, b) => a.name.localeCompare(b.name));
    const alle = staedte.flatMap((c) => c.yards);
    const z = sammeln(alle);
    const mitYards = staedte.filter((c) => c.yards.some((y) => y.kind !== 'gravel-pit'));
    const gross = [...mitYards].sort((a, b) => b.yards.filter(befuellt).length - a.yards.filter(befuellt).length).slice(0, 12);
    const krumen = [['Home', '/'], ['Landscape supply yards', BASIS], [s.name, pfad]];
    const index = z.voll >= MIN_STADT;
    seiten.push({ pfad, index, typ: 'states', html: `${kopf({ pfad, nav: 'Find a yard', noindex: !index, title: `Landscape Supply Yards in ${s.name} – Mulch, Gravel & Stone`.slice(0, 70),
      description: `${z.voll} landscape supply yards, mulch and stone yards and sand & gravel suppliers in ${s.name}${z.gruben ? `, plus ${z.gruben} gravel pits` : ''}. Find bulk mulch, gravel and topsoil near you.`,
      ld: [brotkrumen(krumen)] })}
<main>
<section class="held"><div class="breit">${krumenHtml(krumen)}
  <h1>Landscape Supply Yards in ${esc(s.name)}</h1>
  <p class="unter">${z.voll} suppliers with contact details in ${mitYards.length} ${mitYards.length === 1 ? 'city' : 'cities'}: landscape supply, mulch and stone yards and sand &amp; gravel suppliers${z.gruben ? `, plus ${z.gruben} gravel pits from mine records` : ''}.</p>
</div></section>
<div class="breit">
<section class="liste-karte">
${finder()}
${z.gruben ? `<a class="hinweis-karte" href="${pfad}gravel-pits/"><strong>Gravel pits in ${esc(s.name)}</strong><span>${z.gruben} active sand &amp; gravel pits →</span></a>` : ''}
${staedte.length > 12 ? `<h2>Largest selection</h2>
${raster(gross.map((c) => [c.name, c.pfad, c.yards.length]))}
<h2>All cities in ${esc(s.name)}</h2>` : `<h2>Cities in ${esc(s.name)}</h2>`}
${staedte.length > 15 ? `<label class="sr" for="filter-staedte">Filter cities</label><input class="filter" id="filter-staedte" type="search" data-filter="staedte" placeholder="Filter ${staedte.length} cities…" autocomplete="off" enterkeyhint="search">
<p class="klein filter-leer" hidden>No city with that name – try the ZIP search above.</p>` : ''}
${raster(staedte.map((c) => [c.name, c.pfad, c.yards.length]), 'staedte')}
</section>
${quelleText(z.gruben > 0 || alle.some(istMsha))}
</div>
</main>
${fuss()}` });
  }

  // ---------- Kiesgruben: Übersicht und je Staat ----------
  {
    const proStaatGruben = staaten.map((s) => ({ s, gruben: [...s.staedte.values()].flatMap((c) => c.yards).filter((y) => y.kind === 'gravel-pit') })).filter((x) => x.gruben.length);
    const gesamt = proStaatGruben.reduce((t, x) => t + x.gruben.length, 0);
    const pfad = `${BASIS}gravel-pits/`;
    const krumen = [['Home', '/'], ['Landscape supply yards', BASIS], ['Gravel pits', pfad]];
    seiten.push({ pfad, index: true, typ: 'gravel-pits', html: `${kopf({ pfad, nav: 'Find a yard', title: 'Gravel Pits Near You – Sand & Gravel Pits by State',
      description: `${gesamt.toLocaleString('en-US')} active and intermittent sand & gravel pits in ${proStaatGruben.length} states, from federal mine records: operator, location and directions.`,
      ld: [brotkrumen(krumen)] })}
<main>
<section class="held"><div class="breit">${krumenHtml(krumen)}
  <h1>Gravel Pits by State</h1>
  <p class="unter">${gesamt.toLocaleString('en-US')} active and intermittent sand &amp; gravel pits from federal mine records (MSHA).</p>
</div></section>
<div class="breit">
<section class="liste-karte">
<p>Gravel pits mine sand and gravel straight from the ground. Some sell to the public by the ton if you bring a truck or pay for delivery; many only supply contractors. The mine records list the operator and status, but not phone numbers – look up the operator or call a <a href="${BASIS}">landscape supply yard</a> nearby, which often stocks the same material.</p>
<h2>Choose a state</h2>
${raster(proStaatGruben.map(({ s, gruben }) => [s.name, `${BASIS}${s.slug}/gravel-pits/`, gruben.length]))}
</section>
${quelleText(true)}
</div>
</main>
${fuss()}` });

    for (const { s, gruben } of proStaatGruben) {
      const pfadS = `${BASIS}${s.slug}/gravel-pits/`;
      const krumenS = [['Home', '/'], ['Landscape supply yards', BASIS], [s.name, `${BASIS}${s.slug}/`], ['Gravel pits', pfadS]];
      const nachStadt = new Map();
      for (const y of [...gruben].sort((a, b) => a.address.city.localeCompare(b.address.city) || a.name.localeCompare(b.name))) {
        const c = y._stadt;
        if (!nachStadt.has(c)) nachStadt.set(c, []);
        nachStadt.get(c).push(y);
      }
      const aktiv = gruben.filter((y) => y.msha?.[0]?.status === 'Active').length;
      const index = gruben.length >= MIN_STADT;
      seiten.push({ pfad: pfadS, index, typ: 'gravel-pits', html: `${kopf({ pfad: pfadS, nav: 'Find a yard', noindex: !index,
        title: `Gravel Pits in ${s.name} – ${gruben.length} Sand & Gravel Pits`.slice(0, 70),
        description: `${gruben.length} sand & gravel pits in ${s.name} (${aktiv} active, ${gruben.length - aktiv} intermittent) from federal mine records, with operator, city and directions.`,
        ld: [brotkrumen(krumenS), { '@context': 'https://schema.org', '@type': 'ItemList', name: `Gravel pits in ${s.name}`,
          itemListElement: gruben.map((y, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(y._pfad), name: y.name })) }] })}
<main>
<section class="held"><div class="breit">${krumenHtml(krumenS)}
  <h1>Gravel Pits in ${esc(s.name)}</h1>
  <p class="unter">${gruben.length} sand &amp; gravel pits in ${nachStadt.size} ${nachStadt.size === 1 ? 'town' : 'towns'} – ${aktiv} active, ${gruben.length - aktiv} intermittent.</p>
</div></section>
<div class="breit">
<section class="liste-karte">
<p class="klein">From federal mine records (MSHA): operator and status, no phone numbers. Many pits sell mainly to contractors – for small amounts, a <a href="${BASIS}${s.slug}/">landscape supply yard in ${esc(s.name)}</a> is often easier.</p>
${[...nachStadt].map(([c, liste]) => `<h2>${esc(c.name)}</h2>
<ul class="yards">${liste.map((y) => karte(y)).join('')}</ul>`).join('\n')}
</section>
${quelleText(true)}
</div>
</main>
${fuss()}` });
    }
  }

  // ---------- Städte ----------
  const proStaat = new Map(staaten.map((s) => [s.code, [...s.staedte.values()].flatMap((c) => c.yards)]));
  const zaehlwort = (n, ein, mehr) => `${n} ${n === 1 ? ein : mehr}`;
  for (const s of staaten) for (const c of s.staedte.values()) {
    const z = sammeln(c.yards);
    const nurGruben = z.gruben === z.alle;
    const nachbarn = [...s.staedte.values()].filter((x) => x !== c && x.yards.some(befuellt))
      .map((x) => ({ x, mi: meilen(c.mitte, x.mitte) })).sort((a, b) => a.mi - b.mi).slice(0, 8);
    const umkreis = z.voll < 5
      ? proStaat.get(s.code).filter((y) => y._stadt !== c && befuellt(y)).map((x) => ({ x, mi: meilen(c.mitte, x.location) }))
        .filter((e) => e.mi <= 15).sort((a, b) => a.mi - b.mi).slice(0, 6)
      : [];
    const krumen = [['Home', '/'], ['Landscape supply yards', BASIS], [s.name, `${BASIS}${s.slug}/`], [c.name, c.pfad]];
    const gruppen = GRUPPEN.map((g) => ({ ...g, yards: c.yards.filter((y) => g.arten.includes(y.kind)) })).filter((g) => g.yards.length);
    const itemList = { '@context': 'https://schema.org', '@type': 'ItemList', name: `Landscape supply yards in ${c.name}, ${s.code}`,
      itemListElement: c.yards.map((y, i) => ({ '@type': 'ListItem', position: i + 1, item: ldBetrieb(y) })) };
    const index = z.voll >= MIN_STADT;
    // Titel: mit Anzahl, Materialien nur, wenn Platz ist
    const ort = `${c.name}, ${s.code}`;
    const title = nurGruben
      ? `Gravel Pits near ${ort} – Sand & Gravel`
      : [`Mulch, Gravel & Landscape Supply in ${ort} (${z.voll})`, `Landscape Supply Yards in ${ort} (${z.voll})`, `Landscape Supply in ${ort}`].find((t) => t.length <= 65) || `Landscape Supply in ${ort}`.slice(0, 70);
    const h1 = nurGruben ? `Gravel Pits near ${c.name}, ${s.code}` : `Landscape Supply Yards in ${c.name}, ${s.code}`;
    // Kurztext aus den Daten (je Stadt verschieden)
    const art = (k) => c.yards.filter((y) => y.kind === k).length;
    const teile = [
      [art('landscape-supply'), 'landscape supply yard', 'landscape supply yards'],
      [art('mulch-soil'), 'mulch & topsoil yard', 'mulch & topsoil yards'],
      [art('stone-yard'), 'stone & rock yard', 'stone & rock yards'],
      [art('sand-gravel') + art('quarry'), 'sand & gravel supplier', 'sand & gravel suppliers'],
      [z.gruben, 'gravel pit from mine records', 'gravel pits from mine records'],
    ].filter(([n]) => n).map(([n, a, b]) => zaehlwort(n, a, b));
    const mitWeb = c.yards.filter((y) => y.contact?.website).length;
    const mitTel = c.yards.filter((y) => y.contact?.phone).length;
    const kette = c.yards.filter((y) => y.chain).map((y) => ketteName(y.chain));
    const satz = [
      `${esc(c.name)} has ${esc(teile.length > 1 ? `${teile.slice(0, -1).join(', ')} and ${teile.at(-1)}` : teile[0])}.`,
      mitTel ? `${mitTel === c.yards.length ? (mitTel === 1 ? 'It lists' : 'All list') : `${mitTel} list`} a phone number${mitWeb ? (mitWeb === mitTel && mitTel === c.yards.length ? ' and a website' : `, ${mitWeb} a website`) : ''}.` : '',
      kette.length ? `Chains here: ${esc([...new Set(kette)].join(', '))}.` : '',
      nachbarn.length ? `The closest other cities with suppliers are ${nachbarn.slice(0, 2).map(({ x, mi }) => `${esc(x.name)} (${Math.round(mi)} mi)`).join(' and ')}.` : '',
    ].filter(Boolean).join(' ');
    const beschr = nurGruben
      ? `${zaehlwort(z.gruben, 'sand & gravel pit', 'sand & gravel pits')} near ${c.name}, ${s.name} from federal mine records, plus landscape supply yards nearby and a calculator for tons of gravel.`
      : `${zaehlwort(z.voll, 'supplier', 'suppliers')} for bulk mulch, gravel, stone and topsoil in ${c.name}, ${s.name}: addresses${mitTel ? ', phone numbers' : ''}${mitWeb ? ' and websites' : ''}. Plus a free calculator for how much you need.`;
    const msha = c.yards.some(istMsha);
    seiten.push({ pfad: c.pfad, index, typ: 'cities', html: `${kopf({ pfad: c.pfad, nav: 'Find a yard', noindex: !index, title, description: beschr.slice(0, 165),
      ld: [brotkrumen(krumen), itemList] })}
<main>
<section class="held"><div class="breit">${krumenHtml(krumen)}
  <h1>${esc(h1)}</h1>
  <p class="unter">${satz}</p>
</div></section>
<div class="breit">
<section class="liste-karte">
<nav class="sprung" aria-label="On this page">${gruppen.map((g) => `<a href="#${g.id}">${esc(g.kurz)} <span>${g.yards.length}</span></a>`).join('')}${umkreis.length ? '<a href="#within-15-miles">Within 15 miles</a>' : ''}<a href="#calculator">Calculator</a>${nachbarn.length ? '<a href="#nearby">Nearby cities</a>' : ''}</nav>
${gruppen.map((g) => `<h2 id="${g.id}">${esc(g.titel)} <span class="zahl">${g.yards.length}</span></h2>
${g.hinweis ? `<p class="klein">${esc(g.hinweis)}</p>` : ''}
<ul class="yards">${g.yards.map((y) => karte(y)).join('')}</ul>`).join('\n')}
${umkreis.length ? `<h2 id="within-15-miles">More suppliers within 15 miles</h2>
<ul class="yards">${umkreis.map(({ x, mi }) => karte(x, { mitStadt: true, mi })).join('')}</ul>` : ''}
<p class="klein">Most listings have not been verified by us yet. Please call ahead to confirm materials, prices, delivery and opening hours.</p>
</section>
<h2 class="abstand" id="calculator">How much ${nurGruben ? 'gravel' : 'mulch or gravel'} do you need?</h2>
${rechner({ material: nurGruben ? 'pea-gravel' : 'hardwood-mulch', eingebettet: true }).replace('class="rechner"', 'class="rechner eingebettet"')}
${nachbarn.length ? `<h2 class="abstand" id="nearby">Nearby cities</h2>
${raster(nachbarn.map(({ x, mi }) => [x.name, x.pfad, `${Math.round(mi)} mi`]))}` : ''}
${quelleText(msha)}
</div>
</main>
${fuss()}` });
  }

  // ---------- Unternehmen ----------
  for (const y of yards) {
    const c = y._stadt; const s = c.staat;
    const krumen = [['Home', '/'], ['Landscape supply yards', BASIS], [s.name, `${BASIS}${s.slug}/`], [c.name, c.pfad], [y._titel, y._pfad]];
    const naehe = proStaat.get(s.code).filter((x) => x !== y && befuellt(x)).map((x) => ({ x, mi: meilen(y.location, x.location) }))
      .sort((a, b) => a.mi - b.mi).slice(0, 6);
    const art = ARTEN[y.kind] || 'Supplier';
    const adr = [y.address.street, `${y.address.city}, ${y.address.state} ${y.address.zip}`].filter(Boolean);
    const route = `https://www.google.com/maps/dir/?api=1&destination=${y.location.lat},${y.location.lng}`;
    const mine = (y.msha || []).find((m) => m.match !== 'inactive-nearby');
    const ausMsha = y.source?.dataset?.startsWith('msha');
    const mats = (y.materials || []).filter((m) => h.matById[m.id]);
    const zeiten = y.hours ? TAGE.filter(([k]) => y.hours[k]).map(([k, t]) => `<tr><td>${t}</td><td>${esc(y.hours[k])}</td></tr>`).join('') : '';
    const beschreibung = ausMsha
      ? `${y.name} is a ${y.kind === 'quarry' ? 'quarry' : 'sand and gravel pit'} near ${c.name}, ${s.name}${mine?.commodity ? `, producing ${mine.commodity.toLowerCase()}` : ''}.`
      : `${y.name} is a ${y.kind === 'sand-gravel' ? 'sand and gravel supplier' : art.toLowerCase()} in ${c.name}, ${s.name}.`;
    const index = seiteBefuellt(y);
    seiten.push({ pfad: y._pfad, index, typ: 'yards', html: `${kopf({ pfad: y._pfad, nav: 'Find a yard', noindex: !index,
      title: `${y._titel} – ${c.name}, ${s.code}`.slice(0, 70),
      description: `${beschreibung} Address${y.contact?.phone ? ', phone' : ''}${y.contact?.website ? ', website' : ''} and directions${mats.length ? ', materials' : ''}.`.slice(0, 160),
      ld: [brotkrumen(krumen), ldBetrieb(y)] })}
<main>
<section class="held"><div class="breit">${krumenHtml(krumen)}
  <h1>${esc(y._titel)}</h1>
  <p class="unter">${esc(art)} in ${esc(c.name)}, ${s.code}${y.status === 'active' ? ' · Verified listing' : ''}</p>
</div></section>
<div class="breit">
<section class="liste-karte betrieb">
  <div class="betrieb-daten">
    <h2>Contact &amp; location</h2>
    <p class="adresse">${adr.map(esc).join('<br>')}</p>
    <ul class="kontakt">
      ${y.contact?.phone ? `<li><a class="knopf" href="tel:${esc(tel(y.contact.phone))}">${TEL_ICON}Call ${esc(y.contact.phone)}</a></li>` : ''}
      <li><a class="knopf-zweit" href="${esc(route)}" rel="nofollow noopener" target="_blank">Get directions</a></li>
      ${y.contact?.website ? `<li><a class="knopf-zweit" href="${esc(y.contact.website)}" rel="nofollow noopener" target="_blank">Visit website</a></li>` : ''}
    </ul>
    ${y.status === 'active' ? '<p class="klein"><strong>Verified listing.</strong></p>' : `<p class="klein">${ausMsha
      ? 'Listed from federal mine records (MSHA). Many pits and quarries sell mainly to contractors – call ahead to ask whether they serve homeowners.'
      : 'We have not verified this listing yet. Please call ahead to confirm materials, prices and opening hours.'}</p>`}
    <p class="klein">Is this your business? <a href="mailto:${esc(SITE.operator?.email || '')}?subject=${encodeURIComponent(`Listing: ${y.name} (${y.id})`)}">Request a correction or removal</a>.</p>
  </div>
  <div class="betrieb-info">
    <h2>About</h2>
    <p>${esc(beschreibung)}</p>
    ${mats.length ? `<h3>Materials</h3><ul class="chips">${mats.map((m) => `<li>${esc(h.matById[m.id].label)}${m.price ? ` – $${m.price.amount}/${m.price.unit === 'cy' ? 'cu yd' : m.price.unit}` : ''}</li>`).join('')}</ul>` : ''}
    ${y.delivery?.available ? `<p><strong>Delivery:</strong> yes${y.delivery.radius_mi ? `, up to ${y.delivery.radius_mi} miles` : ''}${y.delivery.fee_from ? `, from $${y.delivery.fee_from}` : ''}</p>` : ''}
    ${y.self_load ? '<p><strong>Pickup:</strong> you can load your own truck or trailer.</p>' : ''}
    ${zeiten ? `<h3>Opening hours</h3><table class="zeiten"><tbody>${zeiten}</tbody></table>` : ''}
    ${y.seasonal ? `<p>${esc(y.seasonal)}</p>` : ''}
    ${mine ? `<h3>Mine record</h3><table class="zeiten"><tbody>
      <tr><td>Status</td><td>${esc(mine.status)}${mine.status_since ? ` (since ${esc(mine.status_since.slice(0, 4))})` : ''}</td></tr>
      ${mine.commodity ? `<tr><td>Product</td><td>${esc(mine.commodity)}</td></tr>` : ''}
      ${mine.operator ? `<tr><td>Operator</td><td>${esc(mine.operator)}</td></tr>` : ''}
      <tr><td>MSHA ID</td><td>${esc(mine.mine_id)}</td></tr></tbody></table>` : ''}
  </div>
</section>
<a class="hinweis-karte abstand" href="${ausMsha ? '/gravel-calculator/' : '/'}"><strong>How much do you need?</strong><span>Calculate ${ausMsha ? 'tons of gravel and sand' : 'cubic yards, tons and bags of mulch, gravel or topsoil'} →</span></a>
${naehe.length ? `<h2 class="abstand">Nearby suppliers</h2>
<ul class="yards">${naehe.map(({ x, mi }) => karte(x, { mitStadt: true, mi })).join('')}</ul>` : ''}
<p class="abstand"><a class="knopf-zweit" href="${c.pfad}">All suppliers in ${esc(c.name)}, ${s.code}</a>${y.kind === 'gravel-pit' ? ` <a class="knopf-zweit" href="${BASIS}${s.slug}/gravel-pits/">All gravel pits in ${esc(s.name)}</a>` : ''}</p>
${quelleText(ausMsha || !!mine)}
</div>
</main>
${fuss()}` });
  }
  return seiten;
}
