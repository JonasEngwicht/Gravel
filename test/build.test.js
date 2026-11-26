import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { SEITEN } from "../scripts/seiten.mjs";

const pub = (p) => new URL("../public/" + p, import.meta.url);
execFileSync(process.execPath, [new URL("../scripts/build.mjs", import.meta.url).pathname], { stdio: "ignore" });

test("jede Seite wird gebaut und hat Titel, H1 und das passende Werkzeug", () => {
  for (const s of SEITEN) {
    const f = pub(s.pfad.slice(1) + "index.html");
    assert.ok(existsSync(f), s.pfad);
    const html = readFileSync(f, "utf8");
    assert.match(html, /<title>[^<]{10,}<\/title>/);
    assert.equal((html.match(/<h1>/g) || []).length, 1, s.pfad);
    if (s.art === "rechner" || s.art === "ratgeber") assert.match(html, /id="rechner"/, s.pfad);
    if (s.art === "umrechner") assert.match(html, /id="umrechner"/, s.pfad);
    assert.ok(s.title.length <= 65, `Titel zu lang: ${s.pfad}`);
    assert.ok(s.description.length <= 165, `Description zu lang: ${s.pfad}`);
  }
});

test("Pfade und Titel der Seiten sind eindeutig", () => {
  assert.equal(new Set(SEITEN.map((s) => s.pfad)).size, SEITEN.length);
  assert.equal(new Set(SEITEN.map((s) => s.title)).size, SEITEN.length);
});

test("Open Graph, FAQ als Überschrift, keine deutschen Sprungmarken", () => {
  for (const p of ["index.html", "mulch-calculator/index.html", "guides/how-many-bags-of-mulch-in-a-yard/index.html", "landscape-supply/nc/apex/index.html"]) {
    const html = readFileSync(pub(p), "utf8");
    assert.match(html, /<meta property="og:title" content="[^"]+">/, p);
    assert.match(html, /<meta property="og:image" content="[^"]+og\.png">/, p);
    assert.doesNotMatch(html, /id="(gruppe-\d|rechner-titel|nachbarn)"/, p);
  }
  assert.match(readFileSync(pub("mulch-calculator/index.html"), "utf8"), /<summary><h3>/);
  assert.ok(existsSync(pub("assets/og.png")));
});

test("Rechenbeispiel stimmt mit core.js überein", () => {
  // 20 × 10 ft bei 3 in = 200 × 0,25 ÷ 27 = 1,85 cu yd
  assert.match(readFileSync(pub("mulch-calculator/index.html"), "utf8"), /<strong>1\.85 cubic yards<\/strong>/);
});

test("verwandte Seiten verweisen auf existierende Seiten", () => {
  const pfade = new Set(SEITEN.map((s) => s.pfad));
  for (const s of SEITEN) for (const v of s.verwandt || []) assert.ok(pfade.has(v), `${s.pfad} → ${v}`);
});

test("Assets und robots.txt vorhanden", () => {
  for (const p of ["assets/app.js", "assets/core.js", "assets/style.css", "assets/materials.json", "404.html", "robots.txt"]) assert.ok(existsSync(pub(p)), p);
});

test("Standardmaterial jeder Rechner- und Ratgeberseite existiert", () => {
  const { materials, projects } = JSON.parse(readFileSync(new URL("../data/materials.json", import.meta.url)));
  for (const s of SEITEN.filter((x) => x.art !== "info")) assert.ok(materials.some((m) => m.id === s.material), s.pfad);
  for (const p of projects) assert.ok(materials.some((m) => m.id === p.material), p.id);
});

test("strukturierte Daten sind gültiges JSON", () => {
  for (const s of SEITEN) {
    const html = readFileSync(pub(s.pfad.slice(1) + "index.html"), "utf8");
    JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  }
});

test("Suchindex für das Verzeichnis passt zu den Seiten", () => {
  const yards = JSON.parse(readFileSync(pub("assets/yards.json"), "utf8"));
  const staedte = JSON.parse(readFileSync(pub("assets/cities.json"), "utf8"));
  assert.ok(yards.length > 1000 && staedte.length > 100);
  for (const y of yards.filter((_, i) => i % 97 === 0)) {
    assert.equal(y.length, 9);
    assert.ok(existsSync(pub(`landscape-supply/${y[6]}index.html`)), y[6]);
  }
  for (const c of staedte.filter((_, i) => i % 53 === 0)) assert.ok(existsSync(pub(`landscape-supply/${c[2]}index.html`)), c[2]);
  assert.ok(existsSync(pub("assets/zip/770.json")));
});

test("mit Domain: Sitemap, robots.txt und Canonicals", () => {
  const { baseUrl } = JSON.parse(readFileSync(new URL("../site.config.json", import.meta.url)));
  if (!baseUrl) return;
  assert.match(readFileSync(pub("robots.txt"), "utf8"), new RegExp(`Sitemap: ${baseUrl}/sitemap.xml`));
  const index = readFileSync(pub("sitemap.xml"), "utf8");
  assert.match(index, /<sitemapindex/);
  const teile = [...index.matchAll(/<loc>[^<]*\/(sitemap-[a-z-]+\.xml)<\/loc>/g)].map((m) => m[1]);
  assert.ok(teile.includes("sitemap-pages.xml") && teile.includes("sitemap-cities.xml"));
  const urls = teile.flatMap((t) => [...readFileSync(pub(t), "utf8").matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]));
  assert.ok(urls.length > 1000);
  // nur indexierbare Seiten in der Sitemap
  for (const u of urls.filter((_, i) => i % 41 === 0)) {
    const html = readFileSync(pub(u.slice(baseUrl.length + 1) + "index.html"), "utf8");
    assert.doesNotMatch(html, /noindex/, u);
  }
  const start = readFileSync(pub("index.html"), "utf8");
  assert.match(start, new RegExp(`<link rel="canonical" href="${baseUrl}/">`));
  assert.doesNotMatch(start, /noindex/);
});

test("Imprint und Privacy Policy: vorhanden, verlinkt, noindex, nicht in der Sitemap", () => {
  const { operator } = JSON.parse(readFileSync(new URL("../site.config.json", import.meta.url)));
  for (const p of ["imprint", "privacy"]) {
    const html = readFileSync(pub(`${p}/index.html`), "utf8");
    assert.match(html, /noindex/);
    assert.ok(html.includes(operator.email) && html.includes(operator.name), p);
  }
  assert.match(readFileSync(pub("index.html"), "utf8"), /href="\/imprint\/".*href="\/privacy\/"/s);
  if (existsSync(pub("sitemap.xml"))) assert.doesNotMatch(readFileSync(pub("sitemap.xml"), "utf8"), /imprint|privacy/);
});

test("kein Speichern auf dem Gerät (sonst Einwilligung nach § 25 TDDDG nötig)", () => {
  for (const f of ["app.js", "finder.js"]) assert.doesNotMatch(readFileSync(pub(`assets/${f}`), "utf8"), /localStorage\.|sessionStorage\.|document\.cookie/, f);
});

test("IndexNow: Schlüsseldatei und URL-Liste passend zur Sitemap, ohne Build-Version im Hash", () => {
  const site = JSON.parse(readFileSync(new URL("../site.config.json", import.meta.url), "utf8"));
  assert.equal(readFileSync(pub(`${site.indexNowKey}.txt`), "utf8"), site.indexNowKey);
  const liste = JSON.parse(readFileSync(pub("indexnow.json"), "utf8"));
  assert.equal(liste.key, site.indexNowKey);
  const sitemapUrls = [];
  const index = readFileSync(pub("sitemap.xml"), "utf8");
  for (const [, loc] of index.matchAll(/<loc>[^<]*\/(sitemap-[^<]+\.xml)<\/loc>/g)) {
    for (const [, u] of readFileSync(pub(loc), "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)) sitemapUrls.push(u);
  }
  assert.deepEqual(Object.keys(liste.urls).sort(), sitemapUrls.sort());
  const vorher = liste.urls[`${site.baseUrl}/mulch-calculator/`];
  execFileSync(process.execPath, [new URL("../scripts/build.mjs", import.meta.url).pathname], { stdio: "ignore", env: { ...process.env, BUILD_DATUM: "2030-01-01T00:00:00Z" } });
  assert.equal(JSON.parse(readFileSync(pub("indexnow.json"), "utf8")).urls[`${site.baseUrl}/mulch-calculator/`], vorher);
});

// ---------- AP1: Verifikation am Quelltext ----------
const ldVon = (p) => JSON.parse(readFileSync(pub(p), "utf8").match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
const typen = (ld) => ld.map((x) => x["@type"]);
const sitemapUrls = (typ) => [...readFileSync(pub(`sitemap-${typ}.xml`), "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const pfadVon = (u) => new URL(u).pathname.slice(1) + "index.html";
const stichprobe = (liste, n = 20) => liste.filter((_, i) => i % Math.max(1, Math.floor(liste.length / n)) === 0).slice(0, n);

test("JSON-LD je Vorlage: passende Typen und Pflichtfelder", () => {
  assert.deepEqual(typen(ldVon("index.html")).sort(), ["BreadcrumbList", "FAQPage", "Organization", "WebApplication", "WebSite"]);
  assert.deepEqual(typen(ldVon("mulch-calculator/index.html")).sort(), ["BreadcrumbList", "FAQPage", "WebApplication"]);
  const art = ldVon("guides/how-much-does-mulch-weigh/index.html").find((x) => x["@type"] === "Article");
  assert.ok(art.headline && art.dateModified && art.author && art.publisher);
  assert.ok(typen(ldVon("landscape-supply/tx/index.html")).includes("BreadcrumbList"));
  assert.ok(typen(ldVon("landscape-supply/tx/gravel-pits/index.html")).includes("ItemList"));
  const stadt = ldVon(pfadVon(sitemapUrls("cities")[0])).find((x) => x["@type"] === "ItemList");
  assert.ok(stadt.itemListElement.length >= 1);
  for (const u of stichprobe([...sitemapUrls("cities"), ...(existsSync(pub("sitemap-yards.xml")) ? sitemapUrls("yards") : [])])) {
    const ld = ldVon(pfadVon(u));
    const betriebe = ld.flatMap((x) => (x["@type"] === "ItemList" ? x.itemListElement.map((e) => e.item) : [x])).filter((x) => x?.["@type"] === "HomeAndConstructionBusiness");
    assert.ok(betriebe.length, u);
    for (const b of betriebe) {
      assert.ok(b.name && b.url && b.address?.addressLocality && b.address?.addressRegion && b.address?.addressCountry === "US", u);
      assert.ok(Number.isFinite(b.geo?.latitude) && Number.isFinite(b.geo?.longitude), u);
    }
  }
});

test("Stichproben: Sitemap-Seiten ohne noindex, noindex-Seiten nicht in der Sitemap", () => {
  const index = readFileSync(pub("sitemap.xml"), "utf8");
  const typenListe = [...index.matchAll(/sitemap-([a-z-]+)\.xml/g)].map((m) => m[1]);
  const alle = new Set();
  for (const t of typenListe) {
    const urls = sitemapUrls(t);
    urls.forEach((u) => alle.add(u));
    for (const u of stichprobe(urls)) {
      const html = readFileSync(pub(pfadVon(u)), "utf8");
      assert.doesNotMatch(html, /name="robots" content="noindex/, u);
      assert.match(html, new RegExp(`<link rel="canonical" href="${u}">`), u);
    }
  }
  // umgekehrt: Seiten mit noindex tauchen in keiner Sitemap auf
  const yards = JSON.parse(readFileSync(pub("assets/yards.json"), "utf8"));
  let geprueft = 0;
  for (const y of yards) {
    const p = `landscape-supply/${y[6]}index.html`;
    const html = readFileSync(pub(p), "utf8");
    if (!/content="noindex, follow"/.test(html)) continue;
    assert.ok(!alle.has(`https://gravelandmulch.com/${p.replace(/index\.html$/, "")}`), p);
    if (++geprueft >= 40) break;
  }
  assert.ok(geprueft > 0);
});

test("Zähler in Linklisten sind vom Namen getrennt", () => {
  const hub = readFileSync(pub("landscape-supply/index.html"), "utf8");
  assert.doesNotMatch(hub, /<\/span><span class="zahl">/);
  assert.match(hub, /<\/span> <span class="zahl">/);
});

test("404-Seite: noindex, Suche, Verzeichnis und Rechner verlinkt", () => {
  const html = readFileSync(pub("404.html"), "utf8");
  assert.match(html, /name="robots" content="noindex"/);
  assert.match(html, /action="\/landscape-supply\/"/);
  assert.match(html, /href="\/mulch-calculator\/"/);
  assert.match(html, /href="\/landscape-supply\/gravel-pits\/"/);
});

test("externe Firmen-Links: nofollow noopener, neues Fenster", () => {
  const u = sitemapUrls("cities")[0];
  const html = readFileSync(pub(pfadVon(u)), "utf8");
  for (const [a] of html.matchAll(/<a class="karte-web"[^>]*>/g)) {
    assert.match(a, /rel="nofollow noopener"/);
    assert.match(a, /target="_blank"/);
  }
});
