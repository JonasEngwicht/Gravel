// Cloudflare Worker für Gravel.
// Liefert die statischen Seiten aus public/ aus, leitet http:// und www. auf https://gravelandmulch.com um,
// setzt HSTS und den Zeichensatz im Content-Type und markiert HTML für Besucher aus EU/EWR, UK und CH
// mit <html data-eu="1"> (static/messung.js lädt das Google Tag dort erst nach Einwilligung).
// Auf *.workers.dev (Vorschau) bekommt jede Antwort "X-Robots-Tag: noindex", damit die Vorschau nicht in den Index gerät.

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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // http → https und www → Hauptdomain in einem Schritt (eine Adresse für Google, ein 301)
    const lokal = LOKAL.has(url.hostname);
    if ((url.protocol === 'http:' && !lokal) || url.hostname.startsWith('www.')) {
      url.protocol = lokal ? url.protocol : 'https:';
      if (url.hostname.startsWith('www.')) url.hostname = url.hostname.slice(4);
      return Response.redirect(url.toString(), 301);
    }
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
