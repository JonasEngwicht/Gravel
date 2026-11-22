// Cloudflare Worker für Gravel.
// Liefert die statischen Seiten aus public/ aus, leitet www.gravelandmulch.com auf gravelandmulch.com um.
// Auf *.workers.dev (Vorschau) bekommt jede Antwort "X-Robots-Tag: noindex", damit die Vorschau nicht in den Index gerät.

const SICHERHEIT = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(self), camera=(), microphone=()',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // www → Hauptdomain (eine Adresse für Google)
    if (url.hostname.startsWith('www.')) {
      url.hostname = url.hostname.slice(4);
      return Response.redirect(url.toString(), 301);
    }
    const antwort = await env.ASSETS.fetch(request);
    const neu = new Response(antwort.body, antwort);
    for (const [k, v] of Object.entries(SICHERHEIT)) neu.headers.set(k, v);
    if (url.hostname.endsWith('.workers.dev')) neu.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return neu;
  },
};
