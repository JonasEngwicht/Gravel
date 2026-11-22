# Gravel

Mulch-, Kies- und Erde-Rechner plus ein Verzeichnis für Landscape-Supply-Yards in den USA.

## Inhalt

| Pfad | Was |
|---|---|
| `docs/01-konzept-rechner.md` | Konzept der Rechner: Seiten, Eingaben, Rechenweg, Ergebnisanzeige |
| `docs/02-konzept-directory.md` | Konzept des Verzeichnisses und der Verzahnung mit den Rechnern |
| `data/materials.json` | Materialien mit Dichte, empfohlener Tiefe, Sackgrößen, Puffer (Richtwerte, vor Launch prüfen) |
| `data/schema/yard.schema.json` | Datenformat für einen Yard-Eintrag |
| `docs/03-datenimport.md` | Herkunft der Yard-Daten (Overture Maps, Anreicherung mit MSHA), Bereinigung, Seitenstruktur und Indexierung |
| `data/yards/<staat>/<id>.json` | 5.185 Landscape-Supply-Yards und Kieslieferanten (ein Eintrag pro Datei) |
| `data/yards/_example.json` | Fiktiver Beispiel-Eintrag (wird nicht veröffentlicht) |
| `data/zip-centroids/<präfix>.json` | ZIP-Mittelpunkte (Census-Gazetteer 2025) für die Umkreissuche |
| `data/import/yards_all.csv` | Alle Einträge als Tabelle zum Durchsehen |
| `scripts/verzeichnis.mjs` | Verzeichnisseiten: Übersicht, Staaten, Städte, Unternehmen |
| `src/calc/core.js` | Rechenlogik (reine Funktionen) |
| `src/directory/distance.js` | Umkreissuche nach ZIP, Median-Preise |
| `scripts/build.mjs` | Build: erzeugt `public/` (Rechner- und Verzeichnisseiten, Assets, robots.txt, Sitemap) |
| `scripts/seiten.mjs` | Rechnerseiten: URL, Titel, Texte, FAQ, Standardmaterial |
| `static/` | CSS, Browser-JS (`app.js`), Favicon |
| `src/worker.js` | Cloudflare Worker: liefert `public/` aus, auf *.workers.dev mit noindex |
| `wrangler.jsonc` | Worker-Konfiguration (Build-Befehl, Assets) |
| `site.config.json` | Name und `baseUrl` (solange leer: noindex, keine Sitemap) |
| `test/` | Tests für Rechenlogik, Umkreissuche, Build, Yard-Daten und Verzeichnis |

## Build und Tests

```sh
npm run build   # baut public/
```

### Tests

```sh
npm test
```

Benötigt Node.js 20 oder neuer, keine Abhängigkeiten.
