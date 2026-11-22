// Cloudflare Worker für Gravel.
// Liefert die statischen Seiten aus public/ aus. Auf *.workers.dev (Vorschau ohne eigene Domain)
// bekommt jede Antwort "X-Robots-Tag: noindex", damit die Vorschau nicht in den Index gerät.

const SICHERHEIT = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), camera=(), microphone=()',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const antwort = await env.ASSETS.fetch(request);
    const neu = new Response(antwort.body, antwort);
    for (const [k, v] of Object.entries(SICHERHEIT)) neu.headers.set(k, v);
    if (url.hostname.endsWith('.workers.dev')) neu.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return neu;
  },
};
