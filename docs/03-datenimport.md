# Datenimport: Landscape Supply Yards (USA)

Stand: 22.11.2026 · Quellen: Overture Maps Places (Release 2026-11-18.0), MSHA Mines Data Set (Stand 20.11.2026) zur Anreicherung, Census ZCTA Gazetteer 2025

## Inhalt

| Pfad | Was |
|---|---|
| `data/yards/<staat>/<id>.json` | 4.716 Einträge in 48 Staaten (inkl. DC), ein Eintrag pro Datei (Dateiname = `id`) |
| `data/schema/yard.schema.json` | Schema ergänzt um `kind`, `chain`, `msha` und Herkunftsfelder unter `source` |
| `data/zip-centroids/<3-stelliger ZIP-Präfix>.json` | ZIP-Mittelpunkte für die Umkreissuche, `{ "80202": [lat, lng] }`, 896 Dateien |
| `data/import/yards_all.csv` | Alle Einträge als Tabelle zum Durchsehen |

## Zusammensetzung

| kind | Anzahl | Was |
|---|---|---|
| landscape-supply | 1.984 | Klassische Landscape-Supply-Yards (davon 579 SiteOne-Filialen) |
| sand-gravel | 1.528 | Sand- & Kiesbetriebe und -händler |
| mulch-soil | 888 | Mulch- und Mutterboden-Yards |
| stone-yard | 316 | Stone- und Rock-Yards |
| gravel-pit | 2.213 | Aktive und zeitweise aktive Sand- & Kiesgruben aus MSHA (ohne Kontaktdaten, seit 22.11.2026) |

## Overture: so entstanden

1. DuckDB-Abfrage auf Overture (S3) nach Namen (landscape supply, mulch, gravel, topsoil, stone yard, aggregates …), Lower 48: 7.381 Treffer
2. Namensfilter mit Wortgrenzen (u. a. „Johnstone Supply“ – HVAC – raus): 6.513
3. Nur gewerbliche Kategorien, keine Ortsnamen („Gravel Road Farm“), keine reinen Rodungsdienste: 5.661
4. Dubletten zusammengeführt (gleicher Name + Nähe, oder gleiche Telefonnummer + Name + Stadt): 5.211
5. 26 Einträge ohne ZIP oder Stadt übersprungen: 5.185
6. 469 Steinbrüche und Großproduzenten (Martin Marietta, Hanson …) entfernt, weil sie meist nur an Gewerbe verkaufen: **4.716**

## MSHA: nur zur Anreicherung

Das MSHA Mines Data Set (alle US-Minen, gemeinfrei) wurde mit den Overture-Einträgen abgeglichen (≤ 3 km und Namensübereinstimmung mit Mine, Betreiber oder Mutterfirma):

- 338 Einträge haben `msha` mit `match: "active-nearby"`: aktive Mine des Betriebs in der Nähe, mit Status, Rohstoff und Betreiber. Wird auf der Unternehmensseite als „Mine record“ gezeigt.
- 115 Einträge haben `match: "inactive-nearby"`: in der Nähe nur eine stillgelegte Mine mit passendem Namen. Nicht automatisch geschlossen (Verkaufshöfe laufen oft weiter), bitte prüfen.

## MSHA: Kiesgruben (`kind: "gravel-pit"`)

Seit 22.11.2026 sind die MSHA-Sand- & Kiesgruben wieder drin, weil „gravel pit near me“ rund 9.900 Suchen im Monat hat: 2.213 Gruben mit Status `Active` oder `Intermittent` und Rohstoff „Construction Sand and Gravel“ bzw. „Sand, Common“ (wiederhergestellt aus dem Commit vor 7d62b46). Sie haben Ort, ZIP, Betreiber und Status, aber weder Straße noch Telefon oder Website. MSHA-Steinbrüche (Crushed Stone) und die 469 Overture-Steinbrüche bleiben draußen.

## Seiten aus den Daten

`npm run build` erzeugt aus `data/yards/` das Verzeichnis unter `/landscape-supply/` (Code: `scripts/verzeichnis.mjs`):

| URL | Inhalt |
|---|---|
| `/landscape-supply/` | Übersicht: Bundesstaaten, Städte mit den meisten Einträgen |
| `/landscape-supply/<staat>/` | Alle Städte des Bundesstaats |
| `/landscape-supply/gravel-pits/` | Kiesgruben-Übersicht nach Bundesstaat |
| `/landscape-supply/<staat>/gravel-pits/` | Alle Kiesgruben eines Staats, nach Ort gruppiert |
| `/landscape-supply/<staat>/<stadt>/` | Stadtseite: Kurztext aus den Daten, Einträge in drei Gruppen (Yards / Sand & Kies / Kiesgruben), bei wenigen Einträgen Anbieter im Umkreis von 15 Meilen, Rechner, Nachbarstädte, JSON-LD `ItemList` |
| `/landscape-supply/<staat>/<stadt>/<slug>/` | Unternehmensseite: Kontakt, Karte, Materialien/Öffnungszeiten (falls gepflegt), MSHA-Daten, Anbieter in der Nähe, JSON-LD `HomeAndConstructionBusiness` |

Indexierung (seit 22.11.2026: nur befüllte Seiten, Regeln in `scripts/verzeichnis.mjs`):
- „Befüllt“ heißt: geprüft (`status: "active"`) oder mit Telefon bzw. Website.
- Stadtseiten: indexiert ab 3 befüllten Einträgen (`MIN_STADT`), sonst `noindex, follow`.
- Unternehmensseiten: indexiert, wenn geprüft oder mit Straße, Telefon und Website. Kiesgruben ohne Kontaktdaten: `noindex, follow`.
- Staatsseiten und Kiesgruben-Seiten je Staat: ab 3 Einträgen.
- Nur indexierbare Seiten stehen in den Sitemaps. `sitemap.xml` ist ein Index auf `sitemap-pages.xml`, `-states`, `-cities`, `-yards` und `-gravel-pits`, damit die Search Console die Indexierung je Seitentyp zeigt.
- Ungeprüfte Einträge zeigen auf ihrer Seite einen Hinweis, vorher anzurufen.
- Ohne `baseUrl` in `site.config.json` ist weiterhin alles `noindex` (Vorschau auf workers.dev), mit `baseUrl` entstehen Canonicals und Sitemap.
- Einträge mit `status: "closed"` und Dateien, die mit `_` beginnen, werden nicht veröffentlicht.

Umfang: ca. 11.500 Verzeichnisseiten (davon ~4.200 indexierbar) plus 26 Rechner-, Ratgeber- und Infoseiten; ~12.400 Dateien im Build. Grenze bei Cloudflare Workers (Free): 20.000 Dateien – ein Test schlägt an, wenn es mehr als 19.500 werden.

## Pflege

- Geprüfte Einträge auf `status: "active"` setzen und Materialien, Preise (`price.updated`), Öffnungszeiten, Lieferung und `self_load` ergänzen.
- Geschlossene Betriebe auf `status: "closed"` setzen (Datei bleibt, Seite verschwindet).
- Overture erscheint monatlich neu; die Abfrage steht in der Projektnotiz, die Bereinigungsregeln oben.

## Lizenzen

- Overture Maps: CDLA-Permissive-2.0, Foursquare-Datensätze Apache-2.0. Pflicht-Attribution auf der Website: „© OpenStreetMap contributors, © Overture Maps Foundation“ (steht auf jeder Verzeichnisseite).
- MSHA und Census: US-Behörden, gemeinfrei. ZIP-Mittelpunkte bezogen über github.com/drewthomas00/us-zip-centroids, stichprobenartig geprüft.
