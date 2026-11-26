// Karte der Yards auf Stadtseiten. Lädt erst nach Klick: Leaflet (unpkg.com) und Kacheln von tile.openstreetmap.org.
// Vorher wird nichts von Dritten geladen (siehe Privacy Policy, Abschnitt „Map“).
const LEAFLET = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet';

function laden(url, typ) {
  return new Promise((ok, fehler) => {
    const el = typ === 'css' ? Object.assign(document.createElement('link'), { rel: 'stylesheet', href: url }) : Object.assign(document.createElement('script'), { src: url });
    el.crossOrigin = '';
    el.onload = ok; el.onerror = fehler;
    document.head.append(el);
  });
}
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

for (const knopf of document.querySelectorAll('[data-karte]')) {
  knopf.addEventListener('click', async () => {
    const box = knopf.parentElement.nextElementSibling;
    knopf.disabled = true;
    knopf.textContent = 'Loading map…';
    try {
      await Promise.all([laden(`${LEAFLET}.css`, 'css'), laden(`${LEAFLET}.js`, 'js')]);
      box.hidden = false;
      const punkte = JSON.parse(knopf.dataset.karte);
      const L = window.L;
      const karte = L.map(box, { scrollWheelZoom: false });
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(karte);
      const marker = punkte.map(([lat, lng, name, pfad]) => L.circleMarker([lat, lng], { radius: 8, color: '#3d5a2a', fillColor: '#6b8f4e', fillOpacity: 0.85, weight: 2 })
        .bindPopup(`<a href="${esc(pfad)}">${esc(name)}</a>`).addTo(karte));
      karte.fitBounds(L.featureGroup(marker).getBounds().pad(0.2), { maxZoom: 13 });
      knopf.parentElement.hidden = true;
    } catch {
      knopf.disabled = false;
      knopf.textContent = 'Map could not be loaded – try again';
    }
  });
}
