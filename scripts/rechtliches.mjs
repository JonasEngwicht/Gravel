// Rechtliche Seiten: Imprint (§ 5 DDG) und Privacy Policy (DSGVO), beide auf Englisch.
// Betreiberdaten kommen aus site.config.json → operator. Beim Ändern der Website (neue Dienste, Analytics,
// Werbung, eingebettete Inhalte) die Privacy Policy anpassen und STAND aktualisieren.

export const STAND = 'November 22, 2026';

export function rechtlicheSeiten(SITE, esc) {
  const o = SITE.operator;
  const adresse = `${esc(o.name)}<br>${esc(o.street)}<br>${esc(o.zip)} ${esc(o.city)}<br>${esc(o.country)}`;
  const mail = `<a href="mailto:${esc(o.email)}">${esc(o.email)}</a>`;
  const domain = SITE.baseUrl ? SITE.baseUrl.replace(/^https?:\/\//, '') : 'this website';

  return [
    {
      pfad: '/imprint/',
      nav: 'Imprint',
      title: 'Imprint (Legal Notice)',
      description: `Legal notice for ${domain}.`,
      h1: 'Imprint',
      intro: 'Legal notice (Impressum) according to German law.',
      inhalt: `<h2>Information pursuant to § 5 DDG</h2>
<p>${adresse}</p>
<h2>Contact</h2>
<p>Email: ${mail}</p>
<h2>Responsible for content pursuant to § 18 (2) MStV</h2>
<p>${esc(o.name)}, address as above</p>
<h2>Supplier listings</h2>
<p>Listings in the supplier directory are compiled from public sources (Overture Maps Foundation, OpenStreetMap contributors, U.S. Mine Safety and Health Administration) and have mostly not been verified by us. Is your business listed with wrong details, or do you want it removed? Email us at ${mail} – we fix it promptly.</p>
<h2>Liability for content</h2>
<p>The calculators give estimates based on typical material weights and coverage. Actual quantities, weights and prices vary by supplier, material and moisture. Please confirm with your supplier before you order. We make every effort to keep the information on this site accurate and up to date, but cannot guarantee that it is complete or correct.</p>
<h2>Liability for links</h2>
<p>This site links to external websites (for example supplier websites and map services). We have no influence on their content; the respective provider is responsible for it. If we become aware of unlawful content on a linked page, we will remove the link.</p>
<h2>Consumer dispute resolution</h2>
<p>We are neither willing nor obliged to take part in dispute resolution proceedings before a consumer arbitration board.</p>`,
    },
    {
      pfad: '/privacy/',
      nav: 'Privacy',
      title: 'Privacy Policy',
      description: `How ${domain} handles personal data.`,
      h1: 'Privacy Policy',
      intro: `Last updated: ${STAND}`,
      inhalt: `<h2>In short</h2>
<ul>
  <li>No account, no newsletter, no ads, no analytics or tracking tools.</li>
  <li>No cookies or other data are stored on your device by this site.</li>
  <li>Calculations and the “near you” search run in your browser. Your measurements and your location are not sent to us.</li>
  <li>Like every website, our hosting provider processes technical access data (such as your IP address) to deliver the pages.</li>
</ul>

<h2>1. Who is responsible</h2>
<p>The controller under the EU General Data Protection Regulation (GDPR) is:</p>
<p>${adresse}<br>Email: ${mail}</p>

<h2>2. Hosting and server logs</h2>
<p>This website is hosted by Cloudflare, Inc., 101 Townsend St., San Francisco, CA 94107, USA (“Cloudflare”). When you visit a page, your browser automatically sends technical data that Cloudflare processes on our behalf: your IP address, date and time of the request, the requested address, the referring page, the HTTP status, and your browser and operating system (user agent).</p>
<p>We need this data to deliver the website, keep it secure (for example against attacks and abuse) and find errors. Legal basis: Art. 6 (1) (f) GDPR – our legitimate interest in a secure, working website. Our own request and error logs are deleted automatically after a few days; Cloudflare keeps security-related data only for a limited period.</p>
<p>We have a data processing agreement with Cloudflare (Art. 28 GDPR). Data may be processed in the USA. Cloudflare is certified under the EU-U.S. Data Privacy Framework, for which the European Commission has adopted an adequacy decision (Art. 45 GDPR). Cloudflare may set a strictly necessary security cookie to tell people and bots apart; this does not require consent (§ 25 (2) no. 2 TDDDG). More information: <a href="https://www.cloudflare.com/privacypolicy/" rel="noopener" target="_blank">Cloudflare privacy policy</a>.</p>

<h2>3. Calculators</h2>
<p>All calculations run locally in your browser. The measurements, materials and prices you enter are not sent to us and are not stored – when you close or reload the page, they are gone. If you use “Copy link to this result”, the values are put into the link; they only leave your device if you share that link yourself.</p>

<h2>4. Supplier search and “Use my location”</h2>
<p>When you search the supplier directory by ZIP code or city, the search runs in your browser. To do so, your browser loads data files from our server. For a ZIP search, the file is named after the first three digits of the ZIP code, so these three digits can appear in the server logs described in section 2.</p>
<p>If you tap “Use my location”, your browser asks for your permission first. Your coordinates are only used inside your browser to sort suppliers by distance; they are never sent to us or stored. You can revoke the permission at any time in your browser settings.</p>

<h2>5. Links to other services</h2>
<p>We do not embed maps, videos, fonts or other third-party content. Supplier pages contain plain links – for example “Get directions” (Google Maps), the supplier’s website and phone links. Only when you click such a link does your browser connect to that service, and its own privacy policy applies.</p>

<h2>6. Supplier directory listings</h2>
<p>The directory shows publicly available business information about landscape supply yards and similar suppliers in the U.S.: business name, address, phone number, website, location on the map and, where available, data from public mine records. Sources: Overture Maps Foundation (including data from OpenStreetMap contributors) and the U.S. Mine Safety and Health Administration (MSHA). Where a business is run by a sole proprietor, these details can be personal data.</p>
<p>Purpose: helping people find suppliers for mulch, gravel, stone and soil near them. Legal basis: Art. 6 (1) (f) GDPR – the legitimate interest of the public and of the listed businesses in being found, and our interest in operating the directory. The data is kept as long as the business is listed.</p>
<p>If you are listed, you can ask us at any time to correct or remove your listing, or object to it (Art. 21 GDPR) – just email ${mail}. We handle requests promptly, at the latest within one month.</p>

<h2>7. Contacting us by email</h2>
<p>If you email us, we process your email address and your message to answer you (Art. 6 (1) (b) or (f) GDPR). Our email is provided by Google (Gmail; for users in the EU: Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Ireland), so your message is processed on Google’s servers. We delete emails once they are no longer needed, unless we must keep them for legal reasons.</p>

<h2>8. Your rights</h2>
<p>Under the GDPR you have the right to access (Art. 15), rectification (Art. 16), erasure (Art. 17), restriction of processing (Art. 18), data portability (Art. 20) and to object to processing based on legitimate interests (Art. 21). To exercise these rights, email ${mail}.</p>
<p>You also have the right to lodge a complaint with a data protection supervisory authority. The authority responsible for us is: Die Landesbeauftragte für den Datenschutz und für das Recht auf Akteneinsicht Brandenburg, Stahnsdorfer Damm 77, 14532 Kleinmachnow, Germany.</p>

<h2>9. Visitors from the United States</h2>
<p>We do not sell or share personal information, and we do not use it for targeted advertising. Because we do not track visitors, browser signals such as “Do Not Track” or Global Privacy Control do not change how this site works. This site is not directed at children under 13, and we do not knowingly collect their personal information.</p>

<h2>10. Changes</h2>
<p>We update this policy when the website or the law changes. The current version is always available on this page.</p>`,
    },
  ];
}
