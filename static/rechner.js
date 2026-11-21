// Rechner im Browser: liest das Formular, rechnet mit calc.js, zeigt Ergebnis und Yards in der Nähe.
import { area, calculate, cost, pickupTrips } from './calc.js';
import { esc } from './helfer.js';

const daten = JSON.parse(document.getElementById('rechner-daten')?.textContent || '{"materials":[]}');
const MATERIAL = new Map(daten.materials.map((m) => [m.id, m]));
const f1 = (n) => n.toLocaleString('en-US', { maximumFractionDigits: 1 });
const usd = (n) => `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
const zahl = (v) => { const n = parseFloat(String(v).replace(',', '.')); return Number.isFinite(n) ? n : null; };
const SPEICHER = 'gravel-rechner';
const lies = () => { try { return JSON.parse(localStorage.getItem(SPEICHER) || '{}'); } catch { return {}; } };
const merke = (w) => { try { localStorage.setItem(SPEICHER, JSON.stringify(w)); } catch {} };

function masse(form) {
  const fd = new FormData(form);
  const shape = fd.get('form') || 'rectangle';
  const g = (k) => zahl(fd.get(k)) ?? 0;
  const dims = { length: g('length'), width: g('width'), diameter: g('diameter'), base: g('base'), height: g('height'),
    outerDiameter: g('outerDiameter'), innerDiameter: g('innerDiameter'), sqft: g('sqft') };
  return { shape, dims, fd };
}

function rechne(form) {
  const aus = form.querySelector('[data-ergebnis]');
  const { shape, dims, fd } = masse(form);
  const material = MATERIAL.get(fd.get('material'));
  if (!material) return null;
  const sqft = area(shape, dims);
  const depthIn = zahl(fd.get('depth')) ?? 0;
  if (!(sqft > 0) || !(depthIn > 0)) { aus.innerHTML = '<p>Enter your area and depth.</p>'; return null; }
  const r = calculate({ sqft, depthIn, material, wastePct: zahl(fd.get('waste')) ?? material.waste_pct });
  const c = cost(r, { perCy: zahl(fd.get('perCy')), perTon: zahl(fd.get('perTon')), perBag: zahl(fd.get('perBag')), deliveryFee: zahl(fd.get('deliveryFee')) ?? 0 });
  const tonnenZuerst = form.dataset.modus === 'ton' || (material.sold_by[0] === 'ton');
  const haupt = tonnenZuerst
    ? `<strong>${f1(r.tons)} tons</strong> <span>(${f1(r.cy)} cubic yards)</span>`
    : `<strong>${f1(r.cy)} cubic yards</strong> <span>(≈ ${f1(r.tons)} tons)</span>`;
  const zeilen = [
    `Order: ${tonnenZuerst ? `${f1(r.orderTons)} tons` : `${f1(r.orderCy)} cubic yards`} · ${Math.round(sqft).toLocaleString('en-US')} sq ft at ${f1(depthIn)} in`,
    r.bags ? `or ${r.bags.toLocaleString('en-US')} bags of ${r.bagSize} cu ft` : null,
    `≈ ${pickupTrips(r)} trip${pickupTrips(r) === 1 ? '' : 's'} with a half-ton pickup – delivery is usually easier`,
    c.bulkByCy != null ? `Bulk: ${usd(c.bulkByCy)}` : null,
    c.bulkByTon != null ? `Bulk: ${usd(c.bulkByTon)}` : null,
    c.bags != null ? `Bags: ${usd(c.bags)}` : null,
  ].filter(Boolean);
  aus.innerHTML = `<p class="gross">You need ${haupt}</p><ul>${zeilen.map((z) => `<li>${esc(z)}</li>`).join('')}</ul>`;
  // Preise gelten nur für die jeweilige Seite (Stadt, Material) und werden nicht gemerkt
  merke(Object.fromEntries([...fd.entries()].filter(([k]) => !['zip', 'perCy', 'perTon', 'perBag', 'deliveryFee'].includes(k))));
  return { r, material, form };
}

function felderZeigen(form) {
  const shape = new FormData(form).get('form');
  for (const el of form.querySelectorAll('[data-fuer]')) el.hidden = el.dataset.fuer !== shape;
}

function materialGewechselt(form) {
  const m = MATERIAL.get(form.elements.material.value);
  if (!m) return;
  if (!form.elements.depth.dataset.geaendert) form.elements.depth.value = m.default_depth_in;
  form.elements.waste.value = m.waste_pct;
  const h = form.querySelector('[data-tiefe-hinweis]');
  if (h) h.textContent = `Recommended: ${m.depth_range_in[0]}–${m.depth_range_in[1]} in`;
}

async function yardsSuchen(form, letzte) {
  const box = form.querySelector('[data-zip-ergebnis]');
  const zip = form.elements.zip.value.trim();
  if (!/^\d{5}$/.test(zip)) { box.innerHTML = '<p>Please enter a 5-digit ZIP code.</p>'; return; }
  const q = new URLSearchParams({ zip, material: form.elements.material.value });
  if (form.elements.delivery.checked) q.set('delivery', '1');
  box.innerHTML = '<p>Searching…</p>';
  try {
    const res = await fetch(`/api/umkreis?${q}`);
    const d = await res.json();
    if (!res.ok) { box.innerHTML = `<p>${esc(d.fehler || 'Search failed.')}</p>`; return; }
    if (!d.treffer.length) { box.innerHTML = '<p>No listed yards nearby yet. <a href="/landscape-supply/">Browse all yards</a></p>'; return; }
    box.innerHTML = `<ul class="yards">${d.treffer.map((t) => {
      const p = t.price;
      const menge = p && letzte ? (p.unit === 'ton' ? letzte.r.orderTons : p.unit === 'cy' ? letzte.r.orderCy : null) : null;
      return `<li class="yard"><h3><a href="${esc(t.pfad)}">${esc(t.name)}</a>${t.featured ? ' <span class="marke">Featured</span>' : ''}</h3>
<p>${esc(t.city)}, ${esc(t.state)} · ${f1(t.miles)} mi${t.confirmed ? '' : ' · materials not confirmed'}${p ? ` · ${usd(p.amount)}/${esc(p.unit)}` : ''}${menge ? ` · est. ${usd(menge * p.amount)}` : ''}</p></li>`;
    }).join('')}</ul>`;
  } catch { box.innerHTML = '<p>Search is not available right now.</p>'; }
}

for (const form of document.querySelectorAll('[data-rechner]')) {
  // Vorbelegung: URL-Parameter (geteilte Ergebnisse) vor gespeicherten Werten
  const url = new URLSearchParams(location.search);
  const gespeichert = lies();
  const vor = { ...gespeichert };
  if (url.get('m')) vor.material = url.get('m');
  if (url.get('sqft')) { vor.form = 'area'; vor.sqft = url.get('sqft'); }
  if (url.get('d')) vor.depth = url.get('d');
  const seitenMaterial = form.elements.material.value;
  for (const [k, v] of Object.entries(vor)) {
    const el = form.elements.namedItem(k); // nicht form.elements[k]: „length“ wäre die Anzahl der Felder
    if (!el || (k === 'material' && !url.get('m') && v !== seitenMaterial)) continue; // Seitenmaterial nur per URL überschreiben
    if (el instanceof RadioNodeList) { for (const r of el) r.checked = r.value === v; }
    else if (el.type === 'checkbox') el.checked = !!v;
    else if (MATERIAL.has(v) || k !== 'material') el.value = v;
  }
  let letzte = null;
  const neu = () => { felderZeigen(form); letzte = rechne(form); };
  form.addEventListener('input', (e) => {
    if (e.target.name === 'depth') e.target.dataset.geaendert = '1';
    if (e.target.name === 'material') materialGewechselt(form);
    if (e.target.name !== 'zip') neu();
  });
  form.addEventListener('submit', (e) => { e.preventDefault(); yardsSuchen(form, letzte); });
  form.querySelector('[data-zip-los]')?.addEventListener('click', () => yardsSuchen(form, letzte));
  neu();
}
