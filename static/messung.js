// Google Tag (Google Tag Manager, Container GTM-5QT7N2LM) mit Einwilligung.
// Der Worker setzt <html data-eu="1"> für Besucher aus EU/EWR, Großbritannien und der Schweiz (und wenn das Land
// unbekannt ist). Dort lädt das Tag erst nach "Accept". Überall sonst lädt es sofort – außer der Besucher hat
// über "Cookie settings" abgelehnt oder sein Browser sendet Global Privacy Control.
// Gespeichert wird nur die Entscheidung selbst (localStorage "einwilligung": "ja" | "nein").

const TAG_ID = 'GTM-5QT7N2LM';
const SCHLUESSEL = 'einwilligung';
const eu = document.documentElement.dataset.eu === '1';

const lesen = () => { try { return localStorage.getItem(SCHLUESSEL); } catch { return null; } };
const merken = (wert) => { try { localStorage.setItem(SCHLUESSEL, wert); } catch {} };

window.dataLayer = window.dataLayer || [];
function gtag() { window.dataLayer.push(arguments); }
window.gtag = gtag;

let geladen = false;
function laden() {
  if (geladen) return;
  geladen = true;
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtm.js?id=${TAG_ID}`;
  document.head.append(s);
  gtag('js', new Date());
}

const entscheidung = lesen();
const gpc = navigator.globalPrivacyControl === true;
const erlaubt = eu ? entscheidung === 'ja' : entscheidung !== 'nein' && !gpc;
// Erst nach dem Laden der Seite und in einer ruhigen Phase: das Tag (rund 80 kB) soll weder den ersten
// Seitenaufbau noch den Rechner ausbremsen.
const spaeter = () => ('requestIdleCallback' in window ? requestIdleCallback(laden, { timeout: 4000 }) : setTimeout(laden, 1500));
if (erlaubt) {
  if (document.readyState === 'complete') spaeter();
  else addEventListener('load', spaeter, { once: true });
}

// ---------- Banner ----------
function banner() {
  document.querySelector('.einwilligung')?.remove();
  const an = eu ? lesen() === 'ja' : lesen() !== 'nein' && !gpc;
  const box = document.createElement('section');
  box.className = 'einwilligung';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-label', 'Cookie settings');
  box.innerHTML = `<p><strong>Measuring visits with Google</strong>
We’d like to use Google tools to see how this site is used and improve it. This sends data such as your IP address to Google and sets cookies. ${eu ? 'Nothing is loaded unless you accept.' : `Currently ${an ? 'on' : 'off'}.`} <a href="/privacy/#google">Privacy policy</a></p>
<div class="einwilligung-knoepfe">
  <button type="button" class="knopf-zweit" data-wahl="nein">Decline</button>
  <button type="button" class="knopf-zweit" data-wahl="ja">Accept</button>
</div>`;
  box.addEventListener('click', (e) => {
    const wahl = e.target.closest('[data-wahl]')?.dataset.wahl;
    if (!wahl) return;
    const vorher = geladen;
    merken(wahl);
    box.remove();
    if (wahl === 'ja') laden();
    // Zurückziehen: bereits geladene Google-Skripte lassen sich nur durch Neuladen der Seite entfernen
    else if (vorher) location.reload();
  });
  document.body.append(box);
  box.querySelector('[data-wahl="ja"]').focus({ preventScroll: true });
}

function start() {
  if (eu && !entscheidung) banner();
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-einwilligung]')) return;
    e.preventDefault();
    banner();
  });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
else start();
