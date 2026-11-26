// Seiten außerhalb des Verzeichnisses: Rechner, Umrechner, Ratgeber, Übersichten.
// Reihenfolge = Reihenfolge in Menü, Übersicht und Fußzeile.
//
// Felder:
//   pfad, art ('rechner' | 'umrechner' | 'ratgeber' | 'info'), nav (kurzer Name), imMenue,
//   title (≤ 60 Zeichen), description, h1, intro (bei Ratgebern: die direkte Antwort), kurz (Kacheltext),
//   material (Standard aus data/materials.json), tiefe (Zoll, sonst default_depth_in), form, nurVolumen,
//   kategorien (für die Gewichtstabelle), beispiel ({ laenge, breite, tiefe } in ft/in, für das Rechenbeispiel),
//   bloecke (Tabellen aus build.mjs, Standard: ['deckung', 'gewicht']), inhalt (HTML), faq ([Frage, Antwort]),
//   verwandt (Pfade für „Related“), stand (JJJJ-MM, wann der Inhalt zuletzt geprüft wurde),
//   stoff (Suchbegriff fürs Material in Tabellen-Überschriften, z. B. 'mulch'), ue ({ block: 'Überschrift' } überschreibt sie),
//   quellen ([Titel, URL] für Preis- und Fachangaben).
//   Keyword-Zuordnung je Seite: Projekt-Dokument claude/keywords-pro-rechner.md.

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

// Quellen für Preise und Fachangaben (werden unter der Seite als "Sources" verlinkt)
const Q = {
  mulchHomeguide: ['HomeGuide: mulch prices', 'https://homeguide.com/costs/mulch-prices'],
  mulchLawnstarter: ['LawnStarter: mulch prices', 'https://www.lawnstarter.com/blog/cost/mulch-price/'],
  mulchThisOldHouse: ['This Old House: cost of a yard of mulch', 'https://www.thisoldhouse.com/gardening/yard-of-mulch-cost'],
  gesteinThisOldHouse: ['This Old House: landscape rock cost', 'https://www.thisoldhouse.com/gardening/landscape-rock-cost'],
  erbsenkiesHomeguide: ['HomeGuide: pea gravel prices', 'https://homeguide.com/costs/pea-gravel-cost'],
  erbsenkiesAngi: ['Angi: pea gravel cost', 'https://www.angi.com/articles/how-much-does-pea-gravel-cost.htm'],
  flusskiesHomeguide: ['HomeGuide: river rock prices', 'https://homeguide.com/costs/landscaping-river-rock-prices'],
  einfahrtHomeguide: ['HomeGuide: gravel driveway cost', 'https://homeguide.com/costs/gravel-driveway-cost'],
  einfahrtLawnstarter: ['LawnStarter: gravel driveway cost', 'https://www.lawnstarter.com/blog/cost/gravel-driveway-price'],
  reitplatzUky: ['University of Kentucky: riding arena footing', 'https://publications.ca.uky.edu/sites/publications.ca.uky.edu/files/ID265.pdf'],
  reitplatzFarmProgress: ['Farm Progress: arena footing', 'https://farmprogress.com/farm-life/3-steps-to-best-arena-footing'],
  fugensandSakrete: ['Sakrete Paver Set: coverage', 'https://pdf.lowes.com/productdocuments/432c46be-009f-4ece-b6a3-fd52f9c9aac7/16107764.pdf'],
  fugensandRatgeber: ['Polymeric Sand Store: coverage per bag', 'https://polymericsandstore.com/blogs/news/how-many-square-feet-does-a-bag-of-polymeric-sand-cover'],
};

// Quelle direkt hinter der Zahl: Link(s) + Abrufmonat
const QUELLEN_STAND = 'November 2026';
const vgl = (...qs) => ` <span class="quelle-inline">(${qs.map(([t, u]) => `<a href="${u}" rel="nofollow noopener">${t.split(':')[0]}</a>`).join(', ')}, ${QUELLEN_STAND})</span>`;

export const SEITEN = [
  // ---------- Rechner ----------
  {
    pfad: '/',
    art: 'rechner',
    nav: 'All materials',
    imMenue: false,
    title: 'Mulch, Gravel & Topsoil Calculator – How Much Do I Need?',
    description: 'Free calculator for mulch, gravel, stone, topsoil and sand. Get cubic yards, tons, bags and cost for any bed, path or driveway in seconds.',
    h1: 'Mulch, Gravel & Topsoil Calculator',
    intro: 'Find out how many cubic yards, tons or bags you need – and what it will cost – for beds, paths, driveways and lawns.',
    kurz: 'Any material',
    material: 'hardwood-mulch',
    beispiel: { laenge: 20, breite: 10, tiefe: 3 },
    inhalt: `${MESSEN}
<h2>Recommended depths by project</h2>
<table><thead><tr><th>Project</th><th>Typical material</th><th>Depth</th></tr></thead><tbody>
<tr><td>Flower bed</td><td><a href="/mulch-calculator/">Shredded hardwood mulch</a></td><td>2–3 in</td></tr>
<tr><td>Tree ring</td><td>Mulch</td><td>2–3 in, kept off the trunk</td></tr>
<tr><td>Garden path</td><td><a href="/pea-gravel-calculator/">Pea gravel</a></td><td>2–3 in</td></tr>
<tr><td>Gravel driveway</td><td><a href="/driveway-gravel-calculator/">Crusher run base + #57 stone</a></td><td>4–8 in base, 2–4 in top</td></tr>
<tr><td>Paver patio</td><td><a href="/paver-sand-calculator/">Bedding sand</a> over a gravel base</td><td>1 in sand</td></tr>
<tr><td>New lawn</td><td><a href="/topsoil-calculator/">Screened topsoil</a></td><td>4–6 in</td></tr>
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
    title: 'Mulch Calculator – How Much Mulch Do I Need? (Yards & Bags)',
    description: 'Free mulch calculator: enter your beds and depth to get cubic yards, bags and cost – plus how many bags are in a yard and what a yard weighs and costs.',
    h1: 'Mulch Calculator: How Much Mulch Do You Need?',
    intro: 'Measure your beds, pick a depth and see right away how many cubic yards of bulk mulch or how many bags to buy – and what it will cost.',
    kurz: 'Beds, tree rings, bags vs. bulk',
    material: 'hardwood-mulch',
    stoff: 'mulch',
    kategorien: ['mulch'],
    beispiel: { laenge: 20, breite: 10, tiefe: 3 },
    bloecke: ['deckung', 'saecke', 'gewicht'],
    verwandt: ['/guides/how-many-bags-of-mulch-in-a-yard/', '/guides/how-much-does-mulch-weigh/', '/rubber-mulch-calculator/'],
    inhalt: `${MESSEN}
<h2>How much mulch do I need?</h2>
<p>Multiply the bed’s square footage by the depth in inches and divide by 324 – that’s cubic yards. A 10 × 20 ft bed (200 sq ft) at 3 inches needs about 1.85 cubic yards, or 25 bags of 2 cu ft. Most people add 10 % because fresh mulch settles, which makes it about 28 bags.</p>
<p>Topping up last year’s mulch? Then 1–2 inches is usually enough, and you need only half as much. The calculator handles several beds at once and shows cubic yards and bags side by side.</p>
<h2>How many cubic feet are in a yard of mulch?</h2>
<p>A “yard” of mulch means a cubic yard: <strong>27 cubic feet</strong>, or a pile 3 ft long, 3 ft wide and 3 ft high. That equals 13.5 bags of 2 cu ft or 9 bags of 3 cu ft. The <a href="/guides/how-many-bags-of-mulch-in-a-yard/">bags of mulch chart</a> lists 1 to 10 yards for every bag size.</p>
<h2>How much is a yard of mulch?</h2>
<p>At a landscape supply yard, plain shredded hardwood or wood-chip mulch usually costs somewhere between $15 and $50 per cubic yard. Dyed, cedar and premium bark mulch cost more. Bagged mulch runs about $3–$7 per 2 cu ft bag – roughly $40–$95 for a yard’s worth of bags.${vgl(Q.mulchHomeguide, Q.mulchLawnstarter)}</p>
<p>So the price per yard of mulch drops a lot once you buy in bulk, even after the delivery fee. Prices depend heavily on your region and the season: enter your local price per yard or per bag under “Extra %, bag size &amp; prices” and the calculator shows your total cost. Yards near you are listed in the <a href="/landscape-supply/">landscape supply directory</a>.</p>
<h2>How deep should mulch be?</h2>
<p>For most flower beds 2–3 inches is right. Less than 2 inches won’t keep weeds down; more than 4 inches can keep water and air from reaching the roots. Around trees, keep mulch a few inches away from the trunk – don’t pile it up in a “volcano”.</p>
<h2>Bulk mulch or bags – which is cheaper?</h2>
<p>Bags are handy for a bed or two and fit in a car. From about 2–3 cubic yards, bulk mulch is usually cheaper per yard, even with a delivery fee. Enter both prices under “Extra %, bag size &amp; prices” to compare them for your project.</p>`,
    faq: [
      ['How many yards of mulch do I need for 1,000 square feet?', 'About 9.3 cubic yards at 3 inches deep and 6.2 cubic yards at 2 inches, before the usual 10 % extra.'],
      ['How much does a bag of mulch weigh?', 'A 2 cu ft bag of wood mulch usually weighs about 30–60 lb, depending on the type and how wet it is. 3 cu ft bags weigh about half as much again.'],
      ['How often should I add new mulch?', 'Most beds need a top-up once a year. Wood mulch breaks down slowly, so 1–2 inches on top of the old layer is usually enough to bring it back to 2–3 inches.'],
    ],
    quellen: [Q.mulchHomeguide, Q.mulchLawnstarter],
  },
  {
    pfad: '/gravel-calculator/',
    art: 'rechner',
    nav: 'Gravel',
    imMenue: true,
    title: 'Gravel Calculator – Tons & Yards (How Much Do I Need?)',
    description: 'Free gravel calculator in tons and cubic yards. Enter your area and depth to see how much gravel you need, what a yard weighs and what it costs.',
    h1: 'Gravel Calculator: How Much Gravel Do You Need?',
    intro: 'Enter your area and depth to get tons (how most yards sell gravel), cubic yards and pickup loads – plus the total cost if you add your local price.',
    kurz: 'Tons of pea gravel & crushed stone',
    material: 'pea-gravel',
    stoff: 'gravel',
    ue: { tonneDeckung: 'How much gravel is in a ton?' },
    kategorien: ['gravel', 'sand'],
    beispiel: { laenge: 30, breite: 4, tiefe: 3 },
    bloecke: ['deckung', 'tonneDeckung', 'gewicht'],
    verwandt: ['/guides/how-much-does-gravel-weigh/', '/tons-to-cubic-yards/', '/guides/dump-truck-load-of-gravel/'],
    inhalt: `${MESSEN}
<h2>How much gravel do I need?</h2>
<p>Work out cubic yards first: <strong>length × width (ft) × depth (in) ÷ 324</strong>. Then multiply by the weight of your gravel – about 1.4 tons per cubic yard for pea gravel and #57 crushed stone. A 30 × 4 ft garden path at 3 inches is 1.1 cubic yards, or roughly 1.6 tons before extra.</p>
<h2>Gravel calculator in tons</h2>
<p>Most yards sell gravel by the ton, so the calculator shows tons first. It uses a typical weight for each gravel type and also gives a range, because wet or very angular stone weighs more. One ton of gravel is about 0.7 cubic yards – enough for roughly 115 sq ft at 2 inches. Order in half-ton steps and round up.</p>
<h2>How many yards of gravel do I need?</h2>
<p>Some suppliers, especially for decorative stone, sell by the cubic yard instead. The calculator shows cubic yards right under the tons: square feet × depth in inches ÷ 324. To switch between yards and tons for any amount, use the <a href="/tons-to-cubic-yards/">cubic yards to tons converter</a>.</p>
<h2>How much does gravel cost?</h2>
<p>Plain gravel is one of the cheapest landscape materials. Crushed stone and pea gravel usually cost about $20–$55 per ton at a sand and gravel yard. River rock and colored decorative stone start around $45 per ton and can cost well over $100.${vgl(Q.gesteinThisOldHouse, Q.erbsenkiesHomeguide, Q.flusskiesHomeguide)}</p>
<h3>How much is a ton of gravel?</h3>
<p>Expect about $20–$55 for common gravel bought in bulk. The same ton in 0.5 cu ft bags (about 40 bags at $4–$8 each) costs several times as much, so bags only make sense for small jobs.${vgl(Q.erbsenkiesHomeguide, Q.erbsenkiesAngi)}</p>
<h3>How much is a yard of gravel?</h3>
<p>A cubic yard of gravel weighs about 1.4 tons, so it typically costs around $30–$80 for pea gravel or crushed stone.${vgl(Q.erbsenkiesHomeguide, Q.gesteinThisOldHouse)}</p>
<h3>How much is a load of gravel?</h3>
<p>A tandem dump truck carries about 12–16 tons. With delivery, a load of common gravel usually comes to somewhere between $250 and $1,000, depending on the stone and how far you are from the pit. More on truck sizes in the <a href="/guides/dump-truck-load-of-gravel/">dump truck load guide</a>.</p>
<p>Prices vary by region – enter your price per ton under “Extra %, bag size &amp; prices” to get your own total.</p>
<h2>How deep should gravel be?</h2>
<p>Garden paths and decorative areas need about 2–3 inches. Patios and walkways that get regular foot traffic do better with 3–4 inches over a compacted base. Driveways need a base layer as well – use the <a href="/driveway-gravel-calculator/">driveway gravel calculator</a>.</p>`,
    faq: [
      ['How many tons of gravel are in a cubic yard?', 'Most gravel weighs about 1.3–1.5 tons per cubic yard. Pea gravel and #57 crushed stone are typically around 1.4 tons.'],
      ['How many cubic yards is a ton of gravel?', 'About 0.7 cubic yards (roughly 19 cubic feet) of typical gravel weighing 1.4 tons per cubic yard.'],
      ['How many tons of gravel do I need for 100 square feet?', 'About 0.9 tons at 2 inches deep and 1.3 tons at 3 inches, before extra for waste.'],
      ['Can I haul gravel in a pickup truck?', 'Yes, but watch the weight: a half-ton pickup can usually carry well under 1 cubic yard of gravel safely. The calculator shows an estimate of trips; for larger amounts delivery is usually the better option.'],
    ],
    quellen: [Q.gesteinThisOldHouse, Q.erbsenkiesHomeguide, Q.flusskiesHomeguide, Q.erbsenkiesAngi],
  },
  {
    pfad: '/topsoil-calculator/',
    art: 'rechner',
    nav: 'Topsoil',
    imMenue: true,
    title: 'Topsoil Calculator – How Much Topsoil Do I Need? (Yards)',
    description: 'Topsoil calculator: enter square feet or length × width and depth to get cubic yards, tons and bags of topsoil for a new lawn, grass seed or garden beds.',
    h1: 'Topsoil Calculator: How Much Topsoil Do You Need?',
    intro: 'Work out how much topsoil you need for a new lawn, grass seed, garden beds or leveling – in cubic yards, tons and bags.',
    kurz: 'Lawns, garden beds, leveling',
    material: 'topsoil',
    stoff: 'topsoil',
    ue: { deckung: 'Topsoil coverage: how far does a cubic yard go?' },
    kategorien: ['soil'],
    beispiel: { laenge: 30, breite: 20, tiefe: 4 },
    verwandt: ['/dirt-calculator/', '/raised-bed-soil-calculator/', '/fill-dirt-calculator/'],
    inhalt: `${MESSEN}
<h2>How much topsoil do I need?</h2>
<p>Multiply the square feet by the depth in inches and divide by 324 to get cubic yards. A 1,000 sq ft lawn area at 4 inches needs about 12.3 cubic yards; a 2-inch layer for overseeding a thin lawn needs about 6.2. If you already know the area in square feet, choose “Known area” as the shape and type it in.</p>
<p>Topsoil settles after it’s spread and watered, so the calculator adds 15 % by default. You can change that under “Extra %, bag size &amp; prices”.</p>
<h2>How deep should topsoil be for grass?</h2>
<p>For a new lawn from seed or sod, plan on 4–6 inches of topsoil over loosened ground. To fill low spots in an existing lawn, spread no more than about half an inch at a time so the grass can grow through. Vegetable and flower beds do best with 6–12 inches of good soil.</p>
<h2>Topsoil, garden soil or fill dirt?</h2>
<ul>
  <li><strong>Topsoil</strong> is screened soil for lawns, grading the top layer and beds.</li>
  <li><strong>Garden soil / raised bed mix</strong> is topsoil blended with compost – best for filling raised beds. Use the <a href="/raised-bed-soil-calculator/">raised bed soil calculator</a>.</li>
  <li><strong>Fill dirt</strong> is cheaper subsoil for filling holes and building up grade. It’s not meant for growing plants. Use the <a href="/fill-dirt-calculator/">fill dirt calculator</a>.</li>
</ul>`,
    faq: [
      ['How much topsoil do I need for a new lawn?', 'Plan on 4–6 inches. 1,000 sq ft at 4 inches needs about 12.3 cubic yards before extra for settling.'],
      ['How many square feet does a yard of topsoil cover?', 'About 162 sq ft at 2 inches, 81 sq ft at 4 inches and 54 sq ft at 6 inches.'],
      ['How much does a cubic yard of topsoil weigh?', 'Dry topsoil typically weighs about 1–1.3 tons per cubic yard. Moist soil is heavier.'],
      ['How many bags of topsoil make a cubic yard?', 'About 27 bags of 1 cu ft or 36 bags of 0.75 cu ft.'],
    ],
  },
  {
    pfad: '/river-rock-calculator/',
    art: 'rechner',
    nav: 'River rock',
    imMenue: true,
    title: 'River Rock Calculator – How Much River Stone Do I Need?',
    description: 'River rock and stone calculator: tons and cubic yards of river rock for beds, borders and dry creek beds, with coverage per ton for 1–3 inch and larger stone.',
    h1: 'River Rock & Stone Calculator',
    intro: 'Enter the area and depth to see how many tons of river rock to order. As a rule, make the layer about twice as deep as the stones are wide.',
    kurz: 'Beds, borders, dry creeks',
    material: 'river-rock',
    stoff: 'river rock',
    ue: { tonneDeckung: 'River rock coverage: how much does a ton cover?' },
    kategorien: ['gravel'],
    beispiel: { laenge: 15, breite: 6, tiefe: 3 },
    bloecke: ['deckung', 'tonneDeckung', 'gewicht'],
    verwandt: ['/landscape-rock-calculator/', '/gravel-calculator/', '/tons-to-cubic-yards/'],
    inhalt: `${MESSEN}
<h2>How much river rock do I need?</h2>
<p>Square feet × depth in inches ÷ 324 gives cubic yards; multiply by about 1.4 to get tons. A 15 × 6 ft bed at 3 inches needs about 0.8 cubic yards, or 1.2 tons. Most yards sell river rock by the ton, so the calculator shows tons first.</p>
<h2>How deep should river rock be?</h2>
<table><thead><tr><th>Stone size</th><th>Typical depth</th><th>Good for</th></tr></thead><tbody>
<tr><td>¾–1½ in</td><td>2–3 in</td><td>Beds, borders, around plants</td></tr>
<tr><td>1–3 in</td><td>3–4 in</td><td>Beds, drainage areas, dry creek beds</td></tr>
<tr><td>2–4 in and larger</td><td>4–6 in</td><td>Dry creek beds, slopes, downspout splash areas</td></tr>
</tbody></table>
<h3>1–3 inch river rock</h3>
<p>The most common size for beds and dry creeks. Lay it 3–4 inches deep so no soil shows between the stones: 100 sq ft at 3 inches takes about 1.3 tons.</p>
<h3>2 inch river rock</h3>
<p>With the twice-the-stone-size rule, 2 inch rock wants a layer of about 4 inches. That’s roughly 1.7 tons per 100 sq ft.</p>
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
    title: 'Driveway Gravel Calculator – Tons & Cost of a Gravel Drive',
    description: 'How much gravel do I need for my driveway? Calculate tons of crusher run base and #57 top stone for a new gravel drive or resurfacing, plus typical costs.',
    h1: 'Driveway Gravel Calculator',
    intro: 'Enter the length and width of your gravel drive. Calculate the top layer of #57 stone first, then switch the material to crusher run for the base layer.',
    kurz: 'Base and top layer in tons',
    material: 'crushed-stone-57',
    tiefe: 4,
    stoff: 'gravel',
    ue: { gewicht: 'How much does driveway gravel weigh?' },
    kategorien: ['gravel'],
    beispiel: { laenge: 50, breite: 12, tiefe: 4 },
    bloecke: ['einfahrt', 'deckung', 'gewicht'],
    verwandt: ['/crushed-stone-calculator/', '/guides/dump-truck-load-of-gravel/', '/tons-to-cubic-yards/'],
    inhalt: `<h2>How much gravel do I need for my driveway?</h2>
<p>Calculate each layer separately: length × width (ft) × depth (in) ÷ 324 gives cubic yards; multiply by the stone’s weight to get tons. A new 50 × 12 ft driveway with 6 inches of crusher run and 3 inches of #57 stone on top needs about 17 tons of base and 8 tons of top stone – before the extra for compaction.</p>
<p>Resurfacing an existing driveway is far less: 2 inches of fresh stone on the same driveway is about 5 tons.</p>
<h2>How thick should a gravel driveway be?</h2>
<p>A new driveway is usually built in layers: about 4–8 inches of crusher run (road base) that is compacted – 6–8 inches for heavy vehicles or soft ground – plus 2–4 inches of #57 crushed stone or similar on top. For resurfacing an existing driveway, 2 inches of top stone is often enough.</p>
<p>A typical single-car driveway is 10–12 ft wide; a two-car driveway is 20–24 ft wide. Crusher run compacts a lot, so the calculator adds 15 % for it automatically.</p>
<h2>How much does a gravel driveway cost?</h2>
<p>Installed by a contractor, a gravel driveway typically costs about $1–$3 per square foot, depending on how much digging and base work is needed. If you spread it yourself, the gravel alone usually comes to about $0.50–$1.50 per square foot. For a 24 × 24 ft two-car driveway that’s roughly $600–$1,800 installed.${vgl(Q.einfahrtHomeguide, Q.einfahrtLawnstarter)}</p>
<p>To estimate your own cost, enter your supplier’s price per ton under “Extra %, bag size &amp; prices” for each layer and add the delivery fee.</p>`,
    faq: [
      ['How many tons of gravel do I need for a driveway?', 'Multiply length × width in feet, then by the depth in inches, divide by 324 to get cubic yards, and multiply by about 1.4–1.6 tons per cubic yard. A 50 × 12 ft driveway with 4 inches of stone needs roughly 10–11 tons.'],
      ['What is the best gravel for a driveway?', 'A compacted base of crusher run (also called road base or dense grade aggregate) with a top layer of angular crushed stone such as #57 is a common, durable combination. Round pea gravel tends to shift under tires.'],
      ['How many truckloads of gravel do I need for a driveway?', 'A standard tandem dump truck usually brings about 12–16 tons of gravel. Divide your total tons by that to estimate loads.'],
    ],
    quellen: [Q.einfahrtHomeguide, Q.einfahrtLawnstarter],
  },
  {
    pfad: '/cubic-yard-calculator/',
    art: 'rechner',
    nav: 'Cubic yards',
    imMenue: true,
    title: 'Cubic Yard Calculator & Conversion (Sq Ft, Cu Ft to Yards)',
    description: 'Convert square feet, cubic feet or square yards and depth into cubic yards. Works for rectangles, circles, round holes and irregular areas – free and instant.',
    h1: 'Cubic Yard Calculator & Conversion',
    intro: 'Enter length, width and depth – or an area you already know – and get cubic yards and cubic feet. Handy for mulch, soil, gravel, sand or concrete.',
    kurz: 'Square feet → cubic yards',
    material: 'topsoil',
    nurVolumen: true,
    beispiel: { laenge: 12, breite: 12, tiefe: 4 },
    verwandt: ['/tons-to-cubic-yards/', '/dirt-calculator/', '/mulch-calculator/'],
    inhalt: `${MESSEN}
<h2>How to calculate cubic yards</h2>
<p><strong>Cubic yards = length (ft) × width (ft) × depth (in) ÷ 12 ÷ 27.</strong> Dividing by 12 turns the depth into feet; dividing by 27 turns cubic feet into cubic yards, because one cubic yard is 3 ft × 3 ft × 3 ft. A 12 × 12 ft area at 4 inches is 48 cubic feet, or 1.78 cubic yards.</p>
<h2>Square feet to cubic yards</h2>
<p>If you already know the area, pick “Known area” as the shape and type the square feet. Quick rule: <strong>square feet × depth in inches ÷ 324 = cubic yards</strong>. 500 sq ft at 2 inches is 3.1 cubic yards.</p>
<h2>Cubic feet to cubic yards</h2>
<p>Divide cubic feet by 27. 100 cubic feet is 3.7 cubic yards. Going the other way, a 2 cu ft bag is 0.074 cubic yards – which is why 13.5 bags make a yard.</p>
<h2>Square yards to cubic yards</h2>
<p>A square yard is 9 sq ft. Multiply square yards by the depth in inches and divide by 36. For example, 50 square yards at 4 inches is 5.6 cubic yards.</p>
<h2>Cubic yards of a cylinder or round hole</h2>
<p>For round beds, holes, tanks or tubes, pick “Circle” and enter the diameter, then the depth in inches (3 ft = 36 in). Behind it is the cylinder formula: 3.1416 × radius² × depth in feet ÷ 27. A round hole 4 ft across and 3 ft deep holds about 1.4 cubic yards.</p>
<h2>Cubic yard conversion chart</h2>
<table><thead><tr><th>1 cubic yard equals</th><th>Value</th></tr></thead><tbody>
<tr><td>Cubic feet</td><td>27</td></tr>
<tr><td>Cubic inches</td><td>46,656</td></tr>
<tr><td>Cubic meters</td><td>0.765</td></tr>
<tr><td>U.S. gallons</td><td>about 202</td></tr>
<tr><td>2 cu ft bags</td><td>13.5</td></tr>
</tbody></table>
<h2>Cubic yards to tons</h2>
<p>Gravel, sand and stone are usually sold by weight. Convert with the <a href="/tons-to-cubic-yards/">cubic yards to tons converter</a>.</p>`,
    faq: [
      ['How many square feet are in a cubic yard?', 'It depends on the depth: one cubic yard covers 324 sq ft at 1 inch, 162 sq ft at 2 inches, 108 sq ft at 3 inches and 81 sq ft at 4 inches.'],
      ['How many cubic feet are in a cubic yard?', 'There are 27 cubic feet in one cubic yard.'],
      ['How do I convert cubic feet to cubic yards?', 'Divide the cubic feet by 27. For example, 54 cubic feet is 2 cubic yards.'],
      ['How do I convert square yards to cubic yards?', 'Multiply the square yards by the depth in inches and divide by 36.'],
    ],
  },
  {
    pfad: '/dirt-calculator/',
    art: 'rechner',
    nav: 'Dirt',
    imMenue: false,
    title: 'Dirt Calculator – How Many Yards of Dirt Do I Need?',
    description: 'Dirt calculator for cubic yards, cubic feet and tons of dirt: fill dirt, topsoil or garden dirt for holes, beds, leveling and grading – with truckloads.',
    h1: 'Dirt Calculator: Yards, Cubic Feet & Tons of Dirt',
    intro: 'Find out how many cubic yards and tons of dirt you need – for filling, leveling, beds or a new lawn. Pick fill dirt, topsoil or garden soil as the material.',
    kurz: 'Yards & tons of dirt',
    material: 'fill-dirt',
    stoff: 'dirt',
    kategorien: ['soil'],
    beispiel: { laenge: 20, breite: 15, tiefe: 6 },
    verwandt: ['/fill-dirt-calculator/', '/topsoil-calculator/', '/raised-bed-soil-calculator/'],
    inhalt: `${MESSEN}
<h2>How many yards of dirt do I need?</h2>
<p>Multiply length × width in feet by the depth in inches and divide by 324. A 20 × 15 ft area filled 6 inches deep needs about 5.6 cubic yards – plus 15–20 % if the dirt will be compacted.</p>
<h2>Volume of dirt in cubic feet and cubic yards</h2>
<p>Volume is length × width × depth, all in feet – so turn inches into feet first (6 inches = 0.5 ft). The same 20 × 15 ft area at 6 inches is 150 cubic feet. Divide by 27 to get cubic yards. Bagged soil is sold in cubic feet, bulk dirt by the cubic yard; the calculator shows both.</p>
<h2>Dirt calculator in tons</h2>
<p>Some pits and haulers sell dirt by the ton. A cubic yard of dirt weighs roughly 1.1–1.3 tons, more when it’s wet or full of clay. Pick “Fill dirt” and the calculator shows tons next to the yards.</p>
<h2>Which dirt should I order?</h2>
<table><thead><tr><th>Job</th><th>Material</th><th>Why</th></tr></thead><tbody>
<tr><td>Fill a hole, low spot, old pool</td><td>Fill dirt</td><td>Cheapest, compacts well, not for planting</td></tr>
<tr><td>Grade around a house</td><td>Fill dirt, then 4 in topsoil</td><td>Fill builds the slope, topsoil grows grass</td></tr>
<tr><td>New lawn, top layer</td><td>Topsoil</td><td>Screened soil that grass roots into</td></tr>
<tr><td>Garden beds, raised beds</td><td>Garden dirt (soil mix)</td><td>Topsoil plus compost, drains and feeds plants</td></tr>
</tbody></table>
<p>For garden dirt in raised beds, the <a href="/raised-bed-soil-calculator/">raised bed soil calculator</a> lets you add each bed separately.</p>
<h2>How many truckloads of dirt?</h2>
<p>A single-axle dump truck carries about 5–8 cubic yards, a tandem about 10–14 cubic yards. Divide your cubic yards by the truck size your supplier uses. See <a href="/guides/dump-truck-load-of-gravel/">dump truck sizes</a>.</p>`,
    faq: [
      ['How many cubic feet are in a yard of dirt?', 'One cubic yard of dirt is 27 cubic feet.'],
      ['How much dirt do I need to fill a hole?', 'Measure length, width and average depth of the hole, enter them above and add 15–20 % for compaction.'],
      ['How much garden dirt do I need?', 'Multiply the bed area in square feet by the depth in inches and divide by 324. A 4 × 8 ft bed filled 12 inches deep needs about 1.2 cubic yards.'],
    ],
  },
  {
    pfad: '/fill-dirt-calculator/',
    art: 'rechner',
    nav: 'Fill dirt',
    imMenue: false,
    title: 'Fill Dirt & Backfill Calculator – Yards and Tons',
    description: 'Fill dirt and backfill calculator: cubic yards, tons and truckloads of fill dirt for holes, trenches, grading and pool fill-ins, with extra for compaction.',
    h1: 'Fill Dirt & Backfill Calculator',
    intro: 'Fill dirt shrinks when it’s compacted. Enter the area and depth to fill – the calculator adds extra for compaction and shows cubic yards, tons and truckloads.',
    kurz: 'Backfill & grading with compaction',
    material: 'fill-dirt',
    tiefe: 12,
    stoff: 'fill dirt',
    kategorien: ['soil'],
    beispiel: { laenge: 30, breite: 15, tiefe: 12 },
    verwandt: ['/dirt-calculator/', '/topsoil-calculator/', '/guides/dump-truck-load-of-gravel/'],
    inhalt: `${MESSEN}
<h2>How much fill dirt do I need?</h2>
<p>Measure the area and the average depth you need to fill, then multiply: square feet × depth in inches ÷ 324 = cubic yards. A 30 × 15 ft low spot filled a foot deep takes about 16.7 cubic yards – closer to 20 once it’s compacted.</p>
<h2>Backfill calculator for trenches and foundations</h2>
<p>For a trench, enter its length, width and depth as a rectangle. For backfill along a foundation wall, use the length of the wall, the width of the gap you’re filling and its depth. Backfill is compacted in layers, so leave the extra at 15–25 %.</p>
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
    description: 'Sand calculator for cubic yards, tons and bags: play sand for a sandbox, masonry sand, fill sand and arena sand – enter the area and depth.',
    h1: 'Sand Calculator: How Much Sand Do You Need?',
    intro: 'Enter the area and depth to see how much sand you need in cubic yards, tons and 50 lb bags – for sandboxes, leveling, arenas or under pavers.',
    kurz: 'Fill, masonry & play sand',
    material: 'masonry-sand',
    stoff: 'sand',
    kategorien: ['sand'],
    beispiel: { laenge: 10, breite: 10, tiefe: 2 },
    bloecke: ['deckung', 'tonneDeckung', 'gewicht'],
    verwandt: ['/paver-sand-calculator/', '/tons-to-cubic-yards/', '/gravel-calculator/'],
    inhalt: `${MESSEN}
<h2>How much sand do I need?</h2>
<p>Square feet × depth in inches ÷ 324 = cubic yards of sand. Multiply by about 1.35 to get tons. A 10 × 10 ft area at 2 inches needs 0.6 cubic yards, or about 0.8 tons – roughly 34 bags of 0.5 cu ft.</p>
<h2>Which sand do I need?</h2>
<table><thead><tr><th>Use</th><th>Sand type</th><th>Typical depth</th></tr></thead><tbody>
<tr><td>Under pavers</td><td>Concrete / bedding sand</td><td>1 in – see the <a href="/paver-sand-calculator/">paver sand calculator</a></td></tr>
<tr><td>Sandbox</td><td>Washed play sand</td><td>6–12 in</td></tr>
<tr><td>Riding arena footing</td><td>Washed, angular arena sand</td><td>2–4 in over a compacted base</td></tr>
<tr><td>Leveling, backfill</td><td>Fill sand</td><td>As needed</td></tr>
<tr><td>Mortar, masonry</td><td>Masonry sand</td><td>–</td></tr>
</tbody></table>
<h2>Sandbox sand calculator: how much play sand?</h2>
<p>Pick “Sandbox” as the project to prefill play sand at 12 inches. A 5 × 5 ft sandbox filled 12 inches deep needs about 0.9 cubic yards, or about 50 bags of 0.5 cu ft. Leave a few inches below the rim so the sand stays in the box.</p>
<h2>Masonry sand</h2>
<p>Masonry sand is fine, washed sand for mortar and for a smooth top layer under play equipment or above ground pools. For mortar, the amount depends on your mix rather than an area – follow the ratio on the cement bag.</p>
<h2>Arena sand</h2>
<p>The loose footing in a riding arena is usually only 2–4 inches deep; it sits on a firm, compacted base. A 60 × 120 ft arena at 3 inches needs about 67 cubic yards – roughly 90 tons of sand.${vgl(Q.reitplatzUky, Q.reitplatzFarmProgress)}</p>`,
    faq: [
      ['How many bags of sand are in a cubic yard?', 'About 54 bags of 0.5 cu ft (a typical 50 lb bag).'],
      ['How many cubic yards is a ton of sand?', 'Dry sand weighs about 1.25–1.4 tons per cubic yard, so one ton is roughly 0.75 cubic yards (20 cubic feet).'],
      ['How much sand do I need for a sandbox?', 'Multiply length × width in feet by the depth in inches and divide by 324. A 6 × 6 ft box at 12 inches needs about 1.3 cubic yards; a 4 × 4 ft box about 16 cubic feet, or 32 bags of 0.5 cu ft.'],
    ],
    quellen: [Q.reitplatzUky, Q.reitplatzFarmProgress],
  },
  {
    pfad: '/paver-sand-calculator/',
    art: 'rechner',
    nav: 'Paver sand',
    imMenue: false,
    title: 'Paver Sand Calculator – Bedding & Polymeric Sand for Pavers',
    description: 'Paver sand calculator: how much bedding sand you need under pavers in cubic yards, tons and bags – plus how many bags of polymeric joint sand.',
    h1: 'Paver Sand Calculator (Bedding & Polymeric Sand)',
    intro: 'Pavers sit on about 1 inch of bedding sand over a compacted gravel base. Enter your patio or walkway size to get the sand in tons, cubic yards and bags.',
    kurz: 'Bedding sand under pavers',
    material: 'paver-sand',
    tiefe: 1,
    stoff: 'paver sand',
    ue: { gewicht: 'Weight of paver sand and base gravel per yard' },
    kategorien: ['sand', 'gravel'],
    beispiel: { laenge: 16, breite: 12, tiefe: 1 },
    verwandt: ['/sand-calculator/', '/crushed-stone-calculator/', '/driveway-gravel-calculator/'],
    inhalt: `${MESSEN}
<h2>How much sand do I need for pavers?</h2>
<p>At the usual 1 inch, square feet ÷ 324 = cubic yards of bedding sand. A 12 × 16 ft patio (192 sq ft) needs about 0.6 cubic yards – roughly 0.8 tons or 32 bags of 0.5 cu ft. Screed it level; don’t compact the sand before the pavers go down.</p>
<h2>Layers under a paver patio</h2>
<table><thead><tr><th>Layer</th><th>Material</th><th>Thickness</th></tr></thead><tbody>
<tr><td>Pavers</td><td>Concrete or stone pavers</td><td>2⅜ in or more</td></tr>
<tr><td>Bedding</td><td>Concrete sand (coarse, washed)</td><td>1 in</td></tr>
<tr><td>Base</td><td>Crusher run / road base, compacted</td><td>4 in for patios, 6–8 in for driveways</td></tr>
</tbody></table>
<p>Calculate the base with the <a href="/crushed-stone-calculator/">crushed stone calculator</a> (choose crusher run).</p>
<h2>Polymeric sand calculator: how many bags for the joints?</h2>
<p>Joint sand goes by coverage per bag, not by depth. A 50 lb bag of polymeric sand typically covers about 40–85 sq ft when the joints are narrow (⅛–¼ in), but only about 20–40 sq ft with wide joints or small, deep pavers. Divide your patio area by the coverage printed on your bag and buy one extra.${vgl(Q.fugensandSakrete, Q.fugensandRatgeber)}</p>
<p>For the 192 sq ft patio above with narrow joints, that’s 3–5 bags.</p>`,
    faq: [
      ['Should I compact the bedding sand before laying pavers?', 'No. Screed the sand to an even 1 inch and lay the pavers on the loose sand; the plate compactor goes over the pavers afterwards and settles them into the sand.'],
      ['How many bags of polymeric sand do I need?', 'Divide the paved area by the coverage on the bag – usually about 40–85 sq ft per 50 lb bag with narrow joints and 20–40 sq ft with wide joints.'],
      ['Can I use play sand under pavers?', 'It isn’t recommended. Play sand is fine and rounded; coarse concrete sand locks together better and drains.'],
      ['How many bags of paver sand do I need?', 'One 0.5 cu ft bag covers about 6 sq ft at 1 inch. Divide your patio area by 6.'],
    ],
    quellen: [Q.fugensandSakrete, Q.fugensandRatgeber],
  },
  {
    pfad: '/raised-bed-soil-calculator/',
    art: 'rechner',
    nav: 'Raised bed',
    imMenue: false,
    title: 'Raised Bed Soil Calculator – How Much Dirt Fills a Bed?',
    description: 'Raised bed and garden bed dirt calculator: how much soil fills your beds in cubic feet, cubic yards and bags. Add several beds at once.',
    h1: 'Raised Bed Soil Calculator: How Much Dirt Do You Need?',
    intro: 'Enter each bed’s length and width and use the bed height as depth. You get the soil in cubic feet, cubic yards and bags – add as many beds as you like.',
    kurz: 'Soil for raised garden beds',
    material: 'garden-soil',
    form: 'rectangle',
    stoff: 'garden soil',
    ue: { beete: 'How much soil for common raised bed sizes?' },
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
<h2>How much dirt do I need for a raised bed?</h2>
<p>Length × width × height in feet gives cubic feet. A 4 × 8 ft bed that’s 1 ft tall holds 32 cubic feet – about 1.2 cubic yards. Bags are sold in cubic feet, bulk soil by the cubic yard (27 cubic feet), so the calculator shows both.</p>
<p>Very tall beds don’t need to be filled with soil all the way down. Many gardeners put logs, branches or leaves in the bottom third and use good soil only for the top 12 inches or so.</p>
<h2>Bags or bulk for raised beds?</h2>
<p>A single 4 × 8 ft bed 12 inches deep needs about 32 cubic feet – around 22 bags of 1.5 cu ft. From two or three beds on, bulk garden soil from a <a href="/landscape-supply/">landscape supply yard</a> is usually much cheaper.</p>
<h2>What dirt goes in a raised garden bed?</h2>
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
    title: 'Pea Gravel Calculator – How Much Pea Gravel Do I Need?',
    description: 'Pea gravel calculator: tons, cubic yards and bags of pea gravel for paths, patios, play areas and dog runs – plus what a yard weighs and costs.',
    h1: 'Pea Gravel Calculator: How Much Do You Need?',
    intro: 'Enter the area and depth to see how many tons, cubic yards and bags of pea gravel you need for paths, patios or play areas.',
    kurz: 'Paths, patios, play areas',
    material: 'pea-gravel',
    stoff: 'pea gravel',
    ue: { tonneDeckung: 'How much pea gravel is in a ton?' },
    kategorien: ['gravel'],
    beispiel: { laenge: 12, breite: 12, tiefe: 3 },
    bloecke: ['deckung', 'tonneDeckung', 'gewicht'],
    verwandt: ['/gravel-calculator/', '/crushed-stone-calculator/', '/guides/how-much-does-gravel-weigh/'],
    inhalt: `${MESSEN}
<h2>How much pea gravel do I need?</h2>
<p>Square feet × depth in inches ÷ 324 = cubic yards; multiply by 1.4 for tons. A 12 × 12 ft patio at 3 inches takes about 1.3 cubic yards – a little under 2 tons. One ton of pea gravel is about 0.7 cubic yards and covers roughly 115 sq ft at 2 inches.</p>
<h2>How deep should pea gravel be?</h2>
<table><thead><tr><th>Project</th><th>Depth</th></tr></thead><tbody>
<tr><td>Garden path, walkway</td><td>2–3 in over landscape fabric</td></tr>
<tr><td>Patio, seating area</td><td>3–4 in, with edging</td></tr>
<tr><td>Play area</td><td>9–12 in for fall protection</td></tr>
<tr><td>Dog run</td><td>3–4 in</td></tr>
</tbody></table>
<p>Pea gravel is round and shifts underfoot, so edging matters. For driveways and parking areas, angular <a href="/crushed-stone-calculator/">crushed stone</a> stays in place better.</p>
<h2>How much is pea gravel?</h2>
<p>Bulk pea gravel usually costs about $30–$55 per ton, or $45–$80 per cubic yard. In 0.5 cu ft bags it’s about $5–$8 each, which adds up fast – around 40 bags make a ton. A small truckload of 2–7 tons delivered typically runs a few hundred dollars. Colored pea gravel costs more.${vgl(Q.erbsenkiesHomeguide)}</p>`,
    faq: [
      ['How many bags of pea gravel are in a ton?', 'About 40 bags of 0.5 cu ft (around 50 lb each).'],
      ['How many bags of pea gravel do I need?', 'One 0.5 cu ft bag covers about 3 sq ft at 2 inches deep. Divide your area by 3 – or, from about half a ton, buy in bulk instead.'],
      ['Is pea gravel good for a driveway?', 'Not on its own: the round stones roll and rut under tires. Angular crushed stone over a compacted base holds much better.'],
    ],
    quellen: [Q.erbsenkiesHomeguide],
  },
  {
    pfad: '/landscape-rock-calculator/',
    art: 'rechner',
    nav: 'Landscape rock',
    imMenue: false,
    title: 'Landscape Rock Calculator – Tons & Coverage',
    description: 'Landscape rock calculator: how many tons and cubic yards of decorative rock you need for beds and xeriscaping, with coverage per ton and per square foot.',
    h1: 'Landscape Rock Calculator',
    intro: 'Decorative rock is sold by the ton. Enter the bed size and depth to see tons, cubic yards and how much area each ton covers.',
    kurz: 'Decorative rock in tons',
    material: 'landscape-rock',
    stoff: 'landscape rock',
    ue: { tonneDeckung: 'Landscape rock coverage per ton' },
    kategorien: ['gravel'],
    beispiel: { laenge: 20, breite: 8, tiefe: 3 },
    bloecke: ['deckung', 'tonneDeckung', 'gewicht'],
    verwandt: ['/river-rock-calculator/', '/pea-gravel-calculator/', '/tons-to-cubic-yards/'],
    inhalt: `${MESSEN}
<h2>How much landscape rock do I need?</h2>
<p>Square feet × depth in inches ÷ 324 gives cubic yards; multiply by about 1.35 for tons. A 20 × 8 ft bed (160 sq ft) at 3 inches needs about 1.5 cubic yards, or 2 tons. Per 100 square feet, plan on about 1.3 tons at 3 inches.</p>
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
    title: 'Crushed Stone Calculator – 3/4 Inch #57 Stone & Crusher Run',
    description: 'Crushed stone calculator for 3/4 inch #57 stone and crusher run: tons and cubic yards for driveways, shed and patio bases and drainage.',
    h1: 'Crushed Stone Calculator (3/4 Inch #57 & Crusher Run)',
    intro: 'Enter your area and depth to get tons and cubic yards of crushed stone – #57 (about ¾ inch) for drainage and top layers, or crusher run for compacted bases.',
    kurz: '#57 stone & crusher run',
    material: 'crushed-stone-57',
    tiefe: 4,
    stoff: 'crushed stone',
    kategorien: ['gravel'],
    beispiel: { laenge: 20, breite: 12, tiefe: 4 },
    bloecke: ['deckung', 'tonneDeckung', 'gewicht'],
    verwandt: ['/driveway-gravel-calculator/', '/paver-sand-calculator/', '/guides/dump-truck-load-of-gravel/'],
    inhalt: `${MESSEN}
<h2>How much 3/4 inch crushed stone do I need?</h2>
<p>Square feet × depth in inches ÷ 324 = cubic yards; ¾ inch #57 stone weighs about 1.4 tons per cubic yard. A 10 × 12 ft shed base at 4 inches needs about 1.5 cubic yards, or 2.1 tons. Crusher run is a little heavier (about 1.55 tons per yard) and compacts, so the calculator adds 15 % for it.</p>
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
    description: 'Rubber mulch calculator: how many bags of rubber mulch you need for beds or playgrounds, with coverage per bag and per cubic yard, and what it costs.',
    h1: 'Rubber Mulch Calculator',
    intro: 'Rubber mulch is usually sold in 0.8 or 1.5 cu ft bags. Enter your area and depth to see how many bags – or cubic yards – you need.',
    kurz: 'Beds & playgrounds',
    material: 'rubber-mulch',
    stoff: 'rubber mulch',
    kategorien: ['mulch'],
    beispiel: { laenge: 20, breite: 15, tiefe: 6 },
    bloecke: ['saecke', 'deckung', 'gewicht'],
    verwandt: ['/mulch-calculator/', '/guides/how-many-bags-of-mulch-in-a-yard/', '/pea-gravel-calculator/'],
    inhalt: `${MESSEN}
<h2>How deep should rubber mulch be?</h2>
<p>For beds, 2–3 inches is enough because rubber mulch doesn’t break down. Playgrounds usually need about 6 inches – check the fall-height rating of your product, which is tested at a specific depth.</p>
<h2>Rubber mulch coverage</h2>
<p>A 0.8 cu ft bag covers about 4.8 sq ft at 2 inches or 1.6 sq ft at 6 inches. A 1.5 cu ft bag covers about 9 sq ft at 2 inches. A cubic yard – about 34 bags of 0.8 cu ft – covers 162 sq ft at 2 inches or 54 sq ft at 6 inches.</p>
<h2>How much is rubber mulch?</h2>
<p>Rubber mulch costs several times as much as wood mulch: bags start at around $6 for 0.8 cu ft, which works out to roughly $200 per cubic yard.${vgl(Q.mulchThisOldHouse)} In return it lasts for years without topping up. Colored and playground-certified products cost more, and larger playgrounds are often cheaper with bulk delivery – ask for a quote.</p>`,
    faq: [
      ['How many bags of rubber mulch do I need for a playground?', 'At 6 inches, a 20 × 15 ft playground (300 sq ft) needs about 150 cubic feet – roughly 188 bags of 0.8 cu ft or 100 bags of 1.5 cu ft.'],
      ['How much area does a bag of rubber mulch cover?', 'A 0.8 cu ft bag covers about 4.8 sq ft at 2 inches and 1.6 sq ft at 6 inches.'],
      ['How much does a bag of rubber mulch weigh?', 'A 0.8 cu ft bag weighs about 16–23 lb, depending on the product.'],
    ],
    quellen: [Q.mulchThisOldHouse],
  },
  // ---------- Umrechner ----------
  {
    pfad: '/tons-to-cubic-yards/',
    art: 'umrechner',
    nav: 'Tons ↔ yards',
    imMenue: false,
    title: 'Cubic Yards to Tons Calculator – Gravel, Sand, Soil',
    description: 'Cubic yard to ton calculator for gravel, crushed stone, sand, topsoil and mulch – and tons back to cubic yards, with a conversion chart.',
    h1: 'Cubic Yards to Tons Calculator',
    intro: 'Convert between cubic yards and tons for any material. Suppliers sell gravel and stone by the ton and mulch and soil by the yard – this tells you how they compare.',
    kurz: 'Convert cubic yards ↔ tons',
    material: 'pea-gravel',
    bloecke: ['umrechnung'],
    verwandt: ['/gravel-calculator/', '/guides/how-much-does-gravel-weigh/', '/cubic-yard-calculator/'],
    inhalt: `<h2>How to convert cubic yards to tons</h2>
<p><strong>Tons = cubic yards × weight per cubic yard.</strong> Gravel and stone weigh about 1.3–1.5 tons per cubic yard, so 5 cubic yards of #57 stone is about 7 tons.</p>
<h2>How to convert tons to cubic yards</h2>
<p><strong>Cubic yards = tons ÷ weight per cubic yard.</strong> One ton of stone or gravel is roughly 0.7 cubic yards. Light materials are the opposite: a ton of mulch is several cubic yards.</p>`,
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
    ue: { saecke: 'Bags per cubic yard by bag size' },
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
