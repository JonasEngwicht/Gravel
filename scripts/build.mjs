// Baut die statische Website nach public/ und die Daten für den Worker nach src/generated/.
// Läuft automatisch vor jedem "wrangler deploy" (siehe wrangler.jsonc → build.command).
// Aufbau wie im Hofladen-Repo (scripts/build/, in dieser Reihenfolge):
//   daten      Daten laden, zusammenführen, ableiten (Yards, Städte, Bundesstaaten, ZIPs)
//   html       HTML-Helfer und Seitenrahmen (seite())
//   rechner    Startseite und Rechnerseiten
//   directory  Übersicht, Bundesstaaten, Städte, Yard-Seiten
//   themen     Info-, Rechts- und Fehlerseiten
//   abschluss  robots.txt, Sitemap, Seitenarchiv (301/410) und Daten für den Worker
import './build/daten.mjs';
import './build/html.mjs';
import './build/rechner.mjs';
import './build/directory.mjs';
import './build/themen.mjs';
import './build/abschluss.mjs';
