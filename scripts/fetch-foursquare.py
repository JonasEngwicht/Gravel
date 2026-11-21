#!/usr/bin/env python3
"""Holt Yard-Kandidaten in den USA aus Foursquare Open Source Places (Apache-2.0, über Hugging Face, Token in HF_TOKEN).
Übernommen aus scripts/fetch-foursquare.py im Hofladen-Repo. Die Dateien werden einzeln geladen, gefiltert und gelöscht.
Aufruf: HF_TOKEN=… python scripts/fetch-foursquare.py <ziel.json> [--bbox xmin,ymin,xmax,ymax]"""
import datetime, json, os, shutil, sys, tempfile, time, urllib.request
import duckdb

ziel = sys.argv[1]
box = [float(x) for x in sys.argv[sys.argv.index('--bbox') + 1].split(',')] if '--bbox' in sys.argv else None
tok = os.environ.get('HF_TOKEN') or sys.exit('HF_TOKEN fehlt.')
H = {'Authorization': f'Bearer {tok}', 'User-Agent': 'gravel-directory/1.0'}
BASIS = 'https://huggingface.co'
def api(pfad):
    with urllib.request.urlopen(urllib.request.Request(f'{BASIS}/api/datasets/foursquare/fsq-os-places/tree/main/{pfad}', headers=H), timeout=60) as r:
        return json.loads(r.read())
rel = sorted(t['path'] for t in api('release') if t['type'] == 'directory')[-1]
dateien = sorted(f['path'] for f in api(f'{rel}/places/parquet') if f['path'].endswith('.parquet'))
print('Foursquare', rel, len(dateien), 'Dateien', file=sys.stderr)

NAME = r'(?i)(landscap|mulch|gravel|stone|rock|boulder|topsoil|top soil|soil|dirt|sand|aggregate|quarry|hardscape|nursery|garden cent)'
KAT = r'(?i)landscap|stone|gravel|masonry|building suppl|garden cent|nursery|quarry|hardware|home improvement'
BOX = f"AND latitude BETWEEN {box[1]} AND {box[3]} AND longitude BETWEEN {box[0]} AND {box[2]}" if box else ''
tmp = tempfile.mkdtemp()
con = duckdb.connect()
rows, spalten = [], None
heute = datetime.date.today()
t0 = time.time()
for i, pfad in enumerate(dateien):
    lokal = os.path.join(tmp, 'teil.parquet')
    for versuch in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(f'{BASIS}/datasets/foursquare/fsq-os-places/resolve/main/{pfad}', headers=H), timeout=300) as r, open(lokal, 'wb') as f:
                shutil.copyfileobj(r, f, 1 << 22)
            break
        except Exception:
            if versuch == 2: raise
            time.sleep(5 * (versuch + 1))
    src = f"read_parquet('{lokal}')"
    if spalten is None:
        spalten = {r[0] for r in con.execute(f'DESCRIBE SELECT * FROM {src}').fetchall()}
        print('Spalten:', sorted(spalten), file=sys.stderr)
    sp = lambda n, alt='NULL': n if n in spalten else alt
    labels = f"array_to_string({sp('fsq_category_labels', '[]')}, '|')"
    q = f"""SELECT fsq_place_id AS id, name, {labels} AS labels, latitude AS lat, longitude AS lon,
        {sp('address')} AS strasse, {sp('postcode')} AS plz, {sp('locality')} AS ort, {sp('region')} AS region,
        {sp('tel')} AS tel, {sp('website')} AS website, {sp('email')} AS email,
        CAST({sp('date_refreshed')} AS VARCHAR) AS refreshed,
        {"array_to_string(unresolved_flags, ',')" if 'unresolved_flags' in spalten else "''"} AS flags
      FROM {src}
      WHERE country = 'US' AND {sp('date_closed')} IS NULL {BOX}
        AND (regexp_matches(name, '{NAME}') OR regexp_matches({labels}, '{KAT}'))"""
    cur = con.execute(q)
    cols = [d[0] for d in cur.description]
    rows += [dict(zip(cols, r)) for r in cur.fetchall()]
    os.remove(lokal)
    if i % 10 == 0: print(f'  {i + 1}/{len(dateien)} Dateien, {len(rows)} Kandidaten, {round(time.time() - t0)} s', file=sys.stderr)

def kat(labels):
    # Foursquare-Labels auf Kategorienamen im Stil von Overture abbilden (siehe KAT_YARD/KAT_DIENST in scripts/quellen.mjs)
    l = (labels or '').lower()
    for muster, k in [('landscape supply', 'landscape_supply'), ('building supply', 'building_supply'), ('stone', 'stone_supplier'),
                      ('masonry', 'masonry_supply'), ('quarry', 'quarry'), ('garden center', 'garden_center'), ('nursery', 'nursery'),
                      ('hardware', 'hardware_store'), ('home improvement', 'home_improvement_store'), ('landscap', 'landscaping'),
                      ('contractor', 'contractor')]:
        if muster in l: return k
    return None

orte = []
for r in rows:
    try: alt = (heute - datetime.date.fromisoformat((r['refreshed'] or '1900-01-01')[:10])).days
    except ValueError: alt = 99999
    konf = 0.75 if alt <= 730 and not r['flags'] else 0.55
    orte.append({'id': r['id'], 'name': r['name'], 'kat': kat(r['labels']), 'hier': r['labels'] or '', 'konf': konf,
                 'lat': r['lat'], 'lon': r['lon'], 'websites': [r['website']] if r['website'] else [], 'phones': [r['tel']] if r['tel'] else [],
                 'emails': [r['email']] if r['email'] else [], 'strasse': r['strasse'], 'plz': r['plz'], 'ort': r['ort'], 'region': r['region']})
print(f'Foursquare: {len(orte)} Kandidaten, {round(time.time() - t0)} s', file=sys.stderr)
if not box and len(orte) < 1000:
    sys.exit('Zu wenige Kandidaten – Abfrage prüfen.')
with open(ziel, 'w', encoding='utf-8') as f:
    json.dump({'quelle': 'foursquare', 'release': rel.split('=')[-1], 'orte': orte}, f, ensure_ascii=False, default=str)
