// Umrechner Kubikyards ↔ Tonnen. Dichten stehen als data-Attribute an den Optionen (kein Nachladen nötig).
const form = document.getElementById('umrechner');
const $ = (id) => document.getElementById(id);
const zahl = (n, d = 2) => n.toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: 0 });
let richtung = 'cy';

function rechnen() {
  const o = $('u-material').selectedOptions[0];
  const t = +o.dataset.t, min = +o.dataset.min, max = +o.dataset.max;
  const name = o.textContent.replace(/ \(.*\)$/, '').toLowerCase();
  const v = +$('u-wert').value;
  const box = $('u-ergebnis');
  if (!(v > 0)) { box.innerHTML = '<p class="leer">Enter an amount.</p>'; return; }
  if (richtung === 'cy') {
    box.innerHTML = `<p class="gross"><span>${zahl(v * t)}</span> tons</p>
      <p class="neben">${zahl(v)} cubic yard${v === 1 ? '' : 's'} of ${name} · range ${zahl(v * min)}–${zahl(v * max)} tons · ${zahl(v * t * 2000, 0)} lb</p>`;
  } else {
    box.innerHTML = `<p class="gross"><span>${zahl(v / t)}</span> cubic yards</p>
      <p class="neben">${zahl(v)} ton${v === 1 ? '' : 's'} of ${name} · range ${zahl(v / max)}–${zahl(v / min)} cubic yards · ${zahl((v / t) * 27, 1)} cu ft</p>`;
  }
}

form.querySelectorAll('[data-richtung]').forEach((b) => b.addEventListener('click', () => {
  richtung = b.dataset.richtung;
  form.querySelectorAll('[data-richtung]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  $('u-label').textContent = richtung === 'cy' ? 'Cubic yards' : 'Tons';
  rechnen();
}));
form.addEventListener('input', rechnen);
form.addEventListener('submit', (e) => { e.preventDefault(); rechnen(); });
rechnen();
