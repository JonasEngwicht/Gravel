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

Reine MSHA-Gruben ohne Overture-Eintrag (rund 4.700) und Steinbrüche wurden bewusst **nicht** aufgenommen: Sie haben weder Adresse noch Telefon oder Website und verkaufen meist nur an Gewerbe.

## Seiten aus den Daten

`npm run build` erzeugt aus `data/yards/` das Verzeichnis unter `/landscape-supply/` (Code: `scripts/verzeichnis.mjs`):

| URL | Inhalt |
|---|---|
| `/landscape-supply/` | Übersicht: Bundesstaaten, Städte mit den meisten Einträgen |
| `/landscape-supply/<staat>/` | Alle Städte des Bundesstaats |
| `/landscape-supply/<staat>/<stadt>/` | Stadtseite: Einträge in zwei Gruppen (Yards / Sand & Kies), Rechner, Nachbarstädte, JSON-LD `ItemList` |
| `/landscape-supply/<staat>/<stadt>/<slug>/` | Unternehmensseite: Kontakt, Karte, Materialien/Öffnungszeiten (falls gepflegt), MSHA-Daten, Anbieter in der Nähe, JSON-LD `HomeAndConstructionBusiness` |

Indexierung:
- Alle Verzeichnisseiten sind indexierbar und stehen in der Sitemap, auch Einträge mit `status: "unverified"`. Ungeprüfte Einträge zeigen auf ihrer Seite einen Hinweis, vorher anzurufen.
- Ohne `baseUrl` in `site.config.json` ist weiterhin alles `noindex` (Vorschau auf workers.dev), mit `baseUrl` entstehen Canonicals und Sitemap.
- Einträge mit `status: "closed"` und Dateien, die mit `_` beginnen, werden nicht veröffentlicht.

Umfang: ca. 7.800 Seiten (1 Übersicht, 48 Staaten, ~3.000 Städte, 4.716 Unternehmen). Grenze bei Cloudflare Workers (Free): 20.000 Dateien – ein Test schlägt an, wenn es mehr als 19.500 werden.

## Pflege

- Geprüfte Einträge auf `status: "active"` setzen und Materialien, Preise (`price.updated`), Öffnungszeiten, Lieferung und `self_load` ergänzen.
- Geschlossene Betriebe auf `status: "closed"` setzen (Datei bleibt, Seite verschwindet).
- Overture erscheint monatlich neu; die Abfrage steht in der Projektnotiz, die Bereinigungsregeln oben.

## Lizenzen

- Overture Maps: CDLA-Permissive-2.0, Foursquare-Datensätze Apache-2.0. Pflicht-Attribution auf der Website: „© OpenStreetMap contributors, © Overture Maps Foundation“ (steht auf jeder Verzeichnisseite).
- MSHA und Census: US-Behörden, gemeinfrei. ZIP-Mittelpunkte bezogen über github.com/drewthomas00/us-zip-centroids, stichprobenartig geprüft.
