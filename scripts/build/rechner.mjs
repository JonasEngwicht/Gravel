// Build, Teil „rechner“: Startseite und Rechnerseiten.
// Rechenlogik: static/calc.js (gemeinsam für Build und Browser, wie static/helfer.js bei Hofladen).
import { coverage, CU_FT_PER_CY } from '../../static/calc.js';
import { seite, schreibe, esc, zahl, MARKE } from './html.mjs';
import { cfg, materials, categories, projects, MATERIAL, staaten, yards } from './daten.mjs';

const r1 = (n) => (Math.round(n * 10) / 10).toLocaleString('en-US');

// Rechnerseiten: je Haupt-Keyword eine Seite (Suchvolumen siehe docs/01-konzept-rechner.md)
export const RECHNER = [
  { pfad: '/mulch-calculator/', name: 'Mulch Calculator', material: 'hardwood-mulch', kategorie: 'mulch', modus: 'cy',
    titel: 'Mulch Calculator: How Much Mulch Do I Need?',
    beschreibung: 'Free mulch calculator: enter your bed size and depth to get cubic yards, number of bags and cost. Works for rectangles, circles and tree rings.',
    intro: 'Measure your beds, pick a depth and see how many cubic yards or bags of mulch to buy – and whether bulk or bagged is cheaper.' },
  { pfad: '/gravel-calculator/', name: 'Gravel Calculator', material: 'pea-gravel', kategorie: 'gravel', modus: 'ton',
    titel: 'Gravel Calculator: Tons and Cubic Yards You Need',
    beschreibung: 'Free gravel calculator: get tons, cubic yards and cost for pea gravel, crushed stone, river rock and road base from your area and depth.',
    intro: 'Most yards sell gravel by the ton. Enter your area and depth to get tons and cubic yards, plus how many pickup loads that is.' },
  { pfad: '/topsoil-calculator/', name: 'Topsoil Calculator', material: 'topsoil', kategorie: 'soil', modus: 'cy',
    titel: 'Topsoil Calculator: How Much Soil Do I Need?',
    beschreibung: 'Free topsoil calculator for new lawns, raised beds and top dressing: cubic yards, bags and cost from your area and depth.',
    intro: 'Topsoil and compost settle after spreading, so the calculator adds a buffer. Pick a project to start with a sensible depth.' },
  { pfad: '/river-rock-calculator/', name: 'River Rock Calculator', material: 'river-rock', kategorie: 'gravel', modus: 'ton',
    titel: 'River Rock Calculator: Tons, Yards and Bags',
    beschreibung: 'Free river rock calculator: find out how many tons, cubic yards or bags of river rock you need for beds, borders and dry creeks.',
    intro: 'As a rule of thumb, lay river rock about twice as deep as the stones are large.' },
  { pfad: '/driveway-gravel-calculator/', name: 'Driveway Gravel Calculator', material: 'crushed-stone-57', kategorie: 'gravel', modus: 'ton', tiefe: 4,
    titel: 'Driveway Gravel Calculator: Tons of Stone Needed',
    beschreibung: 'Free driveway gravel calculator: tons and cubic yards of crushed stone and road base for a new or refreshed gravel driveway.',
    intro: 'A new gravel driveway usually needs a compacted base layer (crusher run, 4–6 in) plus a top layer of crushed stone. Calculate each layer separately.' },
  { pfad: '/cubic-yard-calculator/', name: 'Cubic Yard Calculator', material: 'hardwood-mulch', kategorie: null, modus: 'cy',
    titel: 'Cubic Yard Calculator for Landscaping Materials',
    beschreibung: 'Free cubic yard calculator: convert length, width and depth into cubic yards, cubic feet and tons for mulch, gravel, soil and sand.',
    intro: 'Bulk landscape materials are sold by the cubic yard (27 cubic feet). Enter your dimensions to convert them.' },
];

function materialOptionen(kategorie, gewaehlt) {
  const gruppen = categories.filter((c) => !kategorie || c.id === kategorie);
  return gruppen.map((c) => `<optgroup label="${esc(c.label)}">${materials.filter((m) => m.category === c.id)
    .map((m) => `<option value="${m.id}"${m.id === gewaehlt ? ' selected' : ''}>${esc(m.label)}</option>`).join('')}</optgroup>`).join('');
}

// Rechner-Formular; preise = lokale Vorbelegung { perCy, perTon } (Stadt-Seiten)
export function rechnerForm({ material, kategorie = null, modus = 'cy', tiefe = null, preise = {}, ort = null }) {
  const m = MATERIAL.get(material);
  const d = tiefe ?? m.default_depth_in;
  return `<form class="rechner" data-rechner data-modus="${modus}" novalidate>
  <div class="feld"><label for="r-material">Material</label>
    <select id="r-material" name="material">${materialOptionen(kategorie, material)}</select></div>
  <fieldset class="feld"><legend>Shape</legend>
    <label><input type="radio" name="form" value="rectangle" checked> Rectangle</label>
    <label><input type="radio" name="form" value="circle"> Circle</label>
    <label><input type="radio" name="form" value="triangle"> Triangle</label>
    <label><input type="radio" name="form" value="ring"> Tree ring</label>
    <label><input type="radio" name="form" value="area"> Square feet</label>
  </fieldset>
  <div class="masse" data-masse>
    <div class="feld" data-fuer="rectangle"><label for="r-laenge">Length (ft)</label><input id="r-laenge" name="length" type="number" inputmode="decimal" min="0" step="any" value="20"></div>
    <div class="feld" data-fuer="rectangle"><label for="r-breite">Width (ft)</label><input id="r-breite" name="width" type="number" inputmode="decimal" min="0" step="any" value="10"></div>
    <div class="feld" data-fuer="circle" hidden><label for="r-durchmesser">Diameter (ft)</label><input id="r-durchmesser" name="diameter" type="number" inputmode="decimal" min="0" step="any" value="10"></div>
    <div class="feld" data-fuer="triangle" hidden><label for="r-basis">Base (ft)</label><input id="r-basis" name="base" type="number" inputmode="decimal" min="0" step="any" value="10"></div>
    <div class="feld" data-fuer="triangle" hidden><label for="r-hoehe">Height (ft)</label><input id="r-hoehe" name="height" type="number" inputmode="decimal" min="0" step="any" value="10"></div>
    <div class="feld" data-fuer="ring" hidden><label for="r-aussen">Outer diameter (ft)</label><input id="r-aussen" name="outerDiameter" type="number" inputmode="decimal" min="0" step="any" value="6"></div>
    <div class="feld" data-fuer="ring" hidden><label for="r-innen">Trunk diameter (ft)</label><input id="r-innen" name="innerDiameter" type="number" inputmode="decimal" min="0" step="any" value="1"></div>
    <div class="feld" data-fuer="area" hidden><label for="r-flaeche">Area (sq ft)</label><input id="r-flaeche" name="sqft" type="number" inputmode="decimal" min="0" step="any" value="200"></div>
  </div>
  <div class="feld"><label for="r-tiefe">Depth (in)</label><input id="r-tiefe" name="depth" type="number" inputmode="decimal" min="0" step="any" value="${d}">
    <small data-tiefe-hinweis>Recommended: ${m.depth_range_in[0]}–${m.depth_range_in[1]} in</small></div>
  <details class="feld"><summary>Prices &amp; options</summary>
    <div class="feld"><label for="r-puffer">Extra for settling &amp; waste (%)</label><input id="r-puffer" name="waste" type="number" min="0" max="50" step="1" value="${m.waste_pct}"></div>
    <div class="feld"><label for="r-preis-cy">Price per cubic yard ($)</label><input id="r-preis-cy" name="perCy" type="number" min="0" step="any" value="${preise.perCy ?? ''}"></div>
    <div class="feld"><label for="r-preis-t">Price per ton ($)</label><input id="r-preis-t" name="perTon" type="number" min="0" step="any" value="${preise.perTon ?? ''}"></div>
    <div class="feld"><label for="r-preis-sack">Price per bag ($)</label><input id="r-preis-sack" name="perBag" type="number" min="0" step="any"></div>
    <div class="feld"><label for="r-lieferung">Delivery fee ($)</label><input id="r-lieferung" name="deliveryFee" type="number" min="0" step="any"></div>
    ${ort ? `<p class="hinweis">Prices pre-filled with the median of listed yards in ${esc(ort)}.</p>` : ''}
  </details>
  <output class="ergebnis" data-ergebnis aria-live="polite"><noscript>The calculator needs JavaScript. The tables below show typical amounts.</noscript></output>
  <div class="suche-yard" data-zip-suche>
    <label for="r-zip">Find yards near you</label>
    <div class="zeile"><input id="r-zip" name="zip" inputmode="numeric" pattern="[0-9]{5}" maxlength="5" placeholder="ZIP code" autocomplete="postal-code">
    <label class="klein"><input type="checkbox" name="delivery"> Delivery needed</label>
    <button type="button" data-zip-los>Search</button></div>
    <div data-zip-ergebnis aria-live="polite"></div>
  </div>
</form>
<script type="application/json" id="rechner-daten">${JSON.stringify({ materials }).replace(/</g, '\\u003c')}</script>`;
}

// Tabellen für Inhalt unter dem Rechner (auch ohne JavaScript lesbar)
function abdeckungTabelle() {
  const tiefen = [1, 2, 3, 4, 6];
  return `<table><caption>How much area does 1 cubic yard cover?</caption>
<thead><tr><th>Depth</th><th>Coverage</th></tr></thead><tbody>
${tiefen.map((t) => `<tr><td>${t} in</td><td>${zahl(Math.round(coverage({ cy: 1, depthIn: t })))} sq ft</td></tr>`).join('\n')}
</tbody></table>`;
}
function gewichtTabelle(kategorie) {
  const liste = materials.filter((m) => !kategorie || m.category === kategorie);
  return `<table><caption>Typical weight per cubic yard</caption>
<thead><tr><th>Material</th><th>Tons per cubic yard</th><th>Recommended depth</th></tr></thead><tbody>
${liste.map((m) => `<tr><td>${esc(m.label)}</td><td>${r1(m.density_range[0])}–${r1(m.density_range[1])}</td><td>${m.depth_range_in[0]}–${m.depth_range_in[1]} in</td></tr>`).join('\n')}
</tbody></table>
<p class="klein">Typical values. Moisture, stone size and supplier change the weight – ask your yard for the exact figure.</p>`;
}
function fragen(r) {
  const m = MATERIAL.get(r.material);
  const f = [
    ['How do I calculate cubic yards?', `Multiply length × width (in feet) × depth (in inches), divide by 12 to get cubic feet and then by ${CU_FT_PER_CY} to get cubic yards. Shortcut: square feet × depth in inches ÷ 324.`],
    [`How much does a cubic yard of ${m.label.toLowerCase()} weigh?`, `About ${r1(m.density_range[0])} to ${r1(m.density_range[1])} tons (${zahl(Math.round(m.density_range[0] * 2000))}–${zahl(Math.round(m.density_range[1] * 2000))} lb), depending on moisture and size.`],
    ['Is bulk cheaper than bags?', 'For more than about 2–3 cubic yards, bulk from a landscape supply yard is usually cheaper than bags, even with a delivery fee. Enter both prices above to compare.'],
    ['How much extra should I order?', `Order about ${m.waste_pct}% extra for settling, uneven ground and waste. The calculator adds this automatically; you can change it under “Prices & options”.`],
  ];
  return {
    html: `<section class="abschnitt"><h2>Frequently asked questions</h2>${f.map(([q, a]) => `<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join('')}</section>`,
    jsonld: { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: f.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
  };
}
const webApp = (r) => ({ '@context': 'https://schema.org', '@type': 'WebApplication', name: r.name, url: cfg.domain + r.pfad,
  applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any', isAccessibleForFree: true, inLanguage: 'en-US' });

function andereRechner(pfad) {
  return `<section class="abschnitt"><h2>Other calculators</h2><ul class="links">${RECHNER.filter((r) => r.pfad !== pfad)
    .map((r) => `<li><a href="${r.pfad}">${esc(r.name)}</a></li>`).join('')}</ul></section>`;
}
function topStaedte(n = 8) {
  const st = [...staaten.values()].flatMap((s) => s.staedte).sort((a, b) => b.yards.length - a.yards.length).slice(0, n);
  return st.length ? `<section class="abschnitt"><h2>Landscape supply yards</h2><ul class="links">${st
    .map((s) => `<li><a href="${s.pfad}">${esc(s.name)}, ${s.state}</a></li>`).join('')}</ul><p><a href="/landscape-supply/">All states</a></p></section>` : '';
}

for (const r of RECHNER) {
  const faq = fragen(r);
  const inhalt = `<h1>${esc(r.name)}</h1>
<p class="einleitung">${esc(r.intro)}</p>
${rechnerForm(r)}
<section class="abschnitt"><h2>How the calculation works</h2>
<p>Area (sq ft) × depth (in) ÷ 12 = cubic feet. Cubic feet ÷ 27 = cubic yards. Cubic yards × weight per cubic yard = tons. Bags = cubic feet ÷ bag size.</p>
${abdeckungTabelle()}
${gewichtTabelle(r.kategorie)}
</section>
${faq.html}
${andereRechner(r.pfad)}
${topStaedte()}`;
  schreibe(r.pfad, seite({ titel: r.titel, beschreibung: r.beschreibung, pfad: r.pfad, inhalt, krumen: [[r.name, r.pfad]],
    jsonld: [webApp(r), faq.jsonld], skripte: ['/rechner.js'], klasse: 'rechner-seite' }));
}

// ---------- Startseite ----------
const projektListe = projects.map((p) => `<li><strong>${esc(p.label)}:</strong> ${esc(MATERIAL.get(p.material).label)}, ${p.depth_in} in</li>`).join('');
schreibe('/', seite({
  titel: `${MARKE}: Mulch, Gravel & Soil Calculators`,
  beschreibung: 'Calculate how much mulch, gravel, topsoil or river rock you need – in cubic yards, tons and bags – and find landscape supply yards near you.',
  pfad: '/',
  inhalt: `<h1>How much mulch, gravel or soil do you need?</h1>
<p class="einleitung">Enter your area and depth, get cubic yards, tons, bags and cost – then find a landscape supply yard that sells it near you.</p>
${rechnerForm({ material: 'hardwood-mulch' })}
<section class="abschnitt"><h2>Calculators</h2><ul class="links">${RECHNER.map((r) => `<li><a href="${r.pfad}">${esc(r.name)}</a></li>`).join('')}</ul></section>
<section class="abschnitt"><h2>Typical depths</h2><ul>${projektListe}</ul></section>
${topStaedte()}`,
  jsonld: [{ '@context': 'https://schema.org', '@type': 'WebSite', '@id': `${cfg.domain}/#website`, name: MARKE, url: `${cfg.domain}/`, inLanguage: 'en-US' }],
  skripte: ['/rechner.js'],
  klasse: 'startseite',
}));
console.log(`Rechner: ${RECHNER.length} Rechnerseiten + Startseite (${yards.length} Yards verlinkbar)`);
