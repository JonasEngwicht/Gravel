// Rechtliche Seiten: Imprint (§ 5 DDG) und Privacy Policy (DSGVO), beide auf Englisch.
// Betreiberdaten kommen aus site.config.json → operator. Beim Ändern der Website (neue Dienste, Analytics,
// Werbung, eingebettete Inhalte) die Privacy Policy anpassen und STAND aktualisieren.

export const STAND = 'November 23, 2026';

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
  <li>No account, no newsletter, no ads.</li>
  <li>We use Google Tag Manager to measure how the site is used. Visitors from the EU, the EEA, the UK and Switzerland are only measured if they accept; everyone else can switch it off under “Cookie settings” at the bottom of every page (see section 3).</li>
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

<h2 id="google">3. Google Tag Manager and Google Analytics</h2>
<p>We use Google Tag Manager (container ${esc(SITE.googleTag || 'GTM-5QT7N2LM')}) to load Google measurement tools such as Google Analytics. They tell us which pages are visited, how visitors arrive (for example from a search engine) and roughly where they come from, so we can improve the calculators and the directory. Provider: Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Ireland, and Google LLC, 1600 Amphitheatre Parkway, Mountain View, CA 94043, USA.</p>
<p>When the tools are active, your browser connects to Google’s servers. Google processes your IP address (shortened in Google Analytics), information about your device and browser, the pages you visit, the referring page and interactions such as clicks, and sets cookies (for Google Analytics, for example “_ga”, usually stored for up to 2 years). Data may be processed in the USA; Google LLC is certified under the EU-U.S. Data Privacy Framework (Art. 45 GDPR).</p>
<p><strong>Visitors from the EU, the EEA, the United Kingdom and Switzerland:</strong> nothing is loaded from Google until you click “Accept” in the banner. Legal basis is your consent (Art. 6 (1) (a) GDPR, § 25 (1) TDDDG). You can withdraw it at any time with effect for the future via “Cookie settings” at the bottom of every page.</p>
<p><strong>All other visitors:</strong> the tools load when you open the site, based on our legitimate interest in measuring and improving our website (Art. 6 (1) (f) GDPR). You can object at any time: choose “Decline” under “Cookie settings”, or use a browser that sends Global Privacy Control – then nothing is loaded from Google.</p>
<p>To remember your choice, we store “einwilligung” with the value “ja” (yes) or “nein” (no) in your browser’s local storage. This is necessary to respect your decision (§ 25 (2) no. 2 TDDDG). More information: <a href="https://policies.google.com/privacy" rel="noopener" target="_blank">Google privacy policy</a>.</p>

<h2>4. Calculators</h2>
<p>All calculations run locally in your browser. The measurements, materials and prices you enter are not sent to us, not passed to Google and not stored – when you close or reload the page, they are gone. If you use “Copy link to this result”, the values are put into the link; they only leave your device if you share that link yourself.</p>

<h2>5. Supplier search and “Use my location”</h2>
<p>When you search the supplier directory by ZIP code or city, the search runs in your browser. To do so, your browser loads data files from our server. For a ZIP search, the file is named after the first three digits of the ZIP code, so these three digits can appear in the server logs described in section 2.</p>
<p>If you tap “Use my location”, your browser asks for your permission first. Your coordinates are only used inside your browser to sort suppliers by distance; they are never sent to us or stored. You can revoke the permission at any time in your browser settings.</p>

<h2>6. Links to other services</h2>
<p>Apart from Google Tag Manager (section 3), we do not embed maps, videos, fonts or other third-party content. Supplier pages contain plain links – for example “Get directions” (Google Maps), the supplier’s website and phone links. Only when you click such a link does your browser connect to that service, and its own privacy policy applies.</p>

<h2>7. Supplier directory listings</h2>
<p>The directory shows publicly available business information about landscape supply yards and similar suppliers in the U.S.: business name, address, phone number, website, location on the map and, where available, data from public mine records. Sources: Overture Maps Foundation (including data from OpenStreetMap contributors) and the U.S. Mine Safety and Health Administration (MSHA). Where a business is run by a sole proprietor, these details can be personal data.</p>
<p>Purpose: helping people find suppliers for mulch, gravel, stone and soil near them. Legal basis: Art. 6 (1) (f) GDPR – the legitimate interest of the public and of the listed businesses in being found, and our interest in operating the directory. The data is kept as long as the business is listed.</p>
<p>If you are listed, you can ask us at any time to correct or remove your listing, or object to it (Art. 21 GDPR) – just email ${mail}. We handle requests promptly, at the latest within one month.</p>

<h2>8. Contacting us by email</h2>
<p>If you email us, we process your email address and your message to answer you (Art. 6 (1) (b) or (f) GDPR). Our email is provided by Google (Gmail; for users in the EU: Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Ireland), so your message is processed on Google’s servers. We delete emails once they are no longer needed, unless we must keep them for legal reasons.</p>

<h2>9. Your rights</h2>
<p>Under the GDPR you have the right to access (Art. 15), rectification (Art. 16), erasure (Art. 17), restriction of processing (Art. 18), data portability (Art. 20) and to object to processing based on legitimate interests (Art. 21). To exercise these rights, email ${mail}.</p>
<p>You also have the right to lodge a complaint with a data protection supervisory authority. The authority responsible for us is: Die Landesbeauftragte für den Datenschutz und für das Recht auf Akteneinsicht Brandenburg, Stahnsdorfer Damm 77, 14532 Kleinmachnow, Germany.</p>

<h2>10. Visitors from the United States</h2>
<p>We do not sell personal information for money. We use Google’s measurement tools as described in section 3; you can opt out at any time under “Cookie settings”, and we treat a Global Privacy Control signal from your browser as an opt-out. This site is not directed at children under 13, and we do not knowingly collect their personal information.</p>

<h2>11. Changes</h2>
<p>We update this policy when the website or the law changes. The current version is always available on this page.</p>`,
    },
  ];
}
