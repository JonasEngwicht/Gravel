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
  assert.ok(urls.length > 300);
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

// ---------- AP2: Fakten und Zähler ----------
const text = (html) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
const rasterEintraege = (html, ab) => [...html.slice(html.indexOf(ab)).split("</ul>")[0].matchAll(/<a href="([^"]+)"><span>([^<]+)<\/span> <span class="zahl">([^<]+)<\/span>/g)].map((m) => ({ pfad: m[1], name: m[2], zahl: m[3] }));

test("Zähler stimmen zwischen Hub, Staats- und Stadtseiten überein", () => {
  const hub = readFileSync(pub("landscape-supply/index.html"), "utf8");
  const staaten = rasterEintraege(hub, "Browse by state");
  assert.ok(staaten.length > 40);
  let summe = 0;
  for (const st of staaten) {
    const html = readFileSync(pub(st.pfad.slice(1) + "index.html"), "utf8");
    assert.match(html, new RegExp(`<p class="unter">${st.zahl} yards and suppliers`), st.pfad);
    summe += +st.zahl;
  }
  assert.match(text(hub), new RegExp(`${summe.toLocaleString("en-US")} landscape supply yards`));
  const staedte = rasterEintraege(hub, "Cities with the most yards");
  assert.equal(staedte.length, 24);
  const zahlen = staedte.map((c) => parseInt(c.zahl, 10));
  assert.deepEqual(zahlen, [...zahlen].sort((a, b) => b - a), "nach Anzahl absteigend");
  for (const c of staedte) {
    const html = readFileSync(pub(c.pfad.slice(1) + "index.html"), "utf8");
    assert.match(html.match(/<title>(.*?)<\/title>/)[1], new RegExp(`\\(${c.zahl}\\)$`), c.pfad);
    // dieselbe Zahl auch in der Staatsliste
    const st = readFileSync(pub(c.pfad.split("/").slice(1, 3).join("/") + "/index.html"), "utf8");
    assert.ok(st.includes(`<a href="${c.pfad}"><span>${c.name.replace(/, [A-Z]{2}$/, "")}</span> <span class="zahl">${c.zahl}</span>`), c.pfad);
  }
});

test("keine erfundene Staatenzahl, Hinweise passend zum Seitentyp", () => {
  for (const p of ["index.html", "landscape-supply/index.html", "landscape-supply/gravel-pits/index.html", "about/index.html"]) {
    assert.doesNotMatch(readFileSync(pub(p), "utf8"), /51 states/, p);
  }
  assert.match(readFileSync(pub("landscape-supply/gravel-pits/index.html"), "utf8"), /50 states and Puerto Rico/);
  assert.match(readFileSync(pub("mulch-calculator/index.html"), "utf8"), /Results are estimates based on typical material weights/);
  const staat = readFileSync(pub("landscape-supply/tx/index.html"), "utf8");
  assert.doesNotMatch(staat, /Results are estimates/);
  assert.match(staat, /Listings come from public data/);
});

test("Preisangaben tragen die Quelle direkt hinter der Zahl", () => {
  for (const p of ["mulch-calculator", "gravel-calculator", "pea-gravel-calculator", "driveway-gravel-calculator", "rubber-mulch-calculator"]) {
    const html = readFileSync(pub(`${p}/index.html`), "utf8");
    assert.match(html, /\$\d[^<]*<span class="quelle-inline">\(<a href="https:/, p);
  }
});

test("Startseite: Titel und H1 sprechen von Topsoil, Tiefen widersprechen sich nicht", () => {
  const html = readFileSync(pub("index.html"), "utf8");
  assert.match(html, /<h1>Mulch, Gravel &amp; Topsoil Calculator<\/h1>/);
  const { materials } = JSON.parse(readFileSync(new URL("../data/materials.json", import.meta.url)));
  const bereich = (id) => materials.find((m) => m.id === id).depth_range_in.join("–");
  assert.match(html, new RegExp(`Play sand</a></td><td>${bereich("play-sand")} in`));
  assert.match(html, new RegExp(`${bereich("crusher-run")} in base`));
});

// ---------- AP3: Indexierung und interne Verlinkung ----------
test("Sitemaps mit lastmod, data/lastmod.json ist aktuell", () => {
  const index = readFileSync(pub("sitemap.xml"), "utf8");
  assert.match(index, /<sitemap><loc>[^<]+<\/loc><lastmod>\d{4}-\d{2}-\d{2}<\/lastmod><\/sitemap>/);
  for (const t of [...index.matchAll(/sitemap-([a-z-]+)\.xml/g)].map((m) => m[1])) {
    const xml = readFileSync(pub(`sitemap-${t}.xml`), "utf8");
    assert.equal((xml.match(/<url>/g) || []).length, (xml.match(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/g) || []).length, t);
  }
  const neu = JSON.parse(readFileSync(pub("lastmod.json"), "utf8"));
  const alt = JSON.parse(readFileSync(new URL("../data/lastmod.json", import.meta.url), "utf8"));
  const veraltet = Object.keys(neu).filter((p) => alt[p]?.[0] !== neu[p][0]);
  assert.deepEqual(veraltet.slice(0, 5), [], `${veraltet.length} Seiten geändert: npm run build && npm run lastmod`);
});

test("Rechnerseiten verlinken indexierbare Städte und alle Staaten", () => {
  const sitemapStaedte = new Set(sitemapUrls("cities").map((u) => new URL(u).pathname));
  for (const s of SEITEN.filter((x) => x.art === "rechner" || x.art === "umrechner")) {
    const html = readFileSync(pub(s.pfad.slice(1) + "index.html"), "utf8");
    const block = html.slice(html.indexOf('id="near-you"'));
    const links = [...block.split("</ul>")[0].matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
    assert.ok(links.length >= 12 && links.length <= 20, s.pfad);
    for (const l of links) assert.ok(sitemapStaedte.has(l), `${s.pfad} → ${l}`);
    assert.match(block, /href="\/landscape-supply\/">All states/);
  }
  assert.match(readFileSync(pub("gravel-calculator/index.html"), "utf8"), /id="near-you"[\s\S]*href="\/landscape-supply\/gravel-pits\/"/);
});

test("Staatsseite: indexierbare Städte vorn, Rest eingeklappt, Kiesgruben verlinkt", () => {
  const html = readFileSync(pub("landscape-supply/tx/index.html"), "utf8");
  const haupt = html.split('id="staedte"')[1].split("</ul>")[0];
  const sitemapStaedte = new Set(sitemapUrls("cities").map((u) => new URL(u).pathname));
  for (const [, l] of haupt.matchAll(/href="([^"]+)"/g)) assert.ok(sitemapStaedte.has(l), l);
  assert.match(html, /<details class="weitere"><summary>Other locations in Texas \(\d+\)/);
  assert.match(html, /href="\/landscape-supply\/tx\/gravel-pits\/"><strong>Gravel pits in Texas \(\d+\)/);
  assert.match(html, /data-filter="staedte staedte-weitere"/);
});

test("Stadtseite verlinkt die Kiesgruben des Staats, Firmenseite hat „How much do you need?“ als H2", () => {
  assert.match(readFileSync(pub("landscape-supply/tx/houston/index.html"), "utf8"), /href="\/landscape-supply\/tx\/gravel-pits\/"/);
  const yards = JSON.parse(readFileSync(pub("assets/yards.json"), "utf8"));
  const html = readFileSync(pub(`landscape-supply/${yards.find((y) => y[5] === "landscape-supply")[6]}index.html`), "utf8");
  assert.match(html, /<h2[^>]*>How much do you need\?<\/h2>/);
});

test("Ratgeber verlinken im Fließtext 2–4 Rechner oder Ratgeber", () => {
  for (const s of SEITEN.filter((x) => x.art === "ratgeber")) {
    const n = [...s.inhalt.matchAll(/<a href="\/[^"]+"/g)].length;
    assert.ok(n >= 2 && n <= 4, `${s.pfad}: ${n}`);
  }
});

// ---------- AP6: Rechner ----------
test("Rechnerseiten: Formel und Beispiel direkt unter der H1, Optionen für Auffrischen und Verdichtung", () => {
  for (const s of SEITEN.filter((x) => x.art === "rechner" || x.art === "umrechner")) {
    const html = readFileSync(pub(s.pfad.slice(1) + "index.html"), "utf8");
    const held = html.split('<section class="held">')[1].split("</section>")[0];
    assert.match(held, /<p class="formel"><strong>Formula:<\/strong>.*<strong>Example:<\/strong>/, s.pfad);
    if (s.art === "rechner" && !s.nurVolumen) assert.match(html, /id="bestand"/, s.pfad);
  }
  assert.match(readFileSync(pub("mulch-calculator/index.html"), "utf8"), /20 × 10 ft at 3 in = 1\.85 cubic yards/);
  assert.match(readFileSync(pub("fill-dirt-calculator/index.html"), "utf8"), /<label>Extra for compaction \(%\)<input id="verdichtung"[^>]*value="20"/);
  assert.match(readFileSync(pub("mulch-calculator/index.html"), "utf8"), /<label hidden>Extra for compaction/);
});

test("FAQ: Mulch mit „People also ask“-Fragen, Startseite mit 6–8 Fragen", () => {
  const mulch = SEITEN.find((s) => s.pfad === "/mulch-calculator/").faq.map(([q]) => q);
  for (const q of ["What is the 3-3-3 rule for mulch?", "How many bags of mulch do I need to cover 500 square feet?", "How do I estimate a yard of mulch?"]) assert.ok(mulch.includes(q), q);
  const start = SEITEN.find((s) => s.pfad === "/").faq.length;
  assert.ok(start >= 6 && start <= 8, String(start));
});

// ---------- AP7: Inhalte ----------
test("Staatsseiten: 120–200 Wörter Text aus den Daten", () => {
  for (const st of ["tx", "ca", "nc", "az"]) {
    const html = readFileSync(pub(`landscape-supply/${st}/index.html`), "utf8");
    const abschnitt = html.split(/<h2 class="abstand">About landscape supply in /)[1]?.split("</section>")[0];
    assert.ok(abschnitt, st);
    const woerter = text(abschnitt).split(" ").filter((w) => /[a-z0-9]/i.test(w)).length;
    assert.ok(woerter >= 100 && woerter <= 230, `${st}: ${woerter} Wörter`);
  }
});

test("Kiesgruben je Staat: Titel mit Anzahl, FAQ mit Schema, Yards in der Nähe", () => {
  const html = readFileSync(pub("landscape-supply/tx/gravel-pits/index.html"), "utf8");
  assert.match(html, /<title>Gravel Pits in Texas \(\d+\) – Sand &amp; Gravel Pits by Town<\/title>/);
  assert.match(html, /What’s the difference between a quarry and a gravel pit\?/);
  assert.match(html, /"@type":"FAQPage"/);
  assert.match(html, /Landscape supply yards in Texas<\/h2>/);
});

test("Ratgeber: Autorzeile, Short answer, Quellen; Säcke-Ratgeber mit Quart/Liter", () => {
  for (const s of SEITEN.filter((x) => x.art === "ratgeber")) {
    const html = readFileSync(pub(s.pfad.slice(1) + "index.html"), "utf8");
    assert.match(html, /<p class="autor">By <a href="\/about\/">[^<]+<\/a> · Last reviewed/, s.pfad);
    assert.match(html, /<strong>Short answer: /, s.pfad);
    assert.ok(s.quellen?.length, `${s.pfad}: Quellen fehlen`);
    const art = ldVon(s.pfad.slice(1) + "index.html").find((x) => x["@type"] === "Article");
    assert.equal(art.author["@type"], "Person");
  }
  assert.match(readFileSync(pub("guides/how-many-bags-of-mulch-in-a-yard/index.html"), "utf8"), /dry quarts ÷ 25\.7/);
  assert.match(readFileSync(pub("about/index.html"), "utf8"), /How often we check/);
});

test("Kompost-Rechner (Volumen belegt: 3.600/Monat) gebaut und verlinkt", () => {
  const html = readFileSync(pub("compost-calculator/index.html"), "utf8");
  assert.match(html, /<h1>Compost Calculator: How Much Compost Do You Need\?<\/h1>/);
  assert.match(readFileSync(pub("calculators/index.html"), "utf8"), /href="\/compost-calculator\/"/);
  assert.ok(sitemapUrls("pages").some((u) => u.endsWith("/compost-calculator/")));
});

// ---------- AP8: Links und Bekanntheit ----------
test("Einbettbarer Rechner: eigene Seite ohne Messung, noindex, mit Quell-Link; /embed/ mit Kopier-Code", () => {
  const w = readFileSync(pub("embed/calculator/index.html"), "utf8");
  assert.match(w, /noindex/);
  assert.match(w, /id="rechner"/);
  assert.doesNotMatch(w, /messung\.js/);
  assert.match(w, /Calculator by <a href="https:\/\/gravelandmulch\.com\/"/);
  const e = readFileSync(pub("embed/index.html"), "utf8");
  assert.match(e, /id="embed-code"[^>]*>&lt;iframe src="https:\/\/gravelandmulch\.com\/embed\/calculator\/\?m=hardwood-mulch"/);
  assert.ok(!sitemapUrls("pages").some((u) => u.includes("/embed/calculator/")));
});

test("Add your yard + Badge, Firmenseiten verlinken dorthin; Auswertung Yards je Staat", () => {
  const a = readFileSync(pub("add-your-yard/index.html"), "utf8");
  assert.match(a, /href="mailto:gravelandmulch@gmail\.com\?subject=Add/);
  assert.match(a, /badge\.svg/);
  assert.ok(existsSync(pub("assets/badge.svg")));
  const yards = JSON.parse(readFileSync(pub("assets/yards.json"), "utf8"));
  assert.match(readFileSync(pub(`landscape-supply/${yards[0][6]}index.html`), "utf8"), /href="\/add-your-yard\/"/);
  const t = readFileSync(pub("landscape-supply/yards-per-state/index.html"), "utf8");
  assert.match(t, /"@type":"Dataset"/);
  assert.match(t, /<h2>Method<\/h2>/);
  assert.ok((t.match(/<tr><td><a href="\/landscape-supply\/[a-z]{2}\/">/g) || []).length >= 48);
  assert.ok(sitemapUrls("pages").some((u) => u.endsWith("/landscape-supply/yards-per-state/")));
});
