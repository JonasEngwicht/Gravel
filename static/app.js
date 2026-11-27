// Rechner im Browser. Rechenlogik kommt aus core.js (dieselbe Datei wie src/calc/core.js, getestet in test/).
import { totalArea, calculate, cost, pickupTrips, dumpTruckLoads, bulkVsBags, m2ToSqft, cmToIn, mToFt, KG_PER_TON } from './core.js';
import { FORMEN as FORMEN_ALLE, FORMEN_TOPF, abschnittHtml } from './formen.js';

const form = document.getElementById('rechner');
if (form) start();
// Verzeichnis: Suche nach ZIP/Stadt und Städtefilter (eigene Datei, nur wo gebraucht)
if (document.querySelector('[data-finder], [data-filter], [data-chips]')) import('./finder.js');
// Karte auf Stadtseiten: Leaflet und OpenStreetMap-Kacheln laden erst nach Klick auf „Show on map“
if (document.querySelector('[data-karte]')) import('./karte.js');
if (document.getElementById('umrechner')) import('./umrechner.js');
// /embed/: Code für das gewählte Startmaterial
const embedWahl = document.querySelector('[data-embed]');
if (embedWahl) embedWahl.addEventListener('change', () => {
  const code = document.getElementById('embed-code');
  code.value = code.value.replace(/\?m=[a-z0-9-]+/, `?m=${embedWahl.value}`);
  const vorschau = document.querySelector('iframe[src^="/embed/calculator/"]');
  if (vorschau) vorschau.src = `/embed/calculator/?m=${embedWahl.value}`;
});
if (document.querySelector('select')) import('./auswahl.js');

// Inhaltsverzeichnis: auf dem Handy eingeklappt, auf breiten Bildschirmen offen (steht offen im HTML)
const toc = document.querySelector('.toc details');
if (toc && matchMedia('(max-width: 1019px)').matches) toc.open = false;
const DREI = [0.25, 0.5, 1, 2, 3, 4, 6, 8, 12, 18, 24];

async function start() {
  const cfg = JSON.parse(form.dataset.cfg);
  const DATA = await (await fetch('/assets/materials.json')).json();
  const matById = Object.fromEntries(DATA.materials.map((m) => [m.id, m]));
  const $ = (id) => document.getElementById(id);

  // cfg.zoll: Töpfe und Kübel – Maße in Zoll (bzw. cm), Ergebnis in Kubikfuß und Quarts
  const FORMEN = cfg.zoll ? FORMEN_TOPF : FORMEN_ALLE;
  const WORT = cfg.zoll ? 'Pot' : 'Area';
  // Vom Build ins HTML geschriebenes Beispiel-Ergebnis: bleibt stehen, bis jemand eigene Werte eingibt
  const beispielHtml = $('ergebnis').querySelector('.beispiel-ergebnis') ? $('ergebnis').innerHTML : '';

  const state = {
    einheit: 'imperial',
    material: cfg.material,
    abschnitte: [{ shape: cfg.shape, dims: {} }],
  };

  // ---------- Link-Parameter (geteiltes Ergebnis). Bewusst kein localStorage: nichts wird auf dem Gerät gespeichert. ----------
  const q = new URLSearchParams(location.search);
  if (q.has('sqft') || q.has('m')) {
    if (q.get('m') && matById[q.get('m')]) state.material = q.get('m');
    // Töpfe kennen keine „Known area“: Fläche als runden Topf mit gleichem Querschnitt zeigen
    if (q.get('sqft')) state.abschnitte = cfg.zoll
      ? [{ shape: 'circle', dims: { diameter: +(Math.sqrt((+q.get('sqft') * 4) / Math.PI) * (q.get('u') === 'metric' ? 30.48 : 12)).toFixed(1) } }]
      : [{ shape: 'area', dims: { sqft: +q.get('sqft') } }];
    if (q.get('u') === 'metric') state.einheit = 'metric';
    if (q.get('d')) $('tiefe').value = q.get('d');
    if (q.get('e') && $('bestand')) $('bestand').value = q.get('e');
  }

  // ---------- Abschnitte ----------
  const lang = () => (cfg.zoll ? (state.einheit === 'metric' ? 'cm' : 'in') : state.einheit === 'metric' ? 'm' : 'ft');
  // Eingabe → Fuß: Zoll ÷ 12, cm ÷ 30.48, m × 3.28084
  const inFuss = (v) => (cfg.zoll ? (state.einheit === 'metric' ? v / 30.48 : v / 12) : state.einheit === 'metric' ? mToFt(v) : v);
  const flaeche = () => (state.einheit === 'metric' ? 'm²' : 'sq ft');

  function abschnitteZeichnen() {
    const box = $('abschnitte');
    box.innerHTML = '';
    state.abschnitte.forEach((a, i) => {
      const f = document.createElement('fieldset');
      const mehrere = state.abschnitte.length > 1;
      f.className = 'abschnitt' + (mehrere ? '' : ' einzeln');
      f.innerHTML = abschnittHtml(a, i, { mehrere, lang: lang(), flaeche: flaeche(), formen: FORMEN, wort: WORT });
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
    state.abschnitte.push({ shape: cfg.zoll ? cfg.shape : 'rectangle', dims: {} });
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
      const f = k === 'sqft' ? m2ToSqft(1) : cfg.zoll ? 1 / 2.54 : mToFt(1);
      a.dims[k] = +(zuMetrisch ? v / f : v * f).toFixed(cfg.zoll ? 1 : 2);
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
    if ($('verdichtung')) {
      $('verdichtung').value = m.compaction_pct || 0;
      $('verdichtung').closest('label').hidden = !m.compaction_pct;
    }
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
    $('tiefe-hinweis').textContent = cfg.zoll
      ? 'Use the inside height of the pot, minus about an inch at the rim for watering.'
      : `Recommended for ${m.label.toLowerCase()}: ${a}–${b} in (${+(a * 2.54).toFixed(1)}–${+(b * 2.54).toFixed(1)} cm).`;
    const h = $('mat-hinweis');
    h.hidden = !m.note;
    h.textContent = m.note || '';
    const sack = $('sack');
    if (sack) {
      sack.innerHTML = m.bag_cu_ft.length ? m.bag_cu_ft.map((s) => `<option value="${s}">${s} cu ft${cfg.zoll ? ` (${Math.round(s * 25.714)} qt)` : ''}</option>`).join('') : '<option value="">Not sold in bags</option>';
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
      for (const k of felder) dims[k] = k === 'sqft' ? (metrisch ? m2ToSqft(a.dims[k] ?? 0) : (a.dims[k] ?? 0)) : inFuss(a.dims[k] ?? 0);
      abschnitte.push({ shape: a.shape, dims });
    }
    const tiefe = wert('tiefe');
    const bestand = wert('bestand');
    return { abschnitte, depthIn: tiefe ? (metrisch ? cmToIn(tiefe) : tiefe) : 0, existingIn: bestand ? (metrisch ? cmToIn(bestand) : bestand) : 0 };
  }

  function rechnen() {
    chipsMarkieren();
    const box = $('ergebnis');
    const { abschnitte, depthIn, existingIn } = eingabenInFuss();
    const sqft = abschnitte.length ? totalArea(abschnitte) : 0;
    if (!(sqft > 0) || !(depthIn > 0) || existingIn >= depthIn) {
      const unberuehrt = beispielHtml && state.material === cfg.material && state.einheit === 'imperial' && +$('tiefe').value === cfg.depth
        && state.abschnitte.length === 1 && !Object.values(state.abschnitte[0].dims).some((v) => v != null);
      if (unberuehrt) { box.innerHTML = beispielHtml; leiste(''); return; }
      box.innerHTML = `<p class="leer">${!(sqft > 0) ? 'Enter your measurements' : !(depthIn > 0) ? 'Enter a depth' : 'The existing layer is already as deep as the target depth – nothing to add'}${existingIn >= depthIn && depthIn > 0 ? '.' : ' – your result shows up here instantly.'}</p>`;
      leiste('');
      return;
    }
    const m = matById[state.material];
    const r = calculate({ sqft, depthIn, existingIn, material: m, wastePct: wert('puffer') ?? 0, compactionPct: wert('verdichtung') ?? 0, bagCuFt: wert('sack') });
    const metrisch = state.einheit === 'metric';
    const t = (x) => (metrisch ? `${zahl((x * KG_PER_TON) / 1000, 2)} t` : `${zahl(x, 2)} tons`);
    const flaecheText = metrisch ? `${zahl(sqft / m2ToSqft(1))} m²` : `${zahl(sqft, 0)} sq ft`;
    const tief = (x) => (metrisch ? `${zahl(x * 2.54)} cm` : `${zahl(x, 2)} in`);
    const tiefeText = existingIn > 0 ? `${tief(r.netDepthIn)} on top of ${tief(existingIn)} (total ${tief(depthIn)})` : tief(depthIn);
    const extraText = `Includes ${r.wastePct}% extra for settling and waste${r.compactionPct ? ` and ${r.compactionPct}% for compaction` : ''}.`;

    let html, kurz;
    if (cfg.zoll) {
      // Töpfe: Kubikfuß, Dry Quarts (25,7 je Kubikfuß) und Liter statt Kubikyards
      const quarts = r.cuFt * 25.714, liter = r.cuFt * 28.3168;
      kurz = `<strong>${zahl(r.cuFt, 2)} cu ft</strong> · ${zahl(quarts, 0)} qt`;
      if (r.bags) kurz += ` · ${r.bags.toLocaleString('en-US')} bag${r.bags > 1 ? 's' : ''}`;
      const zeilen = [['Dry quarts', zahl(quarts, 0)], ['Liters', zahl(liter, 0)], ['Gallons (dry)', zahl(quarts / 4, 1)], ['Cubic yards', zahl(r.cy, 2)]];
      if (r.bags) zeilen.unshift([`Bags (${r.bagSize} cu ft)`, `${r.bags.toLocaleString('en-US')} bag${r.bags > 1 ? 's' : ''}`]);
      const c = cost(r, { perBag: wert('p-sack') });
      html = `<p class="gross"><span>${zahl(r.cuFt, 2)}</span> cubic feet of ${m.label.toLowerCase().replace(/ \(.*\)$/, '')}</p>
        <p class="neben">≈ <strong>${zahl(quarts, 0)} dry quarts</strong> · ${zahl(liter, 0)} L</p>
        <dl class="werte">${zeilen.map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join('')}</dl>
        ${c.bags != null ? `<h3>Estimated cost</h3><dl class="werte"><div><dt>Bags</dt><dd>${geld(c.bags)}</dd></div></dl>` : ''}
        <p class="klein">Straight-sided estimate${r.wastePct ? ` plus ${r.wastePct}% extra` : ''}. Tapered pots hold about 20% less.</p>`;
    } else if (cfg.nurVolumen) {
      kurz = `<strong>${zahl(r.cy, 2)}</strong> cubic yards`;
      html = `<p class="gross"><span>${zahl(r.cy, 2)}</span> cubic yards${metrisch ? ` (${zahl(r.m3, 2)} m³)` : ''}</p>
        <dl class="werte"><div><dt>Cubic feet</dt><dd>${zahl(r.cuFt)}</dd></div><div><dt>Cubic meters</dt><dd>${zahl(r.m3, 2)}</dd></div>
        <div><dt>Area</dt><dd>${flaecheText}</dd></div><div><dt>Depth</dt><dd>${tiefeText}</dd></div></dl>
        <p class="klein">${extraText}</p>`;
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
      if (r.cy >= 3 || r.tons >= 4) {
        const loads = dumpTruckLoads(r);
        zeilen.push(['Dump truck', `${loads} tandem load${loads > 1 ? 's' : ''} (about 14 tons or 14 cu yd each)`]);
      }

      const c = cost(r, { perCy: wert('p-cy'), perTon: wert('p-t'), perBag: wert('p-sack'), deliveryFee: wert('p-lief') });
      const kosten = [];
      if (c.bulkByCy != null) kosten.push(['Bulk (by cubic yard)', geld(c.bulkByCy)]);
      if (c.bulkByTon != null) kosten.push(['Bulk (by ton)', geld(c.bulkByTon)]);
      if (c.bags != null) kosten.push(['Bags', geld(c.bags)]);
      const vgl = bulkVsBags(c);
      // Ersparnis aus den gerundeten Beträgen, damit die Zeilen zusammenpassen
      if (vgl) kosten.push([vgl.cheaper === 'bulk' ? 'You save with bulk' : 'Bags are cheaper by', `<strong>${geld(Math.abs(Math.round(vgl.bags) - Math.round(vgl.bulk)))}</strong>`]);

      const tipp = r.bags && r.cy >= 2.5 && m.sold_by.includes('cy')
        ? '<p class="tipp">At this amount, bulk delivery from a landscape supply yard is usually cheaper than bags.</p>'
        : '';
      html = `${haupt}
        <dl class="werte">${zeilen.map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join('')}</dl>
        ${kosten.length ? `<h3>Estimated cost</h3><dl class="werte">${kosten.map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join('')}</dl>` : '<p class="klein">Add your local prices under “Options” to see the cost.</p>'}
        ${tipp}
        <p class="klein">${extraText}</p>`;
    }
    const link = new URL(location.pathname, location.origin);
    link.searchParams.set('m', state.material);
    link.searchParams.set('sqft', +(sqft).toFixed(1));
    link.searchParams.set('d', +($('tiefe').value));
    if (metrisch) link.searchParams.set('u', 'metric');
    if (existingIn > 0) link.searchParams.set('e', +($('bestand').value));
    box.innerHTML = html + `<div class="ergebnis-aktionen">
      ${cfg.cta ? '<a class="knopf" href="/landscape-supply/">Find a yard that sells this near you</a>' : ''}
      <button type="button" class="knopf-zweit" id="teilen" data-link="${link}">Copy link</button>
      <button type="button" class="knopf-zweit" id="kopieren">Copy result</button>
      <button type="button" class="knopf-zweit" id="drucken">Print</button></div>`;
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
    if (e.target.id === 'beispiel-laden' && cfg.beispiel) {
      state.abschnitte = [{ shape: cfg.beispiel.shape, dims: { ...cfg.beispiel.dims } }];
      $('tiefe').value = cfg.beispiel.tiefe;
      abschnitteZeichnen();
      rechnen();
      form.querySelector('#abschnitte input[type=number]')?.focus({ preventScroll: true });
      return;
    }
    if (e.target.id === 'drucken') { window.print(); return; }
    if (e.target.id === 'kopieren') {
      // Ergebnis als Text: Hauptzahl, Werte-Tabelle, Kosten, Link
      const box = $('ergebnis');
      const zeilen = [document.querySelector('h1')?.textContent || '', box.querySelector('.gross')?.textContent.trim() || '', box.querySelector('.neben')?.textContent.trim() || '',
        ...[...box.querySelectorAll('.werte > div')].map((d) => `${d.querySelector('dt').textContent}: ${d.querySelector('dd').textContent}`),
        box.querySelector('#teilen')?.dataset.link || ''].filter(Boolean);
      try { await navigator.clipboard.writeText(zeilen.join('\n')); e.target.textContent = 'Result copied'; }
      catch { prompt('Copy your result:', zeilen.join(' · ')); }
      return;
    }
    if (e.target.id !== 'teilen') return;
    const link = e.target.dataset.link;
    try { await navigator.clipboard.writeText(link); e.target.textContent = 'Link copied'; }
    catch { prompt('Copy this link:', link); }
  });


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
