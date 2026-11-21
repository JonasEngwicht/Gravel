# Was wir aus dem Hofladen-Repo übernehmen

Stand 21.11.2026 · Grundlage: `JonasEngwicht/hofladen` (hofladenliste.de, ca. 14.000 Einträge, Stand Commit `aacac2b`)

## Kurzfazit

Das Hofladen-Repo ist im Kern schon ein fertiges, erprobtes Directory-System. Fast alles außer den deutschen Datenquellen und den hofladen-typischen Funktionen passt auch für Gravel. Statt eines neuen Stacks (bisheriger Vorschlag: Astro + Cloudflare Pages) übernehmen wir die **Hofladen-Architektur**: Node-Build ohne Abhängigkeiten → statische Seiten, ausgeliefert von einem Cloudflare Worker mit D1 (Statistik, Konten, Meldungen) und R2 (eigene Kartenkacheln). Vorteil: ein System, gleiche Abläufe, gleiche Regeln, bewährte Tests.

## Übernahme im Detail

Legende: **1:1** = fast unverändert kopieren (Texte ins Englische) · **anpassen** = Logik bleibt, Inhalt/Regeln neu · **nein** = nicht übernehmen

### Gerüst und Auslieferung

| Bereich | Hofladen-Dateien | Übernahme | Anpassung für Gravel |
|---|---|---|---|
| Build-Einstieg und Module | `scripts/build.mjs`, `scripts/build/*.mjs` | anpassen | Seitentypen: Startseite + Rechner, Bundesstaat, Stadt, Yard, Material × Stadt. `seite()` aus `html.mjs` (Kopf, Meta, JSON-LD, Fuß) 1:1 |
| Seitenarchiv, 301/410 | `scripts/build/abschluss.mjs`, `data/seiten-stand.json` | 1:1 | Nur CI schreibt `seiten-stand.json`; entfernte Yards liefern 410 |
| Sitemaps, robots.txt | `abschluss.mjs` | 1:1 | Getrennte Sitemaps für Rechner und Directory |
| Titel-/Beschreibungslänge | `scripts/pixel.mjs` + Test | 1:1 | Grenzen 580 px / 1000 px bleiben |
| Helfer | `scripts/lib.mjs` (`slugify`, `ladePlz`, Raster für nächsten Ort) | anpassen | PLZ → US-ZIP: **GeoNames US** (CC BY 4.0, gleiche Quelle wie Hofladen) statt Census Gazetteer |
| Worker | `src/worker.js` | anpassen | Weiterleitungen (https, www, 301/410), `/suche`, `/plz/<plz>` → `/zip/<zip>/`, `/api/umkreis`, `/api/eintrag`, `/api/ereignis`, `/kacheln/*`, `/api/verwaltung/*`, `/api/turnstile` |
| Konfiguration | `wrangler.jsonc`, `site.config.json` | anpassen | Neuer Worker `gravel`, eigene D1-Datenbank und R2-Bucket, Domain, Kontaktadresse |

### Directory-Funktionen

| Bereich | Hofladen-Dateien | Übernahme | Anpassung für Gravel |
|---|---|---|---|
| Umkreissuche | `/api/umkreis` im Worker | anpassen | Ersetzt die Client-Suche aus `static/umkreis.js`. Neue Filter: `material`, `delivery`. Der Rechner ruft sie mit dem Ergebnis auf |
| Betreiber-Bereich („Claim your yard“) | `src/betrieb.js` | anpassen | Magic-Link-Login, `emailPasstZuWebsite()` (prüft, ob die E-Mail zur Website des Yards passt), Turnstile, Mails über Resend, Moderation in `/verwaltung/`. Neue Felder: Preise je Material, Lieferradius, Mindestmenge, `accepts_quotes` |
| Nachrichten an Betriebe | `nachrichtAnnehmen()` | anpassen | Grundlage für die **Angebotsanfrage** aus dem Rechner (Material, Menge, ZIP, Lieferung) |
| Tipps / neue Einträge | `tippAnnehmen()`, `/api/meldung`, `/api/rueckmeldung` | 1:1 | „Suggest a yard“, „Report wrong info“ |
| Erinnerungen an Betriebe | `erinnerungenSenden()` + Cron | anpassen | Vor der Saison (Feb/März): „Bitte Preise und Öffnungszeiten prüfen“ |
| Saison-Abo | `saisonAbo()`, `saisonMailsSenden()` | später | Mögliche Idee: Erinnerung zum Frühjahrs-Mulchen. Nicht in Phase 1 |
| Eigene Pflege über Claude-Projekt | `docs/pflege.md`, `scripts/pflege.mjs`, `pflege-uebernehmen.mjs` | 1:1 | Gleiches JSON-Format, Felder englisch; neues Claude-Projekt „Gravel“ mit Ordner `pflege/` |
| Recherche-Funde | `recherche-uebernehmen.mjs` | 1:1 | Füllt nur leere Felder, nennt Quelle und Stand |
| Statistik | D1-Tageszähler, `static/statistik.js`, Verwaltung | 1:1 | Zusätzlich zählen: Rechner benutzt, Material, Angebotsanfrage |

### Datenquellen

| Quelle | Hofladen-Dateien | Übernahme | Anpassung für Gravel |
|---|---|---|---|
| Overture Maps Places | `scripts/fetch-overture.py` | anpassen | Bounding Box USA statt Deutschland, Länderfilter `US`, eigene Kategorien und Namensregeln (siehe unten). Lizenz CDLA-Permissive-2.0 / Apache-2.0 |
| Foursquare Open Source Places | `scripts/fetch-foursquare.py` | anpassen | Gleicher Hugging-Face-Zugang (`HUGGINGFACE_KEY`), Filter auf USA. Lizenz Apache-2.0 |
| OpenStreetMap | `scripts/fetch-osm.mjs`, `import-osm.mjs`, `osm-merkmale.mjs` | anpassen | Overpass-Abfrage auf passende Tags (z. B. `shop=trade` mit `trade=landscaping`/`building_supplies`, `shop=garden_centre` nur mit passendem Namen) – Tags im Probelauf prüfen. ODbL: Quelle nennen, abgeleitete Datenbank steht unter ODbL (wie bei Hofladen) |
| Auswahl und Abgleich | `scripts/quellen.mjs`, `import-quellen.mjs` | anpassen | Logik 1:1 (Konfidenz-Schwellen, Rang der Quellen, Dubletten < 150 m oder bis 2 km mit ähnlichem Namen, Schutz bei 30 % Schwund). Regex neu (siehe unten) |
| Probelauf | `quellen-probe.mjs`, Workflow `quellen-probelauf.yml` | 1:1 | Erst für 2–3 Metros laufen lassen und Trefferqualität von Hand prüfen |
| Website-Prüfung | `scripts/websites-pruefen.mjs`, `websiteBestaetigt()` | anpassen | Kandidat gilt als bestätigt, wenn die eigene Website z. B. „bulk mulch“, „per cubic yard“, „per ton“, „landscape supply“, „delivery“ erwähnt |
| Öffnungszeiten von Websites | `scripts/oeffnungszeiten-websites.mjs` | 1:1 | US-Zeitformate (AM/PM) im Parser ergänzen |
| **Neu: Preise von Websites** | auf Basis von `oeffnungszeiten-websites.mjs` | neu | `preise-websites.mjs`: Preise wie „$38 per yard“ je Material auslesen, mit Datum und Quelle speichern. Das ist das Alleinstellungsmerkmal für Kostenschätzung und Preistabellen |
| Karte von morgen, offene Verwaltungsdaten, Haltestellen, Märkte | `fetch-kvm.mjs`, `fetch-kommunal.py`, `fetch-haltestellen.mjs`, `import-maerkte.mjs` | nein | Nur für Deutschland |
| Impressum-Kontakte | `impressum-kontakte.mjs` | nein | Deutsche Impressumspflicht der Höfe, gibt es in den USA nicht |

**Namensregeln für Overture/Foursquare (Entwurf, im Probelauf schärfen)**

```js
// eindeutig ein Yard
const STRONG = /landscape (supply|supplies|materials|depot|center)|(sand|stone|rock|soil|mulch|gravel) (yard|supply|depot)|sand (&|and) gravel|rock yard|stone yard|mulch (yard|depot|center)|bulk (mulch|materials|landscape)|topsoil|aggregates?\b/i;
// klingt passend, nur mit passender Kategorie und hoher Konfidenz
const WEAK = /landscape|mulch|stone|rock|gravel|soil|nursery|garden center|quarry/i;
// keine Yards: Dienstleister, Ketten, Fremdes
const NOT_YARD = /landscaping (services?|co|company|contractors?|llc)|lawn (care|service)|tree service|irrigation repair|design|architect|pool|concrete contractor|hardscape(s)? (contractor|install)|home depot|lowe'?s|walmart|menards|ace hardware|tractor supply|rental|storage|church|school/i;
```

Wichtigste Unterscheidung: **Landschaftsbau-Firmen (Dienstleistung) ≠ Supply Yards (Verkauf)**. Viele Einträge in offenen Quellen heißen „Landscaping“. Deshalb ist die Website-Prüfung hier noch wichtiger als bei Hofläden.

### Frontend

| Bereich | Hofladen-Dateien | Übernahme | Anpassung für Gravel |
|---|---|---|---|
| Lazy-Loading-Muster | `static/app.js` | anpassen | Karte, Route, Rechner nur bei Bedarf nachladen |
| Öffnungszeiten | `static/oh.js` (OSM-Format, Build + Browser) | 1:1 | Englische Texte, 12-h-Format |
| Karte | `static/karte.js`, `vollkarte.js`, `src/kacheln.js`, Leaflet + Protomaps, Workflow `karten-erzeugen.yml` | anpassen | Eigene PMTiles in R2, keine Drittanbieter. USA ist viel größer als Deutschland → Kacheln nur bis Zoom ~12 oder nur für die Start-Metros erzeugen |
| Route zum Yard | `static/route.js` | 1:1 | |
| Merkliste | im Worker/Frontend | optional | „Saved yards“, eher später |
| Gemeinsame Helfer | `static/helfer.js` (Build + Browser) | 1:1 | `static/calc.js` nach demselben Muster als `static/calc.js` einbinden |
| Service Worker, Manifest, Schriften | `static/sw.js`, `site.webmanifest`, `static/fonts/` | anpassen | Schriften selbst hosten (wie Hofladen), eigenes Logo |
| Aushang/QR-Code für Läden | `static/aushang.js`, `static/qr.js` | nein | Passt nicht zu Yards |

### Tests und Abläufe

| Bereich | Hofladen-Dateien | Übernahme | Anpassung für Gravel |
|---|---|---|---|
| Testgerüst | `tests/hilfen.mjs` (Worker mit nachgebautem Asset-Server), `tests/d1.mjs`, `tests/schema.mjs` | 1:1 | |
| SEO- und Seitentests | `seo.test.mjs`, `seiten.test.mjs`, `snippets.test.mjs`, `routing.test.mjs` | anpassen | Neue Seitentypen |
| Quellen-Tests | `quellen.test.mjs`, `import-osm.test.mjs`, `bereinigen.test.mjs` | anpassen | Mit US-Beispielen (Yard vs. Landschaftsbauer) |
| Workflows | `tests.yml`, `deploy.yml`, `live-check.yml`, `daten-aktualisieren.yml`, `quellen-aktualisieren.yml`, `quellen-probelauf.yml`, `betreiber-uebernehmen.yml`, `websites-auswerten.yml`, `qualitaet.yml`, `indexnow.yml`, `bing-melden.yml` | 1:1 bzw. anpassen | `haltestellen.yml`, `impressum-kontakte.yml` entfallen |
| PR-Ablauf | `scripts/pr-mergen.sh`, Regeln in `AGENTS.md` | 1:1 | Eigene `AGENTS.md` für Gravel |

### Seitentexte

| Bereich | Hofladen-Dateien | Übernahme | Anpassung für Gravel |
|---|---|---|---|
| Gepflegte Texte je Seite | `scripts/seitentexte.mjs`, `data/seitentexte.json` | 1:1 | Englische Stadttexte |
| Texte in 25er-Paketen nach Relevanz | `docs/ortstexte-anleitung.md`, `docs/ortstexte-pakete.md` | anpassen | Reihenfolge nach Suchvolumen der Metros |
| Regionsprofile | `data/regionen/*.json` | später | z. B. Klima, Bodenart, typische Gesteine je Metro |

## Regeln, die wir 1:1 übernehmen

Aus `AGENTS.md` von Hofladen, gelten auch für Gravel:

- **Quellen:** nur offene Quellen mit Lizenzhinweis, Betreiber und eigene Pflege. Keine Daten, Texte oder Bilder von Wettbewerbern (Hello Gravel, Yelp, Angi, BBB, Yellowpages …), kein Scraping von Google Maps.
- **URLs bleiben stabil**, Änderungen bekommen automatisch eine 301, entfernte Yards eine 410.
- **Listenseiten unter 3 Einträgen `noindex`**, ebenso Such-, Formular- und Verwaltungsseiten.
- **Strukturierte Daten nur für echte, sichtbare Angaben**, kein `aggregateRating` ohne echte Bewertungen.
- **Keine Parameter-Links in Übersichten** (Filter als `#material=…`).
- **Dritte nur mit Zustimmung:** Kacheln, Schriften, Analytics vom eigenen Server.
- **E-Mails an Betriebe nur nach Freigabe durch Jonas.**
- **Secrets** nur als Namen dokumentieren, nie ausgeben.

## Was sich an den Konzepten 01 und 02 ändert

| Bisher | Neu |
|---|---|
| Astro + Cloudflare Pages | Hofladen-Stack: Node-Build ohne Abhängigkeiten + Cloudflare Worker (D1, R2) |
| ZIP-Suche im Browser mit Census-Gazetteer-Datei | `/api/umkreis` im Worker, ZIP-Daten von GeoNames (CC BY 4.0) |
| Einträge vor allem aus eigener Recherche | Overture + Foursquare + OSM als Kandidaten, Website-Prüfung, dann eigene Pflege und Betreiber |
| Eigene Lead-Formular-Lösung (Worker + Turnstile) | Baut auf `nachrichtAnnehmen()`, Turnstile und Resend aus `src/betrieb.js` auf |
| `data/yards/*.json` von Hand | Bleibt als Format für eigene Pflege; im Build zusammengeführt mit den offenen Quellen nach dem Vorrang-Modell von Hofladen (offene Quellen → Ergänzungen → eigene Pflege → Betreiber) |

Der Rechner-Kern (`static/calc.js`, `data/materials.json`) bleibt unverändert.

## Stand der Übernahme (21.11.2026)

Erledigt in Schritt 1: Build-Gerüst, Seitenarchiv (301/410), Sitemap, Pixel-Prüfung, Worker mit `/api/umkreis`, Rechner- und Directory-Seiten, Quellen-Pipeline (Overture, Foursquare, Website-Prüfung, Abgleich), Testgerüst, Workflows (Tests, Deploy, ZIP-Daten, Probelauf, Quellen aktualisieren). Offen: siehe „Noch nicht aus Hofladen übernommen“ in `AGENTS.md`.

## Vorschlag für die Reihenfolge

1. **Gerüst übernehmen:** Build, Worker, `lib.mjs`, `pixel.mjs`, Testgerüst, Workflows Tests/Deploy/Live-Prüfung; Texte englisch, `site.config.json` für die neue Domain. Impressum- und Datenschutzseite aus Hofladen übernehmen (Betreiber sitzt in Deutschland).
2. **Rechnerseiten** in den Build einhängen (`core.js` als gemeinsamer Helfer).
3. **Probelauf der Quellen** für 2–3 Metros, Kategorien und Namensregeln festziehen.
4. **Website-Prüfung + Preis-Auslese**.
5. **Stadt- und Yard-Seiten**, `/api/umkreis` mit Material- und Lieferfilter, Anbindung an den Rechner.
6. **Betreiber-Bereich** („Claim your yard“), danach Angebotsanfragen.
7. Später: Featured-Einträge, Saison-Mails, Regionsprofile.

## Offen / zu prüfen

- [ ] Overture- und Foursquare-Kategorien für Supply Yards im Probelauf ermitteln (nicht raten).
- [ ] OSM-Tags für Yards in den USA prüfen (Abdeckung dort vermutlich deutlich schwächer als in Deutschland).
- [ ] Größe der PMTiles für die USA abschätzen (R2-Speicher, Build-Dauer im Workflow).
- [ ] Code kopieren oder gemeinsame Teile in ein eigenes Paket auslagern? Für den Start: kopieren, später bei Bedarf auslagern.
