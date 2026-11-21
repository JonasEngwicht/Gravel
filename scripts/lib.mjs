// Gemeinsame Hilfsfunktionen für Import und Build (nur Node-Bordmittel).
// Aufbau wie scripts/lib.mjs im Hofladen-Repo, angepasst auf die USA.
import { readFileSync, existsSync } from 'node:fs';

export const STATES = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut',
  DE: 'Delaware', DC: 'District of Columbia', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois',
  IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana',
  NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
  NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania',
  RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah',
  VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
};

export function slugify(s) {
  return String(s)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// US-Postleitzahlen aus GeoNames (CC BY 4.0), Datei US.txt aus https://download.geonames.org/export/zip/US.zip
// Spalten (Tab): Land, ZIP, Ort, Bundesstaat, Kürzel, County, County-Code, –, –, Breite, Länge, Genauigkeit
// Fehlt die Datei (lokal ohne Netz), wird die kleine Beispieldatei genommen (nur für Tests).
export function ladeZips(pfad, beispiel) {
  const datei = existsSync(pfad) ? pfad : beispiel;
  const zips = new Map();
  for (const zeile of readFileSync(datei, 'utf8').split('\n')) {
    const f = zeile.split('\t');
    if (f.length < 11 || !/^\d{5}$/.test(f[1])) continue;
    const lat = +f[9], lon = +f[10];
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    zips.set(f[1], { zip: f[1], ort: f[2], state: f[4], county: f[5], lat, lon });
  }
  return { zips, beispiel: datei === beispiel };
}

// Median einer Zahlenliste (null bei leerer Liste)
export function median(werte) {
  const v = werte.filter(Number.isFinite).sort((a, b) => a - b);
  if (!v.length) return null;
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}
