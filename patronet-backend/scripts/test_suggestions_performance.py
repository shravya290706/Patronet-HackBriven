import urllib.request
import urllib.parse
import json
import time

test_queries = [
    ('Samsung', 'Correct brand search'),
    ('Samsng', 'Typo brand search'),
    ('Headphones', 'Category/product type search'),
    ('headphnes', 'Typo product type search'),
    ('Appl', 'Partial brand search'),
    ('Macbok', 'Typo product name search'),
    ('Poma', 'Typo brand search'),
    ('Nik', 'Short prefix search'),
    ('rice', 'Single word pantry search'),
    ('basmati', 'Grain variety search'),
    ('xyzunknown', 'Zero-match query'),
    ('a', 'Short query (<2 chars)')
]

header = f"{'QUERY':<12} | {'STATUS':<6} | {'PRODS':<5} | {'BRANDS':<18} | {'CATEGORIES':<22} | {'CORRECTIONS':<15} | {'TIME'}"
print(header)
print("-" * len(header))

for q, label in test_queries:
    t0 = time.time()
    url = f"http://127.0.0.1:8000/api/v1/search/suggest?q={urllib.parse.quote(q)}"
    req = urllib.request.urlopen(url, timeout=5)
    dur = (time.time() - t0) * 1000
    data = json.loads(req.read().decode())

    prods_count = len(data.get('products', []))
    brands = ', '.join(data.get('brands', [])) or '-'
    cats = ', '.join([c['name'] for c in data.get('categories', [])]) or '-'
    corrs = ', '.join(data.get('corrections', [])) or '-'

    print(f"{q:<12} | {req.status:<6} | {prods_count:<5} | {brands[:18]:<18} | {cats[:22]:<22} | {corrs[:15]:<15} | {dur:5.1f}ms")
