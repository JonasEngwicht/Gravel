// Eigene Auswahlliste statt der nativen Dropdowns von Android/iOS/Windows.
// Das echte <select> bleibt unsichtbar im DOM und ist die Quelle der Wahrheit: Rechner-Logik, Formular und
// Link-Parameter arbeiten weiter damit. Wir zeigen nur einen Knopf und beim Antippen ein Blatt
// (Handy: von unten, Desktop: direkt unter dem Feld) mit Gruppen, Farbfeld und Infozeile.
// Optionale Attribute an <option>: data-farbe (Farbfeld), data-info (zweite Zeile).

const WERT = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const PFEIL = '<svg class="auswahl-pfeil" aria-hidden="true" viewBox="0 0 12 8" width="12" height="8"><path d="M1 1l5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>';
const HAKEN = '<svg class="blatt-haken" aria-hidden="true" viewBox="0 0 24 24" width="22" height="22"><path d="M5 12.5 10 17.5 19.5 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const istHandy = () => matchMedia('(max-width: 760px)').matches;

// Ein gemeinsames Blatt für alle Auswahlfelder
const blatt = document.createElement('dialog');
blatt.className = 'auswahl-blatt';
document.body.append(blatt);
let aktiv = null; // { sel, knopf }

blatt.addEventListener('click', (e) => {
  if (e.target === blatt) return schliessen(); // Klick auf den Hintergrund
  const o = e.target.closest('[data-wert]');
  if (o) waehlen(o.dataset.wert);
  if (e.target.closest('.blatt-zu')) schliessen();
});
blatt.addEventListener('close', () => {
  document.documentElement.classList.remove('blatt-offen');
  aktiv?.knopf.setAttribute('aria-expanded', 'false');
  aktiv?.knopf.focus({ preventScroll: true });
  aktiv = null;
});
blatt.addEventListener('keydown', (e) => {
  if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
  const opts = [...blatt.querySelectorAll('.blatt-option:not([hidden])')];
  if (!opts.length) return;
  e.preventDefault();
  const i = opts.indexOf(document.activeElement);
  const ziel = e.key === 'Home' ? 0 : e.key === 'End' ? opts.length - 1
    : e.key === 'ArrowDown' ? Math.min(opts.length - 1, i + 1) : Math.max(0, i - 1);
  opts[ziel].focus();
});
addEventListener('resize', () => { if (aktiv) positionieren(); });

function beschriftung(sel) {
  const label = sel.closest('label');
  if (!label) return sel.getAttribute('aria-label') || '';
  return [...label.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(' ').replace(/\s+/g, ' ').trim()
    || label.textContent.replace(/\s+/g, ' ').trim();
}

function verschoenern(sel) {
  if (sel.dataset.schoen || sel.multiple) return;
  sel.dataset.schoen = '1';
  const knopf = document.createElement('button');
  knopf.type = 'button';
  knopf.className = 'auswahl-knopf';
  knopf.setAttribute('aria-haspopup', 'dialog');
  knopf.setAttribute('aria-expanded', 'false');
  sel.after(knopf);
  sel.classList.add('auswahl-nativ');
  sel.tabIndex = -1;
  sel.setAttribute('aria-hidden', 'true');

  const name = beschriftung(sel);
  const zeichnen = () => {
    const o = sel.selectedOptions[0];
    const leer = !o || o.value === '';
    const waehlbar = [...sel.options].filter((x) => x.value !== '').length;
    knopf.disabled = sel.disabled || waehlbar === 0;
    knopf.classList.toggle('platzhalter', leer);
    knopf.innerHTML = `${o?.dataset.farbe ? `<span class="farbe" style="--f:${esc(o.dataset.farbe)}"></span>` : ''}<span class="auswahl-text">${esc(o?.textContent || '')}</span>${knopf.disabled ? '' : PFEIL}`;
    knopf.setAttribute('aria-label', `${name}: ${o?.textContent || ''}`);
  };
  // Programmatische Änderungen (sel.value = …, neue Optionen) sofort im Knopf zeigen
  Object.defineProperty(sel, 'value', {
    configurable: true,
    get() { return WERT.get.call(this); },
    set(v) { WERT.set.call(this, v); zeichnen(); },
  });
  sel.addEventListener('change', zeichnen);
  new MutationObserver(zeichnen).observe(sel, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled'] });
  knopf.addEventListener('click', () => oeffnen(sel, knopf, name));
  // Tipp auf die Beschriftung öffnet ebenfalls die Liste (statt das versteckte native Feld)
  sel.closest('label')?.addEventListener('click', (e) => {
    if (e.target.closest('.auswahl-knopf')) return;
    e.preventDefault();
    if (!knopf.disabled) knopf.click();
  });
  zeichnen();
}

function oeffnen(sel, knopf, name) {
  aktiv = { sel, knopf };
  const optionen = [...sel.options].filter((o) => o.value !== '');
  const mitSuche = optionen.length > 12;
  const zeile = (o) => `<button type="button" class="blatt-option" role="option" data-wert="${esc(o.value)}" aria-selected="${o.selected}" data-text="${esc(o.textContent.toLowerCase())}">
    ${o.dataset.farbe ? `<span class="farbe" style="--f:${esc(o.dataset.farbe)}"></span>` : ''}
    <span class="blatt-text"><span>${esc(o.textContent)}</span>${o.dataset.info ? `<small>${esc(o.dataset.info)}</small>` : ''}</span>${HAKEN}</button>`;
  const gruppen = [...sel.children].map((k) => (k.tagName === 'OPTGROUP'
    ? `<div class="blatt-gruppe" role="group" aria-label="${esc(k.label)}"><p>${esc(k.label)}</p>${[...k.children].filter((o) => o.value !== '').map(zeile).join('')}</div>`
    : k.value !== '' ? zeile(k) : '')).join('');
  blatt.innerHTML = `<div class="blatt-griff" aria-hidden="true"></div>
  <div class="blatt-kopf"><strong>${esc(name)}</strong><button type="button" class="blatt-zu" aria-label="Close">×</button></div>
  ${mitSuche ? '<input type="search" class="blatt-suche" placeholder="Search…" aria-label="Search" autocomplete="off" enterkeyhint="done">' : ''}
  <div class="blatt-liste" role="listbox" aria-label="${esc(name)}">${gruppen}</div>
  ${mitSuche ? '<p class="blatt-leer" hidden>Nothing found.</p>' : ''}`;

  const suche = blatt.querySelector('.blatt-suche');
  suche?.addEventListener('input', () => {
    const q = suche.value.trim().toLowerCase();
    let treffer = 0;
    blatt.querySelectorAll('.blatt-option').forEach((b) => { b.hidden = !!q && !b.dataset.text.includes(q); if (!b.hidden) treffer++; });
    blatt.querySelectorAll('.blatt-gruppe').forEach((g) => { g.hidden = !g.querySelector('.blatt-option:not([hidden])'); });
    blatt.querySelector('.blatt-leer').hidden = treffer > 0;
  });
  suche?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); const erste = blatt.querySelector('.blatt-option:not([hidden])'); if (erste) waehlen(erste.dataset.wert); }
  });

  document.documentElement.classList.add('blatt-offen');
  knopf.setAttribute('aria-expanded', 'true');
  blatt.showModal();
  positionieren();
  const gewaehlt = blatt.querySelector('[aria-selected="true"]') || blatt.querySelector('.blatt-option');
  gewaehlt?.scrollIntoView({ block: 'center' });
  // Auf dem Handy nicht ins Suchfeld springen, sonst klappt sofort die Tastatur auf
  (istHandy() ? gewaehlt : suche || gewaehlt)?.focus({ preventScroll: true });
}

// Desktop: direkt unter (oder über) dem Feld; Handy: per CSS als Blatt von unten
function positionieren() {
  blatt.style.cssText = '';
  if (istHandy() || !aktiv) return;
  const r = aktiv.knopf.getBoundingClientRect();
  const breite = Math.max(r.width, 340);
  const links = Math.min(Math.max(8, r.left), innerWidth - breite - 8);
  const unten = innerHeight - r.bottom - 12;
  const oben = r.top - 12;
  const hoch = unten >= 320 || unten >= oben;
  Object.assign(blatt.style, {
    left: `${links}px`, width: `${breite}px`,
    maxHeight: `${Math.min(480, hoch ? unten : oben)}px`,
    ...(hoch ? { top: `${r.bottom + 6}px` } : { top: 'auto', bottom: `${innerHeight - r.top + 6}px` }),
  });
}

function waehlen(wert) {
  if (!aktiv) return;
  const { sel } = aktiv;
  if (WERT.get.call(sel) !== wert) {
    sel.value = wert;
    sel.dispatchEvent(new Event('input', { bubbles: true }));
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  }
  blatt.close();
}

function schliessen() { blatt.close(); }

if (typeof HTMLDialogElement === 'function') {
  document.querySelectorAll('select').forEach(verschoenern);
}
