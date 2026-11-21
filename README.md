# Gravel

Mulch-, Kies- und Erde-Rechner plus ein Verzeichnis für Landscape-Supply-Yards in den USA.
Aufbau übernommen aus dem Hofladen-Repo: Node-Build ohne Abhängigkeiten, ausgeliefert über einen Cloudflare Worker.

- **Für Agenten und Entwickler:** [AGENTS.md](AGENTS.md) – Aufbau, Daten, Befehle, Regeln, Checkliste vor dem Launch.
- **Konzepte:** [Rechner](docs/01-konzept-rechner.md) · [Directory](docs/02-konzept-directory.md) · [Übernahme aus Hofladen](docs/03-uebernahme-hofladen.md)

```sh
node scripts/build.mjs   # Seiten nach public/, Worker-Daten nach src/generated/
npm test                 # bauen und testen
```

## Lizenzen der Daten

- Overture Maps Places: CDLA-Permissive-2.0 / Apache-2.0 · Foursquare Open Source Places: Apache-2.0
- ZIP-Daten: [GeoNames](https://www.geonames.org/), CC BY 4.0
- Schriften: Atkinson Hyperlegible Next und Zilla Slab (SIL Open Font License, siehe `static/fonts/`)
- Leaflet und Protomaps-Leaflet: Lizenzen in `static/vendor/`
