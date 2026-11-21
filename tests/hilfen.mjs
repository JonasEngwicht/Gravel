// Gemeinsame Hilfen für die Tests (nach tests/hilfen.mjs im Hofladen-Repo):
// Build mit Testdaten in ein Temp-Verzeichnis, Worker mit nachgebautem Asset-Server laden, HTML-Seiten einlesen.
import { readFileSync, writeFileSync, existsSync, statSync, readdirSync, mkdtempSync } from 'node:fs';
import { join, extname, relative, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ROOT = fileURLToPath(new URL('..', import.meta.url));
export const DOMAIN = JSON.parse(readFileSync(join(ROOT, 'site.config.json'), 'utf8')).domain;

const TYPEN = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml',
  '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain', '.woff': 'font/woff' };

// Build mit den fiktiven Test-Yards aus tests/fixtures/yards (einmal je Testprozess)
let testBuild;
export function testSeite() {
  if (testBuild) return testBuild;
  const dir = mkdtempSync(join(tmpdir(), 'gravel-test-'));
  const pub = join(dir, 'public'), gen = join(dir, 'generated');
  const r = spawnSync(process.execPath, [join(ROOT, 'scripts', 'build.mjs')], {
    env: { ...process.env, BUILD_OUT: pub, BUILD_GEN: gen, YARDS_DIR: join(ROOT, 'tests', 'fixtures', 'yards'), BUILD_DATUM: '2026-11-21', CI: '' },
    encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`Build mit Testdaten fehlgeschlagen:\n${r.stderr}`);
  testBuild = { pub, gen, log: r.stdout };
  return testBuild;
}

// Wie Cloudflare mit html_handling "none": nur exakt passende Dateien
export function assets(pub) {
  return {
    async fetch(req) {
      const u = new URL(typeof req === 'string' || req instanceof URL ? req : req.url);
      const p = join(pub, decodeURIComponent(u.pathname));
      const methode = req.method || 'GET';
      if (!p.startsWith(pub) || !existsSync(p) || statSync(p).isDirectory()) return new Response('Not Found', { status: 404 });
      return new Response(methode === 'HEAD' ? null : readFileSync(p), { headers: { 'Content-Type': TYPEN[extname(p)] || 'application/octet-stream' } });
    },
  };
}

// Worker laden: Importe auf die generierten Testdaten umbiegen
let worker;
export async function ladeWorker() {
  if (worker) return worker;
  const { gen } = testSeite();
  const dir = mkdtempSync(join(tmpdir(), 'gravel-worker-'));
  const code = readFileSync(join(ROOT, 'src', 'worker.js'), 'utf8')
    .replace(/from '\.\/generated\/(.*?)\.json';/g, (_, n) => `from ${JSON.stringify(pathToFileURL(join(gen, `${n}.json`)).href)} with { type: 'json' };`)
    .replace(/from '\.\.\/static\/([a-z-]+\.js)';/g, (_, n) => `from ${JSON.stringify(pathToFileURL(join(ROOT, 'static', n)).href)};`);
  writeFileSync(join(dir, 'worker.mjs'), code);
  worker = await import(pathToFileURL(join(dir, 'worker.mjs')).href);
  return worker;
}

export async function anfrage(pfad, init = {}) {
  const w = (await ladeWorker()).default;
  const { pub } = testSeite();
  const url = new URL(pfad, DOMAIN);
  // wie run_worker_first in wrangler.jsonc: /api/* und …/index.html laufen immer durch den Worker
  const vorab = url.pathname.startsWith('/api/') || url.pathname.endsWith('/index.html');
  if (!vorab && url.hostname === new URL(DOMAIN).hostname) {
    const datei = join(pub, decodeURIComponent(url.pathname));
    if (datei.startsWith(pub) && existsSync(datei) && statSync(datei).isFile()) return assets(pub).fetch(new Request(url, init));
  }
  return w.fetch(new Request(url, { redirect: 'manual', ...init }), { ASSETS: assets(pub) });
}

// Alle HTML-Seiten eines Builds: [pfad, html]
export function* seiten(pub) {
  function* lauf(d) {
    for (const f of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, f.name);
      if (f.isDirectory()) yield* lauf(p);
      else if (f.name === 'index.html') yield ['/' + relative(pub, d).split(sep).join('/') + (d === pub ? '' : '/'), readFileSync(p, 'utf8')];
    }
  }
  yield* lauf(pub);
}
export const meta = (html, name) => html.match(new RegExp(`<meta name="${name}" content="([^"]*)"`))?.[1] ?? null;
export const titel = (html) => html.match(/<title>([^<]*)<\/title>/)?.[1] ?? null;
export const jsonLd = (html) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
