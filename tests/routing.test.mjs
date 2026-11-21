// Routing des Workers (wie tests/routing.test.mjs im Hofladen-Repo) und Umkreissuche.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { anfrage, ladeWorker } from './hilfen.mjs';

test('https ohne www in einem Schritt', async () => {
  const r = await anfrage('http://www.gravelandmulch.com/mulch-calculator/');
  assert.equal(r.status, 301);
  assert.equal(r.headers.get('Location'), 'https://gravelandmulch.com/mulch-calculator/');
});

test('Seiten werden ausgeliefert, Schreibvarianten per 301', async () => {
  assert.equal((await anfrage('/mulch-calculator/')).status, 200);
  for (const [von, nach] of [['/mulch-calculator', '/mulch-calculator/'], ['/Mulch-Calculator/', '/mulch-calculator/'], ['/mulch-calculator/index.html', '/mulch-calculator/']]) {
    const r = await anfrage(von);
    assert.equal(r.status, 301, von);
    assert.equal(r.headers.get('Location'), nach, von);
  }
});

test('unbekannte Seiten liefern 404 mit Fehlerseite, HTML mit HSTS', async () => {
  const r = await anfrage('/gibt-es-nicht/');
  assert.equal(r.status, 404);
  assert.match(await r.text(), /Page not found/);
  assert.equal((await anfrage('/')).headers.get('Strict-Transport-Security'), 'max-age=31536000');
});

test('normalisiere', async () => {
  const { normalisiere } = await ladeWorker();
  assert.equal(normalisiere('/Landscape_Supply/CO'), '/landscape-supply/co/');
  assert.equal(normalisiere('/style.css'), '/style.css');
});

test('/api/umkreis: ZIP prüfen', async () => {
  assert.equal((await anfrage('/api/umkreis?zip=12')).status, 400);
  assert.equal((await anfrage('/api/umkreis?zip=99999')).status, 404);
  assert.equal((await anfrage('/api/umkreis')).status, 400);
  assert.equal((await anfrage('/api/gibt-es-nicht')).status, 404);
});

test('/api/umkreis: Material, Lieferung, Featured zuerst, Preis je Yard', async () => {
  const d = await (await anfrage('/api/umkreis?zip=80202&material=hardwood-mulch')).json();
  const namen = d.treffer.map((t) => t.name);
  assert.equal(namen[0], 'Test Yard Gamma'); // featured
  assert.ok(namen.includes('Test Yard Beta') && !namen.includes('Test Yard Delta')); // Delta: kein Mulch
  assert.deepEqual(d.treffer.find((t) => t.name === 'Test Yard Alpha').price, { amount: 30, unit: 'cy', updated: '2026-11-21', source: 'yard-website' });
  const l = await (await anfrage('/api/umkreis?zip=80202&material=hardwood-mulch&delivery=1')).json();
  assert.ok(!l.treffer.some((t) => t.name === 'Test Yard Beta')); // liefert nicht
  const r = await anfrage('/api/umkreis?lat=40.02&lon=-105.28&material=river-rock&max=10');
  assert.deepEqual((await r.json()).treffer.map((t) => t.name), ['Test Yard Delta']);
  assert.equal(r.headers.get('X-Robots-Tag'), 'noindex');
});
