# Datenimport: Landscape Supply Yards + MSHA-Gruben (USA)

Stand: 22.11.2026 · Quellen: Overture Maps Places (Release 2026-11-18.0), MSHA Mines Data Set (Stand 20.11.2026), Census ZCTA Gazetteer 2025

## Inhalt

| Pfad | Was |
|---|---|
| `data/yards/<staat>/<id>.json` | 9.917 Einträge, ein Eintrag pro Datei (Dateiname = `id`) |
| `data/schema/yard.schema.json` | Schema ergänzt um `kind`, `chain`, `msha` und Herkunftsfelder unter `source` |
| `data/zip-centroids/<3-stelliger ZIP-Präfix>.json` | ZIP-Mittelpunkte für die Umkreissuche, `{ "80202": [lat, lng] }`, 896 Dateien |
| `data/import/yards_all.csv` | Alle Einträge als Tabelle zum Durchsehen (Spalte `source`: overture / msha) |

## Zusammensetzung

| Quelle | kind | Anzahl |
|---|---|---|
| Overture | landscape-supply | 1.984 |
| Overture | sand-gravel | 1.528 |
| Overture | mulch-soil | 888 |
| Overture | quarry | 469 |
| Overture | stone-yard | 316 |
| MSHA (neu) | quarry | 2.519 |
| MSHA (neu) | sand-gravel | 2.213 |

## MSHA-Verarbeitung

1. 92.129 Minen → aktiv oder zeitweise in Betrieb, Sand & Kies oder Stein: 10.360
2. Ohne Zement, Kalk und Werkstein: 9.456 · ohne mobile Anlagen: 5.553 · ohne Gruben von Bezirken/Gemeinden/Behörden: 5.437 · mit gültigen Koordinaten: 5.419
3. Abgleich mit Overture-Yards (≤ 3 km und Namensübereinstimmung mit Mine, Betreiber oder Mutterfirma): 534 Minen → 508 Yards bekommen `msha` mit `match: "active-nearby"`
4. 153 Overture-Yards haben in der Nähe nur eine stillgelegte Mine mit passendem Namen → `msha` mit `match: "inactive-nearby"`. **Nicht automatisch geschlossen**, weil Verkaufshöfe oft weiterlaufen, wenn die Grube aufgegeben ist. Bitte prüfen.
5. Rest als neue Einträge (gleicher Betreiber < 500 m zusammengefasst, Namen mit „Portable“ raus): 4.764
   - Name: Minenname, bei nichtssagenden Namen „Betreiber – Minenname“
   - Ort: `NEAREST_TOWN` aus MSHA; ZIP: nächster ZIP-Mittelpunkt (Näherung, max. 40 km)
   - Keine Straße, kein Telefon, keine Website
6. Nachträglich entfernt: 32 Industrie- und Frac-Sand-Betriebe (Silica, Proppant). Unbrauchbare Ortsangaben aus MSHA (z. B. „70“, „Unk“, „Intersection of …“) ersetzt durch den Ort des nächsten Overture-Eintrags (≤ 20 km) oder das County.

## Wichtig vor dem Veröffentlichen

- Alle Einträge: `status: "unverified"`, `materials: []`. Sie erscheinen erst nach Prüfung in der ZIP-Suche.
- MSHA-Einträge sind oft reine Betriebsgruben von Bau- und Transportbetonfirmen ohne Privatverkauf (1.163 mit ≤ 2 Mitarbeitern, 1.609 nur zeitweise in Betrieb). Empfehlung: nur nach Prüfung oder nur auf Stadtseiten unter „Pits & quarries“ zeigen.
- MSHA-Daten sind gemeinfrei (US-Behörde). Für Overture gilt die Attribution „© OpenStreetMap contributors, © Overture Maps Foundation“.
- ZIP-Mittelpunkte: Census-Gazetteer 2025 (gemeinfrei), bezogen über github.com/drewthomas00/us-zip-centroids. Werte stichprobenartig geprüft.

## Seiten aus den Daten

`npm run build` erzeugt aus `data/yards/` das Verzeichnis unter `/landscape-supply/` (Code: `scripts/verzeichnis.mjs`):

| URL | Inhalt |
|---|---|
| `/landscape-supply/` | Übersicht: Bundesstaaten, Städte mit den meisten Einträgen |
| `/landscape-supply/<staat>/` | Alle Städte des Bundesstaats |
| `/landscape-supply/<staat>/<stadt>/` | Stadtseite: Einträge in zwei Gruppen (Yards / Gruben & Steinbrüche), Rechner, Nachbarstädte, JSON-LD `ItemList` |
| `/landscape-supply/<staat>/<stadt>/<slug>/` | Unternehmensseite: Kontakt, Karte, Materialien/Öffnungszeiten (falls gepflegt), MSHA-Daten, Anbieter in der Nähe, JSON-LD `HomeAndConstructionBusiness` |

Indexierung (`site.config.json` → `directory`):
- Ohne `baseUrl` ist alles `noindex` (wie bisher).
- `indexUnverified: false`: Unternehmensseiten mit `status: "unverified"` bekommen `noindex` und fehlen in der Sitemap. Sobald ein Eintrag geprüft ist (`status: "active"`), wird seine Seite indexierbar.
- `minYardsCityIndex: 2`: Stadtseiten erst ab 2 Einträgen indexierbar.
- Einträge mit `status: "closed"` und Dateien, die mit `_` beginnen, werden nicht veröffentlicht.

Umfang: ca. 16.000 Seiten (1 Übersicht, 53 Staaten/Territorien, ~6.000 Städte, 9.917 Unternehmen). Grenze bei Cloudflare Workers (Free): 20.000 Dateien – ein Test schlägt an, wenn es mehr als 19.500 werden.
