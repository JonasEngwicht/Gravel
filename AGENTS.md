# AGENTS.md – Einstieg für Agenten

Gravel: Mulch-, Kies- und Erde-Rechner plus Verzeichnis für Landscape-Supply-Yards in den USA (Website auf Englisch, Doku auf Deutsch).
Aufbau übernommen aus dem Hofladen-Repo (`JonasEngwicht/hofladen`): statische Seiten aus einem Node-Build, ausgeliefert von einem Cloudflare Worker.
Das Repo ist **öffentlich**: keine Secrets, keine personenbezogenen Notizen.

## Befehle

```sh
node scripts/build.mjs        # baut public/ und src/generated/ (Daten für den Worker)
npm test                      # baut und testet (node:test, keine Abhängigkeiten)
npm run test:schnell          # nur testen
```

Keine npm-Abhängigkeiten: nur Node-Bordmittel (Node 22). Ausnahme: Abrufe offener Quellen in Python (`scripts/*.py`, nur in Workflows).

## Aufbau

| Pfad | Inhalt |
|---|---|
| `scripts/build.mjs` | Einstieg; lädt `scripts/build/*.mjs` in fester Reihenfolge |
| `scripts/build/daten.mjs` | Daten laden und zusammenführen (Yards, Städte, Bundesstaaten, ZIPs, Materialien) |
| `scripts/build/html.mjs` | `seite()` (Kopf, Meta, JSON-LD, Fuß), `schreibe()`, `MIN_SEITE` |
| `scripts/build/rechner.mjs` | Startseite und Rechnerseiten, `rechnerForm()` |
| `scripts/build/directory.mjs` | Übersicht, Bundesstaaten, Städte, Yard-Seiten |
| `scripts/build/themen.mjs` | About, Imprint, Privacy, 404 |
| `scripts/build/abschluss.mjs` | statische Dateien, robots.txt, Sitemap, Seitenarchiv (301/410), Worker-Daten |
| `static/calc.js` | Rechenlogik (Build + Browser) |
| `static/umkreis.js` | Umkreissuche und Medianpreise (Worker + Build) |
| `static/rechner.js` | Rechner-Oberfläche im Browser, ZIP-Suche |
| `src/worker.js` | Weiterleitungen, 404/410, `/api/umkreis` |
| `scripts/quellen.mjs`, `import-quellen.mjs`, `fetch-*.py`, `websites-pruefen.mjs` | offene Quellen (Overture, Foursquare) |
| `data/materials.json` | Materialien (Dichte, Tiefe, Sackgrößen) – Richtwerte, vor Launch prüfen |
| `data/yards/*.json` | eigene Einträge nach `data/schema/yard.schema.json`; Dateien mit `_` am Anfang werden nie veröffentlicht |
| `tests/` | Tests; `hilfen.mjs` baut mit fiktiven Test-Yards (`tests/fixtures/yards/`) in ein Temp-Verzeichnis und lädt den Worker |
| `docs/` | Konzepte (01 Rechner, 02 Directory, 03 Übernahme aus Hofladen) |

## Daten und Vorrang

Schwach → stark: `data/offene-quellen.json` (Overture/Foursquare, IDs `o-`/`f-`) → `data/yards/*.json` (eigene Pflege, gleiche ID überschreibt) → Betreiber-Angaben (noch nicht übernommen).
`data/seiten-stand.json` (Hash und lastmod je Seite, Grundlage für 301/410) schreibt nur CI – **nie von Hand ändern**.
`data/quellen/zip-us.txt` kommt aus dem Workflow „ZIP-Daten aktualisieren“ (GeoNames); ohne die Datei nutzt der Build nur Beispiel-ZIPs.

## Änderungen ausliefern

1. Branch anlegen, kleine Commits, `npm test` muss grün sein.
2. `bash scripts/pr-mergen.sh <branch> "<titel>" <datei-mit-pr-text>`: PR per REST, wartet auf Checks, merged. (In Claude-Sitzungen `gh api …` statt `gh pr`.)
3. `gh workflow run deploy.yml --ref main`. Ein Push auf main deployt nicht von selbst.

## Feste Regeln (aus Hofladen übernommen)

- **Quellen:** nur offene Quellen mit Lizenzhinweis, Betreiber und eigene Pflege. Keine Daten, Texte oder Bilder von Wettbewerbern (Hello Gravel, Yelp, Angi, BBB, Yellowpages …), kein Scraping von Google Maps.
- **Yard ≠ Landschaftsbauer:** Dienstleister nicht aufnehmen; unsichere Kandidaten nur nach Website-Bestätigung (`scripts/quellen.mjs`).
- **URLs stabil:** `/landscape-supply/<st>/<city>/`, `/yard/<name>-<city>-<st>/`, Rechner unter `/<name>-calculator/`. Änderungen bekommen automatisch eine 301, entfernte Yards 410.
- **Indexierung:** Listenseiten unter 3 Einträgen `noindex`; Imprint, Privacy, 404 `noindex`; robots.txt sperrt `/api/`.
- **Titel ≤ 580 px, Beschreibung ≤ 1000 px** (`scripts/pixel.mjs`, Test für alle Seiten).
- **Strukturierte Daten** nur für echte, sichtbare Angaben; kein `aggregateRating` ohne echte Bewertungen.
- **Keine Parameter-Links** in Übersichten; interne Links mit `?` bekommen automatisch `nofollow`.
- **Dritte nur mit Zustimmung:** Schriften, Skripte, Karten vom eigenen Server.
- **E-Mails an Betriebe** nur nach Freigabe durch Jonas.
- **Secrets** (nur Namen): GitHub `CF_DEPLOY_HOOK`, `HUGGINGFACE_KEY`. Nie ausgeben, speichern oder in Links einbauen.

## Vor dem Launch

- [ ] Domain in `site.config.json` und `wrangler.jsonc` (routes) eintragen
- [ ] Kontakt-E-Mail in `site.config.json` (`kontaktEmail`, `impressum.email`)
- [ ] Workflow „ZIP-Daten aktualisieren“ einmal laufen lassen
- [ ] Dichten in `data/materials.json` gegen Lieferantenangaben prüfen
- [ ] Probelauf offene Quellen für 2–3 Metros, Regeln in `scripts/quellen.mjs` schärfen
- [ ] Cloudflare: Worker `gravel` verbinden, Deploy Hook als `CF_DEPLOY_HOOK` hinterlegen

## Noch nicht aus Hofladen übernommen

Betreiber-Bereich (`src/betrieb.js`: Claim, Magic-Link, Turnstile, Resend), Verwaltung `/verwaltung/`, Statistik (D1), eigene Kartenkacheln (R2, `src/kacheln.js`, Leaflet liegt schon in `static/vendor/`), Pflege-Workflow über das Claude-Projekt (`pflege/`), Öffnungszeiten aus Websites, Live-Prüfung, IndexNow, Bing. Reihenfolge und Anpassungen: `docs/03-uebernahme-hofladen.md`.
