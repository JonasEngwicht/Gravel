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
| `data/yards/<staat>/<id>.json` | 4.716 Landscape-Supply-, Mulch- und Stone-Yards sowie Kieslieferanten (ein Eintrag pro Datei) |
| `data/yards/_example.json` | Fiktiver Beispiel-Eintrag (wird nicht veröffentlicht) |
| `data/zip-centroids/<präfix>.json` | ZIP-Mittelpunkte (Census-Gazetteer 2025) für die Umkreissuche |
| `data/import/yards_all.csv` | Alle Einträge als Tabelle zum Durchsehen |
| `scripts/verzeichnis.mjs` | Verzeichnisseiten: Übersicht, Staaten, Städte, Unternehmen |
| `scripts/qualitaet.mjs` | Datenqualität: Fehlkategorien, Postfächer, Namen, Dubletten (`npm run review` → `review/verdachtsfaelle.csv`) |
| `scripts/anreicherung.mjs`, `scripts/anreichern.mjs` | Fakten von Yard-Websites (Materialien, Lieferung, Zeiten, Preise), siehe `docs/04-anreicherung.md` |
| `data/anreicherung.json` | Extrahierte Fakten je Yard mit Quelle und Abrufdatum |
| `data/lastmod.json` | Inhalts-Hash und Änderungsdatum je indexierbarer Seite (`npm run lastmod` nach dem Build) |
| `src/calc/core.js` | Rechenlogik (reine Funktionen) |
| `src/directory/distance.js` | Umkreissuche nach ZIP, Median-Preise |
| `scripts/build.mjs` | Build: erzeugt `public/` (Rechner- und Verzeichnisseiten, Assets, Suchindex `yards.json`/`cities.json`/`zip/`, robots.txt, Sitemap-Index je Seitentyp, Open Graph) |
| `scripts/seiten.mjs` | Rechner, Umrechner, Ratgeber (`/guides/`) und Infoseiten: URL, Titel, Texte, FAQ, Standardmaterial, Rechenbeispiel, Tabellen-Bausteine |
| `static/` | CSS, Browser-JS (`app.js` Rechner, `finder.js` Yard-Suche nach ZIP/Stadt/Standort und Städtefilter), Favicon |
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
