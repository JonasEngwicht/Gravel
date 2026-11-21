# Konzept: Rechner

Stand 21.11.2026 · Zielmarkt USA (Website-Texte auf Englisch, imperiale Einheiten mit Metrik-Umschalter)

## 1. Ziel

Nutzer:innen wissen nach 30 Sekunden, **wie viel** Material sie bestellen müssen (Kubikyards, Tonnen oder Säcke), **was es ungefähr kostet** und **wo sie es in der Nähe bekommen**. Der letzte Schritt ist die Brücke ins Verzeichnis (siehe `02-konzept-directory.md`).

## 2. Seiten und Keywords

Jede Seite nutzt denselben Rechner-Kern (`src/calc/core.js`), nur mit anderem Standardmaterial, Text und FAQ.

| URL | Haupt-Keyword (Suchen/Monat USA) | Standardmaterial |
|---|---|---|
| `/` | Startseite, alle Materialien | Auswahl |
| `/mulch-calculator/` | mulch calculator (60.500) | hardwood-mulch, 3 in |
| `/gravel-calculator/` | gravel calculator (60.500) | pea-gravel, 3 in |
| `/topsoil-calculator/` | topsoil calculator (18.100) | topsoil, 4 in |
| `/river-rock-calculator/` | river rock calculator (5.400) | river-rock, 3 in |
| `/driveway-gravel-calculator/` | driveway gravel calculator (4.400) | crushed-stone-57 + crusher-run, zweilagig |
| `/cubic-yard-calculator/` | cubic yard calculator (33.100) | neutral, nur Volumen |
| `/compost-calculator/` | später | compost |

Reihenfolge für den Start: Mulch → Topsoil → Gravel (beim Kies dominieren große Rechner-Portale, siehe Recherche).

## 3. Eingaben

1. **Projekt** (optional, setzt Material und Tiefe vor): Flower bed, Tree ring, Garden path, Driveway, New lawn, Top dressing, Raised bed → `data/materials.json` → `projects`.
2. **Material**: Dropdown, gruppiert nach Kategorie.
3. **Fläche**, wählbar als:
   - Rechteck (Länge × Breite)
   - Kreis (Durchmesser)
   - Dreieck (Grundseite × Höhe)
   - Ring um Baum (Außen- und Innendurchmesser)
   - Fläche direkt in sq ft
   - **Mehrere Abschnitte** (+ Abschnitt hinzufügen) für unregelmäßige Beete, die Flächen werden addiert.
4. **Tiefe** in Zoll. Vorbelegt mit der empfohlenen Tiefe des Materials, Hinweis auf den sinnvollen Bereich (`depth_range_in`).
5. **Puffer** in Prozent (vorbelegt über `waste_pct`, 10–15 %), aufklappbar unter „Advanced“.
6. **Preise** (optional): pro Kubikyard, pro Tonne, pro Sack, Liefergebühr. Auf Stadt-Seiten mit dem Median-Preis aus dem Verzeichnis vorbelegt.
7. **Sackgröße** (bei Sackware): 1,5 / 2 / 3 cu ft bei Mulch, 0,75 / 1 cu ft bei Erde.
8. **Einheiten-Umschalter**: ft/in ↔ m/cm.

Ergebnis aktualisiert sich live bei jeder Eingabe (kein „Berechnen“-Knopf nötig, aber für Barrierefreiheit trotzdem ein Submit vorhanden).

## 4. Rechenweg

```
Fläche (sq ft)    = Summe aller Abschnitte
Volumen (cu ft)   = Fläche × Tiefe(in) / 12 × (1 + Puffer)
Kubikyards        = cu ft / 27              (Faustregel Mulch: sq ft × Tiefe / 324)
Tonnen            = Kubikyards × Dichte (t/cy), Spanne über density_range
Säcke             = aufrunden(cu ft / Sackgröße)
Bestellmenge      = auf 0,5 cy bzw. 0,5 t aufrunden (übliche Verkaufsschritte)
Kosten Schüttgut  = Bestellmenge × Preis + Liefergebühr
Kosten Säcke      = Säcke × Sackpreis
Pick-up-Fahrten   = aufrunden(max(Gewicht / Nutzlast, Volumen / Ladefläche))
```

Referenz-Implementierung: `src/calc/core.js`, getestet in `test/calc.test.js` (u. a. Faustregel /324, Beispiel 10×10 ft bei 2 in ≈ 0,62 cy).

**Wichtig:** Die Dichten und Tiefen in `data/materials.json` sind typische Richtwerte. Vor dem Launch gegen Datenblätter von 3–5 Lieferanten prüfen und die Quelle im Datensatz vermerken.

## 5. Ergebnisanzeige

Reihenfolge nach Nutzen:

1. **Große Zahl:** „You need **3.5 cubic yards** (≈ 1 ton)“, bei Kies Tonnen zuerst, weil Kies meist nach Gewicht verkauft wird.
2. **Bulk vs. Bags:** „or **41 bags** (2 cu ft)“ plus Kostenvergleich, wenn Preise da sind. Ab ca. 2–3 cy ist Schüttgut fast immer günstiger; diesen Hinweis ausspielen.
3. **Transport:** „≈ 6 trips with a half-ton pickup“, sonst Lieferung empfehlen.
4. **CTA ins Verzeichnis:** ZIP-Feld „Find yards that deliver [material] near you“ → siehe Directory-Konzept.
5. **Teilen / Merken:** Ergebnis als URL mit Parametern (`?m=hardwood-mulch&sqft=324&d=3`), damit man es dem Lieferanten oder Partner schicken kann.

## 6. Inhalt unter dem Rechner (für SEO)

- Kurze Anleitung „How to measure your bed“ mit einer Skizze je Form.
- Tabelle „How much area does 1 cubic yard cover?“ (1, 2, 3, 4 in Tiefe) aus `coverage()`.
- Empfohlene Tiefen je Projekt.
- Gewichtstabelle je Material (Tonnen pro Kubikyard).
- 4–6 FAQ aus „People also ask“ (z. B. „Is it cheaper to buy bagged or bulk mulch?“, „How much does a truckload of mulch cost?“).
- Links zu den anderen Rechnern und zu den Top-Städten im Verzeichnis.

## 7. Technik

- **Statische Seiten**, Rechner als kleines Vanilla-JS-Modul (keine Framework-Pflicht), lädt `materials.json` beim Build mit ein. Ziel: < 50 KB JS, Lighthouse 95+.
- Funktioniert ohne Cookies und ohne Login.
- Strukturierte Daten: `WebApplication` (applicationCategory „UtilitiesApplication“) und `BreadcrumbList`. Keine erfundenen Bewertungen.
- Eingaben werden lokal gemerkt (localStorage, in try/catch), damit Rückkehrer ihre Werte wiederfinden.
- Tracking (datenschutzfreundlich, z. B. Plausible oder Cloudflare Web Analytics): Rechner benutzt, Material, ZIP-Suche ausgelöst, Klick auf Yard, Angebotsanfrage.

## 8. Offene Entscheidungen

- [ ] Framework für die statischen Seiten (Vorschlag: Astro, weil Stadt-Seiten aus JSON generiert werden).
- [ ] Hosting (Vorschlag: Cloudflare Pages).
- [ ] Domain final (Favorit aus der Recherche: gravelandmulch.com).
- [ ] Dichten mit Lieferantendaten verifizieren.
