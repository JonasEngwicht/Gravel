// Worker "gravel" – Aufbau wie src/worker.js im Hofladen-Repo:
//   Weiterleitungen (https ohne www, Schreibvarianten, Seitenarchiv 301, entfernte Yards 410)
//   /api/umkreis?zip=80202&material=hardwood-mulch&delivery=1  → nächste Yards als JSON
//   Alle anderen HTML-Seiten kommen aus public/ (ASSETS, html_handling "none").
import ROUTEN from './generated/routen.json';
import YARDS from './generated/yards.json';
import ZIPS from './generated/zips.json';
import { findYards, yardPrice } from '../static/umkreis.js';

const JSON_KOPF = { 'Content-Type': 'application/json; charset=utf-8' };
const antwort = (daten, status = 200, cache = 'public, max-age=300') =>
  new Response(JSON.stringify(daten), { status, headers: { ...JSON_KOPF, 'Cache-Control': cache, 'X-Robots-Tag': 'noindex' } });

// ---------- Umkreissuche ----------
const MAX_TREFFER = 20;
export function umkreis(url) {
  const zip = url.searchParams.get('zip');
  let origin = null;
  if (zip) {
    if (!/^\d{5}$/.test(zip)) return antwort({ fehler: 'Please enter a 5-digit ZIP code.' }, 400);
    if (!ZIPS[zip]) return antwort({ fehler: 'Unknown ZIP code.' }, 404);
    origin = ZIPS[zip];
  } else {
    const roh = [url.searchParams.get('lat'), url.searchParams.get('lon')];
    const [lat, lon] = roh.map((x) => (x == null || x === '' ? NaN : +x));
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return antwort({ fehler: 'zip or lat/lon required.' }, 400);
    origin = [lat, lon];
  }
  const material = url.searchParams.get('material') || null;
  const maxMiles = Math.min(Math.max(+url.searchParams.get('max') || 30, 5), 100);
  const treffer = findYards({ origin, materialId: material, needsDelivery: url.searchParams.get('delivery') === '1', maxMiles }, YARDS)
    .slice(0, MAX_TREFFER)
    .map(({ yard: y, miles, confirmed }) => ({ name: y.name, pfad: y.pfad, city: y.address.city, state: y.address.state,
      miles: Math.round(miles * 10) / 10, confirmed, featured: y.listing?.tier === 'featured',
      price: material ? yardPrice(y, material) : null, delivery: y.delivery?.available ?? null, phone: y.phone }));
  return antwort({ origin, treffer });
}

// ---------- HTML-Seiten, Weiterleitungen, 410/404 ----------
const ENTFERNT = new Set(ROUTEN.entfernt);
export function normalisiere(pfad) {
  let p = pfad;
  try { p = decodeURIComponent(p); } catch {}
  p = p.toLowerCase().replace(/[\s_+]+/g, '-').replace(/\/{2,}/g, '/').replace(/\/index\.html?$/, '/');
  if (!p.endsWith('/') && !/\.[a-z0-9]{2,5}$/.test(p)) p += '/';
  return p;
}
async function seiteLaden(env, url, pfad, request) {
  const r = await env.ASSETS.fetch(new Request(new URL(pfad === '/' ? '/index.html' : `${pfad}index.html`, url), { method: request.method, headers: request.headers }));
  return r.status === 200 || r.status === 304 ? r : null;
}
async function fehlerSeite(env, url, status) {
  const r = await env.ASSETS.fetch(new URL('/404.html', url));
  return new Response(r.body, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
}
const dauerhaft = (url, pfad) => new Response(null, { status: 301, headers: { Location: pfad + url.search, 'Cache-Control': 'public, max-age=86400' } });

export const HSTS = 'max-age=31536000';
function sicherheitsKopf(r) {
  if (r.status >= 300 && r.status < 400) return r;
  const k = new Response(r.body, r);
  const typ = k.headers.get('Content-Type') || '';
  if (/^text\/html/i.test(typ) && !/charset/i.test(typ)) k.headers.set('Content-Type', 'text/html; charset=utf-8');
  k.headers.set('Strict-Transport-Security', HSTS);
  k.headers.set('X-Content-Type-Options', 'nosniff');
  return k;
}
async function seiteAusliefern(request, env, url) {
  const pfad = url.pathname;
  const n = normalisiere(pfad);
  if (n === pfad && pfad.endsWith('/') && !ROUTEN.umleitungen[pfad]) {
    const r = await seiteLaden(env, url, pfad, request);
    if (r) return r;
  }
  if (ROUTEN.umleitungen[n]) return dauerhaft(url, ROUTEN.umleitungen[n]);
  if (ENTFERNT.has(n)) return fehlerSeite(env, url, 410);
  if (n !== pfad && n.endsWith('/') && await seiteLaden(env, url, n, new Request(url, { method: 'HEAD' }))) return dauerhaft(url, n);
  if (/\.[a-z0-9]{2,5}$/i.test(pfad)) return env.ASSETS.fetch(request);
  return fehlerSeite(env, url, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // Immer https ohne www – in einem Schritt
    if (url.hostname.startsWith('www.') || (url.protocol === 'http:' && !/^(localhost|127\.)/.test(url.hostname))) {
      if (url.hostname.startsWith('www.')) url.hostname = url.hostname.slice(4);
      url.protocol = 'https:';
      return new Response(null, { status: 301, headers: { Location: url.toString() } });
    }
    if (url.pathname === '/api/umkreis') return umkreis(url);
    if (url.pathname.startsWith('/api/')) return antwort({ fehler: 'Not found' }, 404, 'no-store');
    return sicherheitsKopf(await seiteAusliefern(request, env, url));
  },
};
