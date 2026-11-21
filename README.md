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
| `test/` | Tests für Rechenlogik und Umkreissuche |

## Tests

```sh
npm test
```

Benötigt Node.js 20 oder neuer, keine Abhängigkeiten.
