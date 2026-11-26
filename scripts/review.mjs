// Prüfliste für Jonas: review/verdachtsfaelle.csv (Name, Stadt, Grund, Aktion, URL).
// Aufruf: npm run review. Die Regeln stehen in scripts/qualitaet.mjs.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ladeYards } from './verzeichnis.mjs';
import { bereinigen } from './qualitaet.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const { liste } = bereinigen(ladeYards(join(ROOT, 'data/yards'), { roh: true }));
const zelle = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
const zeilen = [['id', 'name', 'stadt', 'staat', 'grund', 'aktion', 'url'], ...liste
  .sort((a, b) => a.aktion.localeCompare(b.aktion) || a.staat.localeCompare(b.staat) || a.stadt.localeCompare(b.stadt) || a.id.localeCompare(b.id))
  .map((z) => [z.id, z.name, z.stadt, z.staat, z.grund, z.aktion, z.url])];
mkdirSync(join(ROOT, 'review'), { recursive: true });
writeFileSync(join(ROOT, 'review/verdachtsfaelle.csv'), zeilen.map((z) => z.map(zelle).join(',')).join('\n') + '\n');
const n = (a) => liste.filter((z) => z.aktion === a).length;
console.log(`review/verdachtsfaelle.csv: ${liste.length} Zeilen (${n('ausgeschlossen')} ausgeschlossen, ${n('ausgeblendet')} Dubletten ausgeblendet, ${n('geprüft werden')} zu prüfen, ${n('nachrangig, zählt nicht als Yard')} Postfach)`);
