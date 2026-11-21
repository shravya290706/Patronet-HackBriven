import sys
from pathlib import Path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.opensearch import get_opensearch_client, get_opensearch_index_name

client = get_opensearch_client()
idx = get_opensearch_index_name()

def test_query(q):
    body = {
        'query': {
            'bool': {
                'must': [
                    {
                        'bool': {
                            'should': [
                                {
                                    'multi_match': {
                                        'query': q,
                                        'fields': ['name.keyword^15', 'name^10', 'brand.keyword^8', 'brand^6', 'sku^8'],
                                        'type': 'phrase',
                                        'boost': 5.0,
                                    }
                                },
                                {
                                    'multi_match': {
                                        'query': q,
                                        'fields': ['name^8', 'brand^5', 'category.name^3', 'sku^5', 'description^1'],
                                        'type': 'best_fields',
                                        'operator': 'or',
                                        'boost': 2.5,
                                    }
                                },
                                {
                                    'multi_match': {
                                        'query': q,
                                        'fields': ['name^6', 'brand^4'],
                                        'type': 'phrase_prefix',
                                        'boost': 2.0,
                                    }
                                },
                                {
                                    'multi_match': {
                                        'query': q,
                                        'fields': ['name^4', 'brand^3', 'category.name^2', 'sku^2'],
                                        'type': 'best_fields',
                                        'fuzziness': 'AUTO',
                                        'prefix_length': 1,
                                        'max_expansions': 50,
                                        'boost': 1.0,
                                    }
                                },
                            ],
                            'minimum_should_match': 1,
                        }
                    }
                ],
                'filter': [{'term': {'is_active': True}}],
            }
        }
    }
    res = client.search(index=idx, body=body)
    hits = res['hits']['hits']
    total = res['hits']['total']['value']
    top_hits = [f"[{h['_score']:.1f}] {h['_source']['name']} ({h['_source']['brand']})" for h in hits[:2]]
    print(f"Query: {q:12} -> Total: {total:2d} | Top: {top_hits}")

queries = [
    'MacBook', 'Macbok', 'Mackbook', 'Samsng', 'headphnes',
    'Nik', 'Appl', 'basmati', 'rice', 'smartwach', 'snneakers', 'shampooo',
    'xyzunknown'
]

print("=== TESTING TIERED OPENSEARCH QUERY ===")
for q in queries:
    test_query(q)
