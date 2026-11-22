// Rechner im Browser. Rechenlogik kommt aus core.js (dieselbe Datei wie src/calc/core.js, getestet in test/).
import { totalArea, calculate, cost, pickupTrips, m2ToSqft, cmToIn, mToFt, KG_PER_TON } from './core.js';

const form = document.getElementById('rechner');
if (form) start();
// Verzeichnis: Suche nach ZIP/Stadt und Städtefilter (eigene Datei, nur wo gebraucht)
if (document.querySelector('[data-finder], [data-filter]')) import('./finder.js');
if (document.getElementById('umrechner')) import('./umrechner.js');

const ICON = {
  rectangle: '<rect x="3" y="4" width="18" height="12" rx="1.5"/>',
  circle: '<circle cx="12" cy="10" r="7.5"/>',
  triangle: '<path d="M12 2.5 21.5 17h-19Z"/>',
  ring: '<circle cx="12" cy="10" r="7.5"/><circle cx="12" cy="10" r="2.2" fill="currentColor"/>',
  area: '<rect x="3" y="3" width="18" height="14" rx="1.5" stroke-dasharray="3 2.5"/>',
};
const DREI = [0.25, 0.5, 1, 2, 3, 4, 6, 8, 12, 18, 24];

async function start() {
  const cfg = JSON.parse(form.dataset.cfg);
  const DATA = await (await fetch('/assets/materials.json')).json();
  const matById = Object.fromEntries(DATA.materials.map((m) => [m.id, m]));
  const $ = (id) => document.getElementById(id);
  const SPEICHER = 'gravel:' + location.pathname;

  const FORMEN = {
    rectangle: { label: 'Rectangle', felder: [['length', 'Length'], ['width', 'Width']] },
    circle: { label: 'Circle', felder: [['diameter', 'Diameter']] },
    triangle: { label: 'Triangle', felder: [['base', 'Base'], ['height', 'Height']] },
    ring: { label: 'Tree ring', felder: [['outerDiameter', 'Outer diameter'], ['innerDiameter', 'Inner diameter']] },
    area: { label: 'Known area', felder: [['sqft', 'Area']] },
  };

  const state = {
    einheit: 'imperial',
    material: cfg.material,
    abschnitte: [{ shape: cfg.shape, dims: {} }],
  };

  // ---------- gespeicherte Werte / Link-Parameter ----------
  const q = new URLSearchParams(location.search);
  let geladen = null;
  try { geladen = JSON.parse(localStorage.getItem(SPEICHER) || 'null'); } catch {}
  if (q.has('sqft') || q.has('m')) {
    if (q.get('m') && matById[q.get('m')]) state.material = q.get('m');
    if (q.get('sqft')) state.abschnitte = [{ shape: 'area', dims: { sqft: +q.get('sqft') } }];
    if (q.get('u') === 'metric') state.einheit = 'metric';
    if (q.get('d')) $('tiefe').value = q.get('d');
  } else if (geladen) {
    Object.assign(state, { einheit: geladen.einheit, material: matById[geladen.material] ? geladen.material : state.material, abschnitte: geladen.abschnitte?.length ? geladen.abschnitte : state.abschnitte });
    if (geladen.tiefe) $('tiefe').value = geladen.tiefe;
    if (geladen.puffer != null) $('puffer').value = geladen.puffer;
    for (const id of ['p-cy', 'p-t', 'p-sack', 'p-lief']) if ($(id) && geladen[id]) $(id).value = geladen[id];
  }

  // ---------- Abschnitte ----------
  const lang = () => (state.einheit === 'metric' ? 'm' : 'ft');
  const flaeche = () => (state.einheit === 'metric' ? 'm²' : 'sq ft');

  function abschnitteZeichnen() {
    const box = $('abschnitte');
    box.innerHTML = '';
    state.abschnitte.forEach((a, i) => {
      const f = document.createElement('fieldset');
      const mehrere = state.abschnitte.length > 1;
      f.className = 'abschnitt' + (mehrere ? '' : ' einzeln');
      f.innerHTML = `<legend class="${mehrere ? '' : 'sr'}">${mehrere ? `Area ${i + 1}` : 'Area'}</legend>
        <div class="formen" role="radiogroup" aria-label="Shape">${Object.entries(FORMEN).map(([k, v]) => `<label class="form-wahl"><input type="radio" class="form" name="form-${i}" data-i="${i}" value="${k}"${k === a.shape ? ' checked' : ''}><span><svg aria-hidden="true" viewBox="0 0 24 20" fill="none" stroke="currentColor" stroke-width="2">${ICON[k]}</svg>${v.label}</span></label>`).join('')}</div>
        <div class="masse">${FORMEN[a.shape].felder.map(([k, l]) => `<label>${l} <span class="opt">(${k === 'sqft' ? flaeche() : lang()})</span>
          <input type="number" inputmode="decimal" min="0" step="any" enterkeyhint="next" placeholder="0" data-i="${i}" data-k="${k}" value="${a.dims[k] ?? ''}"></label>`).join('')}</div>
        ${mehrere ? `<button type="button" class="entfernen" data-weg="${i}" aria-label="Remove section ${i + 1}">Remove</button>` : ''}`;
      box.append(f);
    });
  }

  $('abschnitte').addEventListener('input', (e) => {
    const t = e.target;
    if (t.dataset.k) state.abschnitte[+t.dataset.i].dims[t.dataset.k] = t.value === '' ? undefined : +t.value;
    rechnen();
  });
  $('abschnitte').addEventListener('change', (e) => {
    if (e.target.classList.contains('form')) {
      const i = +e.target.dataset.i;
      state.abschnitte[i] = { shape: e.target.value, dims: {} };
      abschnitteZeichnen();
      form.querySelector(`input[name="form-${i}"]:checked`)?.focus({ preventScroll: true });
      rechnen();
    }
  });
  $('abschnitte').addEventListener('click', (e) => {
    if (e.target.dataset.weg != null) {
      state.abschnitte.splice(+e.target.dataset.weg, 1);
      abschnitteZeichnen();
      rechnen();
    }
  });
  $('abschnitt-neu').addEventListener('click', () => {
    state.abschnitte.push({ shape: 'rectangle', dims: {} });
    abschnitteZeichnen();
    form.querySelector(`[data-i="${state.abschnitte.length - 1}"][data-k]`)?.focus();
  });

  // ---------- Einheiten ----------
  form.querySelectorAll('[data-einheit]').forEach((b) => b.addEventListener('click', () => {
    if (state.einheit === b.dataset.einheit) return;
    state.einheit = b.dataset.einheit;
    // vorhandene Werte umrechnen, damit das Ergebnis gleich bleibt
    const zuMetrisch = state.einheit === 'metric';
    for (const a of state.abschnitte) for (const k in a.dims) {
      const v = a.dims[k];
      if (v == null) continue;
      const f = k === 'sqft' ? m2ToSqft(1) : mToFt(1);
      a.dims[k] = +(zuMetrisch ? v / f : v * f).toFixed(2);
    }
    const t = +$('tiefe').value;
    if (t) $('tiefe').value = +(zuMetrisch ? t * 2.54 : cmToIn(t)).toFixed(zuMetrisch ? 1 : 2);
    einheitenZeigen();
    abschnitteZeichnen();
    tiefenChips();
    rechnen();
  }));
  function einheitenZeigen() {
    form.querySelectorAll('[data-einheit]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.einheit === state.einheit)));
    form.querySelector('.einheit-tiefe').textContent = state.einheit === 'metric' ? '(cm)' : '(inches)';
  }

  // ---------- Material und Projekt ----------
  function materialSetzen(id, { tiefe } = {}) {
    state.material = id;
    const m = matById[id];
    if ($('material')) $('material').value = id;
    const d = tiefe ?? m.default_depth_in;
    if (!cfg.nurVolumen || tiefe != null) $('tiefe').value = state.einheit === 'metric' ? +(d * 2.54).toFixed(1) : d;
    $('puffer').value = m.waste_pct;
    materialHinweise();
  }
  // Schnellwahl für gängige Tiefen (passend zum Material)
  function tiefenChips() {
    const m = matById[state.material];
    let werte = [2, 3, 4, 6];
    if (!cfg.nurVolumen) {
      const [a, b] = m.depth_range_in;
      const passend = DREI.filter((d) => d >= a && d <= b);
      werte = passend.length <= 4 ? passend : [0, 1, 2, 3].map((k) => passend[Math.round((k * (passend.length - 1)) / 3)]);
      if (!werte.includes(m.default_depth_in) && DREI.includes(m.default_depth_in)) {
        const naechster = werte.reduce((x, y) => (Math.abs(y - m.default_depth_in) < Math.abs(x - m.default_depth_in) ? y : x));
        werte[werte.indexOf(naechster)] = m.default_depth_in;
        werte.sort((x, y) => x - y);
      }
    }
    const metrisch = state.einheit === 'metric';
    const bruch = { 0.25: '¼', 0.5: '½' };
    $('tiefe-chips').innerHTML = werte.map((d) => {
      const v = metrisch ? +(d * 2.54).toFixed(d < 1 ? 1 : 0) : d;
      return `<button type="button" data-tiefe="${v}" aria-pressed="false">${metrisch ? `${v} cm` : `${bruch[d] || d}″`}</button>`;
    }).join('');
    chipsMarkieren();
  }
  function chipsMarkieren() {
    const t = +$('tiefe').value;
    $('tiefe-chips').querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.tiefe === t)));
  }
  $('tiefe-chips').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tiefe]');
    if (!b) return;
    $('tiefe').value = b.dataset.tiefe;
    rechnen();
  });

  function materialHinweise() {
    const m = matById[state.material];
    tiefenChips();
    if (cfg.nurVolumen) { $('tiefe-hinweis').textContent = ''; return; }
    const [a, b] = m.depth_range_in;
    $('tiefe-hinweis').textContent = `Recommended for ${m.label.toLowerCase()}: ${a}–${b} in (${+(a * 2.54).toFixed(1)}–${+(b * 2.54).toFixed(1)} cm).`;
    const h = $('mat-hinweis');
    h.hidden = !m.note;
    h.textContent = m.note || '';
    const sack = $('sack');
    if (sack) {
      sack.innerHTML = m.bag_cu_ft.length ? m.bag_cu_ft.map((s) => `<option value="${s}">${s} cu ft</option>`).join('') : '<option value="">Not sold in bags</option>';
      sack.disabled = !m.bag_cu_ft.length;
    }
  }
  $('material')?.addEventListener('change', (e) => { materialSetzen(e.target.value); rechnen(); });
  $('projekt')?.addEventListener('change', (e) => {
    const p = DATA.projects.find((x) => x.id === e.target.value);
    if (!p) return;
    materialSetzen(p.material, { tiefe: p.depth_in });
    if (p.shape && state.abschnitte.length === 1) state.abschnitte[0] = { shape: p.shape, dims: {} };
    abschnitteZeichnen();
    const h = $('mat-hinweis');
    if (p.note) { h.hidden = false; h.textContent = p.note; }
    rechnen();
  });

  // ---------- Rechnen und Anzeigen ----------
  const zahl = (n, d = 1) => n.toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: 0 });
  const geld = (n) => '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  const wert = (id) => { const v = $(id)?.value; return v === '' || v == null ? undefined : +v; };

  function eingabenInFuss() {
    const metrisch = state.einheit === 'metric';
    const abschnitte = [];
    for (const a of state.abschnitte) {
      const felder = FORMEN[a.shape].felder.map(([k]) => k);
      if (!felder.every((k) => a.dims[k] > 0 || (k === 'innerDiameter' && a.dims[k] >= 0))) continue;
      const dims = {};
      for (const k of felder) dims[k] = metrisch ? (k === 'sqft' ? m2ToSqft(a.dims[k] ?? 0) : mToFt(a.dims[k] ?? 0)) : (a.dims[k] ?? 0);
      abschnitte.push({ shape: a.shape, dims });
    }
    const tiefe = wert('tiefe');
    return { abschnitte, depthIn: tiefe ? (metrisch ? cmToIn(tiefe) : tiefe) : 0 };
  }

  function rechnen() {
    speichern();
    chipsMarkieren();
    const box = $('ergebnis');
    const { abschnitte, depthIn } = eingabenInFuss();
    const sqft = abschnitte.length ? totalArea(abschnitte) : 0;
    if (!(sqft > 0) || !(depthIn > 0)) {
      box.innerHTML = `<p class="leer">${sqft > 0 ? 'Enter a depth' : 'Enter your measurements'} – your result shows up here instantly.</p>`;
      leiste('');
      return;
    }
    const m = matById[state.material];
    const r = calculate({ sqft, depthIn, material: m, wastePct: wert('puffer') ?? 0, bagCuFt: wert('sack') });
    const metrisch = state.einheit === 'metric';
    const t = (x) => (metrisch ? `${zahl((x * KG_PER_TON) / 1000, 2)} t` : `${zahl(x, 2)} tons`);
    const flaecheText = metrisch ? `${zahl(sqft / m2ToSqft(1))} m²` : `${zahl(sqft, 0)} sq ft`;
    const tiefeText = metrisch ? `${zahl(depthIn * 2.54)} cm` : `${zahl(depthIn, 2)} in`;

    let html, kurz;
    if (cfg.nurVolumen) {
      kurz = `<strong>${zahl(r.cy, 2)}</strong> cubic yards`;
      html = `<p class="gross"><span>${zahl(r.cy, 2)}</span> cubic yards${metrisch ? ` (${zahl(r.m3, 2)} m³)` : ''}</p>
        <dl class="werte"><div><dt>Cubic feet</dt><dd>${zahl(r.cuFt)}</dd></div><div><dt>Cubic meters</dt><dd>${zahl(r.m3, 2)}</dd></div>
        <div><dt>Area</dt><dd>${flaecheText}</dd></div><div><dt>Depth</dt><dd>${tiefeText}</dd></div></dl>
        <p class="klein">Includes ${wert('puffer') ?? 0}% extra.</p>`;
    } else {
      const nachGewicht = m.sold_by[0] === 'ton';
      kurz = nachGewicht
        ? `<strong>${t(r.tons)}</strong> · ${zahl(r.cy, 2)} cu yd`
        : metrisch ? `<strong>${zahl(r.m3, 2)} m³</strong> · ${zahl(r.cy, 2)} cu yd` : `<strong>${zahl(r.cy, 2)}</strong> cubic yards`;
      if (r.bags && !nachGewicht) kurz += ` · ${r.bags.toLocaleString('en-US')} bags`;
      const haupt = nachGewicht
        ? `<p class="gross"><span>${t(r.tons)}</span> of ${m.label.toLowerCase()}</p><p class="neben">≈ ${zahl(r.cy, 2)} cubic yards · order <strong>${metrisch ? t(r.orderTons) : zahl(r.orderTons) + ' tons'}</strong></p>`
        : metrisch
          ? `<p class="gross"><span>${zahl(r.m3, 2)} m³</span> of ${m.label.toLowerCase()}</p><p class="neben">= ${zahl(r.cy, 2)} cubic yards · order <strong>${zahl(r.orderCy)} cubic yards</strong> · ≈ ${t(r.tons)}</p>`
          : `<p class="gross"><span>${zahl(r.cy, 2)}</span> cubic yards of ${m.label.toLowerCase()}</p><p class="neben">order <strong>${zahl(r.orderCy)} cubic yards</strong> · ≈ ${t(r.tons)}</p>`;
      const zeilen = [
        ['Area', flaecheText],
        ['Depth', tiefeText],
        ['Volume', metrisch ? `${zahl(r.m3, 2)} m³` : `${zahl(r.cuFt)} cu ft`],
        ['Weight', `${t(r.tonsRange[0])} – ${t(r.tonsRange[1])}`],
      ];
      if (r.bags) zeilen.push([`Bags (${r.bagSize} cu ft)`, `${r.bags.toLocaleString('en-US')} bags`]);
      const trips = pickupTrips(r);
      zeilen.push(['Pickup truck', trips > 3 ? `${trips} trips – delivery recommended` : `${trips} trip${trips > 1 ? 's' : ''} (half-ton pickup)`]);

      const c = cost(r, { perCy: wert('p-cy'), perTon: wert('p-t'), perBag: wert('p-sack'), deliveryFee: wert('p-lief') });
      const kosten = [];
      if (c.bulkByCy != null) kosten.push(['Bulk (by cubic yard)', geld(c.bulkByCy)]);
      if (c.bulkByTon != null) kosten.push(['Bulk (by ton)', geld(c.bulkByTon)]);
      if (c.bags != null) kosten.push(['Bags', geld(c.bags)]);

      const tipp = r.bags && r.cy >= 2.5 && m.sold_by.includes('cy')
        ? '<p class="tipp">At this amount, bulk delivery from a landscape supply yard is usually cheaper than bags.</p>'
        : '';
      html = `${haupt}
        <dl class="werte">${zeilen.map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join('')}</dl>
        ${kosten.length ? `<h3>Estimated cost</h3><dl class="werte">${kosten.map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join('')}</dl>` : '<p class="klein">Add prices under “Advanced” to compare bulk vs. bags.</p>'}
        ${tipp}
        <p class="klein">Includes ${wert('puffer') ?? 0}% extra for settling and waste.</p>`;
    }
    const link = new URL(location.pathname, location.origin);
    link.searchParams.set('m', state.material);
    link.searchParams.set('sqft', +(sqft).toFixed(1));
    link.searchParams.set('d', +($('tiefe').value));
    if (metrisch) link.searchParams.set('u', 'metric');
    box.innerHTML = html + `<div class="ergebnis-aktionen">
      ${cfg.cta ? '<a class="knopf" href="/landscape-supply/">Find a supplier near you</a>' : ''}
      <button type="button" class="knopf-zweit" id="teilen" data-link="${link}">Copy link to this result</button></div>`;
    leiste(kurz);
  }

  // ---------- Ergebnisleiste unten (Handy): zeigt das Ergebnis, solange die Ergebnisbox noch nicht im Bild ist ----------
  let boxUnten = true;
  function leiste(kurz) {
    $('leiste-text').innerHTML = kurz || '';
    const zeigen = !!kurz && boxUnten;
    $('leiste').hidden = !zeigen;
    document.body.classList.toggle('mit-leiste', !!kurz);
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      boxUnten = !e.isIntersecting && e.boundingClientRect.top > 0;
      leiste($('leiste-text').innerHTML);
    }).observe($('ergebnis'));
  }
  const zumErgebnis = () => {
    document.activeElement?.blur?.();
    $('ergebnis').scrollIntoView({ block: 'start' });
    $('ergebnis').focus({ preventScroll: true });
  };
  $('leiste-knopf').addEventListener('click', zumErgebnis);

  $('ergebnis').addEventListener('click', async (e) => {
    if (e.target.id !== 'teilen') return;
    const link = e.target.dataset.link;
    try { await navigator.clipboard.writeText(link); e.target.textContent = 'Link copied'; }
    catch { prompt('Copy this link:', link); }
  });

  function speichern() {
    try {
      const daten = { einheit: state.einheit, material: state.material, abschnitte: state.abschnitte, tiefe: $('tiefe').value, puffer: $('puffer').value };
      for (const id of ['p-cy', 'p-t', 'p-sack', 'p-lief']) if ($(id)) daten[id] = $(id).value;
      localStorage.setItem(SPEICHER, JSON.stringify(daten));
    } catch {}
  }

  form.addEventListener('input', (e) => { if (!e.target.dataset.k) rechnen(); });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    rechnen();
    if (matchMedia('(max-width: 760px)').matches) zumErgebnis();
    else $('ergebnis').focus({ preventScroll: true });
  });
  // Enter springt zum nächsten Zahlenfeld (schnelles Tippen auf dem Handy), im letzten zeigt es das Ergebnis
  form.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.target.type !== 'number') return;
    const felder = [...form.querySelectorAll('#abschnitte input[type=number], #tiefe')];
    const i = felder.indexOf(e.target);
    if (i < 0 || i === felder.length - 1) return;
    e.preventDefault();
    felder[i + 1].focus();
  });
  // Zahlenfelder beim Antippen markieren, damit man direkt überschreiben kann
  form.addEventListener('focusin', (e) => { if (e.target.type === 'number') setTimeout(() => e.target.select?.(), 0); });

  // ---------- Start ----------
  if ($('material')) $('material').value = state.material;
  materialHinweise();
  einheitenZeigen();
  abschnitteZeichnen();
  rechnen();
}
