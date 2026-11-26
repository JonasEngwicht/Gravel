// Liste für die „Check your listing“-Mail (AP8): die 200 wichtigsten unabhängigen Yards mit Website.
// Die Daten enthalten keine E-Mail-Adressen – Spalte „email“ von Hand oder per Abruf der Kontaktseite füllen.
// Jonas verschickt die Mails selbst. Aufruf: npm run kontakte → review/check-your-listing.csv
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ladeYards, verzeichnisSeiten, zaehlen } from './verzeichnis.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const yards = ladeYards(join(ROOT, 'data/yards'));
const h = { kopf: () => '', fuss: () => '', esc: String, rechner: () => '', matById: {}, SITE: { baseUrl: 'https://gravelandmulch.com' } };
verzeichnisSeiten(yards, h);
const liste = yards
  .filter((y) => y.kind !== 'gravel-pit' && !y.chain && !y.mailbox && y.contact?.website && y._stadt.index)
  .sort((a, b) => zaehlen(b._stadt.yards).yards - zaehlen(a._stadt.yards).yards || a._stadt.name.localeCompare(b._stadt.name) || a.name.localeCompare(b.name))
  .slice(0, 200);
const zelle = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
mkdirSync(join(ROOT, 'review'), { recursive: true });
writeFileSync(join(ROOT, 'review/check-your-listing.csv'), [['name', 'stadt', 'staat', 'website', 'telefon', 'eintrag', 'email'],
  ...liste.map((y) => [y.name, y.address.city, y.address.state, y.contact.website, y.contact.phone || '', `https://gravelandmulch.com${y._pfad}`, ''])]
  .map((z) => z.map(zelle).join(',')).join('\n') + '\n');
console.log(`review/check-your-listing.csv: ${liste.length} Yards`);
