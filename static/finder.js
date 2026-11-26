// Verzeichnis im Browser: "Find yards near you" (ZIP, Stadt/Staat oder Standort) und der Städtefilter auf Staatsseiten.
// Daten kommen aus dem Build (lädt erst, wenn jemand ins Suchfeld tippt):
//   /assets/yards.json   [lat, lng, titel, stadt, staat, art, pfad, telefon, geprüft]
//   /assets/cities.json  [name, staat, pfad, anzahl]
//   /assets/zip/<3>.json { "77002": [lat, lng] }

const BASIS = '/landscape-supply/';
const ARTEN = {
  'landscape-supply': 'Landscape supply yard', 'mulch-soil': 'Mulch & topsoil yard', 'stone-yard': 'Stone & rock yard',
  'sand-gravel': 'Sand & gravel', quarry: 'Quarry / aggregate producer', 'gravel-pit': 'Gravel pit',
};
const STAATEN = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut',
  DE: 'Delaware', DC: 'District of Columbia', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois',
  IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana',
  NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
  NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania',
  RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah',
  VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
};
const TEL_ICON = '<svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M6.6 10.8a15.2 15.2 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1L6.6 10.8Z"/></svg>';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = (s) => String(s).normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[^a-z0-9,]+/g, ' ').replace(/\s+/g, ' ').trim();

let yardsP, staedteP;
const json = (url) => fetch(url).then((r) => (r.ok ? r.json() : null)).catch(() => null);
const ladeYards = () => (yardsP ||= json('/assets/yards.json'));
const ladeStaedte = () => (staedteP ||= json('/assets/cities.json'));

function meilen(lat1, lng1, lat2, lng2) {
  const r = (d) => (d * Math.PI) / 180;
  const x = Math.sin(r(lat2 - lat1) / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lng2 - lng1) / 2) ** 2;
  return 2 * 3958.8 * Math.asin(Math.sqrt(x));
}
const entf = (mi) => `${mi < 10 ? mi.toFixed(1) : Math.round(mi)} mi`;

function karte([, , titel, stadt, staat, art, pfad, tel, ok], mi) {
  return `<li class="yard">
  <div class="yard-text">
    <a class="yard-name" href="${BASIS}${esc(pfad)}">${esc(titel)}</a>
    <span class="yard-meta"><span class="tag tag-${esc(art)}">${esc(ARTEN[art] || 'Supplier')}</span>${ok ? ' <span class="tag tag-ok">Verified</span>' : ''} <span class="entf"><span class="sr">· </span>${entf(mi)}</span></span>
    <span class="yard-adr">${esc(stadt)}, ${esc(staat)}</span>
    ${tel ? `<span class="yard-tel">${esc(tel)}</span>` : ''}
  </div>
  ${tel ? `<a class="anruf" href="tel:${esc(tel.replace(/[^\d+]/g, ''))}" aria-label="Call ${esc(titel)} at ${esc(tel)}">${TEL_ICON}<span>Call</span></a>` : ''}
</li>`;
}

for (const form of document.querySelectorAll('[data-finder]')) finder(form);
for (const feld of document.querySelectorAll('[data-filter]')) filter(feld);
for (const leiste of document.querySelectorAll('[data-chips]')) chipFilter(leiste);

function finder(form) {
  const eingabe = form.querySelector('input');
  const box = form.querySelector('.finder-ergebnis');
  const ort = form.querySelector('.finder-ort');
  let lauf = 0; // verwirft veraltete Antworten, wenn schneller getippt als geladen wird
  const zeige = (html) => { box.innerHTML = html; };

  if ('geolocation' in navigator) ort.hidden = false;
  eingabe.addEventListener('focus', () => { ladeStaedte(); ladeYards(); }, { once: true });

  let timer;
  eingabe.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => suchen(false), 120);
  });
  form.addEventListener('submit', (e) => { e.preventDefault(); suchen(true); });

  ort.addEventListener('click', () => {
    const n = ++lauf;
    zeige('<p>Finding your location…</p>');
    navigator.geolocation.getCurrentPosition(
      (p) => { if (n === lauf) naheYards(p.coords.latitude, p.coords.longitude, 'you', n); },
      () => { if (n === lauf) zeige('<p>We couldn’t get your location. Enter your ZIP code instead.</p>'); },
      { timeout: 10000, maximumAge: 600000 },
    );
  });

  async function suchen(abgeschickt) {
    const q = eingabe.value.trim();
    const n = ++lauf;
    if (/^\d{5}$/.test(q)) return zipSuche(q, n);
    if (/^\d+$/.test(q)) return zeige(abgeschickt ? '<p>Please enter a 5-digit ZIP code.</p>' : '');
    if (norm(q).length < 2) return zeige('');
    const treffer = await vorschlaege(q);
    if (n !== lauf) return;
    if (abgeschickt && treffer.length) { location.href = treffer[0].href; return; }
    zeige(treffer.length
      ? `<ul class="vorschlaege">${treffer.map((t) => `<li><a href="${t.href}"><span>${esc(t.name)}</span><small>${t.info}</small></a></li>`).join('')}</ul>`
      : '<p>No city found with that name. Try your ZIP code.</p>');
  }

  async function zipSuche(zip, n) {
    zeige('<p>Searching…</p>');
    const shard = await json(`/assets/zip/${zip.slice(0, 3)}.json`);
    if (n !== lauf) return;
    const p = shard?.[zip];
    if (!p) return zeige(`<p>We don’t know ZIP ${esc(zip)}. Try a neighboring ZIP or your city name.</p>`);
    try { history.replaceState(null, '', `?q=${zip}`); } catch {}
    naheYards(p[0], p[1], `ZIP ${zip}`, n);
  }

  async function naheYards(lat, lng, wo, n) {
    const yards = await ladeYards();
    if (n !== lauf) return;
    if (!yards) return zeige('<p>The list could not be loaded. Please try again.</p>');
    const naechste = yards.map((y) => [y, meilen(lat, lng, y[0], y[1])]).sort((a, b) => a[1] - b[1]).slice(0, 10);
    const [erster] = naechste[0];
    const weit = naechste[0][1] > 50;
    zeige(`<p><strong>Nearest yards to ${esc(wo)}</strong>${weit ? ' – the closest one is more than 50 miles away.' : ''}</p>
<ul class="yards">${naechste.map(([y, mi]) => karte(y, mi)).join('')}</ul>
<p><a href="${BASIS}${esc(erster[6].split('/').slice(0, 2).join('/'))}/">All yards in ${esc(erster[3])}, ${esc(erster[4])} →</a></p>`);
  }

  // Beim Aufruf mit ?q=… (Formular ohne JavaScript, geteilter Link) direkt suchen
  const start = new URLSearchParams(location.search).get('q');
  if (start) { eingabe.value = start; suchen(false); }
}

async function vorschlaege(q) {
  const [stadtTeil, staatTeil = ''] = norm(q).split(',').map((x) => x.trim());
  const staaten = Object.entries(STAATEN);
  const passtStaat = (code) => !staatTeil || code.toLowerCase() === staatTeil || norm(STAATEN[code] || '').startsWith(staatTeil);
  const aus = [];
  if (!staatTeil && stadtTeil.length >= 2) {
    for (const [code, name] of staaten) if (norm(name).startsWith(stadtTeil) || (stadtTeil.length === 2 && code.toLowerCase() === stadtTeil)) {
      aus.push({ name, info: 'State', href: `${BASIS}${code.toLowerCase()}/`, rang: -1, zahl: 0 });
    }
  }
  const staedte = (await ladeStaedte()) || [];
  for (const [name, st, pfad, zahl] of staedte) {
    if (!passtStaat(st)) continue;
    const n = norm(name);
    const rang = n.startsWith(stadtTeil) ? 0 : n.split(' ').some((w) => w.startsWith(stadtTeil)) ? 1 : n.includes(stadtTeil) ? 2 : 9;
    if (rang < 9) aus.push({ name: `${name}, ${st}`, info: `${zahl} yard${zahl === 1 ? '' : 's'}`, href: BASIS + pfad, rang, zahl });
  }
  return aus.sort((a, b) => a.rang - b.rang || b.zahl - a.zahl || a.name.localeCompare(b.name)).slice(0, 8);
}

// data-filter: eine oder mehrere Listen-IDs (Leerzeichen getrennt); eingeklappte Listen öffnen sich beim Filtern
function filter(feld) {
  const listen = feld.dataset.filter.split(/\s+/).map((id) => document.getElementById(id)).filter(Boolean);
  const leer = feld.parentElement.querySelector('.filter-leer');
  const eintraege = listen.flatMap((liste) => [...liste.children]).map((li) => [li, norm(li.querySelector('span')?.textContent || li.textContent)]);
  feld.addEventListener('input', () => {
    const q = norm(feld.value);
    for (const l of listen) { const d = l.closest('details'); if (d && q) d.open = true; }
    let sichtbar = 0;
    for (const [li, text] of eintraege) {
      const an = !q || text.includes(q);
      li.hidden = !an;
      if (an) sichtbar++;
    }
    if (leer) leer.hidden = sichtbar > 0;
  });
}

// Stadtseite: Yards nach Material/Lieferung filtern (Daten aus data-m der Karten, von den Websites der Yards).
// Mehrere Knöpfe = alle Bedingungen müssen passen. Ohne aktive Knöpfe ist alles sichtbar.
function chipFilter(leiste) {
  const karten = [...leiste.closest('section').querySelectorAll('ul.yards > li.yard')];
  leiste.addEventListener('click', (e) => {
    const b = e.target.closest('[data-f]');
    if (!b) return;
    b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'));
    const aktiv = [...leiste.querySelectorAll('[aria-pressed="true"]')].map((x) => x.dataset.f);
    for (const li of karten) {
      const m = (li.dataset.m || '').split(' ');
      li.hidden = aktiv.length > 0 && !aktiv.every((f) => m.includes(f));
    }
  });
}
