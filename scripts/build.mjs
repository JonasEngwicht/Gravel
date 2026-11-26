// Baut die statische Website nach public/.
// Läuft automatisch vor jedem "wrangler deploy" (siehe wrangler.jsonc → build.command).
// Keine Abhängigkeiten, nur Node-Bordmittel.
//
// Eingaben:  data/materials.json, data/yards/**/*.json, site.config.json, static/*, src/calc/core.js
// Ausgabe:   public/<seite>/index.html (Rechner + Verzeichnis unter /landscape-supply/), public/assets/*, robots.txt, 404.html (+ sitemap.xml und IndexNow-Dateien, wenn baseUrl gesetzt)
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { coverage, calculate } from '../src/calc/core.js';
import { SEITEN, RECHNER, RATGEBER, STAND } from './seiten.mjs';
import { ladeYards, verzeichnisSeiten, BASIS, zaehlen } from './verzeichnis.mjs';
import { rechtlicheSeiten } from './rechtliches.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public');
const lies = (p) => readFileSync(join(ROOT, p), 'utf8');
const MAT = JSON.parse(lies('data/materials.json'));
const SITE = JSON.parse(lies('site.config.json'));
const VERSION = (process.env.BUILD_DATUM || new Date().toISOString()).replace(/\D/g, '').slice(0, 12);

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const matById = Object.fromEntries(MAT.materials.map((m) => [m.id, m]));
const fmt = (n, d = 0) => n.toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: d });

// ---------- Bausteine ----------

function kopf(seite) {
  const canonical = SITE.baseUrl ? `<link rel="canonical" href="${SITE.baseUrl}${seite.pfad}">` : '';
  const robots = SITE.baseUrl && !seite.noindex ? '' : '<meta name="robots" content="noindex, follow">';
  const ld = seite.ld || standardLd(seite);
  if (seite.faq?.length) ld.push({
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: seite.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  });
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#3d2f22">
<script src="/assets/messung.js?v=${VERSION}" async></script>
<title>${esc(seite.title)}</title>
<meta name="description" content="${esc(seite.description)}">
${robots}${canonical}
${ogTags(seite)}
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<link rel="preload" href="/assets/bitter-700.woff" as="font" type="font/woff" crossorigin>
<link rel="stylesheet" href="/assets/style.css?v=${VERSION}">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body>
<header class="kopf"><div class="breit kopf-innen">
  <a class="logo" href="/"><svg aria-hidden="true" viewBox="0 0 32 32" width="28" height="28"><use href="/assets/favicon.svg#m"/></svg>${esc(SITE.shortName)}</a>
  <nav class="menue" aria-label="Calculators">${[...SEITEN.filter((s) => s.imMenue), { pfad: '/calculators/', nav: 'All calculators' }].map((s) => `<a href="${s.pfad}"${s.pfad === seite.pfad ? ' aria-current="page"' : ''}>${esc(s.nav)}</a>`).join('')}</nav>
  <a class="kopf-cta" href="${BASIS}"${seite.pfad?.startsWith(BASIS) ? ' aria-current="page"' : ''}><svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z"/></svg>Find a yard</a>
</div></header>`;
}

// hinweis: 'rechner' (Seite mit Rechner) | 'daten' (Verzeichnis ohne Rechner) | leer
function fuss({ hinweis } = {}) {
  const text = hinweis === 'rechner'
    ? 'Results are estimates based on typical material weights. Densities vary by supplier and moisture – confirm with your supplier before ordering.'
    : hinweis === 'daten'
      ? 'Listings come from public data (OpenStreetMap, Overture Maps, U.S. mine records) and most are not verified yet. Call ahead to confirm materials, prices and hours.'
      : '';
  return `<footer class="fuss"><div class="breit">
  <p><strong>${esc(SITE.name)}</strong> – free calculators for mulch, gravel, stone and soil.</p>
  <nav aria-label="All calculators">${RECHNER.filter((s) => s.pfad !== '/').map((s) => `<a href="${s.pfad}">${esc(s.h1)}</a>`).join('')}</nav>
  <nav aria-label="Guides">${RATGEBER.map((s) => `<a href="${s.pfad}">${esc(s.nav)}</a>`).join('')}<a href="${BASIS}">Landscape supply yards near you</a><a href="${BASIS}gravel-pits/">Gravel pits by state</a><a href="/about/">About</a></nav>
  ${text ? `<p class="klein">${text}</p>` : ''}
  <nav class="recht" aria-label="Legal"><a href="/imprint/">Imprint</a><a href="/privacy/">Privacy</a><a href="/privacy/#google" data-einwilligung>Cookie settings</a><a href="mailto:${esc(SITE.operator.email)}">Contact</a></nav>
</div></footer>
<script type="module" src="/assets/app.js?v=${VERSION}"></script>
</body>
</html>`;
}

// Zusatzinfos für die eigene Auswahlliste (static/auswahl.js): Farbfeld und eine Zeile Erklärung je Material
const FARBEN = {
  'hardwood-mulch': '#6b4423', 'pine-bark-mulch': '#8b5a2b', 'rubber-mulch': '#7a3428', 'pea-gravel': '#c9b79c',
  'crushed-stone-57': '#8e8e8a', 'crusher-run': '#9d978d', 'river-rock': '#a08d79', 'landscape-rock': '#c7a27a',
  'decomposed-granite': '#c49a6c', topsoil: '#3e2c1e', compost: '#2f2418', 'garden-soil': '#4a3526',
  'fill-dirt': '#8a6a4a', 'masonry-sand': '#d9c49a', 'paver-sand': '#cdb88f', 'play-sand': '#eadbb5',
};
const VERKAUF = { cy: 'cubic yard', ton: 'ton', bag: 'bag' };
const zoll = (d) => ({ 0.25: '¼', 0.5: '½' }[d] || d);
const matInfo = (m) => `${zoll(m.depth_range_in[0])}–${zoll(m.depth_range_in[1])}″ deep · by the ${m.sold_by.map((x) => VERKAUF[x]).join(', ').replace(/, ([^,]*)$/, ' or $1')}`;
const matExtras = (m) => ` data-farbe="${FARBEN[m.id] || '#9a8a78'}" data-info="${esc(matInfo(m))}"`;

function rechner(seite) {
  const opt = MAT.categories.map((c) => `<optgroup label="${esc(c.label)}">${MAT.materials.filter((m) => m.category === c.id)
    .map((m) => `<option value="${m.id}"${matExtras(m)}${m.id === seite.material ? ' selected' : ''}>${esc(m.label)}</option>`).join('')}</optgroup>`).join('');
  const proj = MAT.projects.map((p) => `<option value="${p.id}" data-farbe="${FARBEN[p.material] || ''}" data-info="${esc(`${matById[p.material].label}, ${zoll(p.depth_in)}″ deep`)}">${esc(p.label)}</option>`).join('');
  const m = matById[seite.material];
  const cfg = { material: seite.material, depth: seite.tiefe ?? m.default_depth_in, nurVolumen: !!seite.nurVolumen, shape: seite.form || 'rectangle', cta: !seite.eingebettet };
  return `<form class="rechner" id="rechner" novalidate data-cfg='${esc(JSON.stringify(cfg))}'>
  <div class="spalten">
    <fieldset class="eingabe">
      <legend class="sr">Your project</legend>
      ${seite.nurVolumen ? '' : `<div class="zeile-2">
        <label>Material<select id="material">${opt}</select></label>
        <label>Project <span class="opt">(optional)</span>
          <select id="projekt"><option value="">Pick to prefill…</option>${proj}</select></label>
      </div>
      <p class="hinweis" id="mat-hinweis" hidden></p>`}
      <div class="schritt-kopf">
        <span class="schritt">Area</span>
        <div class="einheiten" role="group" aria-label="Units">
          <button type="button" data-einheit="imperial" aria-pressed="true">ft / in</button>
          <button type="button" data-einheit="metric" aria-pressed="false">m / cm</button>
        </div>
      </div>
      <div id="abschnitte"></div>
      <button type="button" class="knopf-zweit klein-knopf" id="abschnitt-neu">+ Add another area</button>
      <div class="tiefe-block">
        <label for="tiefe" class="schritt">Depth <span class="einheit-tiefe opt">(inches)</span></label>
        <div class="tiefe-zeile">
          <input id="tiefe" type="number" inputmode="decimal" min="0" step="0.25" value="${cfg.depth}" enterkeyhint="done">
          <div class="chips-wahl" id="tiefe-chips" role="group" aria-label="Common depths"></div>
        </div>
        <p class="hinweis" id="tiefe-hinweis"></p>
      </div>
      <details class="erweitert">
        <summary>${seite.nurVolumen ? 'Options: extra %' : 'Options: extra %, top-up, bags &amp; prices'}</summary>
        <label>Extra for settling &amp; waste (%)<input id="puffer" type="number" inputmode="decimal" min="0" max="50" step="1" value="${seite.nurVolumen ? 0 : m.waste_pct}"></label>
        ${seite.nurVolumen ? '' : `<label${m.compaction_pct ? '' : ' hidden'}>Extra for compaction (%)<input id="verdichtung" type="number" inputmode="decimal" min="0" max="50" step="1" value="${m.compaction_pct || 0}"></label>
        <label>Existing layer to top up <span class="opt">(inches, optional)</span><input id="bestand" type="number" inputmode="decimal" min="0" step="0.25" placeholder="e.g. 1"></label>`}
        ${seite.nurVolumen ? '' : `<label>Bag size<select id="sack"></select></label>
        <div class="preise">
          <label>$ per cubic yard<input id="p-cy" type="number" inputmode="decimal" min="0" step="1" placeholder="e.g. 40"></label>
          <label>$ per ton<input id="p-t" type="number" inputmode="decimal" min="0" step="1" placeholder="e.g. 45"></label>
          <label>$ per bag<input id="p-sack" type="number" inputmode="decimal" min="0" step="0.1" placeholder="e.g. 4"></label>
          <label>Delivery fee ($)<input id="p-lief" type="number" inputmode="decimal" min="0" step="1" placeholder="e.g. 75"></label>
        </div>`}
      </details>
      <button type="submit" class="knopf rechnen-knopf">Show result</button>
    </fieldset>
    <section class="ergebnis" id="ergebnis" tabindex="-1" aria-live="polite" aria-label="Result">
      <p class="leer">Enter length and width – your result shows up here instantly.</p>
    </section>
  </div>
  <div class="ergebnis-leiste" id="leiste" hidden>
    <p id="leiste-text"></p>
    <button type="button" class="leiste-knopf" id="leiste-knopf">Details</button>
  </div>
</form>`;
}

// ---------- Strukturierte Daten und Vorschau ----------

const abs = (p) => (SITE.baseUrl || '') + p;
const MONATE = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const standText = (st) => { const [j, m] = st.split('-'); return `${MONATE[+m - 1]} ${j}`; };

function krumen(seite) {
  const k = [{ name: 'Home', pfad: '/' }];
  if (seite.art === 'ratgeber') k.push({ name: 'Guides', pfad: '/guides/' });
  if (seite.pfad !== '/') k.push({ name: seite.nav, pfad: seite.pfad });
  return k;
}

function standardLd(seite) {
  const ld = [];
  if (seite.pfad === '/') {
    ld.push(
      { '@context': 'https://schema.org', '@type': 'WebSite', name: SITE.name, url: abs('/') },
      { '@context': 'https://schema.org', '@type': 'Organization', name: SITE.name, url: abs('/'), logo: abs('/assets/og.png') },
    );
  }
  if (seite.art === 'ratgeber') {
    ld.push({
      '@context': 'https://schema.org', '@type': 'Article', headline: seite.h1, description: seite.description,
      dateModified: `${seite.stand || STAND}-01`, image: abs('/assets/og.png'),
      author: { '@type': 'Organization', name: SITE.name, url: abs('/about/') },
      publisher: { '@type': 'Organization', name: SITE.name, logo: { '@type': 'ImageObject', url: abs('/assets/og.png') } },
      mainEntityOfPage: abs(seite.pfad),
    });
  } else if (seite.art === 'info') {
    ld.push({ '@context': 'https://schema.org', '@type': seite.hub ? 'CollectionPage' : 'AboutPage', name: seite.h1, url: abs(seite.pfad) });
  } else if (seite.art) {
    ld.push({
      '@context': 'https://schema.org', '@type': 'WebApplication', name: seite.h1, url: abs(seite.pfad),
      applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    });
  }
  ld.push({
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: krumen(seite).map((k, i) => ({ '@type': 'ListItem', position: i + 1, name: k.name, item: abs(k.pfad) })),
  });
  return ld;
}

function ogTags(seite) {
  const url = SITE.baseUrl ? `\n<meta property="og:url" content="${SITE.baseUrl}${seite.pfad}">` : '';
  return `<meta property="og:type" content="${seite.art === 'ratgeber' ? 'article' : 'website'}">
<meta property="og:site_name" content="${esc(SITE.name)}">
<meta property="og:title" content="${esc(seite.title)}">
<meta property="og:description" content="${esc(seite.description)}">${url}
<meta property="og:image" content="${abs('/assets/og.png')}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">`;
}

// ---------- Tabellen und Bausteine ----------

const tabelle = (kopfzeile, zeilen) => `<table><thead><tr>${kopfzeile.map((k) => `<th>${k}</th>`).join('')}</tr></thead><tbody>
${zeilen.map((z) => `<tr>${z.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('\n')}
</tbody></table>`;
const name = (m) => m.label.replace(/ \(.*\)$/, '').toLowerCase();
const STANDARDSAECKE = { mulch: [1.5, 2, 3], soil: [0.75, 1, 1.5, 2], gravel: [0.5], sand: [0.5] };
const saeckeVon = (m) => [...new Set([...m.bag_cu_ft, ...(STANDARDSAECKE[m.category] || [])])].sort((a, b) => a - b);
const lbProCy = (t) => Math.round((t * 2000) / 50) * 50;

// Überschriften der Tabellen: seite.ue[block] überschreibt, sonst Standard mit seite.stoff (Suchbegriff, z. B. 'mulch')
const ue = (seite, block, standard) => esc(seite.ue?.[block] || standard);
const stoffVon = (seite) => seite.stoff || name(matById[seite.material]);

const BLOECKE = {
  deckung(seite) {
    const m = matById[seite.material];
    const tiefen = [1, 2, 3, 4, 6].filter((d) => seite.nurVolumen || (d >= m.depth_range_in[0] && d <= Math.max(m.depth_range_in[1], 4)));
    return `<h2>${ue(seite, 'deckung', seite.nurVolumen ? 'How many square feet does a cubic yard cover?' : `How much area does a yard of ${stoffVon(seite)} cover?`)}</h2>
${tabelle(['Depth', 'Coverage of 1 cubic yard'], tiefen.map((d) => [`${d} in`, `${fmt(coverage({ cy: 1, depthIn: d }))} sq ft`]))}`;
  },
  gewicht(seite) {
    if (seite.nurVolumen) return '';
    const liste = MAT.materials.filter((m) => !seite.kategorien || seite.kategorien.includes(m.category));
    return `<h2>${ue(seite, 'gewicht', `How much does a yard of ${stoffVon(seite)} weigh?`)}</h2>
${tabelle(['Material', 'Tons per cubic yard (typical)', 'Recommended depth'], liste.map((m) => [esc(m.label), `${fmt(m.density_range[0], 2)}–${fmt(m.density_range[1], 2)} t`, `${m.depth_range_in[0]}–${m.depth_range_in[1]} in`]))}
<p class="klein">Typical values for loose material. Wet material is heavier; ask your supplier for their exact weight.</p>`;
  },
  saecke(seite) {
    const m = matById[seite.material];
    const d = seite.tiefe ?? m.default_depth_in;
    return `<h2>${ue(seite, 'saecke', `How many bags of ${stoffVon(seite)} are in a yard?`)}</h2>
${tabelle(['Bag size', 'Bags per cubic yard', `One bag covers at ${d} in`], saeckeVon(m).map((b) => [`${b} cu ft`, fmt(27 / b, 1), `${fmt((b * 12) / d, 1)} sq ft`]))}
<p class="klein">1 cubic yard = 27 cubic feet. Round up to whole bags when you buy.</p>`;
  },
  yardsZuSaecken() {
    const groessen = [1.5, 2, 3];
    return `<h2>Bags of mulch for 1 to 10 yards</h2>
${tabelle(['Cubic yards', 'Cubic feet', ...groessen.map((g) => `Bags of ${g} cu ft`)], [1, 2, 3, 4, 5, 6, 8, 10].map((y) => [y, fmt(y * 27), ...groessen.map((g) => fmt(Math.ceil((y * 27) / g)))]))}`;
  },
  sackDeckung() {
    return `<h2>How much area does a bag of mulch cover?</h2>
${tabelle(['Depth', '1.5 cu ft bag', '2 cu ft bag', '3 cu ft bag'], [1, 2, 3, 4].map((d) => [`${d} in`, ...[1.5, 2, 3].map((g) => `${fmt((g * 12) / d, 1)} sq ft`)]))}`;
  },
  tonneDeckung(seite) {
    const m = matById[seite.material];
    return `<h2>${ue(seite, 'tonneDeckung', `How much area does a ton of ${stoffVon(seite)} cover?`)}</h2>
${tabelle(['Depth', 'Coverage of 1 ton', 'Tons per 100 sq ft'], [1, 2, 3, 4].map((d) => [`${d} in`, `${fmt(coverage({ cy: 1 / m.density_tons_per_cy, depthIn: d }))} sq ft`, `${fmt((100 * d / 324) * m.density_tons_per_cy, 2)} t`]))}
<p class="klein">Based on ${fmt(m.density_tons_per_cy, 2)} tons per cubic yard, before extra for waste.</p>`;
  },
  einfahrt(seite) {
    const top = matById['crushed-stone-57'], base = matById['crusher-run'];
    const t = (w, d, m) => fmt((100 * w * d / 324) * m.density_tons_per_cy, 1);
    return `<h2>${ue(seite, 'einfahrt', 'Tons of gravel per 100 feet of driveway')}</h2>
${tabelle(['Width', '#57 stone, 2 in', '#57 stone, 4 in', 'Crusher run base, 6 in'], [10, 12, 16, 20].map((w) => [`${w} ft`, `${t(w, 2, top)} t`, `${t(w, 4, top)} t`, `${t(w, 6, base)} t`]))}
<p class="klein">Before extra for waste and compaction (add 10–15 %).</p>`;
  },
  beete(seite) {
    const masse = [[4, 4], [3, 6], [4, 6], [2, 8], [4, 8], [4, 12]];
    return `<h2>${ue(seite, 'beete', 'Soil for common raised bed sizes')}</h2>
${tabelle(['Bed size', '6 in deep', '10 in deep', '12 in deep', '18 in deep'], masse.map(([a, b]) => [`${a} × ${b} ft`, ...[6, 10, 12, 18].map((d) => { const cf = (a * b * d) / 12; return `${fmt(cf, 1)} cu ft (${fmt(cf / 27, 2)} yd)`; })]))}
<p class="klein">Without extra for settling. Bags: divide cubic feet by the bag size.</p>`;
  },
  umrechnung(seite) {
    const liste = MAT.materials.filter((m) => m.category !== 'mulch' || m.id === 'hardwood-mulch');
    return `<h2>${ue(seite, 'umrechnung', 'Cubic yards to tons by material')}</h2>
${tabelle(['Material', '1 cubic yard weighs', '1 ton equals', '1 ton equals'], liste.map((m) => [esc(m.label), `${fmt(m.density_tons_per_cy, 2)} t (${fmt(lbProCy(m.density_tons_per_cy))} lb)`, `${fmt(1 / m.density_tons_per_cy, 2)} cu yd`, `${fmt(27 / m.density_tons_per_cy, 1)} cu ft`]))}
<h2>Conversion chart for gravel (1.4 tons per cubic yard)</h2>
${tabelle(['Cubic yards', 'Tons', 'Tons', 'Cubic yards'], [1, 2, 3, 5, 10, 15, 20].map((n) => [n, fmt(n * 1.4, 1), n, fmt(n / 1.4, 2)]))}`;
  },
  mulchGewicht() {
    const liste = ['hardwood-mulch', 'pine-bark-mulch', 'rubber-mulch', 'compost'].map((id) => matById[id]);
    return `<h2>Mulch weight chart</h2>
${tabelle(['Material', 'Per cubic yard', 'Per 2 cu ft bag', 'Per 3 cu ft bag'], liste.map((m) => { const [a, b] = m.density_range; const proCf = (t) => (t * 2000) / 27; return [esc(m.label), `${fmt(lbProCy(a))}–${fmt(lbProCy(b))} lb`, `${fmt(proCf(a) * 2)}–${fmt(proCf(b) * 2)} lb`, `${fmt(proCf(a) * 3)}–${fmt(proCf(b) * 3)} lb`]; }))}
<p class="klein">Typical ranges; wet material can be heavier. Rubber mulch is mostly sold in 0.8 and 1.5 cu ft bags (about 16–23 lb per 0.8 cu ft).</p>`;
  },
  gewichtStein() {
    const liste = MAT.materials.filter((m) => m.category === 'gravel' || m.category === 'sand');
    return `<h2>Gravel and sand weight chart</h2>
${tabelle(['Material', 'Tons per cubic yard', 'Pounds per cubic yard', '1 ton equals'], liste.map((m) => [esc(m.label), `${fmt(m.density_range[0], 2)}–${fmt(m.density_range[1], 2)} t`, `${fmt(lbProCy(m.density_range[0]))}–${fmt(lbProCy(m.density_range[1]))} lb`, `${fmt(1 / m.density_tons_per_cy, 2)} cu yd`]))}`;
  },
  lkw() {
    return `<h2>Dump truck capacity chart</h2>
${tabelle(['Truck', 'Gravel per load', 'Volume', 'Good for'], [
      ['Pickup truck (half-ton)', 'Under 1 ton', 'About ½ cu yd of gravel', 'Small beds, bags'],
      ['Single-axle dump truck', '6–10 tons', '5–8 cu yd', 'Residential deliveries, tight access'],
      ['Tandem dump truck (10-wheeler)', '12–16 tons', '10–14 cu yd', 'Most driveway and yard deliveries'],
      ['Tri-axle dump truck', '18–25 tons', '14–16 cu yd', 'Large driveways, commercial jobs'],
    ])}
<p class="klein">Typical ranges. Legal loads depend on the truck’s rating and state weight limits – your supplier knows what their trucks carry.</p>`;
  },
};

function standardBloecke(seite) {
  if (seite.bloecke) return seite.bloecke;
  if (seite.art === 'rechner') return ['deckung', 'gewicht'];
  return [];
}

// Rechenbeispiel mit den echten Werten aus core.js
function beispiel(seite) {
  if (!seite.beispiel) return '';
  const { laenge, breite, tiefe } = seite.beispiel;
  const m = matById[seite.material];
  const r = calculate({ sqft: laenge * breite, depthIn: tiefe, material: m, wastePct: 0, compactionPct: 0 });
  const mit = calculate({ sqft: laenge * breite, depthIn: tiefe, material: m, bagCuFt: m.bag_cu_ft.includes(2) ? 2 : undefined });
  const teile = [`<strong>${fmt(r.cy, 2)} cubic yards</strong> (${fmt(r.cuFt)} cu ft)`];
  if (!seite.nurVolumen) teile.push(`about ${fmt(r.tons, 1)} tons`);
  if (!seite.nurVolumen && mit.bags) teile.push(`${fmt(mit.bags)} bags of ${mit.bagSize} cu ft with ${m.waste_pct} % extra${m.compaction_pct ? ` and ${m.compaction_pct} % for compaction` : ''}`);
  else if (!seite.nurVolumen && m.compaction_pct) teile.push(`about ${fmt(mit.tons, 1)} tons with ${m.waste_pct} % extra and ${m.compaction_pct} % for compaction`);
  return `<p class="tipp"><strong>Example:</strong> ${laenge} × ${breite} ft (${fmt(laenge * breite)} sq ft) at ${tiefe} in deep needs ${teile.join(', ')}${seite.nurVolumen ? '' : ` of ${name(m)}`}.</p>`;
}

// Formel in einem Satz + Zahlenbeispiel direkt unter der H1 (Rechner und Umrechner)
function formelZeile(seite) {
  if (seite.art === 'umrechner') {
    const m = matById[seite.material];
    return `<p class="formel"><strong>Formula:</strong> tons = cubic yards × weight per cubic yard. <strong>Example:</strong> 5 cubic yards of ${name(m)} × ${fmt(m.density_tons_per_cy, 2)} = ${fmt(5 * m.density_tons_per_cy, 1)} tons.</p>`;
  }
  if (seite.art !== 'rechner' || !seite.beispiel) return '';
  const { laenge, breite, tiefe } = seite.beispiel;
  const m = matById[seite.material];
  const r = calculate({ sqft: laenge * breite, depthIn: tiefe, material: m, wastePct: 0, compactionPct: 0 });
  const tonnen = !seite.nurVolumen && m.sold_by[0] === 'ton';
  return `<p class="formel"><strong>Formula:</strong> length × width (ft) × depth (in) ÷ 324 = cubic yards${tonnen ? `; × ${fmt(m.density_tons_per_cy, 2)} = tons` : ''}. <strong>Example:</strong> ${laenge} × ${breite} ft at ${tiefe} in = ${fmt(r.cy, 2)} cubic yards${tonnen ? ` ≈ ${fmt(r.tons, 1)} tons` : ''}.</p>`;
}

function verwandtBlock(seite) {
  const liste = (seite.verwandt || []).map((p) => SEITEN.find((s) => s.pfad === p)).filter(Boolean);
  if (!liste.length) return '';
  return `<h2>Related</h2>
<ul class="kacheln">${liste.map((s) => `<li><a href="${s.pfad}"><span class="kachel-titel">${esc(s.h1)}</span> <span>${esc(s.kurz)}</span></a></li>`).join('')}</ul>`;
}

const kacheln = (liste) => `<ul class="kacheln">${liste.map((s) => `<li><a href="${s.pfad}"><span class="kachel-titel">${esc(s.h1)}</span> <span>${esc(s.kurz)}</span></a></li>`).join('')}</ul>`;

function umrechnerForm(seite) {
  const m = matById[seite.material];
  const opt = MAT.categories.map((c) => `<optgroup label="${esc(c.label)}">${MAT.materials.filter((x) => x.category === c.id)
    .map((x) => `<option value="${x.id}" data-t="${x.density_tons_per_cy}" data-min="${x.density_range[0]}" data-max="${x.density_range[1]}" data-farbe="${FARBEN[x.id] || '#9a8a78'}" data-info="≈ ${x.density_tons_per_cy} tons per cubic yard"${x.id === m.id ? ' selected' : ''}>${esc(x.label)}</option>`).join('')}</optgroup>`).join('');
  return `<form class="rechner" id="umrechner" novalidate>
  <div class="spalten">
    <fieldset class="eingabe">
      <legend class="sr">Convert</legend>
      <label>Material<select id="u-material">${opt}</select></label>
      <div class="schritt-kopf"><span class="schritt">Convert</span>
        <div class="einheiten" role="group" aria-label="Direction">
          <button type="button" data-richtung="cy" aria-pressed="true">Yards → tons</button>
          <button type="button" data-richtung="t" aria-pressed="false">Tons → yards</button>
        </div>
      </div>
      <label for="u-wert" class="schritt" id="u-label">Cubic yards</label>
      <input id="u-wert" type="number" inputmode="decimal" min="0" step="0.5" value="1" enterkeyhint="done">
    </fieldset>
    <section class="ergebnis" id="u-ergebnis" tabindex="-1" aria-live="polite" aria-label="Result">
      <p class="gross"><span>${fmt(m.density_tons_per_cy, 2)}</span> tons</p>
      <p class="neben">1 cubic yard of ${name(m)} · range ${fmt(m.density_range[0], 2)}–${fmt(m.density_range[1], 2)} tons · ${fmt(lbProCy(m.density_tons_per_cy))} lb</p>
    </section>
  </div>
</form>`;
}

// Rechner → Verzeichnis: größte Städte + alle Staaten; Kies/Stein/Sand zusätzlich Kiesgruben
function naheBlock(seite) {
  if (seite.art !== 'rechner' && seite.art !== 'umrechner') return '';
  const m = matById[seite.material];
  const stein = ['gravel', 'sand'].includes(m.category) && !seite.nurVolumen;
  const stoff = seite.nurVolumen ? 'landscape materials' : stoffVon(seite);
  return `<h2 id="near-you">Find bulk ${esc(stoff)} near you</h2>
<p>Landscape supply yards sell ${esc(stoff)} by the ${m.sold_by[0] === 'ton' && !seite.nurVolumen ? 'ton' : 'cubic yard'} – usually much cheaper than bags. Yards in the largest metro areas:</p>
<ul class="raster">${METROS.map((c) => `<li><a href="${c.pfad}"><span>${esc(c.name)}, ${c.staat.code}</span> <span class="zahl">${zaehlen(c.yards).yards}</span></a></li>`).join('')}</ul>
<p><a class="knopf-zweit" href="${BASIS}">All states &amp; ZIP search</a>${stein ? ` <a class="knopf-zweit" href="${BASIS}gravel-pits/">Gravel pits by state</a>` : ''}</p>`;
}

function hubInhalt(seite) {
  if (seite.hub === 'ratgeber') return kacheln(RATGEBER);
  return `<h2>Calculators</h2>
${kacheln(RECHNER)}
<h2 id="guides">Guides</h2>
${kacheln(RATGEBER)}
<h2>Find a supplier</h2>
<ul class="kacheln"><li><a href="${BASIS}"><span class="kachel-titel">Landscape supply yards</span> <span>Mulch, gravel and stone yards by state and city</span></a></li><li><a href="${BASIS}gravel-pits/"><span class="kachel-titel">Gravel pits by state</span> <span>Active sand &amp; gravel pits from mine records</span></a></li></ul>`;
}

function seiteBauen(seite) {
  const art = seite.art || 'rechner';
  const kreis = RECHNER.filter((s) => s.pfad !== seite.pfad && s.pfad !== '/');
  const werkzeug = art === 'rechner' || art === 'ratgeber' ? rechner(seite) : art === 'umrechner' ? umrechnerForm(seite) : '';
  const krumenHtml = art === 'ratgeber' ? `<nav class="krumen" aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/guides/">Guides</a></nav>` : '';
  const faq = seite.faq?.length
    ? `<h2>Frequently asked questions</h2>\n${seite.faq.map(([q, a]) => `<details class="faq"><summary><h3>${esc(q)}</h3></summary><p>${esc(a)}</p></details>`).join('\n')}`
    : '';
  const quellen = seite.quellen?.length
    ? `<p class="klein quelle">Sources: ${seite.quellen.map(([t, u]) => `<a href="${u}" rel="nofollow noopener">${esc(t)}</a>`).join(' · ')}</p>`
    : '';
  const stand = art === 'info' ? '' : `<p class="klein">Last reviewed ${standText(seite.stand || STAND)} · <a href="/about/">How we calculate</a></p>`;
  return `${kopf(seite)}
<main>
<section class="held"><div class="breit">${krumenHtml}
  <h1>${esc(seite.h1)}</h1>
  <p class="unter">${esc(seite.intro)}</p>
  ${formelZeile(seite)}
</div></section>
<div class="breit">
${werkzeug}
<article class="inhalt">
${beispiel(seite)}
${seite.inhalt || ''}
${seite.hub ? hubInhalt(seite) : ''}
${standardBloecke(seite).map((b) => BLOECKE[b](seite)).join('\n')}
${faq}
${quellen}
${verwandtBlock(seite)}
${naheBlock(seite)}
${art === 'info' ? '' : `<h2>More calculators</h2>\n${kacheln(kreis.filter((s) => !(seite.verwandt || []).includes(s.pfad)))}`}
${stand}
</article>
</div>
</main>
${fuss({ hinweis: art === 'info' ? '' : 'rechner' })}`;
}

// ---------- Ausgabe ----------

// Verzeichnis zuerst: die Rechnerseiten verlinken die größten Städte daraus
// Verzeichnis: Übersicht, Staaten, Städte, Unternehmen
const YARDS = ladeYards(join(ROOT, 'data/yards'));
const VERZ = verzeichnisSeiten(YARDS, { kopf, fuss, esc, rechner, SITE, matById });
const pfade = new Set();
const schreibeVerzeichnis = () => { for (const v of VERZ) {
  if (pfade.has(v.pfad)) throw new Error(`Doppelter Pfad im Verzeichnis: ${v.pfad}`);
  pfade.add(v.pfad);
  const ziel = join(OUT, v.pfad, 'index.html');
  mkdirSync(dirname(ziel), { recursive: true });
  writeFileSync(ziel, v.html);
} };


// Größte indexierbare Städte für „Find bulk … near you“ auf den Rechnerseiten
const METROS = VERZ.staedte.filter((c) => c.index).sort((a, b) => zaehlen(b.yards).yards - zaehlen(a.yards).yards || a.name.localeCompare(b.name)).slice(0, 16);

rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, 'assets'), { recursive: true });
cpSync(join(ROOT, 'static'), join(OUT, 'assets'), { recursive: true });
cpSync(join(ROOT, 'src/calc/core.js'), join(OUT, 'assets/core.js'));
// Materialdaten ohne _meta für den Browser
writeFileSync(join(OUT, 'assets/materials.json'), JSON.stringify({ categories: MAT.categories, materials: MAT.materials, projects: MAT.projects }));

for (const seite of SEITEN) {
  const ziel = join(OUT, seite.pfad, 'index.html');
  mkdirSync(dirname(ziel), { recursive: true });
  writeFileSync(ziel, seiteBauen(seite).replace(/<table>/g, '<div class="tabelle"><table>').replace(/<\/table>/g, '</table></div>'));
}

schreibeVerzeichnis();

// Rechtliches: Imprint und Privacy Policy (noindex, nicht in der Sitemap)
for (const r of rechtlicheSeiten(SITE, esc)) {
  const ziel = join(OUT, r.pfad, 'index.html');
  mkdirSync(dirname(ziel), { recursive: true });
  writeFileSync(ziel, `${kopf({ ...r, noindex: true, ld: [] })}
<main>
<section class="held"><div class="breit"><h1>${esc(r.h1)}</h1><p class="unter">${esc(r.intro)}</p></div></section>
<div class="breit"><article class="inhalt recht-text">
${r.inhalt}
</article></div>
</main>
${fuss()}`);
}

// Suchindex für "Find a yard" (ZIP, Stadt, Standort). Der Browser lädt ihn erst, wenn jemand sucht.
writeFileSync(join(OUT, 'assets/yards.json'), JSON.stringify(YARDS.map((y) => [
  +y.location.lat.toFixed(4), +y.location.lng.toFixed(4), y._titel, y.address.city, y.address.state, y.kind,
  y._pfad.slice(BASIS.length), y.contact?.phone || '', y.status === 'active' ? 1 : 0,
])));
const staedteIndex = new Map();
for (const y of YARDS) staedteIndex.set(y._stadt.pfad, [y._stadt.name, y.address.state, y._stadt.pfad.slice(BASIS.length), y._stadt.yards.length]);
writeFileSync(join(OUT, 'assets/cities.json'), JSON.stringify([...staedteIndex.values()]));
cpSync(join(ROOT, 'data/zip-centroids'), join(OUT, 'assets/zip'), { recursive: true });

writeFileSync(join(OUT, '404.html'), `${kopf({ pfad: '/404', title: 'Page not found', description: 'Page not found', h1: 'Page not found', nav: '404' })}
<main><section class="held"><div class="breit"><h1>Page not found</h1><p class="unter">This page doesn't exist (yet). Search for a yard, or pick a calculator below.</p></div></section>
<div class="breit"><article class="inhalt">
<form class="finder" action="${BASIS}" method="get" role="search">
  <label class="finder-titel" for="finder-404">Find landscape supply yards near you</label>
  <div class="finder-zeile"><input id="finder-404" name="q" type="search" placeholder="ZIP code or city" autocomplete="off" enterkeyhint="search"><button class="knopf" type="submit">Search</button></div>
</form>
<ul class="kacheln"><li><a href="${BASIS}"><span class="kachel-titel">Landscape supply yards</span> <span>By state and city</span></a></li><li><a href="${BASIS}gravel-pits/"><span class="kachel-titel">Gravel pits</span> <span>By state</span></a></li><li><a href="/guides/"><span class="kachel-titel">Guides</span> <span>Bags, weights, truckloads</span></a></li></ul>
<h2>Calculators</h2>
${kacheln(RECHNER)}
</article></div></main>
${fuss()}`.replace('<meta name="robots" content="noindex, follow">', '').replace('<title>', '<meta name="robots" content="noindex">\n<title>'));

writeFileSync(join(OUT, 'robots.txt'), SITE.baseUrl
  ? `User-agent: *\nAllow: /\n\nSitemap: ${SITE.baseUrl}/sitemap.xml\n`
  : 'User-agent: *\nDisallow: /\n');

// Sitemaps nach Seitentyp, damit die Search Console die Indexierung je Typ zeigt.
// Nur indexierbare Seiten: Verzeichnisseiten ohne genug Inhalt haben noindex und fehlen hier.
const SITEMAPS = {
  pages: SEITEN.filter((s) => !s.noindex).map((s) => s.pfad),
  states: [], cities: [], materials: [], yards: [], 'gravel-pits': [],
};
for (const v of VERZ.filter((x) => x.index)) (SITEMAPS[v.typ] || SITEMAPS.pages).push(v.pfad);
// lastmod = Tag der letzten inhaltlichen Änderung je Seite. Gemessen wird ein Hash aus Titel, Description und <main>
// (Kopf, Fußzeile und Build-Version zählen nicht). data/lastmod.json (im Repo) merkt sich Hash und Datum; ändert sich
// der Hash, gilt das Build-Datum. Nach inhaltlichen Änderungen: npm run build && npm run lastmod, Datei mit committen.
const HEUTE = (process.env.BUILD_DATUM || new Date().toISOString()).slice(0, 10);
const inhaltsHash = (html) => {
  const t = html.match(/<title>.*?<\/title>/s)?.[0] || '';
  const d = html.match(/<meta name="description"[^>]*>/)?.[0] || '';
  const m = html.slice(html.indexOf('<main>'), html.lastIndexOf('</main>'));
  return createHash('sha1').update(t + d + m.replaceAll(`?v=${VERSION}`, '')).digest('hex').slice(0, 16);
};
if (SITE.baseUrl) {
  const altPfad = join(ROOT, 'data/lastmod.json');
  const alt = existsSync(altPfad) ? JSON.parse(readFileSync(altPfad, 'utf8')) : {};
  const stand = {};
  for (const p of Object.values(SITEMAPS).flat()) {
    const h = inhaltsHash(readFileSync(join(OUT, p, 'index.html'), 'utf8'));
    stand[p] = [h, alt[p]?.[0] === h ? alt[p][1] : HEUTE];
  }
  writeFileSync(join(OUT, 'lastmod.json'), JSON.stringify(stand, null, 0).replace(/\],"/g, '],\n"'));
  const urlset = (liste) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${liste.map((p) => `  <url><loc>${SITE.baseUrl}${p}</loc><lastmod>${stand[p][1]}</lastmod></url>`).join('\n')}
</urlset>
`;
  const teile = Object.entries(SITEMAPS).filter(([, l]) => l.length);
  for (const [n, l] of teile) writeFileSync(join(OUT, `sitemap-${n}.xml`), urlset(l));
  writeFileSync(join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${teile.map(([n, l]) => `  <sitemap><loc>${SITE.baseUrl}/sitemap-${n}.xml</loc><lastmod>${l.map((p) => stand[p][1]).sort().pop()}</lastmod></sitemap>`).join('\n')}
</sitemapindex>
`);
  // IndexNow (Bing, Yandex, Seznam …): Schlüsseldatei im Wurzelverzeichnis und eine Liste aller indexierbaren
  // URLs mit Inhalts-Hash. Der Worker meldet täglich nur URLs, deren Hash sich seit der letzten Meldung geändert hat.
  if (SITE.indexNowKey) {
    writeFileSync(join(OUT, `${SITE.indexNowKey}.txt`), SITE.indexNowKey);
    const urls = Object.fromEntries(Object.entries(stand).map(([p, [h]]) => [`${SITE.baseUrl}${p}`, h]));
    writeFileSync(join(OUT, 'indexnow.json'), JSON.stringify({ baseUrl: SITE.baseUrl, key: SITE.indexNowKey, urls }));
  }
}

console.log(`Build fertig: ${SEITEN.length} Seiten + ${VERZ.length} Verzeichnisseiten (${VERZ.filter((v) => v.index).length} indexierbar, ${YARDS.length} Einträge) nach public/ (Version ${VERSION}${SITE.baseUrl ? '' : ', noindex – baseUrl fehlt'})`);
