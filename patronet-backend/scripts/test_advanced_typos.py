import urllib.request
import json

test_cases = [
    ('smartwach', 'Noise Smartwatch'),
    ('snneakers', 'Puma Sneakers'),
    ('shampooo', 'Biotique Shampoo'),
    ('Aplpe', 'Apple'),
    ('Samsun', 'Samsung'),
    ('Nkie', 'Nike'),
    ('Sonny', 'Sony'),
    ('Mi', 'Mi Power Bank'),
    ('boAt', 'boAt Earbuds'),
    ('xyzunknown', 'No results'),
    ('', 'Full Catalog')
]

print("=== TESTING ADVANCED TYPOS & EDGE CASES VIA HTTP /api/v1/products ===")
for q, desc in test_cases:
    url = f"http://127.0.0.1:8000/api/v1/products?q={q}"
    res = json.loads(urllib.request.urlopen(url, timeout=5).read())
    total = res['pagination']['total']
    names = [i['name'] for i in res['items']]
    print(f"Test: {desc:16} (q='{q}') -> Total: {total:2d} | Top: {names[:2]}")
