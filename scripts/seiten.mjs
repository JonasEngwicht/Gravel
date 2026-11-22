// Seiten der Rechner. Reihenfolge = Reihenfolge im Menü und in "More calculators".
// Felder: pfad, nav (Menütext), imMenue, title (≤ 60 Zeichen), description, h1, intro, kurz (Kacheltext),
// material (Standard aus data/materials.json), tiefe (Zoll, sonst default_depth_in), form, nurVolumen,
// kategorien (für die Gewichtstabelle), inhalt (HTML unter dem Rechner), faq ([Frage, Antwort]).

const MESSEN = `<h2>How to measure your area</h2>
<ul>
  <li><strong>Rectangle or square:</strong> measure length and width in feet.</li>
  <li><strong>Circle:</strong> measure straight across the widest point (the diameter).</li>
  <li><strong>Triangle:</strong> measure the base and the height at a right angle to it.</li>
  <li><strong>Ring around a tree:</strong> measure the outer diameter of the bed and the trunk (or the area you keep clear).</li>
  <li><strong>Irregular bed:</strong> split it into simple shapes and add each one as a section.</li>
</ul>`;

export const SEITEN = [
  {
    pfad: '/',
    nav: 'All materials',
    imMenue: false,
    title: 'Mulch, Gravel & Topsoil Calculator – How Much Do I Need?',
    description: 'Free calculator for mulch, gravel, stone, topsoil and sand. Get cubic yards, tons, bags and cost for any bed, path or driveway in seconds.',
    h1: 'Mulch, Gravel & Soil Calculator',
    intro: 'Find out how many cubic yards, tons or bags you need – and what it will cost – for beds, paths, driveways and lawns.',
    kurz: 'Any material',
    material: 'hardwood-mulch',
    inhalt: `${MESSEN}
<h2>Recommended depths by project</h2>
<table><thead><tr><th>Project</th><th>Typical material</th><th>Depth</th></tr></thead><tbody>
<tr><td>Flower bed</td><td>Mulch</td><td>2–3 in</td></tr>
<tr><td>Tree ring</td><td>Mulch</td><td>2–3 in, kept off the trunk</td></tr>
<tr><td>Garden path</td><td>Pea gravel</td><td>2–3 in</td></tr>
<tr><td>Gravel driveway</td><td>Crusher run base + #57 stone</td><td>4–6 in base, 2–4 in top</td></tr>
<tr><td>New lawn</td><td>Topsoil</td><td>4–6 in</td></tr>
<tr><td>Lawn top dressing</td><td>Compost</td><td>¼–½ in</td></tr>
<tr><td>Raised bed</td><td>Topsoil / soil mix</td><td>Full bed height</td></tr>
</tbody></table>`,
    faq: [
      ['How do I calculate cubic yards?', 'Multiply the area in square feet by the depth in inches, divide by 12 to get cubic feet, then divide by 27. For example, 324 sq ft at 3 inches is 81 cubic feet, or 3 cubic yards.'],
      ['Is it cheaper to buy in bulk or in bags?', 'For small jobs under about 1 cubic yard, bags are often simpler. From roughly 2–3 cubic yards upward, bulk material from a landscape supply yard is usually much cheaper, even with a delivery fee.'],
      ['Why add extra material?', 'Material settles and compacts, edges are rarely perfect, and some is lost while spreading. Adding 10–15 % avoids a second trip.'],
    ],
  },
  {
    pfad: '/mulch-calculator/',
    nav: 'Mulch',
    imMenue: true,
    title: 'Mulch Calculator – Cubic Yards & Bags of Mulch',
    description: 'How much mulch do I need? Enter your bed size and depth to get cubic yards, number of bags and cost. Works for flower beds, tree rings and irregular beds.',
    h1: 'Mulch Calculator',
    intro: 'Enter the size of your beds and how deep you want the mulch. You get cubic yards for bulk delivery, the number of bags, and a cost comparison.',
    kurz: 'Beds, tree rings, bags vs. bulk',
    material: 'hardwood-mulch',
    kategorien: ['mulch'],
    inhalt: `${MESSEN}
<h2>How deep should mulch be?</h2>
<p>For most flower beds 2–3 inches is right. Less than 2 inches won't keep weeds down; more than 4 inches can keep water and air from reaching the roots. Around trees, keep mulch a few inches away from the trunk – don't pile it up in a “volcano”.</p>
<p>A quick rule of thumb: <strong>square feet × depth in inches ÷ 324 = cubic yards</strong>.</p>`,
    faq: [
      ['How many bags of mulch are in a cubic yard?', 'A cubic yard is 27 cubic feet, so it equals about 13.5 bags of 2 cu ft, 18 bags of 1.5 cu ft, or 9 bags of 3 cu ft.'],
      ['How much area does a cubic yard of mulch cover?', 'At 3 inches deep, one cubic yard covers about 108 square feet. At 2 inches it covers about 162 square feet.'],
      ['Is bagged or bulk mulch cheaper?', 'Bulk mulch is usually cheaper per cubic yard once you need more than 2–3 cubic yards, even after a delivery fee. Bags make sense for small beds or if you can’t take a delivery.'],
      ['How much does a cubic yard of mulch weigh?', 'Dry shredded hardwood mulch typically weighs about 400–800 lb per cubic yard. Wet mulch can be considerably heavier.'],
    ],
  },
  {
    pfad: '/gravel-calculator/',
    nav: 'Gravel',
    imMenue: true,
    title: 'Gravel Calculator – Tons & Cubic Yards of Gravel',
    description: 'How much gravel do I need? Calculate tons and cubic yards of pea gravel, crushed stone or decomposed granite for paths, patios and driveways.',
    h1: 'Gravel Calculator',
    intro: 'Gravel is usually sold by the ton. Enter your area and depth to get tons, cubic yards and how many pickup loads it takes.',
    kurz: 'Tons of pea gravel & crushed stone',
    material: 'pea-gravel',
    kategorien: ['gravel', 'sand'],
    inhalt: `${MESSEN}
<h2>How deep should gravel be?</h2>
<p>Garden paths and decorative areas need about 2–3 inches. Patios and walkways that get regular foot traffic do better with 3–4 inches over a compacted base. Driveways need a base layer as well – use the <a href="/driveway-gravel-calculator/">driveway gravel calculator</a>.</p>`,
    faq: [
      ['How many tons of gravel are in a cubic yard?', 'Most gravel weighs about 1.3–1.5 tons per cubic yard. Pea gravel and #57 crushed stone are typically around 1.4 tons.'],
      ['How much area does a ton of gravel cover?', 'At 2 inches deep, one ton of pea gravel covers roughly 115 square feet; at 3 inches about 75–80 square feet.'],
      ['Can I haul gravel in a pickup truck?', 'Yes, but watch the weight: a half-ton pickup can usually carry well under 1 cubic yard of gravel safely. The calculator shows an estimate of trips; for larger amounts delivery is usually the better option.'],
    ],
  },
  {
    pfad: '/topsoil-calculator/',
    nav: 'Topsoil',
    imMenue: true,
    title: 'Topsoil Calculator – How Much Topsoil Do I Need?',
    description: 'Calculate cubic yards, tons and bags of topsoil for a new lawn, garden beds or raised beds. Includes extra for settling.',
    h1: 'Topsoil Calculator',
    intro: 'Work out how much topsoil you need for a new lawn, garden beds or raised beds – in cubic yards, tons and bags.',
    kurz: 'Lawns, garden & raised beds',
    material: 'topsoil',
    kategorien: ['soil'],
    inhalt: `${MESSEN}
<h2>How deep should topsoil be?</h2>
<p>For a new lawn plan on 4–6 inches. Vegetable beds benefit from 6–12 inches of good soil. For a raised bed, use the full height of the bed as the depth. Topsoil settles after it’s placed, so the calculator adds 15 % by default.</p>`,
    faq: [
      ['How much does a cubic yard of topsoil weigh?', 'Dry topsoil typically weighs about 1–1.3 tons per cubic yard. Moist soil is heavier.'],
      ['How many bags of topsoil make a cubic yard?', 'About 27 bags of 1 cu ft or 36 bags of 0.75 cu ft.'],
      ['How much topsoil do I need for a raised bed?', 'Multiply length × width of the bed and use its height as the depth. A 4 × 8 ft bed that is 12 inches deep needs about 1.2 cubic yards, plus a little extra for settling.'],
    ],
  },
  {
    pfad: '/river-rock-calculator/',
    nav: 'River rock',
    imMenue: true,
    title: 'River Rock Calculator – Tons of River Rock Needed',
    description: 'Calculate how many tons and cubic yards of river rock you need for beds, borders and dry creek beds.',
    h1: 'River Rock Calculator',
    intro: 'Enter the area and depth to see how many tons of river rock to order. As a rule, make the layer about twice as deep as the stones are wide.',
    kurz: 'Beds, borders, dry creeks',
    material: 'river-rock',
    kategorien: ['gravel'],
    inhalt: `${MESSEN}
<h2>How deep should river rock be?</h2>
<p>Small river rock (¾–1½ in) looks good at 2–3 inches. Larger stones (2–4 in) need 4 inches or more so the ground doesn’t show through. Use landscape fabric underneath to keep stones from sinking into the soil.</p>`,
    faq: [
      ['How much does river rock weigh per cubic yard?', 'Typically about 1.3–1.5 tons per cubic yard, depending on stone size and type.'],
      ['How much area does a ton of river rock cover?', 'At 3 inches deep, about 75 square feet; at 2 inches, about 115 square feet.'],
    ],
  },
  {
    pfad: '/driveway-gravel-calculator/',
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
    inhalt: `<h2>How thick should a gravel driveway be?</h2>
<p>A new driveway is usually built in layers: about 4–6 inches of crusher run (road base) that is compacted, plus 2–4 inches of #57 crushed stone or similar on top. For resurfacing an existing driveway, 2 inches of top stone is often enough.</p>
<p>A typical single-car driveway is 10–12 ft wide; a two-car driveway is 20–24 ft wide.</p>
<p>Crusher run compacts a lot, so the calculator adds 15 % for it automatically.</p>`,
    faq: [
      ['How many tons of gravel do I need for a driveway?', 'Multiply length × width in feet, then by the depth in inches, divide by 324 to get cubic yards, and multiply by about 1.4–1.6 tons per cubic yard. A 50 × 12 ft driveway with 4 inches of stone needs roughly 10–11 tons.'],
      ['What is the best gravel for a driveway?', 'A compacted base of crusher run (also called road base or dense grade aggregate) with a top layer of angular crushed stone such as #57 is a common, durable combination. Round pea gravel tends to shift under tires.'],
    ],
  },
  {
    pfad: '/cubic-yard-calculator/',
    nav: 'Cubic yards',
    imMenue: true,
    title: 'Cubic Yard Calculator – Square Feet to Cubic Yards',
    description: 'Convert square feet and depth into cubic yards and cubic feet. Works for any shape: rectangles, circles, triangles and irregular areas.',
    h1: 'Cubic Yard Calculator',
    intro: 'Convert any area and depth into cubic yards and cubic feet – for mulch, soil, gravel, sand or concrete planning.',
    kurz: 'Square feet → cubic yards',
    material: 'topsoil',
    nurVolumen: true,
    inhalt: `${MESSEN}
<h2>The formula</h2>
<p><strong>Cubic yards = length (ft) × width (ft) × depth (in) ÷ 12 ÷ 27.</strong> One cubic yard is 3 ft × 3 ft × 3 ft = 27 cubic feet, or about 0.76 cubic meters.</p>`,
    faq: [
      ['How many square feet are in a cubic yard?', 'It depends on the depth: one cubic yard covers 324 sq ft at 1 inch, 162 sq ft at 2 inches, 108 sq ft at 3 inches and 81 sq ft at 4 inches.'],
      ['How many cubic feet are in a cubic yard?', 'There are 27 cubic feet in one cubic yard.'],
    ],
  },
];
