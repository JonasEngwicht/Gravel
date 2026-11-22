# Gravel

Mulch-, Kies- und Erde-Rechner plus ein Verzeichnis für Landscape-Supply-Yards in den USA.

## Inhalt

| Pfad | Was |
|---|---|
| `docs/01-konzept-rechner.md` | Konzept der Rechner: Seiten, Eingaben, Rechenweg, Ergebnisanzeige |
| `docs/02-konzept-directory.md` | Konzept des Verzeichnisses und der Verzahnung mit den Rechnern |
| `data/materials.json` | Materialien mit Dichte, empfohlener Tiefe, Sackgrößen, Puffer (Richtwerte, vor Launch prüfen) |
| `data/schema/yard.schema.json` | Datenformat für einen Yard-Eintrag |
| `data/yards/_example.json` | Fiktiver Beispiel-Eintrag |
| `src/calc/core.js` | Rechenlogik (reine Funktionen) |
| `src/directory/distance.js` | Umkreissuche nach ZIP, Median-Preise |
| `scripts/build.mjs` | Build: erzeugt `public/` (Seiten, Assets, robots.txt) |
| `scripts/seiten.mjs` | Rechnerseiten: URL, Titel, Texte, FAQ, Standardmaterial |
| `static/` | CSS, Browser-JS (`app.js`), Favicon |
| `src/worker.js` | Cloudflare Worker: liefert `public/` aus, auf *.workers.dev mit noindex |
| `wrangler.jsonc` | Worker-Konfiguration (Build-Befehl, Assets) |
| `site.config.json` | Name und `baseUrl` (solange leer: noindex, keine Sitemap) |
| `test/` | Tests für Rechenlogik, Umkreissuche und Build |

## Build und Tests

```sh
npm run build   # baut public/
```

### Tests

```sh
npm test
```

Benötigt Node.js 20 oder neuer, keine Abhängigkeiten.
