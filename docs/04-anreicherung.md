# Anreicherung: Materialien, Lieferung, Öffnungszeiten (AP5)

Ziel: Daten zeigen, die Yelp, MapQuest und das Local Pack nicht haben – was ein Yard als Schüttgut verkauft und ob er liefert.

## Ablauf

1. `node scripts/anreichern.mjs pilot` → `review/anreicherung-pilot.csv`: Yards mit Website in den 5 Pilot-Metros (Houston, Dallas, Phoenix, Austin, San Antonio, je 30 Meilen Umkreis). Stand 26.11.2026: 190 Yards.
2. Websites abrufen – Firecrawl o. Ä.: Startseite + Products/Materials + Delivery + Contact, **max. 5 Seiten je Yard, robots.txt beachten**. Je Yard eine Datei `data/anreicherung/roh/<id>.json`:
   ```json
   { "pages": [{ "url": "https://…", "markdown": "…", "fetched_at": "2026-11-26T10:00:00Z" }] }
   ```
   Der Ordner `roh/` enthält Texte der Yards und wird nicht veröffentlicht (nur die extrahierten Fakten).
3. `node scripts/anreichern.mjs extrahieren` → `data/anreicherung.json`
4. `node scripts/anreichern.mjs stand` → Abdeckung je Metro (Pilot fertig bei ≥ 60 % mit Materialfeld)
5. `npm run build && npm run lastmod`, committen.

## Felder (`data/anreicherung.json` → `yards.<id>`)

| Feld | Inhalt |
|---|---|
| `sortiment` | mulch, gravel, crushed-stone, river-rock, pea-gravel, topsoil, fill-dirt, sand, compost, decorative-rock, flagstone-boulders |
| `bulk`, `bagged` | true, wenn die Website lose Ware bzw. Säcke nennt |
| `delivery` | true / false (nur bei ausdrücklicher Aussage), sonst fehlt das Feld |
| `pickup` | true bei „self-load“, „we'll load your truck“ … |
| `sells_to_public` | true („homeowners welcome“) / false („contractors only“) |
| `hours` | `{ mon: "07:00-17:00", …, sun: "closed" }`, erst ab zwei erkannten Tagen |
| `price_examples` | `[{ material, amount, unit }]` – nur Zahlen mit Einheit und Material im selben Satzteil |
| `quellen.<feld>` | `{ url, checked_at }` – Seite und Abrufdatum |

Regeln (`scripts/anreicherung.mjs`): nur übernehmen, was auf der Website steht; nichts raten; keine Texte kopieren.

## Wirkung im Build

- **Firmenseite:** Materialien, „Sold in bulk/in bags“, Lieferung, „Sells to the public“, Preisbeispiele mit Quelle und Monat, „About“ aus den Fakten, Schema `hasOfferCatalog`, `makesOffer`, `openingHoursSpecification`. Wird damit indexierbar (Regel aus AP3).
- **Stadtseite:** Material-Chips und „Delivers“ je Eintrag, Filter Mulch · Gravel · Topsoil · Delivery (ab 2 Yards mit Daten), Kurztext „Of the 7 yards … 5 sell mulch, 3 deliver“, FAQ aus Daten.
- **Material-Seiten** `/landscape-supply/<st>/<stadt>/{mulch,gravel,topsoil}/`: nur ab 3 Yards, die das Material bestätigt führen. Eigene Sitemap `sitemap-materials.xml`.
- **Karte** auf Stadtseiten: Leaflet + OSM-Kacheln, erst nach Klick (Privacy Policy Abschnitt 6).
