// Reference logic for the "yards near me" lookup (filter, radius, sorting).
// In production this runs in the Worker behind /api/umkreis (see docs/03-uebernahme-hofladen.md);
// ZIP centroids come from GeoNames (CC BY 4.0) and are generated at build time.

const EARTH_RADIUS_MI = 3958.8;

export function haversineMi([lat1, lng1], [lat2, lng2]) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_MI * Math.asin(Math.sqrt(a));
}

/**
 * Find yards for a calculator result.
 * @param {object} q
 * @param {[number, number]} q.origin   lat/lng of the user's ZIP
 * @param {string} q.materialId         material id from materials.json
 * @param {boolean} [q.needsDelivery]
 * @param {number} [q.maxMiles=30]
 * @param {Array} yards                 listings (see data/schema/yard.schema.json)
 */
export function findYards({ origin, materialId, needsDelivery = false, maxMiles = 30 }, yards) {
  return yards
    .filter((y) => y.status === "active")
    // Yards ohne bestätigte Materialliste (z. B. aus offenen Quellen) bleiben drin, stehen aber hinter bestätigten
    .filter((y) => !materialId || !y.materials.length || y.materials.some((m) => m.id === materialId))
    .map((y) => ({ yard: y, miles: haversineMi(origin, [y.location.lat, y.location.lng]),
      confirmed: !materialId || y.materials.some((m) => m.id === materialId) }))
    .filter(({ yard, miles }) => {
      if (!needsDelivery) return miles <= maxMiles;
      const radius = yard.delivery?.radius_mi ?? 0;
      return yard.delivery?.available && miles <= radius;
    })
    .sort((a, b) => {
      // Featured listings first, then distance
      const fa = a.yard.listing?.tier === "featured" ? 0 : 1;
      const fb = b.yard.listing?.tier === "featured" ? 0 : 1;
      return fa - fb || Number(b.confirmed) - Number(a.confirmed) || a.miles - b.miles;
    });
}

/** Price per unit for a material at a yard, if known. */
export function yardPrice(yard, materialId) {
  const m = yard.materials.find((x) => x.id === materialId);
  return m?.price ?? null; // { amount, unit: "cy" | "ton" | "bag", updated }
}

/** Median local price for a city page (used as default in the calculator). */
export function medianPrice(yards, materialId, unit) {
  const values = yards
    .map((y) => yardPrice(y, materialId))
    .filter((p) => p && p.unit === unit)
    .map((p) => p.amount)
    .sort((a, b) => a - b);
  if (!values.length) return null;
  const mid = Math.floor(values.length / 2);
  return values.length % 2 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
}
