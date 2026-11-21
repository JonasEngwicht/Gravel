// Reference implementation of the calculator math.
// Pure functions, no DOM – usable in the browser, at build time and in tests.

export const CU_FT_PER_CY = 27;
export const LB_PER_TON = 2000;
export const M3_PER_CY = 0.764555;
export const KG_PER_TON = 907.185;

/** Area in square feet for the supported shapes. All lengths in feet. */
export function area(shape, d) {
  switch (shape) {
    case "rectangle":
      return d.length * d.width;
    case "circle":
      return Math.PI * (d.diameter / 2) ** 2;
    case "triangle":
      return (d.base * d.height) / 2;
    case "ring": {
      // e.g. mulch ring around a tree: outer diameter minus trunk/inner diameter
      const outer = Math.PI * (d.outerDiameter / 2) ** 2;
      const inner = Math.PI * (d.innerDiameter / 2) ** 2;
      return Math.max(outer - inner, 0);
    }
    case "area":
      return d.sqft;
    default:
      throw new Error(`Unknown shape: ${shape}`);
  }
}

/** Sum of several sections (irregular beds are entered as multiple shapes). */
export function totalArea(sections) {
  return sections.reduce((sum, s) => sum + area(s.shape, s.dims), 0);
}

/**
 * Core calculation.
 * @param {object} p
 * @param {number} p.sqft        area in square feet
 * @param {number} p.depthIn     depth in inches
 * @param {object} p.material    entry from data/materials.json
 * @param {number} [p.wastePct]  buffer in percent (defaults to material.waste_pct)
 * @param {number} [p.bagCuFt]   bag size (defaults to first bag size of the material)
 */
export function calculate({ sqft, depthIn, material, wastePct, bagCuFt }) {
  if (!(sqft > 0) || !(depthIn > 0)) throw new Error("Area and depth must be > 0");
  const buffer = 1 + (wastePct ?? material.waste_pct ?? 0) / 100;

  const cuFt = sqft * (depthIn / 12) * buffer;
  const cy = cuFt / CU_FT_PER_CY;
  const tons = cy * material.density_tons_per_cy;
  const [dMin, dMax] = material.density_range ?? [material.density_tons_per_cy, material.density_tons_per_cy];

  const bagSize = bagCuFt ?? material.bag_cu_ft?.[0];
  const bags = bagSize ? Math.ceil(cuFt / bagSize) : null;

  return {
    cuFt,
    cy,
    m3: cy * M3_PER_CY,
    tons,
    tonsRange: [cy * dMin, cy * dMax],
    lbs: tons * LB_PER_TON,
    bags,
    bagSize: bagSize ?? null,
    // What the user should order: suppliers usually sell in 0.5 cy / 0.5 ton steps
    orderCy: roundUpTo(cy, 0.5),
    orderTons: roundUpTo(tons, 0.5),
  };
}

/**
 * Cost comparison bulk vs. bags.
 * prices: { perCy?, perTon?, perBag?, deliveryFee? }
 */
export function cost(result, prices) {
  const out = {};
  const delivery = prices.deliveryFee ?? 0;
  if (prices.perCy != null) out.bulkByCy = result.orderCy * prices.perCy + delivery;
  if (prices.perTon != null) out.bulkByTon = result.orderTons * prices.perTon + delivery;
  if (prices.perBag != null && result.bags != null) out.bags = result.bags * prices.perBag;
  return out;
}

/** How many trips with a pickup truck (payload in lb, bed volume in cy). */
export function pickupTrips(result, { payloadLb = 1500, bedCy = 2 } = {}) {
  const byWeight = result.lbs / payloadLb;
  const byVolume = result.cy / bedCy;
  return Math.ceil(Math.max(byWeight, byVolume));
}

/** Inverse calculation: how much area does a given volume cover? */
export function coverage({ cy, depthIn }) {
  return (cy * CU_FT_PER_CY) / (depthIn / 12);
}

export function roundUpTo(value, step) {
  return Math.ceil(value / step - 1e-9) * step;
}

// Unit helpers for the metric toggle
export const m2ToSqft = (m2) => m2 * 10.7639;
export const cmToIn = (cm) => cm / 2.54;
export const mToFt = (m) => m * 3.28084;
