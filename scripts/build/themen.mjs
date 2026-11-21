// Build, Teil „themen“: Info-, Rechts- und Fehlerseiten.
// Impressum: Betreiber sitzt in Deutschland, deshalb wie bei Hofladen eine Anbieterkennzeichnung.
import { seite, schreibe, esc, MARKE } from './html.mjs';
import { cfg } from './daten.mjs';

const imp = cfg.impressum;
const email = imp.email || cfg.kontaktEmail;
if (!email) console.warn('Hinweis: site.config.json → kontaktEmail/impressum.email fehlt (vor dem Launch eintragen).');
const mail = email ? `<a href="mailto:${esc(email)}">${esc(email)}</a>` : '<em>(contact email to be added)</em>';

schreibe('/about/', seite({ titel: `About ${MARKE} and Our Sources`, pfad: '/about/',
  beschreibung: `How ${MARKE} calculates amounts, where the yard listings come from and how yards can update their information.`,
  inhalt: `<h1>About ${esc(MARKE)}</h1>
<p class="einleitung">Free calculators for mulch, gravel, soil and stone, and a directory of landscape supply yards in the United States.</p>
<section class="abschnitt"><h2>How we calculate</h2>
<p>Volumes follow the standard formula (area × depth, 27 cubic feet per cubic yard). Weights are typical values per material; actual weights vary with moisture and stone size. Always confirm the final amount with your supplier.</p></section>
<section class="abschnitt"><h2>Where the listings come from</h2>
<ul>
<li>Our own research on the yards’ own websites</li>
<li>Information submitted by the yards</li>
<li><a href="https://overturemaps.org/" rel="noopener">Overture Maps Foundation</a> (CDLA-Permissive-2.0 / Apache-2.0)</li>
<li><a href="https://opensource.foursquare.com/os-places/" rel="noopener">Foursquare Open Source Places</a> (Apache-2.0)</li>
<li>© <a href="https://www.openstreetmap.org/copyright" rel="noopener">OpenStreetMap contributors</a> (ODbL)</li>
<li>ZIP code locations: <a href="https://www.geonames.org/" rel="noopener">GeoNames</a> (CC BY 4.0)</li>
</ul>
<p>We do not copy data, texts or photos from other directories or review sites.</p></section>
<section class="abschnitt"><h2>Contact</h2><p>${mail}</p></section>`,
  krumen: [['About', '/about/']] }));

schreibe('/imprint/', seite({ titel: 'Imprint', pfad: '/imprint/', beschreibung: `Legal notice for ${MARKE}.`,
  inhalt: `<h1>Imprint</h1>
<p>${esc(imp.name)}<br>${esc(imp.strasse)}<br>${esc(imp.plzOrt)}<br>${esc(imp.land || '')}</p>
<p>Email: ${mail}${imp.telefon ? `<br>Phone: ${esc(imp.telefon)}` : ''}</p>`,
  noindex: true }));

schreibe('/privacy/', seite({ titel: 'Privacy Policy', pfad: '/privacy/', beschreibung: `Privacy policy of ${MARKE}.`,
  inhalt: `<h1>Privacy Policy</h1>
<p>This site does not use cookies or third-party tracking. Fonts and scripts are served from our own server.</p>
<p>The site is hosted on Cloudflare. To deliver pages and protect the service, Cloudflare processes technical data such as your IP address.</p>
<p>When you search for yards by ZIP code, the ZIP code is only used to return results and is not stored with any personal data. The calculator runs entirely in your browser; your inputs may be remembered in your browser’s local storage.</p>
<p>Contact: ${mail}</p>`,
  noindex: true }));

schreibe('/404.html', seite({ titel: 'Page Not Found', pfad: '/404.html', beschreibung: 'This page does not exist.', noindex: true,
  inhalt: `<h1>Page not found</h1><p>Try the <a href="/">calculators</a> or <a href="/landscape-supply/">find a yard</a>.</p>` }));
