#!/usr/bin/env python3
"""Holt Yard-Kandidaten in den USA aus Overture Maps Places (CDLA-Permissive-2.0 / Apache-2.0; keine OSM-Daten).
Übernommen aus scripts/fetch-overture.py im Hofladen-Repo, Filter für Landscape-Supply-Yards.
Aufruf: python scripts/fetch-overture.py <ziel.json> [--bbox xmin,ymin,xmax,ymax]
Ohne --bbox: USA ohne Alaska/Hawaii. Für einen Probelauf eine Metro-Box angeben, z. B. Denver: -105.3,39.5,-104.6,40.1
Die genaue Auswahl (Namen, Konfidenz, Doppelungen) macht scripts/import-quellen.mjs (testbar)."""
import json, subprocess, sys
import duckdb

ziel = sys.argv[1]
bbox = sys.argv[sys.argv.index('--bbox') + 1] if '--bbox' in sys.argv else '-125.0,24.4,-66.9,49.4'
probe = '--bbox' in sys.argv
rel = sorted(l.split()[-1].strip('/') for l in subprocess.run(
    ['aws', 's3', 'ls', '--no-sign-request', 's3://overturemaps-us-west-2/release/'],
    capture_output=True, text=True, check=True).stdout.splitlines() if l.strip().startswith('PRE'))[-1]
print('Overture-Release:', rel, 'Box:', bbox, file=sys.stderr)

# Grob vorfiltern (Name oder Kategorie); Kategorienamen sind bewusst weit gefasst, der Probelauf zeigt die echten
NAME = r'(?i)(landscap|mulch|gravel|stone|rock|boulder|topsoil|top soil|soil|dirt|sand|aggregate|quarry|hardscape|nursery|garden cent)'
KAT = r'(?i)(landscap|stone|gravel|aggregate|masonry|building_supply|building_material|garden|nursery|quarry|mulch|soil|sand|hardware|home_improvement)'

lokal = ziel + '.places.parquet'
subprocess.run(['overturemaps', 'download', f'--bbox={bbox}', '-f', 'geoparquet', '--type=place', '-o', lokal], check=True)
SRC = f"read_parquet('{lokal}')"
con = duckdb.connect()
schema = {r[0] for r in con.execute(f"DESCRIBE SELECT * FROM {SRC}").fetchall()}
K = 'taxonomy.primary' if 'taxonomy' in schema else 'categories.primary'
HIER = "array_to_string(taxonomy.hierarchy, '>')" if 'taxonomy' in schema else "''"
if 'bbox' in schema:
    LAT, LON = 'round((bbox.ymin + bbox.ymax) / 2, 6)', 'round((bbox.xmin + bbox.xmax) / 2, 6)'
else:
    con.execute('INSTALL spatial; LOAD spatial;')
    LAT, LON = 'round(ST_Y(ST_GeomFromWKB(geometry)), 6)', 'round(ST_X(ST_GeomFromWKB(geometry)), 6)'

q = f"""
SELECT id, names.primary AS name, {K} AS kat, {HIER} AS hier, confidence AS konf, operating_status AS status,
  {LAT} AS lat, {LON} AS lon, websites, phones, emails, socials,
  addresses[1].freeform AS strasse, addresses[1].postcode AS plz, addresses[1].locality AS ort, addresses[1].region AS region,
  sources[1].dataset AS quelle, sources[1].license AS lizenz
FROM {SRC}
WHERE coalesce(addresses[1].country, 'US') = 'US'
  AND coalesce(operating_status, 'open') = 'open'
  AND confidence >= 0.5
  AND (regexp_matches(names.primary, '{NAME}') OR regexp_matches(coalesce({K}, ''), '{KAT}'))
"""
cur = con.execute(q)
cols = [d[0] for d in cur.description]
rows = [dict(zip(cols, r)) for r in cur.fetchall()]
print('Kandidaten:', len(rows), file=sys.stderr)
if not probe and len(rows) < 1000:
    sys.exit('Zu wenige Kandidaten – Abfrage oder Schema prüfen.')
with open(ziel, 'w', encoding='utf-8') as f:
    json.dump({'quelle': 'overture', 'release': rel, 'orte': rows}, f, ensure_ascii=False, default=str)
