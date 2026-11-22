// Baut die statische Website nach public/.
// Läuft automatisch vor jedem "wrangler deploy" (siehe wrangler.jsonc → build.command).
// Keine Abhängigkeiten, nur Node-Bordmittel.
//
// Eingaben:  data/materials.json, data/yards/**/*.json, site.config.json, static/*, src/calc/core.js
// Ausgabe:   public/<seite>/index.html (Rechner + Verzeichnis unter /landscape-supply/), public/assets/*, robots.txt, 404.html (+ sitemap.xml, wenn baseUrl gesetzt)
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { coverage } from '../src/calc/core.js';
import { SEITEN } from './seiten.mjs';
import { ladeYards, verzeichnisSeiten, BASIS } from './verzeichnis.mjs';
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
  const robots = SITE.baseUrl && !seite.noindex ? '' : '<meta name="robots" content="noindex">';
  const ld = seite.ld || [
    {
      '@context': 'https://schema.org', '@type': 'WebApplication', name: seite.h1,
      applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: (SITE.baseUrl || '') + '/' },
        ...(seite.pfad === '/' ? [] : [{ '@type': 'ListItem', position: 2, name: seite.nav, item: (SITE.baseUrl || '') + seite.pfad }]),
      ],
    },
  ];
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
<title>${esc(seite.title)}</title>
<meta name="description" content="${esc(seite.description)}">
${robots}${canonical}
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/style.css?v=${VERSION}">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body>
<header class="kopf"><div class="breit kopf-innen">
  <a class="logo" href="/"><svg aria-hidden="true" viewBox="0 0 32 32" width="28" height="28"><use href="/assets/favicon.svg#m"/></svg>${esc(SITE.shortName)}</a>
  <nav class="menue" aria-label="Calculators">${SEITEN.filter((s) => s.imMenue).map((s) => `<a href="${s.pfad}"${s.pfad === seite.pfad ? ' aria-current="page"' : ''}>${esc(s.nav)}</a>`).join('')}</nav>
  <a class="kopf-cta" href="${BASIS}"${seite.pfad?.startsWith(BASIS) ? ' aria-current="page"' : ''}><svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z"/></svg>Find a yard</a>
</div></header>`;
}

function fuss() {
  return `<footer class="fuss"><div class="breit">
  <p><strong>${esc(SITE.name)}</strong> – free calculators for mulch, gravel, stone and soil.</p>
  <nav aria-label="All calculators">${SEITEN.filter((s) => s.pfad !== '/').map((s) => `<a href="${s.pfad}">${esc(s.h1)}</a>`).join('')}<a href="${BASIS}">Landscape supply yards near you</a></nav>
  <p class="klein">Results are estimates based on typical material weights. Densities vary by supplier and moisture – confirm with your supplier before ordering.</p>
  <nav class="recht" aria-label="Legal"><a href="/imprint/">Imprint</a><a href="/privacy/">Privacy</a><a href="mailto:${esc(SITE.operator.email)}">Contact</a></nav>
</div></footer>
<script type="module" src="/assets/app.js?v=${VERSION}"></script>
</body>
</html>`;
}

function rechner(seite) {
  const opt = MAT.categories.map((c) => `<optgroup label="${esc(c.label)}">${MAT.materials.filter((m) => m.category === c.id)
    .map((m) => `<option value="${m.id}"${m.id === seite.material ? ' selected' : ''}>${esc(m.label)}</option>`).join('')}</optgroup>`).join('');
  const proj = MAT.projects.map((p) => `<option value="${p.id}">${esc(p.label)}</option>`).join('');
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
        <summary>Extra %, bag size &amp; prices</summary>
        <label>Extra for settling &amp; waste (%)<input id="puffer" type="number" inputmode="decimal" min="0" max="50" step="1" value="${seite.nurVolumen ? 0 : m.waste_pct}"></label>
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

function deckungstabelle(seite) {
  const m = matById[seite.material];
  const tiefen = [1, 2, 3, 4, 6].filter((d) => seite.nurVolumen || (d >= m.depth_range_in[0] && d <= Math.max(m.depth_range_in[1], 4)));
  return `<h2>How much area does 1 cubic yard cover?</h2>
<table><thead><tr><th>Depth</th><th>Coverage of 1 cubic yard</th></tr></thead><tbody>
${tiefen.map((d) => `<tr><td>${d} in</td><td>${fmt(coverage({ cy: 1, depthIn: d }))} sq ft</td></tr>`).join('\n')}
</tbody></table>`;
}

function gewichtstabelle(kategorien) {
  const liste = MAT.materials.filter((m) => !kategorien || kategorien.includes(m.category));
  return `<h2>How much does a cubic yard weigh?</h2>
<table><thead><tr><th>Material</th><th>Tons per cubic yard (typical)</th><th>Recommended depth</th></tr></thead><tbody>
${liste.map((m) => `<tr><td>${esc(m.label)}</td><td>${fmt(m.density_range[0], 2)}–${fmt(m.density_range[1], 2)} t</td><td>${m.depth_range_in[0]}–${m.depth_range_in[1]} in</td></tr>`).join('\n')}
</tbody></table>
<p class="klein">Typical values for loose material. Wet material is heavier; ask your supplier for their exact weight.</p>`;
}

function seiteBauen(seite) {
  const andere = SEITEN.filter((s) => s.pfad !== seite.pfad && s.pfad !== '/');
  return `${kopf(seite)}
<main>
<section class="held"><div class="breit">
  <h1>${esc(seite.h1)}</h1>
  <p class="unter">${esc(seite.intro)}</p>
</div></section>
<div class="breit">
${rechner(seite)}
<article class="inhalt">
${seite.inhalt}
${deckungstabelle(seite)}
${seite.nurVolumen ? '' : gewichtstabelle(seite.kategorien)}
${seite.faq?.length ? `<h2>Frequently asked questions</h2>\n${seite.faq.map(([q, a]) => `<details class="faq"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('\n')}` : ''}
<h2>More calculators</h2>
<ul class="kacheln">${andere.map((s) => `<li><a href="${s.pfad}"><strong>${esc(s.h1)}</strong><span>${esc(s.kurz)}</span></a></li>`).join('')}</ul>
</article>
</div>
</main>
${fuss()}`;
}

// ---------- Ausgabe ----------

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

// Verzeichnis: Übersicht, Staaten, Städte, Unternehmen
const YARDS = ladeYards(join(ROOT, 'data/yards'));
const VERZ = verzeichnisSeiten(YARDS, { kopf, fuss, esc, rechner, SITE, matById });
const pfade = new Set();
for (const v of VERZ) {
  if (pfade.has(v.pfad)) throw new Error(`Doppelter Pfad im Verzeichnis: ${v.pfad}`);
  pfade.add(v.pfad);
  const ziel = join(OUT, v.pfad, 'index.html');
  mkdirSync(dirname(ziel), { recursive: true });
  writeFileSync(ziel, v.html);
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
<main><section class="held"><div class="breit"><h1>Page not found</h1><p class="unter">This page doesn't exist (yet). Try one of our calculators:</p>
<ul class="kacheln">${SEITEN.filter((s) => s.pfad !== '/').map((s) => `<li><a href="${s.pfad}"><strong>${esc(s.h1)}</strong><span>${esc(s.kurz)}</span></a></li>`).join('')}</ul></div></section></main>
${fuss()}`.replace('<meta name="robots" content="noindex">', '').replace('<title>', '<meta name="robots" content="noindex">\n<title>'));

writeFileSync(join(OUT, 'robots.txt'), SITE.baseUrl
  ? `User-agent: *\nAllow: /\n\nSitemap: ${SITE.baseUrl}/sitemap.xml\n`
  : 'User-agent: *\nDisallow: /\n');

if (SITE.baseUrl) {
  writeFileSync(join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...SEITEN.map((s) => s.pfad), ...VERZ.filter((v) => v.index).map((v) => v.pfad)].map((p) => `  <url><loc>${SITE.baseUrl}${p}</loc></url>`).join('\n')}
</urlset>
`);
}

console.log(`Build fertig: ${SEITEN.length} Rechnerseiten + ${VERZ.length} Verzeichnisseiten (${YARDS.length} Yards) nach public/ (Version ${VERSION}${SITE.baseUrl ? '' : ', noindex – baseUrl fehlt'})`);
