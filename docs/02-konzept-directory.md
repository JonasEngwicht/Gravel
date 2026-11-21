# Konzept: Directory-Integration (Landscape Supply Yards)

Stand 21.11.2026 · Datenformat: `data/schema/yard.schema.json` · Beispiel: `data/yards/_example.json` (fiktiv)

## 1. Grundidee

Rechner und Verzeichnis bedienen dieselbe Person im selben Moment: Erst wird die Menge berechnet, direkt danach die Frage „Wo kaufe ich das?“. Die Integration hat drei Richtungen:

```
Rechner ──► ZIP-Suche ──► passende Yards (Material + Lieferung + Entfernung)
   ▲                                │
   │                                ▼
Stadt-Seite ◄── lokale Preise ── Yard-Eintrag ──► Angebotsanfrage (Lead)
```

1. **Rechner → Verzeichnis:** Unter jedem Ergebnis ein ZIP-Feld. Treffer zeigen geschätzte Gesamtkosten mit dem Preis des jeweiligen Yards.
2. **Verzeichnis → Rechner:** Jede Stadt-Seite hat den Rechner eingebettet, vorbelegt mit den Median-Preisen der Stadt.
3. **Yard → Lead:** Bei Yards mit `accepts_quotes` kann man die berechnete Menge direkt als Anfrage schicken.

## 2. Seitenstruktur und URLs

| URL | Inhalt | Ziel-Suchen |
|---|---|---|
| `/landscape-supply/` | Übersicht aller Bundesstaaten, Karte | landscape supply, landscape supply near me |
| `/landscape-supply/co/` | Städte in Colorado mit Anzahl Yards | landscape supply colorado |
| `/landscape-supply/co/denver/` | **Stadt-Seite**: alle Yards, Filter, Rechner, lokale Preise | landscape supply denver, bulk mulch denver, gravel denver, mulch delivery denver |
| `/yard/example-landscape-supply-denver-co/` | Detailseite eines Yards (stabile URL wie `/hof/<name>-<ort>/` bei Hofladen) | Name des Yards (Marken-Suchen) |
| `/mulch/co/denver/` (Phase 2) | Material × Stadt | bulk mulch denver, mulch delivery denver |
| `/add-your-yard/` | Eintragen / Eintrag übernehmen | – |

Stadt-Seiten sind das wichtigste SEO-Asset: Die Live-SERP für „landscape supply yards denver“ zeigte nur Yelp (falsche Kategorie), Apple Maps, Facebook und Instagram.

## 3. Stadt-Seite im Detail

1. H1 „Landscape Supply Yards in Denver, CO“ + Satz mit Anzahl und Stand („12 yards, checked November 2026“).
2. **Filter:** Material, Lieferung ja/nein, Selbstabholung, für Privatkunden.
3. **Liste/Karte** der Yards: Name, Entfernung zum Zentrum, Materialien als Chips, Lieferradius, Preis ab, Öffnungszeiten heute.
4. **Lokale Preistabelle:** Median pro Material (`medianPrice()`), nur wenn ≥ 3 Preise vorliegen, sonst ausblenden.
5. **Eingebetteter Rechner** mit diesen Preisen als Vorbelegung.
6. Kurzer lokaler Text (Bodenart, typische Projekte, Saison). Kein Füllmaterial; lieber knapp und korrekt.
7. Nachbarstädte verlinken.

Karte: OpenStreetMap-Kacheln (z. B. über MapLibre). Google Maps nur, wenn die Nutzungsbedingungen geprüft sind.

## 4. ZIP-Suche

- Wie bei Hofladen über den Worker: `/api/umkreis?zip=80202&material=hardwood-mulch&delivery=1` und Landingpages `/zip/<zip>/`.
- ZIP-Daten von **GeoNames** (US-Postleitzahlen, CC BY 4.0, gleiche Quelle wie Hofladen), im Build nach `src/generated/` geschrieben.
- Die Filter- und Sortierlogik `findYards()` in `static/umkreis.js` nutzt der Worker direkt.
- Sortierung: Featured zuerst, dann Entfernung. Featured-Einträge klar als „Featured“ kennzeichnen.
- Bei „Delivery needed“ nur Yards, deren `delivery.radius_mi` den Abstand abdeckt.
- Keine Treffer → Hinweis auf Nachbarstadt + „Know a yard? Add it“.

## 5. Angebotsanfrage (Lead-Flow)

Formular, automatisch befüllt aus dem Rechner: Material, Menge (cy/t), ZIP, Lieferung ja/nein, Wunschtermin, Name, Telefon/E-Mail.

- Versand über den Worker an die E-Mail des Yards, Kopie an uns. Baut auf `nachrichtAnnehmen()`, Turnstile und Resend aus `src/betrieb.js` von Hofladen auf.
- Nur an Yards mit `listing.accepts_quotes = true` (also Yards, die zugestimmt haben).
- Spam-Schutz (Turnstile o. ä.), Datenschutzhinweis, Einwilligung zur Weitergabe.
- Später: Anfrage an bis zu 3 Yards gleichzeitig („Get 3 quotes“).

## 6. Datenbeschaffung

**Kandidaten aus offenen Quellen** (Pipeline aus Hofladen, siehe `03-uebernahme-hofladen.md`)
- Overture Maps Places (CDLA-Permissive-2.0 / Apache-2.0) und Foursquare Open Source Places (Apache-2.0) mit eigenen Namens- und Kategorieregeln, Dublettenprüfung und Bestätigung über die Website des Yards.
- OpenStreetMap (ODbL, Quelle nennen), in den USA vermutlich mit schwächerer Abdeckung.

**Weitere erlaubte Quellen**
- Eigene Recherche auf den Websites der Yards (Name, Adresse, Materialien, veröffentlichte Preise).
- Öffentliche Listen (z. B. Lieferantenlisten von Behörden oder Wasserversorgern).
- Selbsteintrag und Übernahme durch die Yards (`/add-your-yard/`).

**Nicht verwenden:** Google-Maps-/Places-Daten kopieren und speichern (Lizenz verbietet das), Yelp/Angi/BBB-Inhalte übernehmen, Bewertungen anderer Plattformen anzeigen.

Jeder Eintrag bekommt `source.type`, `source.url` und `source.checked`. Preise haben ein eigenes `updated`-Datum; Preise älter als 12 Monate werden ausgeblendet.

**Startumfang:** 15 Metros im Mulch-Gürtel (Südosten, Mittlerer Westen, Texas, Colorado), je 10–25 Yards ≈ 250 Einträge. Danach nach Suchvolumen ausbauen.

## 7. Monetarisierung

| Stufe | Was | Wann |
|---|---|---|
| Free | Basiseintrag | ab Start |
| Featured | Oben in Stadt und ZIP-Suche, Logo, Foto, „Request quote“-Button | ab ca. 1.000 Besuchen/Monat pro Metro |
| Leads | Bezahlung pro weitergeleiteter Anfrage | wenn genug Anfragen da sind |
| Display-Ads | auf Rechnerseiten (nicht auf Stadt-Seiten, dort stören sie die Leads) | ab Start |

## 8. Strukturierte Daten

- Stadt-Seite: `ItemList` mit `HomeAndConstructionBusiness`-Einträgen (Name, Adresse, Telefon, URL, Öffnungszeiten).
- Detailseite: `HomeAndConstructionBusiness` mit `areaServed` (Lieferradius) und `makesOffer` für Materialien mit Preis.
- Keine `aggregateRating`, solange es keine eigenen, echten Bewertungen gibt.

## 9. Build-Pipeline

Nach dem Vorrang-Modell von Hofladen (schwach → stark):

```
1. offene Quellen (Overture, Foursquare, OSM)  ─┐
2. Ergänzungen nur für leere Felder              │
   (Website-Öffnungszeiten, Website-Preise)      ├─► Build (Node, ohne Abhängigkeiten)
3. eigene Pflege (data/pflege.json, data/yards/) │     ├─ Rechner-, Staats-, Stadt-, Yard-Seiten
4. Angaben der Yards (Betreiber-Bereich)       ─┘     ├─ src/generated/ für den Worker (Umkreis, ZIPs)
data/materials.json ─────────────────────────────────►└─ Preistabellen, Rechner-Vorbelegung
```

- Eigene Einträge als JSON nach `yard.schema.json`, Änderungen per Pull Request nachvollziehbar.
- CI prüft Schema, doppelte Slugs und abgelaufene Preise.
- Sitemap pro Bereich (Rechner / Directory).

## 10. Nächste Schritte

1. Gerüst aus dem Hofladen-Repo übernehmen und Domain festlegen (siehe `03-uebernahme-hofladen.md`).
2. Rechner-Seite Mulch als ersten Prototyp bauen.
3. Erste Metro (z. B. Denver oder Atlanta) mit 15–20 echten Einträgen erfassen.
4. Probelauf Overture/Foursquare für die erste Metro, Namensregeln schärfen.
5. Launch vor März 2027 (Saisonstart).
