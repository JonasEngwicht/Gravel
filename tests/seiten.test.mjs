// Seiten-Regeln aus Hofladen: Titel ≤ 580 px, Beschreibung ≤ 1000 px, Canonical, eine H1, noindex unter 3 Einträgen,
// Sitemap nur mit indexierten Seiten, JSON-LD nur mit sichtbaren Angaben.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { testSeite, seiten, meta, titel, jsonLd, DOMAIN, ROOT } from './hilfen.mjs';
import { titelBreite, beschreibungBreite, TITEL_MAX, BESCHREIBUNG_MAX } from '../scripts/pixel.mjs';

const { pub } = testSeite();
const alle = [...seiten(pub)];
const seite = (p) => alle.find(([x]) => x === p)?.[1];
const unescape = (s) => s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');

test('Build mit Testdaten erzeugt Rechner-, Directory- und Yard-Seiten', () => {
  for (const p of ['/', '/mulch-calculator/', '/gravel-calculator/', '/landscape-supply/', '/landscape-supply/co/',
    '/landscape-supply/co/denver/', '/landscape-supply/co/boulder/', '/yard/test-yard-alpha-denver-co/', '/about/', '/imprint/'])
    assert.ok(seite(p), `fehlt: ${p}`);
});

test('jede Seite: Titel und Beschreibung passen, Canonical stimmt, genau eine H1', () => {
  for (const [p, html] of alle) {
    const t = unescape(titel(html));
    const b = unescape(meta(html, 'description'));
    assert.ok(titelBreite(t) <= TITEL_MAX, `${p}: Titel zu breit (${titelBreite(t)} px): ${t}`);
    assert.ok(beschreibungBreite(b) <= BESCHREIBUNG_MAX, `${p}: Beschreibung zu breit`);
    assert.ok(html.includes(`<link rel="canonical" href="${DOMAIN}${p}">`), `${p}: Canonical`);
    assert.equal((html.match(/<h1[\s>]/g) || []).length, 1, `${p}: H1`);
    assert.ok(html.includes('<html lang="en">'), `${p}: Sprache`);
  }
});

test('Listenseiten unter 3 Einträgen sind noindex, ab 3 indexiert', () => {
  assert.match(seite('/landscape-supply/co/boulder/'), /noindex/); // 1 Yard
  assert.doesNotMatch(seite('/landscape-supply/co/denver/'), /noindex/); // 3 Yards
  assert.doesNotMatch(seite('/landscape-supply/co/'), /noindex/); // 4 Yards
});

test('Sitemap enthält nur indexierte Seiten', () => {
  const sm = readFileSync(join(pub, 'sitemap.xml'), 'utf8');
  for (const [p, html] of alle) {
    const drin = sm.includes(`<loc>${DOMAIN}${p}</loc>`);
    if (/name="robots" content="noindex/.test(html)) assert.ok(!drin, `${p} ist noindex, steht aber in der Sitemap`);
    else assert.ok(drin, `${p} fehlt in der Sitemap`);
  }
  assert.match(readFileSync(join(pub, 'robots.txt'), 'utf8'), /Disallow: \/api\//);
});

test('Stadtseite: Medianpreis ab 3 Preisen, Rechner mit lokalem Preis vorbelegt', () => {
  const html = seite('/landscape-supply/co/denver/');
  assert.match(html, /Shredded hardwood mulch<\/td><td>\$40 per cubic yard<\/td><td>3<\/td>/); // 30, 40, 50
  assert.match(html, /name="perCy" type="number" min="0" step="any" value="40"/);
  assert.doesNotMatch(html, /Pea gravel<\/td><td>\$/); // nur 1 Preis → keine Zeile
});

test('JSON-LD: Yard-Seite als HomeAndConstructionBusiness ohne Bewertungen, Rechner als WebApplication', () => {
  const yard = jsonLd(seite('/yard/test-yard-alpha-denver-co/'));
  const g = yard.find((j) => j['@type'] === 'HomeAndConstructionBusiness');
  assert.equal(g.address.addressLocality, 'Denver');
  assert.ok(!JSON.stringify(yard).includes('aggregateRating'));
  assert.ok(jsonLd(seite('/mulch-calculator/')).some((j) => j['@type'] === 'WebApplication'));
});

test('Beispiel-Einträge (data/yards/_*.json) werden nie veröffentlicht', () => {
  assert.ok(!alle.some(([p]) => p.includes('example-landscape-supply')));
  if (existsSync(join(testSeite().gen, 'yards.json'))) {
    const y = JSON.parse(readFileSync(join(testSeite().gen, 'yards.json'), 'utf8'));
    assert.ok(y.every((x) => !('email' in x) && !x.contact), 'Worker-Daten enthalten keine Kontakt-E-Mails');
  }
});

test('Produktions-Build (public/) hält dieselben Regeln ein', () => {
  const pubProd = join(ROOT, 'public');
  if (!existsSync(pubProd)) return; // test:schnell ohne vorherigen Build
  for (const [p, html] of seiten(pubProd)) {
    assert.ok(titelBreite(unescape(titel(html))) <= TITEL_MAX, `${p}: Titel zu breit`);
    assert.equal((html.match(/<h1[\s>]/g) || []).length, 1, `${p}: H1`);
  }
});
