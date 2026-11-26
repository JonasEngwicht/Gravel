// Cloudflare Worker für Gravel.
// Liefert die statischen Seiten aus public/ aus, leitet http:// und www. auf https://gravelandmulch.com um,
// setzt HSTS und den Zeichensatz im Content-Type und markiert HTML für Besucher aus EU/EWR, UK und CH
// mit <html data-eu="1"> (static/messung.js lädt das Google Tag dort erst nach Einwilligung).
// Auf *.workers.dev (Vorschau) bekommt jede Antwort "X-Robots-Tag: noindex", damit die Vorschau nicht in den Index gerät.
// Täglich (Cron in wrangler.jsonc) meldet indexNowMelden() neue und geänderte URLs an IndexNow (Bing, Yandex …).

const SICHERHEIT = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(self), camera=(), microphone=()',
};

const LOKAL = new Set(['localhost', '127.0.0.1', '[::1]']);
// EU, EWR (IS, LI, NO), Großbritannien, Schweiz: Google Tag nur mit Einwilligung
const EINWILLIGUNG_NOETIG = new Set(('AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE '
  + 'IS LI NO GB CH').split(' '));
// Land unbekannt (z. B. lokale Entwicklung) → vorsichtshalber wie EU behandeln
export const brauchtEinwilligung = (land) => !land || EINWILLIGUNG_NOETIG.has(land);

const INDEXNOW_API = 'https://api.indexnow.org/indexnow';
const INDEXNOW_MAX = 10000; // URLs pro Anfrage laut Protokoll

// Liest public/indexnow.json (vom Build), vergleicht die Hashes mit dem Stand in KV und meldet nur Neues/Geändertes.
// KV wird erst nach erfolgreicher Meldung aktualisiert, ein Fehlschlag wird also am nächsten Tag wiederholt.
export async function indexNowMelden(env, holen = fetch) {
  const liste = await env.ASSETS.fetch(new Request('https://assets.local/indexnow.json'));
  if (!liste.ok) return { gemeldet: 0, grund: 'keine indexnow.json' };
  const { baseUrl, key, urls } = await liste.json();
  const alt = (await env.INDEXNOW.get('gemeldet', 'json')) || {};
  const neu = Object.keys(urls).filter((u) => alt[u] !== urls[u]);
  for (let i = 0; i < neu.length; i += INDEXNOW_MAX) {
    const r = await holen(INDEXNOW_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: new URL(baseUrl).host, key, keyLocation: `${baseUrl}/${key}.txt`, urlList: neu.slice(i, i + INDEXNOW_MAX) }),
    });
    if (!r.ok) throw new Error(`IndexNow antwortet ${r.status}: ${await r.text()}`);
  }
  if (neu.length) await env.INDEXNOW.put('gemeldet', JSON.stringify(urls));
  console.log(`IndexNow: ${neu.length} von ${Object.keys(urls).length} URLs gemeldet`);
  return { gemeldet: neu.length };
}

export default {
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(indexNowMelden(env));
  },

  async fetch(request, env) {
    const url = new URL(request.url);
    // http → https, www → Hauptdomain und fehlender Schrägstrich am Seitenende (/mulch-calculator → /mulch-calculator/)
    // in einem Schritt: eine Adresse für Google, ein einziges 301. Ohne die Schrägstrich-Regel würde die
    // Asset-Auslieferung mit 307 (vorübergehend) umleiten. Dateien mit Endung (.js, .xml …) bleiben unberührt.
    const lokal = LOKAL.has(url.hostname);
    const ziel = new URL(url);
    if (url.protocol === 'http:' && !lokal) ziel.protocol = 'https:';
    if (url.hostname.startsWith('www.')) ziel.hostname = url.hostname.slice(4);
    if (!url.pathname.endsWith('/') && !/\.[a-z0-9]{1,8}$/i.test(url.pathname)) ziel.pathname += '/';
    if (ziel.href !== url.href) return Response.redirect(ziel.toString(), 301);
    const antwort = await env.ASSETS.fetch(request);
    const neu = new Response(antwort.body, antwort);
    for (const [k, v] of Object.entries(SICHERHEIT)) neu.headers.set(k, v);
    if (!lokal) neu.headers.set('Strict-Transport-Security', 'max-age=31536000');
    // Zeichensatz auch im HTTP-Header angeben (steht sonst nur im HTML)
    const typ = neu.headers.get('Content-Type') || '';
    if (/^(text\/|application\/(javascript|json|xml))/.test(typ) && !/charset=/i.test(typ)) {
      neu.headers.set('Content-Type', `${typ}; charset=utf-8`);
    }
    if (url.hostname.endsWith('.workers.dev')) neu.headers.set('X-Robots-Tag', 'noindex, nofollow');
    if (typ.startsWith('text/html') && typeof HTMLRewriter !== 'undefined') {
      const eu = brauchtEinwilligung(request.cf?.country) ? '1' : '0';
      return new HTMLRewriter().on('html', { element: (el) => el.setAttribute('data-eu', eu) }).transform(neu);
    }
    return neu;
  },
};
