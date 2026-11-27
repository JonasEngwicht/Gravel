// Formen und Eingabefelder der Flächen-Abschnitte. Gemeinsam für Browser (app.js) und Build (scripts/build.mjs):
// der Build schreibt den ersten Abschnitt schon ins HTML, damit das Formular ohne Nachladen vollständig dasteht.
export const ICON = {
  rectangle: '<rect x="3" y="4" width="18" height="12" rx="1.5"/>',
  circle: '<circle cx="12" cy="10" r="7.5"/>',
  triangle: '<path d="M12 2.5 21.5 17h-19Z"/>',
  ring: '<circle cx="12" cy="10" r="7.5"/><circle cx="12" cy="10" r="2.2" fill="currentColor"/>',
  area: '<rect x="3" y="3" width="18" height="14" rx="1.5" stroke-dasharray="3 2.5"/>',
};

export const FORMEN = {
  rectangle: { label: 'Rectangle', felder: [['length', 'Length'], ['width', 'Width']] },
  circle: { label: 'Circle', felder: [['diameter', 'Diameter']] },
  triangle: { label: 'Triangle', felder: [['base', 'Base'], ['height', 'Height']] },
  ring: { label: 'Tree ring', felder: [['outerDiameter', 'Outer diameter'], ['innerDiameter', 'Inner diameter']] },
  area: { label: 'Known area', felder: [['sqft', 'Area']] },
};
// Töpfe und Kübel (Maße in Zoll bzw. cm): nur Kreis und Rechteck, mit passenden Namen
export const FORMEN_TOPF = {
  circle: { label: 'Round pot', felder: [['diameter', 'Diameter']] },
  rectangle: { label: 'Planter box', felder: [['length', 'Length'], ['width', 'Width']] },
};

/** HTML eines Abschnitts. a = { shape, dims }, i = Index, mehrere = mehr als ein Abschnitt, lang/flaeche = Einheiten-Kürzel. */
export function abschnittHtml(a, i, { mehrere = false, lang = 'ft', flaeche = 'sq ft', formen = FORMEN, wort = 'Area' } = {}) {
  return `<legend class="${mehrere ? '' : 'sr'}">${mehrere ? `${wort} ${i + 1}` : wort}</legend>
        <div class="formen" role="radiogroup" aria-label="Shape">${Object.entries(formen).map(([k, v]) => `<label class="form-wahl"><input type="radio" class="form" name="form-${i}" data-i="${i}" value="${k}"${k === a.shape ? ' checked' : ''}><span><svg aria-hidden="true" viewBox="0 0 24 20" fill="none" stroke="currentColor" stroke-width="2">${ICON[k]}</svg>${v.label}</span></label>`).join('')}</div>
        <div class="masse">${formen[a.shape].felder.map(([k, l]) => `<label>${l} <span class="opt">(${k === 'sqft' ? flaeche : lang})</span>
          <input type="number" inputmode="decimal" min="0" step="any" enterkeyhint="next" placeholder="0" data-i="${i}" data-k="${k}" value="${a.dims[k] ?? ''}"></label>`).join('')}</div>
        ${mehrere ? `<button type="button" class="entfernen" data-weg="${i}" aria-label="Remove section ${i + 1}">Remove</button>` : ''}`;
}
