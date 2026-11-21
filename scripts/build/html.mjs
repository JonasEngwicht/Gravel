// Build, Teil „html“: HTML-Helfer, Seitenrahmen seite() und Ausgabe schreibe().
// Nach dem Muster von scripts/build/html.mjs + grundlagen.mjs im Hofladen-Repo.
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { esc } from '../../static/helfer.js';
import { titelMitMarke, kuerzeBeschreibung } from '../pixel.mjs';
import { OUT, VERSION, cfg } from './daten.mjs';

export { esc };
export const MARKE = cfg.name;
// Listenseiten unter MIN_SEITE Einträgen werden nicht indexiert (Regel aus Hofladen)
export const MIN_SEITE = 3;
export const zahl = (n) => n.toLocaleString('en-US');
export const plural = (n, s, p = `${s}s`) => `${zahl(n)} ${n === 1 ? s : p}`;
export const usd = (n) => `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

// Alle gebauten Seiten: pfad → { noindex, hash } (für Sitemap, Seitenarchiv und Tests)
export const SEITEN = new Map();
const hash = (x) => createHash('sha1').update(x).digest('base64url').slice(0, 10);

// Interne Links mit Parametern sind Funktionen, keine Seiten: nofollow (Regel aus Hofladen)
const nofollowParameter = (html) => html.replace(/<a ([^>]*?)href="(\/[^"#]*\?[^"]*)"([^>]*)>/g,
  (m, vor, href, nach) => (/\brel=/.test(vor + nach) ? m : `<a ${vor}href="${href}" rel="nofollow"${nach}>`));

const LOGO = `<svg class="logo-mark" viewBox="0 0 64 64" width="32" height="32" aria-hidden="true"><path d="M6 50 L22 24 L32 36 L42 18 L58 50 Z" fill="#8a6a43"/><circle cx="20" cy="50" r="6" fill="#5c7a3a"/><circle cx="34" cy="52" r="5" fill="#b9a37c"/><circle cx="46" cy="50" r="6" fill="#6b5236"/></svg>`;

const NAV = [
  ['/mulch-calculator/', 'Mulch'],
  ['/gravel-calculator/', 'Gravel'],
  ['/topsoil-calculator/', 'Topsoil'],
  ['/landscape-supply/', 'Find a yard'],
];

export function seite({ titel, beschreibung, pfad, inhalt, noindex = false, jsonld = [], krumen = [], klasse = '', skripte = [] }) {
  const url = cfg.domain + pfad;
  const bc = krumen.length ? [{ '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [['Home', '/'], ...krumen].map(([n, p], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: cfg.domain + p })) }] : [];
  const beschr = kuerzeBeschreibung(beschreibung);
  SEITEN.set(pfad, { noindex, hash: hash([titel, beschr, noindex, JSON.stringify(jsonld), inhalt.replace(/\?v=[a-z0-9]+/g, '')].join('\u0000')) });
  return nofollowParameter(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titelMitMarke(titel, MARKE))}</title>
<meta name="description" content="${esc(beschr)}">
<link rel="canonical" href="${esc(url)}">
${noindex ? '<meta name="robots" content="noindex, follow">\n' : ''}<meta property="og:title" content="${esc(titel)}">
<meta property="og:description" content="${esc(beschr)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="en_US">
<meta property="og:site_name" content="${esc(MARKE)}">
<meta name="theme-color" content="#3f3426">
<link rel="icon" href="/favicon.svg?v=${VERSION}" type="image/svg+xml">
<link rel="preload" href="/fonts/atkinson-next.woff" as="font" type="font/woff" crossorigin>
<link rel="stylesheet" href="/style.css?v=${VERSION}">
${[...bc, ...jsonld].map((j) => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, '\\u003c')}</script>`).join('\n')}
</head>
<body class="${klasse}">
<a class="sprung" href="#inhalt">Skip to content</a>
<header class="kopf"><div class="kopf-innen">
  <a class="logo" href="/">${LOGO}<span>${esc(MARKE)}</span></a>
  <nav class="kopf-nav" aria-label="Main">
    ${NAV.map(([p, n]) => `<a href="${p}"${p === pfad ? ' aria-current="page"' : ''}>${n}</a>`).join('\n    ')}
  </nav>
</div></header>
${krumen.length ? `<nav class="krumen" aria-label="Breadcrumb"><a href="/">Home</a>${krumen.map(([n, p], i) => (i === krumen.length - 1 ? `<span aria-current="page">${esc(n)}</span>` : `<a href="${esc(p)}">${esc(n)}</a>`)).join('')}</nav>` : ''}
<main id="inhalt">
${inhalt}
</main>
<footer class="fuss"><div class="fuss-innen">
  <nav aria-label="Calculators"><strong>Calculators</strong>
    <a href="/mulch-calculator/">Mulch</a><a href="/gravel-calculator/">Gravel</a><a href="/topsoil-calculator/">Topsoil</a>
    <a href="/river-rock-calculator/">River rock</a><a href="/cubic-yard-calculator/">Cubic yards</a>
  </nav>
  <nav aria-label="Site"><strong>${esc(MARKE)}</strong>
    <a href="/landscape-supply/">Landscape supply yards</a><a href="/about/">About &amp; sources</a>
    <a href="/imprint/">Imprint</a><a href="/privacy/">Privacy</a>
  </nav>
</div></footer>
${skripte.map((s) => `<script type="module" src="${s}?v=${VERSION}"></script>`).join('\n')}
</body>
</html>
`);
}

export function schreibe(pfad, html) {
  const datei = pfad.endsWith('/') ? join(OUT, pfad, 'index.html') : join(OUT, pfad);
  mkdirSync(dirname(datei), { recursive: true });
  writeFileSync(datei, html);
}
