// Build, Teil „directory“: Übersicht, Bundesstaaten, Städte und Yard-Seiten.
// Regeln aus Hofladen: Listen unter MIN_SEITE Einträgen noindex, URLs stabil, JSON-LD nur für sichtbare Angaben.
import { medianPrice } from '../../static/umkreis.js';
import { seite, schreibe, esc, plural, usd, MIN_SEITE } from './html.mjs';
import { rechnerForm } from './rechner.mjs';
import { cfg, yards, staedte, staaten, MATERIAL, BUILD_DATUM } from './daten.mjs';

const MONAT = new Date(BUILD_DATUM).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const TAGE = [['mon', 'Mon'], ['tue', 'Tue'], ['wed', 'Wed'], ['thu', 'Thu'], ['fri', 'Fri'], ['sat', 'Sat'], ['sun', 'Sun']];

const materialChips = (y) => (y.materials.length
  ? `<ul class="chips">${y.materials.map((m) => `<li>${esc(MATERIAL.get(m.id).label)}${m.price ? ` · ${usd(m.price.amount)}/${m.price.unit}` : ''}</li>`).join('')}</ul>`
  : '<p class="klein">Materials not confirmed yet.</p>');

function yardKarte(y) {
  const lieferung = y.delivery?.available ? `Delivery${y.delivery.radius_mi ? ` up to ${y.delivery.radius_mi} mi` : ''}` : 'Pickup only';
  return `<li class="yard"><h3><a href="${y.pfad}">${esc(y.name)}</a></h3>
<p>${esc([y.address.street, y.address.city].filter(Boolean).join(', '))}, ${y.state} ${esc(y.address.zip || '')} · ${lieferung}</p>
${materialChips(y)}</li>`;
}

const geschaeft = (y) => ({
  '@context': 'https://schema.org', '@type': 'HomeAndConstructionBusiness', '@id': `${cfg.domain}${y.pfad}#yard`, name: y.name,
  url: cfg.domain + y.pfad,
  address: { '@type': 'PostalAddress', streetAddress: y.address.street, addressLocality: y.address.city, addressRegion: y.state, postalCode: y.address.zip, addressCountry: 'US' },
  geo: { '@type': 'GeoCoordinates', latitude: y.location.lat, longitude: y.location.lng },
  ...(y.contact?.phone ? { telephone: y.contact.phone } : {}),
  ...(y.contact?.website ? { sameAs: [y.contact.website] } : {}),
});

// Lokale Preistabelle: Median je Material, nur ab 3 Preisen (sonst nicht aussagekräftig)
function preise(liste) {
  const zeilen = [];
  for (const m of MATERIAL.values()) for (const unit of ['cy', 'ton']) {
    const n = liste.filter((y) => y.materials.some((x) => x.id === m.id && x.price?.unit === unit)).length;
    if (n >= 3) zeilen.push({ m, unit, wert: medianPrice(liste, m.id, unit), n });
  }
  return zeilen;
}

// ---------- Yard-Seiten ----------
for (const y of yards) {
  const zeiten = y.hours ? `<table class="zeiten"><caption>Opening hours</caption><tbody>${TAGE.map(([k, n]) => `<tr><th>${n}</th><td>${esc(y.hours[k] || 'closed')}</td></tr>`).join('')}</tbody></table>` : '';
  const kontakt = [y.contact?.phone && `<a href="tel:${esc(y.contact.phone.replace(/[^\d+]/g, ''))}">${esc(y.contact.phone)}</a>`,
    y.contact?.website && `<a href="${esc(y.contact.website)}" rel="nofollow noopener" target="_blank">Website</a>`].filter(Boolean).join(' · ');
  const inhalt = `<h1>${esc(y.name)}</h1>
<p class="einleitung">Landscape supply yard in ${esc(y.address.city)}, ${y.state}.</p>
<p>${esc([y.address.street, y.address.city].filter(Boolean).join(', '))}, ${y.state} ${esc(y.address.zip || '')}${kontakt ? `<br>${kontakt}` : ''}</p>
<section class="abschnitt"><h2>Materials</h2>${materialChips(y)}</section>
<section class="abschnitt"><h2>Delivery &amp; pickup</h2><ul>
<li>${y.delivery?.available ? `Delivers${y.delivery.radius_mi ? ` within about ${y.delivery.radius_mi} miles` : ''}${y.delivery.fee_from ? `, delivery from ${usd(y.delivery.fee_from)}` : ''}${y.delivery.min_order_cy ? `, minimum ${y.delivery.min_order_cy} cubic yards` : ''}` : 'No delivery listed'}</li>
${y.self_load != null ? `<li>${y.self_load ? 'Pickup with your own truck or trailer' : 'No self pickup'}</li>` : ''}
</ul></section>
${zeiten}
<p class="klein">Information checked ${esc(y.source?.checked || BUILD_DATUM)}. Prices can change – please confirm with the yard. <a href="/about/">Sources</a></p>
<p><a href="${y.stadtPfad}">All yards in ${esc(y.address.city)}</a></p>`;
  schreibe(y.pfad, seite({ titel: `${y.name} – ${y.address.city}, ${y.state}`, pfad: y.pfad,
    beschreibung: `${y.name} in ${y.address.city}, ${y.state}: materials, delivery, pickup and opening hours.`,
    inhalt, jsonld: [geschaeft(y)],
    krumen: [['Landscape supply', '/landscape-supply/'], [staaten.get(y.state).name, staaten.get(y.state).pfad], [y.address.city, y.stadtPfad], [y.name, y.pfad]] }));
}

// ---------- Städte ----------
for (const s of staedte.values()) {
  const st = staaten.get(s.state);
  const p = preise(s.yards);
  const lokal = {};
  const mulch = p.find((x) => x.m.id === 'hardwood-mulch' && x.unit === 'cy');
  if (mulch) lokal.perCy = mulch.wert;
  const inhalt = `<h1>Landscape Supply Yards in ${esc(s.name)}, ${s.state}</h1>
<p class="einleitung">${plural(s.yards.length, 'yard')} for bulk mulch, gravel, stone and soil in ${esc(s.name)}, checked ${MONAT}.</p>
<ul class="yards">${s.yards.map(yardKarte).join('\n')}</ul>
${p.length ? `<section class="abschnitt"><h2>Typical prices in ${esc(s.name)}</h2><table><thead><tr><th>Material</th><th>Median price</th><th>Yards</th></tr></thead><tbody>
${p.map((x) => `<tr><td>${esc(x.m.label)}</td><td>${usd(x.wert)} per ${x.unit === 'cy' ? 'cubic yard' : 'ton'}</td><td>${x.n}</td></tr>`).join('\n')}</tbody></table></section>` : ''}
<section class="abschnitt"><h2>How much do you need?</h2>${rechnerForm({ material: 'hardwood-mulch', preise: lokal, ort: Object.keys(lokal).length ? s.name : null })}</section>`;
  schreibe(s.pfad, seite({ titel: `Landscape Supply Yards in ${s.name}, ${s.state}`, pfad: s.pfad,
    beschreibung: `${plural(s.yards.length, 'landscape supply yard')} in ${s.name}, ${st.name}: bulk mulch, gravel, stone and topsoil, delivery and local prices.`,
    inhalt, noindex: s.yards.length < MIN_SEITE, skripte: ['/rechner.js'],
    jsonld: [{ '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: s.yards.map((y, i) => ({ '@type': 'ListItem', position: i + 1, url: cfg.domain + y.pfad, name: y.name })) }],
    krumen: [['Landscape supply', '/landscape-supply/'], [st.name, st.pfad], [s.name, s.pfad]] }));
}

// ---------- Bundesstaaten ----------
for (const st of staaten.values()) {
  const n = st.staedte.reduce((a, s) => a + s.yards.length, 0);
  schreibe(st.pfad, seite({ titel: `Landscape Supply Yards in ${st.name}`, pfad: st.pfad,
    beschreibung: `${plural(n, 'landscape supply yard')} in ${st.name} by city: bulk mulch, gravel, stone and soil.`,
    inhalt: `<h1>Landscape Supply Yards in ${esc(st.name)}</h1>
<p class="einleitung">${plural(n, 'yard')} in ${plural(st.staedte.length, 'city', 'cities')}.</p>
<ul class="links">${st.staedte.map((s) => `<li><a href="${s.pfad}">${esc(s.name)}</a> (${s.yards.length})</li>`).join('')}</ul>`,
    noindex: n < MIN_SEITE, krumen: [['Landscape supply', '/landscape-supply/'], [st.name, st.pfad]] }));
}

// ---------- Übersicht ----------
const alle = [...staaten.values()].sort((a, b) => a.name.localeCompare(b.name));
schreibe('/landscape-supply/', seite({ titel: 'Landscape Supply Yards Near You', pfad: '/landscape-supply/',
  beschreibung: 'Find landscape supply yards for bulk mulch, gravel, stone and topsoil by state and city – with delivery areas and local prices.',
  inhalt: `<h1>Landscape Supply Yards</h1>
${alle.length ? `<p class="einleitung">${plural(yards.length, 'yard')} in ${plural(alle.length, 'state')}.</p>
<ul class="links">${alle.map((st) => `<li><a href="${st.pfad}">${esc(st.name)}</a></li>`).join('')}</ul>`
    : '<p class="einleitung">We are adding the first yards right now. In the meantime, use the calculators to work out how much you need.</p>'}
<p><a href="/about/">Where the listings come from</a></p>`,
  noindex: yards.length < MIN_SEITE, krumen: [['Landscape supply', '/landscape-supply/']] }));

console.log(`Directory: ${yards.length} Yard-Seiten, ${staedte.size} Städte, ${staaten.size} Bundesstaaten`);
