// Build, Teil „abschluss“: robots.txt, Sitemap, Seitenarchiv (301/410) und Daten für den Worker.
// Seitenarchiv wie im Hofladen-Repo: data/seiten-stand.json hält Inhalts-Hash und Änderungsdatum je Seite,
// auch für Seiten, die es nicht mehr gibt. Daraus entstehen echtes lastmod, 301-Weiterleitungen und 410.
// Die Datei schreibt nur CI (Workflows) – nie von Hand ändern.
import { writeFileSync, readFileSync, existsSync, copyFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { SEITEN } from './html.mjs';
import { ROOT, OUT, GEN, cfg, yards, ZIPS, BUILD_DATUM } from './daten.mjs';

// ---------- statische Dateien ----------
function kopiere(von, nach) {
  mkdirSync(nach, { recursive: true });
  for (const f of readdirSync(von, { withFileTypes: true })) {
    if (f.isDirectory()) kopiere(join(von, f.name), join(nach, f.name));
    else copyFileSync(join(von, f.name), join(nach, f.name));
  }
}
kopiere(join(ROOT, 'static'), OUT);
// Materialdaten für den Rechner im Browser
writeFileSync(join(OUT, 'materials.json'), readFileSync(join(ROOT, 'data', 'materials.json')));

// ---------- Seitenarchiv ----------
const STAND_DATEI = join(ROOT, 'data', 'seiten-stand.json');
const stand = existsSync(STAND_DATEI) ? JSON.parse(readFileSync(STAND_DATEI, 'utf8')) : { seiten: {}, yards: {} };
stand.seiten ??= {}; stand.yards ??= {};
const ALLE = new Set([...SEITEN.keys()].filter((p) => p.endsWith('/')));
for (const p of ALLE) {
  const { hash } = SEITEN.get(p);
  const alt = stand.seiten[p];
  stand.seiten[p] = alt && alt.hash === hash ? alt : { hash, lastmod: BUILD_DATUM };
}
// Yard-Slug → stabile ID, damit umbenannte Yards per 301 auf den neuen Slug zeigen
for (const y of yards) stand.yards[y.slug] = y.id;
const sortiert = (o) => Object.fromEntries(Object.keys(o).sort().map((k) => [k, o[k]]));
if ((process.env.CI || process.env.SEITEN_STAND_SCHREIBEN) && !process.env.YARDS_DIR) writeFileSync(STAND_DATEI, JSON.stringify({ seiten: sortiert(stand.seiten), yards: sortiert(stand.yards) }));

const slugNachId = new Map(yards.map((y) => [y.id, y.slug]));
const umleitungen = {}, entfernt = [];
for (const pfad of Object.keys(stand.seiten)) {
  if (ALLE.has(pfad)) continue;
  const yard = pfad.match(/^\/yard\/([^/]+)\/$/);
  if (yard) {
    const neu = slugNachId.get(stand.yards[yard[1]]);
    if (neu && neu !== yard[1]) umleitungen[pfad] = `/yard/${neu}/`; else entfernt.push(pfad);
    continue;
  }
  // nächste übergeordnete Seite, z. B. aufgelöste Stadtseite → Bundesstaat
  let ziel = pfad;
  do ziel = ziel.replace(/[^/]+\/$/, ''); while (ziel !== '/' && !ALLE.has(ziel));
  umleitungen[pfad] = ziel;
}
writeFileSync(join(GEN, 'routen.json'), JSON.stringify({ umleitungen, entfernt }));

// ---------- robots.txt und Sitemap ----------
writeFileSync(join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${cfg.domain}/sitemap.xml\n`);
const indexiert = [...ALLE].filter((p) => !SEITEN.get(p).noindex).sort();
writeFileSync(join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexiert.map((p) => `<url><loc>${cfg.domain}${p}</loc><lastmod>${stand.seiten[p].lastmod}</lastmod></url>`).join('\n')}
</urlset>
`);

// ---------- Daten für den Worker ----------
// Schlanke Yard-Liste für /api/umkreis (nur veröffentlichte Angaben, keine E-Mail-Adressen)
const fuerWorker = yards.map((y) => ({ id: y.id, name: y.name, pfad: y.pfad, status: 'active',
  address: { city: y.address.city, state: y.state, zip: y.address.zip || null },
  location: y.location, materials: y.materials.map((m) => ({ id: m.id, ...(m.price ? { price: m.price } : {}) })),
  delivery: y.delivery || null, listing: { tier: y.listing?.tier || 'free' }, phone: y.contact?.phone || null }));
writeFileSync(join(GEN, 'yards.json'), JSON.stringify(fuerWorker));
// ZIP → [lat, lon] (gerundet auf 4 Stellen ≈ 10 m)
writeFileSync(join(GEN, 'zips.json'), JSON.stringify(Object.fromEntries([...ZIPS.values()].map((z) => [z.zip, [+z.lat.toFixed(4), +z.lon.toFixed(4)]]))));

console.log(`Abschluss: ${ALLE.size} Seiten (${indexiert.length} indexiert), ${Object.keys(umleitungen).length} Weiterleitungen, ${entfernt.length} entfernte Yards (410)`);
