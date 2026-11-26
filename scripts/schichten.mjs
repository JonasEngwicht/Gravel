// Erzeugt static/schichten.svg: den Bodenquerschnitt (Mulch, Mutterboden, Kies, Sand) am unteren Rand
// der dunklen Kopfflächen. Nahtlos horizontal kachelbar. Ausführen: node scripts/schichten.mjs
// (Ergebnis wird eingecheckt; der Build kopiert es wie alle Dateien aus static/.)
import { writeFileSync } from 'node:fs';

const B = 960; // Kachelbreite
const H = 96;  // Höhe
let saat = 7;
const zufall = () => ((saat = (saat * 16807) % 2147483647) / 2147483647);
const zw = (a, b) => a + zufall() * (b - a);
const wahl = (l) => l[Math.floor(zufall() * l.length)];
const f = (n) => Math.round(n * 10) / 10;

// Wellige Grenzen, periodisch über die Kachelbreite
const welle = (basis, a, b, phase) => (x) => basis + a * Math.sin((2 * Math.PI * x * 2) / B + phase) + b * Math.sin((2 * Math.PI * x * 5) / B + phase * 2);
const g0 = welle(8, 2.5, 1.5, 0.3);
const g1 = welle(27, 2.5, 1.8, 1.1);
const g2 = welle(52, 3, 1.5, 2.2);
const g3 = welle(76, 2, 1.5, 3.1);

const pfad = (oben, unten) => {
  const p = [];
  for (let x = 0; x <= B; x += 16) p.push(`${x},${f(oben(x))}`);
  for (let x = B; x >= 0; x -= 16) p.push(`${x},${f(unten(x))}`);
  return `M${p.join('L')}Z`;
};
const boden = () => H;

const formen = [];
// Jede Form auch um ±B verschoben, damit die Kachel an den Rändern nahtlos ist
const setze = (x, svg) => {
  formen.push(svg(x));
  if (x < 20) formen.push(svg(x + B));
  if (x > B - 20) formen.push(svg(x - B));
};

// Mulch: Holzstückchen
for (let i = 0; i < 170; i++) {
  const x = zw(0, B); const y = zw(g0(x) + 3, g1(x) - 2);
  const w = zw(5, 13), h = zw(1.6, 3.4), r = zw(-35, 35), c = wahl(['#7a5232', '#4a2f1a', '#8b6340', '#6b4423', '#9a7350']);
  setze(x, (xx) => `<rect x="${f(xx - w / 2)}" y="${f(y - h / 2)}" width="${f(w)}" height="${f(h)}" rx="1" fill="${c}" transform="rotate(${f(r)} ${f(xx)} ${f(y)})"/>`);
}
// Mutterboden: feine Krümel
for (let i = 0; i < 160; i++) {
  const x = zw(0, B); const y = zw(g1(x) + 2, g2(x) - 2);
  const r = zw(0.6, 1.6), c = wahl(['#2a1e14', '#54402e', '#463424']);
  setze(x, (xx) => `<circle cx="${f(xx)}" cy="${f(y)}" r="${f(r)}" fill="${c}"/>`);
}
// Kies: Kiesel
for (let i = 0; i < 150; i++) {
  const x = zw(0, B); const y = zw(g2(x) + 4, g3(x) - 3);
  const rx = zw(2.6, 6.5), ry = rx * zw(0.55, 0.85), r = zw(-25, 25), c = wahl(['#9c978d', '#b3ada2', '#6c675f', '#c4bfb5', '#8a857b', '#a39a8a']);
  setze(x, (xx) => `<ellipse cx="${f(xx)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="${c}" transform="rotate(${f(r)} ${f(xx)} ${f(y)})"/>`);
}
// Sand: Körner
for (let i = 0; i < 260; i++) {
  const x = zw(0, B); const y = zw(g3(x) + 2, H - 1);
  const r = zw(0.45, 1), c = wahl(['#e3d1aa', '#b59c6e', '#c9b285']);
  setze(x, (xx) => `<circle cx="${f(xx)}" cy="${f(y)}" r="${f(r)}" fill="${c}"/>`);
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${B} ${H}" width="${B}" height="${H}">
<path d="${pfad(g0, g1)}" fill="#5e3d22"/>
<path d="${pfad(g1, g2)}" fill="#4a3726"/>
<path d="${pfad(g2, g3)}" fill="#7d786f"/>
<path d="${pfad(g3, boden)}" fill="#cdb68a"/>
${formen.join('')}
</svg>
`;
writeFileSync(new URL('../static/schichten.svg', import.meta.url), svg);
console.log(`static/schichten.svg: ${(svg.length / 1024).toFixed(1)} KB`);
