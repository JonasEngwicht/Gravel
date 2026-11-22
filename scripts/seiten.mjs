// Seiten außerhalb des Verzeichnisses: Rechner, Umrechner, Ratgeber, Übersichten.
// Reihenfolge = Reihenfolge in Menü, Übersicht und Fußzeile.
//
// Felder:
//   pfad, art ('rechner' | 'umrechner' | 'ratgeber' | 'info'), nav (kurzer Name), imMenue,
//   title (≤ 60 Zeichen), description, h1, intro (bei Ratgebern: die direkte Antwort), kurz (Kacheltext),
//   material (Standard aus data/materials.json), tiefe (Zoll, sonst default_depth_in), form, nurVolumen,
//   kategorien (für die Gewichtstabelle), beispiel ({ laenge, breite, tiefe } in ft/in, für das Rechenbeispiel),
//   bloecke (Tabellen aus build.mjs, Standard: ['deckung', 'gewicht']), inhalt (HTML), faq ([Frage, Antwort]),
//   verwandt (Pfade für „Related“), stand (JJJJ-MM, wann der Inhalt zuletzt geprüft wurde).

export const STAND = '2026-11';

const MESSEN = `<h2>How to measure your area</h2>
<ul>
  <li><strong>Rectangle or square:</strong> measure length and width in feet.</li>
  <li><strong>Circle:</strong> measure straight across the widest point (the diameter).</li>
  <li><strong>Triangle:</strong> measure the base and the height at a right angle to it.</li>
  <li><strong>Ring around a tree:</strong> measure the outer diameter of the bed and the trunk (or the area you keep clear).</li>
  <li><strong>Irregular bed:</strong> split it into simple shapes and add each one as a section.</li>
</ul>`;

const FORMEL = '<p>The math behind every calculator here: <strong>square feet × depth in inches ÷ 324 = cubic yards</strong>. Multiply cubic yards by the material’s weight per cubic yard to get tons.</p>';

export const SEITEN = [
  // ---------- Rechner ----------
  {
    pfad: '/',
    art: 'rechner',
    nav: 'All materials',
    imMenue: false,
    title: 'Mulch, Gravel & Topsoil Calculator – How Much Do I Need?',
    description: 'Free calculator for mulch, gravel, stone, topsoil and sand. Get cubic yards, tons, bags and cost for any bed, path or driveway in seconds.',
    h1: 'Mulch, Gravel & Soil Calculator',
    intro: 'Find out how many cubic yards, tons or bags you need – and what it will cost – for beds, paths, driveways and lawns.',
    kurz: 'Any material',
    material: 'hardwood-mulch',
    beispiel: { laenge: 20, breite: 10, tiefe: 3 },
    inhalt: `${MESSEN}
<h2>Recommended depths by project</h2>
<table><thead><tr><th>Project</th><th>Typical material</th><th>Depth</th></tr></thead><tbody>
<tr><td>Flower bed</td><td><a href="/mulch-calculator/">Mulch</a></td><td>2–3 in</td></tr>
<tr><td>Tree ring</td><td>Mulch</td><td>2–3 in, kept off the trunk</td></tr>
<tr><td>Garden path</td><td><a href="/pea-gravel-calculator/">Pea gravel</a></td><td>2–3 in</td></tr>
<tr><td>Gravel driveway</td><td><a href="/driveway-gravel-calculator/">Crusher run base + #57 stone</a></td><td>4–6 in base, 2–4 in top</td></tr>
<tr><td>Paver patio</td><td><a href="/paver-sand-calculator/">Bedding sand</a> over a gravel base</td><td>1 in sand</td></tr>
<tr><td>New lawn</td><td><a href="/topsoil-calculator/">Topsoil</a></td><td>4–6 in</td></tr>
<tr><td>Lawn top dressing</td><td>Compost</td><td>¼–½ in</td></tr>
<tr><td>Raised bed</td><td><a href="/raised-bed-soil-calculator/">Garden soil mix</a></td><td>Full bed height</td></tr>
<tr><td>Sandbox</td><td><a href="/sand-calculator/">Play sand</a></td><td>6–12 in</td></tr>
<tr><td>Playground</td><td><a href="/rubber-mulch-calculator/">Rubber mulch</a></td><td>About 6 in</td></tr>
</tbody></table>
${FORMEL}`,
    faq: [
      ['How do I calculate cubic yards?', 'Multiply the area in square feet by the depth in inches, divide by 12 to get cubic feet, then divide by 27. For example, 324 sq ft at 3 inches is 81 cubic feet, or 3 cubic yards.'],
      ['Is it cheaper to buy in bulk or in bags?', 'For small jobs under about 1 cubic yard, bags are often simpler. From roughly 2–3 cubic yards upward, bulk material from a landscape supply yard is usually much cheaper, even with a delivery fee.'],
      ['Why add extra material?', 'Material settles and compacts, edges are rarely perfect, and some is lost while spreading. Adding 10–15 % avoids a second trip.'],
    ],
  },
  {
    pfad: '/mulch-calculator/',
    art: 'rechner',
    nav: 'Mulch',
    imMenue: true,
    title: 'Mulch Calculator – Cubic Yards, Bags & Cost',
    description: 'How much mulch do I need? Enter your bed size and depth to get cubic yards, number of bags and cost. Works for flower beds, tree rings and irregular beds.',
    h1: 'Mulch Calculator',
    intro: 'Enter the size of your beds and how deep you want the mulch. You get cubic yards for bulk delivery, the number of bags, and a cost comparison.',
    kurz: 'Beds, tree rings, bags vs. bulk',
    material: 'hardwood-mulch',
    kategorien: ['mulch'],
    beispiel: { laenge: 20, breite: 10, tiefe: 3 },
    bloecke: ['deckung', 'saecke', 'gewicht'],
    verwandt: ['/guides/how-many-bags-of-mulch-in-a-yard/', '/guides/how-much-does-mulch-weigh/', '/rubber-mulch-calculator/'],
    inhalt: `${MESSEN}
<h2>How much mulch do I need?</h2>
<p>Multiply the bed’s square footage by the depth in inches and divide by 324 – that’s cubic yards. A 10 × 20 ft bed (200 sq ft) at 3 inches needs about 1.85 cubic yards before the extra for settling. The calculator above does this for several beds at once and adds the extra automatically.</p>
<h2>How deep should mulch be?</h2>
<p>For most flower beds 2–3 inches is right. Less than 2 inches won't keep weeds down; more than 4 inches can keep water and air from reaching the roots. Around trees, keep mulch a few inches away from the trunk – don't pile it up in a “volcano”.</p>
<h2>How many cubic feet are in a yard of mulch?</h2>
<p>One cubic yard of mulch is <strong>27 cubic feet</strong> (3 ft × 3 ft × 3 ft). Most bags hold 2 cubic feet, so a yard equals 13.5 bags. See <a href="/guides/how-many-bags-of-mulch-in-a-yard/">how many bags of mulch are in a yard</a> for every bag size.</p>
<h2>Bulk or bags?</h2>
<p>Bags are handy for a bed or two. From about 2–3 cubic yards, bulk mulch from a <a href="/landscape-supply/">landscape supply yard</a> is usually cheaper per yard, even with a delivery fee. Enter both prices under “Extra %, bag size &amp; prices” to compare for your project.</p>`,
    faq: [
      ['How many bags of mulch are in a cubic yard?', 'A cubic yard is 27 cubic feet, so it equals about 13.5 bags of 2 cu ft, 18 bags of 1.5 cu ft, or 9 bags of 3 cu ft.'],
      ['How much area does a cubic yard of mulch cover?', 'At 3 inches deep, one cubic yard covers about 108 square feet. At 2 inches it covers about 162 square feet.'],
      ['Is bagged or bulk mulch cheaper?', 'Bulk mulch is usually cheaper per cubic yard once you need more than 2–3 cubic yards, even after a delivery fee. Bags make sense for small beds or if you can’t take a delivery.'],
      ['How much does a cubic yard of mulch weigh?', 'Shredded hardwood mulch typically weighs about 400–800 lb per cubic yard. Wet mulch is at the upper end or heavier.'],
    ],
  },
  {
    pfad: '/gravel-calculator/',
    art: 'rechner',
    nav: 'Gravel',
    imMenue: true,
    title: 'Gravel Calculator – Tons & Cubic Yards (with Cost)',
    description: 'How much gravel do I need? Calculate tons and cubic yards of pea gravel, crushed stone or decomposed granite for paths, patios and driveways.',
    h1: 'Gravel Calculator',
    intro: 'Gravel is usually sold by the ton. Enter your area and depth to get tons, cubic yards and how many pickup loads it takes.',
    kurz: 'Tons of pea gravel & crushed stone',
    material: 'pea-gravel',
    kategorien: ['gravel', 'sand'],
    beispiel: { laenge: 30, breite: 4, tiefe: 3 },
    bloecke: ['deckung', 'tonneDeckung', 'gewicht'],
    verwandt: ['/guides/how-much-does-gravel-weigh/', '/tons-to-cubic-yards/', '/guides/dump-truck-load-of-gravel/'],
    inhalt: `${MESSEN}
<h2>How much gravel do I need?</h2>
<p>Work out cubic yards first: <strong>length × width (ft) × depth (in) ÷ 324</strong>. Then multiply by the weight of your gravel – about 1.4 tons per cubic yard for pea gravel and #57 crushed stone. A 30 × 4 ft garden path at 3 inches is 1.1 cubic yards, or roughly 1.6 tons before extra.</p>
<h2>Gravel calculator in tons</h2>
<p>Most yards sell gravel by the ton, so the calculator shows tons first. It uses a typical weight for each gravel type and also gives a range, because wet or very angular stone weighs more. Order in half-ton steps and round up.</p>
<h2>Gravel calculator in cubic yards</h2>
<p>Some suppliers sell by the cubic yard instead. The calculator shows cubic yards under the tons. To switch between the two for any amount, use the <a href="/tons-to-cubic-yards/">cubic yards to tons converter</a>.</p>
<h2>How deep should gravel be?</h2>
<p>Garden paths and decorative areas need about 2–3 inches. Patios and walkways that get regular foot traffic do better with 3–4 inches over a compacted base. Driveways need a base layer as well – use the <a href="/driveway-gravel-calculator/">driveway gravel calculator</a>.</p>`,
    faq: [
      ['How many tons of gravel are in a cubic yard?', 'Most gravel weighs about 1.3–1.5 tons per cubic yard. Pea gravel and #57 crushed stone are typically around 1.4 tons.'],
      ['How much area does a ton of gravel cover?', 'At 2 inches deep, one ton of pea gravel covers roughly 115 square feet; at 3 inches about 75–80 square feet.'],
      ['How many cubic yards is a ton of gravel?', 'About 0.7 cubic yards (roughly 19 cubic feet) for typical gravel weighing 1.4 tons per cubic yard.'],
      ['Can I haul gravel in a pickup truck?', 'Yes, but watch the weight: a half-ton pickup can usually carry well under 1 cubic yard of gravel safely. The calculator shows an estimate of trips; for larger amounts delivery is usually the better option.'],
    ],
  },
  {
    pfad: '/topsoil-calculator/',
    art: 'rechner',
    nav: 'Topsoil',
    imMenue: true,
    title: 'Topsoil Calculator – Cubic Yards, Tons & Bags',
    description: 'Calculate cubic yards, tons and bags of topsoil for a new lawn, garden beds or leveling. Includes extra for settling.',
    h1: 'Topsoil Calculator',
    intro: 'Work out how much topsoil you need for a new lawn, garden beds or leveling – in cubic yards, tons and bags.',
    kurz: 'Lawns, garden beds, leveling',
    material: 'topsoil',
    kategorien: ['soil'],
    beispiel: { laenge: 30, breite: 20, tiefe: 4 },
    verwandt: ['/dirt-calculator/', '/raised-bed-soil-calculator/', '/fill-dirt-calculator/'],
    inhalt: `${MESSEN}
<h2>How deep should topsoil be?</h2>
<p>For a new lawn plan on 4–6 inches. Vegetable beds benefit from 6–12 inches of good soil. Topsoil settles after it’s placed, so the calculator adds 15 % by default.</p>
<h2>Topsoil, garden soil or fill dirt?</h2>
<ul>
  <li><strong>Topsoil</strong> is screened soil for lawns, grading the top layer and beds.</li>
  <li><strong>Garden soil / raised bed mix</strong> is topsoil blended with compost – best for filling raised beds. Use the <a href="/raised-bed-soil-calculator/">raised bed soil calculator</a>.</li>
  <li><strong>Fill dirt</strong> is cheaper subsoil for filling holes and building up grade. It’s not meant for growing plants. Use the <a href="/fill-dirt-calculator/">fill dirt calculator</a>.</li>
</ul>`,
    faq: [
      ['How much does a cubic yard of topsoil weigh?', 'Dry topsoil typically weighs about 1–1.3 tons per cubic yard. Moist soil is heavier.'],
      ['How many bags of topsoil make a cubic yard?', 'About 27 bags of 1 cu ft or 36 bags of 0.75 cu ft.'],
      ['How much topsoil do I need for a new lawn?', 'Plan on 4–6 inches. 1,000 sq ft at 4 inches needs about 12.3 cubic yards before extra for settling.'],
    ],
  },
  {
    pfad: '/river-rock-calculator/',
    art: 'rechner',
    nav: 'River rock',
    imMenue: true,
    title: 'River Rock Calculator – Tons, Yards & Coverage',
    description: 'River rock stone calculator: how many tons and cubic yards of river rock you need for beds, borders and dry creek beds, plus coverage per ton.',
    h1: 'River Rock Calculator',
    intro: 'Enter the area and depth to see how many tons of river rock to order. As a rule, make the layer about twice as deep as the stones are wide.',
    kurz: 'Beds, borders, dry creeks',
    material: 'river-rock',
    kategorien: ['gravel'],
    beispiel: { laenge: 15, breite: 6, tiefe: 3 },
    bloecke: ['deckung', 'tonneDeckung', 'gewicht'],
    verwandt: ['/landscape-rock-calculator/', '/gravel-calculator/', '/tons-to-cubic-yards/'],
    inhalt: `${MESSEN}
<h2>How deep should river rock be?</h2>
<table><thead><tr><th>Stone size</th><th>Typical depth</th><th>Good for</th></tr></thead><tbody>
<tr><td>¾–1½ in</td><td>2–3 in</td><td>Beds, borders, around plants</td></tr>
<tr><td>1–3 in</td><td>3–4 in</td><td>Beds, drainage areas, dry creek beds</td></tr>
<tr><td>2–4 in and larger</td><td>4–6 in</td><td>Dry creek beds, slopes, downspout splash areas</td></tr>
</tbody></table>
<p>Use landscape fabric underneath to keep stones from sinking into the soil.</p>`,
    faq: [
      ['How much does river rock weigh per cubic yard?', 'Typically about 1.3–1.5 tons per cubic yard, depending on stone size and type.'],
      ['How much area does a ton of river rock cover?', 'At 3 inches deep, about 75 square feet; at 2 inches, about 115 square feet.'],
      ['How much 1–3 inch river rock do I need?', 'Plan on a 3–4 inch layer. 100 sq ft at 3 inches needs about 0.9 cubic yards, or roughly 1.3 tons.'],
    ],
  },
  {
    pfad: '/driveway-gravel-calculator/',
    art: 'rechner',
    nav: 'Driveway',
    imMenue: true,
    title: 'Driveway Gravel Calculator – Tons for Base & Top Layer',
    description: 'Calculate the tons of crushed stone and crusher run you need for a new gravel driveway or for resurfacing an existing one.',
    h1: 'Driveway Gravel Calculator',
    intro: 'Enter the length and width of your driveway. Calculate the top layer of #57 stone first, then switch the material to crusher run for the base layer.',
    kurz: 'Base and top layer in tons',
    material: 'crushed-stone-57',
    tiefe: 4,
    kategorien: ['gravel'],
    beispiel: { laenge: 50, breite: 12, tiefe: 4 },
    bloecke: ['einfahrt', 'deckung', 'gewicht'],
    verwandt: ['/crushed-stone-calculator/', '/guides/dump-truck-load-of-gravel/', '/tons-to-cubic-yards/'],
    inhalt: `<h2>How thick should a gravel driveway be?</h2>
<p>A new driveway is usually built in layers: about 4–6 inches of crusher run (road base) that is compacted, plus 2–4 inches of #57 crushed stone or similar on top. For resurfacing an existing driveway, 2 inches of top stone is often enough.</p>
<p>A typical single-car driveway is 10–12 ft wide; a two-car driveway is 20–24 ft wide.</p>
<p>Crusher run compacts a lot, so the calculator adds 15 % for it automatically.</p>`,
    faq: [
      ['How many tons of gravel do I need for a driveway?', 'Multiply length × width in feet, then by the depth in inches, divide by 324 to get cubic yards, and multiply by about 1.4–1.6 tons per cubic yard. A 50 × 12 ft driveway with 4 inches of stone needs roughly 10–11 tons.'],
      ['What is the best gravel for a driveway?', 'A compacted base of crusher run (also called road base or dense grade aggregate) with a top layer of angular crushed stone such as #57 is a common, durable combination. Round pea gravel tends to shift under tires.'],
      ['How many truckloads of gravel do I need for a driveway?', 'A standard tandem dump truck usually brings about 12–16 tons of gravel. Divide your total tons by that to estimate loads.'],
    ],
  },
  {
    pfad: '/cubic-yard-calculator/',
    art: 'rechner',
    nav: 'Cubic yards',
    imMenue: true,
    title: 'Cubic Yard Calculator – Square Feet to Cubic Yards',
    description: 'Convert square feet and depth into cubic yards and cubic feet. Works for any shape: rectangles, circles, triangles and irregular areas.',
    h1: 'Cubic Yard Calculator',
    intro: 'Convert any area and depth into cubic yards and cubic feet – for mulch, soil, gravel, sand or concrete planning.',
    kurz: 'Square feet → cubic yards',
    material: 'topsoil',
    nurVolumen: true,
    beispiel: { laenge: 12, breite: 12, tiefe: 4 },
    verwandt: ['/tons-to-cubic-yards/', '/dirt-calculator/', '/mulch-calculator/'],
    inhalt: `${MESSEN}
<h2>The formula</h2>
<p><strong>Cubic yards = length (ft) × width (ft) × depth (in) ÷ 12 ÷ 27.</strong> One cubic yard is 3 ft × 3 ft × 3 ft = 27 cubic feet, or about 0.76 cubic meters.</p>
<h2>Square feet to cubic yards</h2>
<p>If you already know the area, pick “Known area” as the shape and type the square feet. Quick rule: <strong>square feet × depth in inches ÷ 324 = cubic yards</strong>. 500 sq ft at 2 inches is 3.1 cubic yards.</p>
<h2>Cubic yards to tons</h2>
<p>Gravel, sand and stone are usually sold by weight. Convert with the <a href="/tons-to-cubic-yards/">cubic yards to tons converter</a>.</p>`,
    faq: [
      ['How many square feet are in a cubic yard?', 'It depends on the depth: one cubic yard covers 324 sq ft at 1 inch, 162 sq ft at 2 inches, 108 sq ft at 3 inches and 81 sq ft at 4 inches.'],
      ['How many cubic feet are in a cubic yard?', 'There are 27 cubic feet in one cubic yard.'],
    ],
  },
  {
    pfad: '/dirt-calculator/',
    art: 'rechner',
    nav: 'Dirt',
    imMenue: false,
    title: 'Dirt Calculator – How Many Yards of Dirt Do I Need?',
    description: 'Dirt calculator for yards, tons and truckloads of dirt: fill dirt, topsoil or garden soil for holes, beds, leveling and grading.',
    h1: 'Dirt Calculator',
    intro: 'Find out how many cubic yards and tons of dirt you need – for filling, leveling, beds or a new lawn. Pick fill dirt, topsoil or garden soil as the material.',
    kurz: 'Yards & tons of dirt',
    material: 'fill-dirt',
    kategorien: ['soil'],
    beispiel: { laenge: 20, breite: 15, tiefe: 6 },
    verwandt: ['/fill-dirt-calculator/', '/topsoil-calculator/', '/raised-bed-soil-calculator/'],
    inhalt: `${MESSEN}
<h2>How many yards of dirt do I need?</h2>
<p>Multiply length × width in feet by the depth in inches and divide by 324. A 20 × 15 ft area filled 6 inches deep needs about 5.6 cubic yards – plus 15–20 % if the dirt will be compacted.</p>
<h2>Which dirt should I order?</h2>
<table><thead><tr><th>Job</th><th>Material</th><th>Why</th></tr></thead><tbody>
<tr><td>Fill a hole, low spot, old pool</td><td>Fill dirt</td><td>Cheapest, compacts well, not for planting</td></tr>
<tr><td>Grade around a house</td><td>Fill dirt, then 4 in topsoil</td><td>Fill builds the slope, topsoil grows grass</td></tr>
<tr><td>New lawn, top layer</td><td>Topsoil</td><td>Screened soil that grass roots into</td></tr>
<tr><td>Raised beds, vegetables</td><td>Garden soil mix</td><td>Topsoil plus compost, drains and feeds plants</td></tr>
</tbody></table>
<h2>How many truckloads of dirt?</h2>
<p>A single-axle dump truck carries about 5–8 cubic yards, a tandem about 10–14 cubic yards. Divide your cubic yards by the truck size your supplier uses. See <a href="/guides/dump-truck-load-of-gravel/">dump truck sizes</a>.</p>`,
    faq: [
      ['How much does a yard of dirt weigh?', 'Fill dirt weighs about 1.1–1.3 tons per cubic yard, topsoil about 1–1.3 tons. Wet clay soil can be heavier.'],
      ['How many cubic feet are in a yard of dirt?', 'One cubic yard of dirt is 27 cubic feet.'],
      ['How much dirt do I need to fill a hole?', 'Measure length, width and average depth of the hole, enter them above and add 15–20 % for compaction.'],
    ],
  },
  {
    pfad: '/fill-dirt-calculator/',
    art: 'rechner',
    nav: 'Fill dirt',
    imMenue: false,
    title: 'Fill Dirt Calculator – Yards & Tons with Compaction',
    description: 'Fill dirt calculator: cubic yards, tons and truckloads of fill dirt for holes, grading, backfill and pool fill-ins, with extra for compaction.',
    h1: 'Fill Dirt Calculator',
    intro: 'Fill dirt shrinks when it’s compacted. Enter the area and depth to fill – the calculator adds extra for compaction and shows cubic yards, tons and truckloads.',
    kurz: 'Backfill & grading with compaction',
    material: 'fill-dirt',
    tiefe: 12,
    kategorien: ['soil'],
    beispiel: { laenge: 30, breite: 15, tiefe: 12 },
    verwandt: ['/dirt-calculator/', '/topsoil-calculator/', '/guides/dump-truck-load-of-gravel/'],
    inhalt: `${MESSEN}
<h2>How much extra for compaction?</h2>
<p>Loose fill dirt loses volume when it is compacted with a plate compactor or roller. Add <strong>15–25 %</strong> for fill that will be compacted in layers, and around 10 % for loose fill in a garden. Set the percentage under “Extra %, bag size &amp; prices”.</p>
<h2>Fill dirt for an old pool or a big hole</h2>
<p>Measure the average depth and enter the area as a rectangle or circle. For deep fills, place and compact the dirt in 6–8 inch layers, and finish with 4–6 inches of <a href="/topsoil-calculator/">topsoil</a> if grass should grow on top.</p>`,
    faq: [
      ['How many tons is a yard of fill dirt?', 'About 1.1–1.3 tons per cubic yard, depending on moisture and clay content.'],
      ['Is fill dirt the same as topsoil?', 'No. Fill dirt is subsoil with little organic matter; it compacts well and is cheap. Topsoil is screened soil for growing plants and is not used for structural fill.'],
      ['How many yards of fill dirt fit in a dump truck?', 'Typically 5–8 cubic yards in a single-axle truck and 10–14 cubic yards in a tandem.'],
    ],
  },
  {
    pfad: '/sand-calculator/',
    art: 'rechner',
    nav: 'Sand',
    imMenue: false,
    title: 'Sand Calculator – Cubic Yards, Tons & Bags of Sand',
    description: 'Sand calculator for cubic yards, tons and bags: fill sand, masonry sand and play sand for sandboxes, leveling and paver bases.',
    h1: 'Sand Calculator',
    intro: 'Enter the area and depth to see how much sand you need in cubic yards, tons and 50 lb bags – for leveling, sandboxes or under pavers.',
    kurz: 'Fill, masonry & play sand',
    material: 'masonry-sand',
    kategorien: ['sand'],
    beispiel: { laenge: 10, breite: 10, tiefe: 2 },
    bloecke: ['deckung', 'tonneDeckung', 'gewicht'],
    verwandt: ['/paver-sand-calculator/', '/tons-to-cubic-yards/', '/gravel-calculator/'],
    inhalt: `${MESSEN}
<h2>How much does sand weigh?</h2>
<p>Dry sand weighs about 1.25–1.4 tons per cubic yard; wet sand is heavier. That means one ton of sand is roughly 0.75 cubic yards (20 cubic feet).</p>
<h2>Which sand do I need?</h2>
<table><thead><tr><th>Use</th><th>Sand type</th><th>Typical depth</th></tr></thead><tbody>
<tr><td>Under pavers</td><td>Concrete / bedding sand</td><td>1 in – see the <a href="/paver-sand-calculator/">paver sand calculator</a></td></tr>
<tr><td>Sandbox</td><td>Washed play sand</td><td>6–12 in</td></tr>
<tr><td>Leveling, backfill</td><td>Fill sand</td><td>As needed</td></tr>
<tr><td>Mortar, masonry</td><td>Masonry sand</td><td>–</td></tr>
</tbody></table>
<h2>Sand for a sandbox</h2>
<p>Pick “Sandbox” as the project to prefill play sand at 12 inches. A 5 × 5 ft sandbox filled 12 inches deep needs about 0.9 cubic yards, or about 50 bags of 0.5 cu ft.</p>`,
    faq: [
      ['How many bags of sand are in a cubic yard?', 'About 54 bags of 0.5 cu ft (a typical 50 lb bag).'],
      ['How much area does a ton of sand cover?', 'At 2 inches deep, about 120 square feet; at 1 inch about 240 square feet.'],
      ['How much sand do I need for a sandbox?', 'Multiply length × width in feet by the depth in inches and divide by 324. A 6 × 6 ft box at 12 inches needs about 1.3 cubic yards.'],
    ],
  },
  {
    pfad: '/paver-sand-calculator/',
    art: 'rechner',
    nav: 'Paver sand',
    imMenue: false,
    title: 'Paver Sand Calculator – Bedding Sand for Pavers',
    description: 'Paver sand calculator: how much bedding sand you need under pavers, in cubic yards, tons and 0.5 cu ft bags, plus the gravel base.',
    h1: 'Paver Sand Calculator',
    intro: 'Pavers sit on about 1 inch of bedding sand over a compacted gravel base. Enter your patio or walkway size to get the sand in tons, cubic yards and bags.',
    kurz: 'Bedding sand under pavers',
    material: 'paver-sand',
    tiefe: 1,
    kategorien: ['sand', 'gravel'],
    beispiel: { laenge: 16, breite: 12, tiefe: 1 },
    verwandt: ['/sand-calculator/', '/crushed-stone-calculator/', '/driveway-gravel-calculator/'],
    inhalt: `${MESSEN}
<h2>Layers under a paver patio</h2>
<table><thead><tr><th>Layer</th><th>Material</th><th>Thickness</th></tr></thead><tbody>
<tr><td>Pavers</td><td>Concrete or stone pavers</td><td>2⅜ in or more</td></tr>
<tr><td>Bedding</td><td>Concrete sand (coarse, washed)</td><td>1 in</td></tr>
<tr><td>Base</td><td>Crusher run / road base, compacted</td><td>4 in for patios, 6–8 in for driveways</td></tr>
</tbody></table>
<p>Calculate the base with the <a href="/crushed-stone-calculator/">crushed stone calculator</a> (choose crusher run). Joint sand for the gaps comes in bags and is sold separately.</p>`,
    faq: [
      ['How much sand do I need for pavers?', 'At 1 inch deep, one cubic yard of sand covers about 324 sq ft. A 12 × 16 ft patio (192 sq ft) needs about 0.6 cubic yards, roughly 0.8 tons.'],
      ['Can I use play sand under pavers?', 'It isn’t recommended. Play sand is fine and rounded; coarse concrete sand locks together better and drains.'],
      ['How many bags of paver sand do I need?', 'One 0.5 cu ft bag covers about 6 sq ft at 1 inch. Divide your patio area by 6.'],
    ],
  },
  {
    pfad: '/raised-bed-soil-calculator/',
    art: 'rechner',
    nav: 'Raised bed',
    imMenue: false,
    title: 'Raised Bed Soil Calculator – Cubic Feet, Yards & Bags',
    description: 'Raised bed soil calculator: how much soil, garden mix or dirt fills your raised beds, in cubic feet, cubic yards and bags. Add several beds at once.',
    h1: 'Raised Bed Soil Calculator',
    intro: 'Enter each bed’s length and width and use the bed height as depth. You get the soil in cubic feet, cubic yards and bags – add as many beds as you like.',
    kurz: 'Soil for raised garden beds',
    material: 'garden-soil',
    form: 'rectangle',
    kategorien: ['soil'],
    beispiel: { laenge: 8, breite: 4, tiefe: 12 },
    bloecke: ['beete', 'saecke', 'gewicht'],
    verwandt: ['/topsoil-calculator/', '/dirt-calculator/', '/mulch-calculator/'],
    inhalt: `<h2>How to measure raised beds</h2>
<ul>
  <li>Measure the <strong>inside</strong> length and width of each bed in feet.</li>
  <li>Use the bed’s height as the depth (or a little less if you leave a gap at the top).</li>
  <li>Several beds: click “Add another area” for each one.</li>
</ul>
<h2>Bags or bulk for raised beds?</h2>
<p>A single 4 × 8 ft bed 12 inches deep needs about 32 cubic feet – around 22 bags of 1.5 cu ft. From two or three beds on, bulk garden soil from a <a href="/landscape-supply/">landscape supply yard</a> is usually much cheaper.</p>
<h2>What soil goes in a raised bed?</h2>
<p>A common mix is about 60 % topsoil and 40 % compost. Many yards sell a ready-made raised bed or garden blend. Avoid fill dirt – it has little organic matter.</p>`,
    faq: [
      ['How much soil do I need for a 4 × 8 raised bed?', 'At 12 inches deep, about 32 cubic feet or 1.2 cubic yards; at 10 inches about 27 cubic feet (1 cubic yard).'],
      ['How many bags of soil fill a raised bed?', 'Divide the bed volume in cubic feet by the bag size. A 4 × 8 × 1 ft bed needs about 22 bags of 1.5 cu ft or 32 bags of 1 cu ft.'],
      ['Does raised bed soil settle?', 'Yes, mixes with compost settle 10–20 % in the first weeks. The calculator adds 10 % extra by default.'],
    ],
  },
  {
    pfad: '/pea-gravel-calculator/',
    art: 'rechner',
    nav: 'Pea gravel',
    imMenue: false,
    title: 'Pea Gravel Calculator – Tons, Cubic Yards & Bags',
    description: 'Pea gravel calculator: tons, cubic yards and bags of pea gravel for paths, patios, play areas and dog runs.',
    h1: 'Pea Gravel Calculator',
    intro: 'Enter the area and depth to see how many tons, cubic yards and bags of pea gravel you need for paths, patios or play areas.',
    kurz: 'Paths, patios, play areas',
    material: 'pea-gravel',
    kategorien: ['gravel'],
    beispiel: { laenge: 12, breite: 12, tiefe: 3 },
    bloecke: ['deckung', 'tonneDeckung', 'gewicht'],
    verwandt: ['/gravel-calculator/', '/crushed-stone-calculator/', '/guides/how-much-does-gravel-weigh/'],
    inhalt: `${MESSEN}
<h2>How deep should pea gravel be?</h2>
<table><thead><tr><th>Project</th><th>Depth</th></tr></thead><tbody>
<tr><td>Garden path, walkway</td><td>2–3 in over landscape fabric</td></tr>
<tr><td>Patio, seating area</td><td>3–4 in, with edging</td></tr>
<tr><td>Play area</td><td>9–12 in for fall protection</td></tr>
<tr><td>Dog run</td><td>3–4 in</td></tr>
</tbody></table>
<p>Pea gravel is round and shifts underfoot, so edging matters. For driveways and parking areas, angular <a href="/crushed-stone-calculator/">crushed stone</a> stays in place better.</p>`,
    faq: [
      ['How much does a yard of pea gravel weigh?', 'About 1.3–1.5 tons (2,600–3,000 lb) per cubic yard.'],
      ['How many bags of pea gravel are in a ton?', 'About 40 bags of 0.5 cu ft (around 50 lb each).'],
      ['How much area does a ton of pea gravel cover?', 'At 2 inches about 115 sq ft, at 3 inches about 77 sq ft.'],
    ],
  },
  {
    pfad: '/landscape-rock-calculator/',
    art: 'rechner',
    nav: 'Landscape rock',
    imMenue: false,
    title: 'Landscape Rock Calculator – Tons & Coverage',
    description: 'Landscape rock calculator: how many tons and cubic yards of decorative rock you need for beds and xeriscaping, plus coverage per ton.',
    h1: 'Landscape Rock Calculator',
    intro: 'Decorative rock is sold by the ton. Enter the bed size and depth to see tons, cubic yards and how much area each ton covers.',
    kurz: 'Decorative rock in tons',
    material: 'landscape-rock',
    kategorien: ['gravel'],
    beispiel: { laenge: 20, breite: 8, tiefe: 3 },
    bloecke: ['deckung', 'tonneDeckung', 'gewicht'],
    verwandt: ['/river-rock-calculator/', '/pea-gravel-calculator/', '/tons-to-cubic-yards/'],
    inhalt: `${MESSEN}
<h2>How deep should landscape rock be?</h2>
<p>Make the layer about twice as deep as the stones are wide: 2–3 inches for ¾–1 inch rock, 3–4 inches for 1–3 inch rock. Put landscape fabric underneath so the rock doesn’t sink into the soil and weeds stay down.</p>
<h2>Lava rock is lighter</h2>
<p>Lava rock weighs only about 0.5–0.75 tons per cubic yard, so a ton covers roughly twice the area of regular rock. If you order lava rock, enter your supplier’s weight under “Extra %, bag size &amp; prices” or use the cubic yard figure.</p>`,
    faq: [
      ['How much area does a ton of landscape rock cover?', 'At 2 inches about 120 sq ft, at 3 inches about 80 sq ft, at 4 inches about 60 sq ft.'],
      ['How many tons of rock do I need for 100 square feet?', 'At 3 inches, about 1.3 tons. At 2 inches, a little under 1 ton.'],
    ],
  },
  {
    pfad: '/crushed-stone-calculator/',
    art: 'rechner',
    nav: 'Crushed stone',
    imMenue: false,
    title: 'Crushed Stone Calculator – Tons of #57 & Crusher Run',
    description: 'Crushed stone calculator for 3/4 inch #57 stone and crusher run: tons and cubic yards for driveways, patio bases and drainage.',
    h1: 'Crushed Stone Calculator',
    intro: 'Enter your area and depth to get tons and cubic yards of crushed stone – #57 (about ¾ inch) for drainage and top layers, or crusher run for compacted bases.',
    kurz: '#57 stone & crusher run',
    material: 'crushed-stone-57',
    tiefe: 4,
    kategorien: ['gravel'],
    beispiel: { laenge: 20, breite: 12, tiefe: 4 },
    bloecke: ['deckung', 'tonneDeckung', 'gewicht'],
    verwandt: ['/driveway-gravel-calculator/', '/paver-sand-calculator/', '/guides/dump-truck-load-of-gravel/'],
    inhalt: `${MESSEN}
<h2>Common crushed stone sizes</h2>
<table><thead><tr><th>Name</th><th>Size</th><th>Used for</th></tr></thead><tbody>
<tr><td>#57 stone</td><td>About ¾–1 in, clean</td><td>Driveway top layer, drainage, French drains, under sheds</td></tr>
<tr><td>#411 / crusher run</td><td>¾ in down to dust</td><td>Compacted base for driveways, patios and pavers</td></tr>
<tr><td>#8 / #89</td><td>⅜–½ in</td><td>Walkways, paver joints, small drainage</td></tr>
<tr><td>#3 / #2</td><td>1½–3 in</td><td>Base for heavy driveways, construction entrances</td></tr>
</tbody></table>
<p>Names and sizes vary a little by region – ask your yard for their spec sheet.</p>`,
    faq: [
      ['How much does a yard of 3/4 crushed stone weigh?', 'About 1.35–1.5 tons per cubic yard.'],
      ['How much crushed stone do I need for a shed base?', 'For a 10 × 12 ft shed at 4 inches, about 1.5 cubic yards or roughly 2.1 tons, plus 10 % extra.'],
    ],
  },
  {
    pfad: '/rubber-mulch-calculator/',
    art: 'rechner',
    nav: 'Rubber mulch',
    imMenue: false,
    title: 'Rubber Mulch Calculator – Bags & Coverage',
    description: 'Rubber mulch calculator: how many bags of rubber mulch you need for beds or playgrounds, with coverage per bag and per cubic yard.',
    h1: 'Rubber Mulch Calculator',
    intro: 'Rubber mulch is usually sold in 0.8 or 1.5 cu ft bags. Enter your area and depth to see how many bags – or cubic yards – you need.',
    kurz: 'Beds & playgrounds',
    material: 'rubber-mulch',
    kategorien: ['mulch'],
    beispiel: { laenge: 20, breite: 15, tiefe: 6 },
    bloecke: ['saecke', 'deckung', 'gewicht'],
    verwandt: ['/mulch-calculator/', '/guides/how-many-bags-of-mulch-in-a-yard/', '/pea-gravel-calculator/'],
    inhalt: `${MESSEN}
<h2>How deep should rubber mulch be?</h2>
<p>For beds, 2–3 inches is enough because rubber mulch doesn’t break down. Playgrounds usually need about 6 inches – check the fall-height rating of your product, which is tested at a specific depth.</p>
<h2>Coverage of a bag</h2>
<p>A 0.8 cu ft bag covers about 4.8 sq ft at 2 inches or 1.6 sq ft at 6 inches. A 1.5 cu ft bag covers about 9 sq ft at 2 inches.</p>`,
    faq: [
      ['How many bags of rubber mulch do I need for a playground?', 'At 6 inches, a 20 × 15 ft playground (300 sq ft) needs about 150 cubic feet – roughly 188 bags of 0.8 cu ft or 100 bags of 1.5 cu ft.'],
      ['How much does a bag of rubber mulch weigh?', 'A 0.8 cu ft bag weighs about 16–23 lb, depending on the product.'],
    ],
  },
  // ---------- Umrechner ----------
  {
    pfad: '/tons-to-cubic-yards/',
    art: 'umrechner',
    nav: 'Tons ↔ yards',
    imMenue: false,
    title: 'Cubic Yards to Tons Calculator – Gravel, Sand, Soil',
    description: 'Convert cubic yards to tons and tons to cubic yards for gravel, crushed stone, sand, topsoil and mulch, with a conversion table.',
    h1: 'Cubic Yards to Tons Converter',
    intro: 'Convert between cubic yards and tons for any material. Suppliers sell gravel and sand by the ton and mulch and soil by the yard – this tells you how they compare.',
    kurz: 'Convert cubic yards ↔ tons',
    material: 'pea-gravel',
    bloecke: ['umrechnung'],
    verwandt: ['/gravel-calculator/', '/guides/how-much-does-gravel-weigh/', '/cubic-yard-calculator/'],
    inhalt: `<h2>The formula</h2>
<p><strong>Tons = cubic yards × weight per cubic yard.</strong> <strong>Cubic yards = tons ÷ weight per cubic yard.</strong> Gravel and stone weigh about 1.3–1.5 tons per cubic yard, so one ton is roughly 0.7 cubic yards.</p>`,
    faq: [
      ['How many tons are in a cubic yard of gravel?', 'About 1.4 tons for pea gravel and #57 crushed stone; 1.3–1.5 tons for most gravel.'],
      ['How many cubic yards are in a ton of sand?', 'About 0.75 cubic yards for dry sand weighing 1.35 tons per cubic yard.'],
      ['How many tons is a yard of topsoil?', 'About 1.1 tons on average, 1–1.3 tons depending on moisture.'],
    ],
  },
  // ---------- Ratgeber ----------
  {
    pfad: '/guides/how-many-bags-of-mulch-in-a-yard/',
    art: 'ratgeber',
    nav: 'Bags of mulch in a yard',
    title: 'How Many Bags of Mulch in a Yard? (Chart by Bag Size)',
    description: 'A cubic yard of mulch is 27 cubic feet: 13.5 bags of 2 cu ft, 9 bags of 3 cu ft or 18 bags of 1.5 cu ft. Charts for 1–10 yards.',
    h1: 'How Many Bags of Mulch Are in a Yard?',
    intro: 'One cubic yard of mulch is 27 cubic feet. That’s 13.5 bags of 2 cu ft (buy 14), 9 bags of 3 cu ft or 18 bags of 1.5 cu ft.',
    kurz: '27 cu ft = 13.5 bags of 2 cu ft',
    material: 'hardwood-mulch',
    beispiel: { laenge: 20, breite: 10, tiefe: 3 },
    bloecke: ['saecke', 'yardsZuSaecken', 'sackDeckung'],
    verwandt: ['/mulch-calculator/', '/guides/how-much-does-mulch-weigh/', '/rubber-mulch-calculator/'],
    inhalt: `<h2>How many cubic feet are in a yard of mulch?</h2>
<p>A cubic yard is 3 ft × 3 ft × 3 ft = <strong>27 cubic feet</strong>. Bulk mulch is sold by the cubic yard; bagged mulch is labeled in cubic feet (sometimes in quarts or liters).</p>`,
    faq: [
      ['How many 2 cubic foot bags of mulch make a yard?', '13.5 bags. Round up to 14 when you buy.'],
      ['How many bags of mulch are in 3 yards?', 'About 41 bags of 2 cu ft or 27 bags of 3 cu ft.'],
      ['How many square feet does a bag of mulch cover?', 'A 2 cu ft bag covers about 12 sq ft at 2 inches or 8 sq ft at 3 inches.'],
      ['Is a yard of mulch cheaper than bags?', 'Usually yes once you need 2–3 yards or more. 13.5 bags often cost more than one bulk yard, though delivery fees narrow the gap for small orders.'],
    ],
  },
  {
    pfad: '/guides/how-much-does-mulch-weigh/',
    art: 'ratgeber',
    nav: 'Mulch weight',
    title: 'How Much Does Mulch Weigh? Bags & Cubic Yards',
    description: 'A cubic yard of mulch weighs about 400–800 lb; a 2 cu ft bag about 30–60 lb. Weight by mulch type, bag size and moisture.',
    h1: 'How Much Does Mulch Weigh?',
    intro: 'A cubic yard of shredded hardwood mulch weighs about 400–800 lb, and a 2 cu ft bag roughly 30–60 lb. Wet mulch is at the top of that range or heavier.',
    kurz: 'Per bag and per cubic yard',
    material: 'hardwood-mulch',
    beispiel: { laenge: 20, breite: 10, tiefe: 3 },
    bloecke: ['mulchGewicht'],
    verwandt: ['/mulch-calculator/', '/guides/how-many-bags-of-mulch-in-a-yard/', '/guides/how-much-does-gravel-weigh/'],
    inhalt: `<h2>Why the weight varies</h2>
<p>Mulch is mostly wood and water. Freshly ground or rain-soaked mulch can weigh nearly twice as much as dry, aged mulch. Bark nuggets are lighter than shredded hardwood; rubber mulch is in a similar range but doesn’t absorb water.</p>
<h2>Can my pickup carry a yard of mulch?</h2>
<p>Usually yes: at 400–800 lb, one cubic yard of mulch is well within the payload of a half-ton pickup, and most beds hold about 2 cubic yards heaped. Gravel is a different story – see <a href="/guides/how-much-does-gravel-weigh/">how much gravel weighs</a>.</p>`,
    faq: [
      ['How much does a 2 cubic foot bag of mulch weigh?', 'About 30–60 lb; dry bags are at the lower end.'],
      ['How much does a yard of mulch weigh?', 'About 400–800 lb for shredded hardwood, 400–600 lb for pine bark.'],
      ['How much does a pallet of mulch weigh?', 'A pallet usually holds 60–75 bags of 2 cu ft, so roughly 2,000–4,000 lb.'],
    ],
  },
  {
    pfad: '/guides/how-much-does-gravel-weigh/',
    art: 'ratgeber',
    nav: 'Gravel weight',
    title: 'How Much Does a Yard of Gravel Weigh? (Tons per Yard)',
    description: 'A cubic yard of gravel weighs about 1.3–1.5 tons (2,600–3,000 lb). One ton of gravel is about 0.7 cubic yards. Chart by gravel type.',
    h1: 'How Much Does a Yard of Gravel Weigh?',
    intro: 'A cubic yard of gravel weighs about 1.3–1.5 tons, or 2,600–3,000 lb. Turned around, one ton of gravel is roughly 0.7 cubic yards (about 19 cubic feet).',
    kurz: '1 cu yd ≈ 1.4 tons',
    material: 'pea-gravel',
    beispiel: { laenge: 30, breite: 4, tiefe: 3 },
    bloecke: ['gewichtStein', 'tonneDeckung'],
    verwandt: ['/gravel-calculator/', '/tons-to-cubic-yards/', '/guides/dump-truck-load-of-gravel/'],
    inhalt: `<h2>How much gravel is a ton?</h2>
<p>One ton of typical gravel is about <strong>0.7 cubic yards</strong>, a pile roughly 3 ft × 3 ft × 2 ft. At 2 inches deep it covers about 115 square feet.</p>`,
    faq: [
      ['How much does a cubic yard of gravel weigh in pounds?', 'About 2,600–3,000 lb for most gravel and crushed stone.'],
      ['How much does a yard of pea gravel weigh?', 'About 1.3–1.5 tons (2,600–3,000 lb).'],
      ['How many yards of gravel are in a ton?', 'About 0.67–0.77 cubic yards, depending on the stone.'],
    ],
  },
  {
    pfad: '/guides/dump-truck-load-of-gravel/',
    art: 'ratgeber',
    nav: 'Dump truck load',
    title: 'How Much Gravel Is in a Dump Truck Load?',
    description: 'A tandem dump truck carries about 12–16 tons (10–14 cubic yards) of gravel; a single-axle truck about 6–10 tons. Chart by truck type.',
    h1: 'How Much Gravel Is in a Dump Truck Load?',
    intro: 'A standard tandem dump truck brings about 12–16 tons of gravel – roughly 10–14 cubic yards. Single-axle trucks carry about 6–10 tons, tri-axles up to about 20–25 tons.',
    kurz: 'Tons and yards per truck',
    material: 'crushed-stone-57',
    tiefe: 4,
    beispiel: { laenge: 100, breite: 12, tiefe: 4 },
    bloecke: ['lkw'],
    verwandt: ['/driveway-gravel-calculator/', '/guides/how-much-does-gravel-weigh/', '/tons-to-cubic-yards/'],
    inhalt: `<h2>Weight, not volume, sets the limit</h2>
<p>Gravel is heavy, so trucks reach their legal weight limit before the bed is full. That’s why yards quote gravel loads in tons. Mulch is light: the same truck can carry far more cubic yards of mulch than of stone.</p>
<h2>Will a dump truck fit on my property?</h2>
<p>A loaded tandem weighs 50,000 lb or more and needs about 10–12 ft of width and a firm surface. Tell the yard about soft lawns, septic fields, low wires and tight turns before delivery.</p>`,
    faq: [
      ['How many tons of gravel are in a dump truck?', 'Typically 12–16 tons in a tandem (10-wheeler), 6–10 tons in a single-axle truck and up to about 20–25 tons in a tri-axle.'],
      ['How many yards of gravel are in a dump truck?', 'About 10–14 cubic yards in a tandem and 5–8 cubic yards in a single-axle truck.'],
      ['How many truckloads do I need for my driveway?', 'Calculate the total tons with the driveway calculator and divide by about 14 tons for a tandem load.'],
    ],
    quellen: [
      ['TxDOT Maintenance Manual: haul truck size', 'https://www.txdot.gov/manuals/mnt/scm/equipment_inspection/haul_trucks-i1008556/size-i1008586.html'],
      ['HomeGuide: dump truck sizes', 'https://homeguide.com/articles/dump-truck-sizes'],
    ],
  },
  // ---------- Übersichten und Info ----------
  {
    pfad: '/calculators/',
    art: 'info',
    nav: 'All calculators',
    imMenue: false,
    title: 'All Landscape Material Calculators – Mulch, Gravel, Soil',
    description: 'Every calculator in one place: mulch, gravel, topsoil, dirt, sand, river rock, crushed stone, pea gravel, rubber mulch and cubic yards to tons.',
    h1: 'All Calculators & Guides',
    intro: 'Pick the material or the question – every calculator gives cubic yards, tons and bags.',
    kurz: 'Every calculator',
    hub: 'alle',
  },
  {
    pfad: '/guides/',
    art: 'info',
    nav: 'Guides',
    imMenue: false,
    title: 'Mulch & Gravel Guides – Bags, Weights, Truckloads',
    description: 'Quick answers with charts: bags of mulch in a yard, how much mulch and gravel weigh, and how much gravel fits in a dump truck.',
    h1: 'Mulch & Gravel Guides',
    intro: 'Short answers with charts to the questions that come up before you order.',
    kurz: 'Bags, weights, truckloads',
    hub: 'ratgeber',
  },
  {
    pfad: '/about/',
    art: 'info',
    nav: 'About',
    imMenue: false,
    title: 'About Gravel & Mulch – How Our Calculators Work',
    description: 'How the Gravel & Mulch calculators work, which material weights they use, and where the landscape supply yard listings come from.',
    h1: 'About Gravel & Mulch',
    intro: 'Free calculators for landscape materials and a directory of the yards that sell them in bulk.',
    kurz: 'Method and data sources',
    inhalt: `<h2>How the calculators work</h2>
<p>Every calculator turns your area and depth into volume: <strong>square feet × depth in inches ÷ 324 = cubic yards</strong>. For weight, it multiplies cubic yards by a typical weight per cubic yard for the material and shows a range, because moisture and stone type change the weight. You can adjust the extra percentage for settling and waste.</p>
<p>The material weights are typical reference values for loose material. Suppliers’ own figures can differ – ask your yard for their weight per cubic yard before you order by the ton.</p>
<h2>Where the yard listings come from</h2>
<p>The directory combines business locations from Overture Maps (© OpenStreetMap contributors, © Overture Maps Foundation) with mine records from the U.S. Mine Safety and Health Administration (MSHA, public domain). Most listings have not been verified yet, so please call ahead to confirm materials, prices, delivery and hours.</p>
<h2>Gravel pits from mine records</h2>
<p>Sand and gravel pits come from MSHA records of active and intermittent mines. These records list the mine name, operator and status, but no phone number or retail details. Many pits sell mainly to contractors.</p>`,
  },
];

export const RECHNER = SEITEN.filter((s) => s.art === 'rechner' || s.art === 'umrechner');
export const RATGEBER = SEITEN.filter((s) => s.art === 'ratgeber');
