// Regeln für offene Quellen (Yard vs. Landschaftsbauer), Dubletten und Import – US-Beispiele.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, readFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { istYard, brauchtPruefung, websiteBestaetigt, gleicherYard, telefon, sauberName, kontakt, zusammenfuehren } from '../scripts/quellen.mjs';
import { ROOT } from './hilfen.mjs';

const k = (name, konf = 0.9, extra = {}) => ({ name, konf, kat: null, ...extra });

test('eindeutige Yard-Namen werden ab Konfidenz 0,7 aufgenommen', () => {
  for (const n of ['Rocky Mountain Landscape Supply', 'Smith Sand & Gravel', 'Valley Rock Yard', 'Mile High Mulch Yard',
    'Front Range Topsoil', 'ABC Stone Supply', 'Denver Bulk Materials', 'Martin Marietta Aggregates'])
    assert.ok(istYard(k(n)), n);
  assert.ok(!istYard(k('Valley Rock Yard', 0.6)));
});

test('Landschaftsbauer, Dienstleister und Baumärkte werden nicht aufgenommen', () => {
  for (const n of ['Green Acres Landscaping Services', 'Bob’s Lawn Care', 'Summit Landscape Design', 'Rocky Tree Service',
    'Pro Landscape Contractors LLC', 'The Home Depot', 'Lowe’s Home Improvement', 'Stone Creek Apartments', 'Gravel Pit Storage Rental'])
    assert.ok(!istYard(k(n)), n);
});

test('„Landscape Supply“ mit Dienstleister-Kategorie nur mit Website-Bestätigung', () => {
  const o = k('Acme Landscape Supply', 0.9, { kat: 'landscaping' });
  assert.ok(!istYard(o));
  assert.ok(brauchtPruefung(o));
  assert.ok(istYard({ ...o, webGeprueft: '2026-11-21' }));
});

test('schwache Namen nur mit passender Kategorie, hoher Konfidenz und Website-Bestätigung', () => {
  const o = k('Johnson Stone', 0.85, { kat: 'stone_supplier' });
  assert.ok(!istYard(o));
  assert.ok(brauchtPruefung(o));
  assert.ok(istYard({ ...o, webGeprueft: '2026-11-21' }));
  assert.ok(!brauchtPruefung(k('Johnson Stone', 0.85, { kat: 'restaurant' })));
});

test('Website-Prüfung erkennt Schüttgut-Verkauf, nicht reine Dienstleister', () => {
  assert.ok(websiteBestaetigt('<p>Bulk mulch, rock and soil – $38 per yard. We deliver!</p>'));
  assert.ok(websiteBestaetigt('<h2>Landscape Supplies</h2><p>Pick up your load Mon–Sat</p>'));
  assert.ok(!websiteBestaetigt('<p>Full-service landscape design and lawn maintenance.</p><script>var x = "per ton"</script>'));
});

test('Dubletten: < 150 m immer, bis 2 km bei ähnlichem Namen', () => {
  const a = { name: 'Rocky Mountain Landscape Supply', lat: 39.75, lon: -104.99 };
  assert.ok(gleicherYard(a, { name: 'Anderes', lat: 39.7505, lon: -104.9905 }));
  assert.ok(gleicherYard(a, { name: 'Rocky Mtn Landscape Supply Inc', lat: 39.76, lon: -104.99 })); // „rocky“ gemeinsam
  assert.ok(!gleicherYard(a, { name: 'Smith Sand & Gravel', lat: 39.76, lon: -104.99 }));
});

test('Telefon, Namen, Kontakt', () => {
  assert.equal(telefon('+1 303-555-0100'), '(303) 555-0100');
  assert.equal(telefon('3035550100'), '(303) 555-0100');
  assert.equal(telefon('555-0100'), null);
  assert.equal(sauberName('SMITH SAND AND GRAVEL LLC'), 'Smith Sand and Gravel LLC');
  assert.equal(kontakt({ websites: ['https://www.yelp.com/biz/x', 'acme-supply.com'] }).website, 'https://acme-supply.com/');
});

test('zusammenfuehren: bereits veröffentlichte ID gewinnt, Felder werden ergänzt', () => {
  const o = (id, website) => ({ id, name: 'Valley Rock Yard', lat: 39.75, lon: -104.99, konf: 0.9, k: { website, telefon: null, email: null }, a: { street: null } });
  const r = zusammenfuehren([o('f-neu', 'https://valley.example/'), o('o-alt', null)], (x) => (x.id === 'o-alt' ? -10 : 0));
  assert.equal(r.length, 1);
  assert.equal(r[0].id, 'o-alt');
  assert.equal(r[0].k.website, 'https://valley.example/');
});

test('import-quellen: Auswahl, Adresse über nächste ZIP, Schwund-Schutz', () => {
  const dir = mkdtempSync(join(tmpdir(), 'gravel-import-'));
  const roh = join(dir, 'roh.json'), ziel = join(dir, 'ziel.json');
  writeFileSync(roh, JSON.stringify({ quelle: 'overture', release: 'test', orte: [
    { id: 'a1', name: 'VALLEY ROCK YARD', konf: 0.9, lat: 39.786, lon: -104.966, websites: ['valley.example'], phones: ['+13035550100'] },
    { id: 'a2', name: 'Green Acres Landscaping Services', konf: 0.95, lat: 39.75, lon: -104.99 },
    { id: 'a3', name: 'Valley Rock Yard', konf: 0.8, lat: 39.7861, lon: -104.9661 }, // Dublette
  ] }));
  writeFileSync(ziel, '{"eintraege":[]}');
  const lauf = (env = {}) => spawnSync(process.execPath, [join(ROOT, 'scripts', 'import-quellen.mjs'), roh, '--ziel', ziel, '--pruefung', join(dir, 'p.json')], { encoding: 'utf8', env: { ...process.env, ...env } });
  const r = lauf();
  assert.equal(r.status, 0, r.stderr);
  const e = JSON.parse(readFileSync(ziel, 'utf8')).eintraege;
  assert.equal(e.length, 1);
  assert.deepEqual([e[0].id, e[0].name, e[0].address.city, e[0].address.state, e[0].contact.phone], ['o-a1', 'Valley Rock Yard', 'Denver', 'CO', '(303) 555-0100']);
  assert.deepEqual(e[0].materials, []);
  // weniger als 70 % des bisherigen Stands → Abbruch ohne Überschreiben
  writeFileSync(ziel, JSON.stringify({ eintraege: [e[0], { ...e[0], id: 'o-x' }, { ...e[0], id: 'o-y' }] }));
  assert.equal(lauf().status, 1);
  assert.equal(lauf({ ERLAUBE_SCHWUND: '1' }).status, 0);
});
