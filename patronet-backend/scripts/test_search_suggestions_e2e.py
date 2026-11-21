#!/usr/bin/env python3
"""
Automated E2E Verification Test Suite for Intelligent Search Autocomplete & Suggestions.
Validates suggestion generation across exact queries, misspelled queries, partial queries,
categories, brands, spelling corrections ("Did you mean?"), short queries, and fallback behavior.
"""
import sys
import json
from pathlib import Path
from urllib.request import urlopen

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.database import SessionLocal
from app.services.search_indexer import SearchIndexerService

passed_tests = 0
failed_tests = 0


def record_result(name: str, passed: bool, details: str = ""):
    global passed_tests, failed_tests
    if passed:
        passed_tests += 1
        print(f"  [PASS] {name} {details}")
    else:
        failed_tests += 1
        print(f"  [FAIL] {name} {details}")


def query_api(q: str):
    url = f"http://127.0.0.1:8000/api/v1/search/suggest?q={q}"
    req = urlopen(url, timeout=5)
    return req.status, json.loads(req.read().decode())


def run_tests():
    print("=" * 70)
    print(" PATRONET — Search Autocomplete & Suggestions E2E Verification")
    print("=" * 70)

    db = SessionLocal()
    try:
        # 1. Correct Query: Samsung
        status, data = query_api("Samsung")
        prods = [p["name"] for p in data["products"]]
        brands = data["brands"]
        cats = [c["name"] for c in data["categories"]]
        record_result(
            "Test 1: Correct Query 'Samsung'",
            status == 200
            and any("Samsung Galaxy Watch" in p for p in prods)
            and "Samsung" in brands
            and "Electronics" in cats
            and len(data["corrections"]) == 0,
            f"(products: {len(prods)}, brands: {brands}, corrections: {data['corrections']})",
        )

        # 2. Typo Query: Samsng -> Samsung
        status, data = query_api("Samsng")
        prods = [p["name"] for p in data["products"]]
        record_result(
            "Test 2: Typo Query 'Samsng' -> Samsung",
            status == 200
            and any("Samsung Galaxy Watch" in p for p in prods)
            and "Samsung" in data["corrections"],
            f"(products: {len(prods)}, correction: {data['corrections']})",
        )

        # 3. Typo Query: headphnes -> Headphones
        status, data = query_api("headphnes")
        prods = [p["name"] for p in data["products"]]
        record_result(
            "Test 3: Typo Query 'headphnes' -> Headphones",
            status == 200
            and any("Headphones" in p for p in prods)
            and "Headphones" in data["corrections"],
            f"(top product: {prods[:1]}, correction: {data['corrections']})",
        )

        # 4. Partial Query: Appl -> Apple
        status, data = query_api("Appl")
        prods = [p["name"] for p in data["products"]]
        record_result(
            "Test 4: Partial Query 'Appl' -> Apple products",
            status == 200
            and len(prods) >= 2
            and "Apple" in data["brands"]
            and "Apple" in data["corrections"],
            f"(products found: {len(prods)}, brands: {data['brands']}, correction: {data['corrections']})",
        )

        # 5. Typo Query: Macbok -> MacBook
        status, data = query_api("Macbok")
        prods = [p["name"] for p in data["products"]]
        record_result(
            "Test 5: Typo Query 'Macbok' -> MacBook",
            status == 200
            and any("MacBook" in p for p in prods)
            and any("Macbook" in c or "MacBook" in c for c in data["corrections"]),
            f"(products: {prods}, correction: {data['corrections']})",
        )

        # 6. Correct Query: rice
        status, data = query_api("rice")
        prods = [p["name"] for p in data["products"]]
        cats = [c["name"] for c in data["categories"]]
        record_result(
            "Test 6: Exact Query 'rice'",
            status == 200
            and any("Basmati Rice" in p for p in prods)
            and "Grocery" in cats
            and len(data["corrections"]) == 0,
            f"(products: {prods}, categories: {cats})",
        )

        # 7. Brand Typo: Poma -> Puma
        status, data = query_api("Poma")
        prods = [p["name"] for p in data["products"]]
        record_result(
            "Test 7: Brand Typo 'Poma' -> Puma",
            status == 200
            and any("Puma" in p for p in prods)
            and "Puma" in data["corrections"],
            f"(products: {prods}, correction: {data['corrections']})",
        )

        # 8. Brand Typo: Nik -> Nike
        status, data = query_api("Nik")
        prods = [p["name"] for p in data["products"]]
        record_result(
            "Test 8: Partial/Typo 'Nik' -> Nike",
            status == 200
            and any("Nike" in p for p in prods)
            and ("Nike" in data["brands"] or "Nike" in data["corrections"]),
            f"(products: {prods}, brands: {data['brands']}, correction: {data['corrections']})",
        )

        # 9. No Matches Query: xyzunknown
        status, data = query_api("xyzunknown")
        record_result(
            "Test 9: No Matches Query 'xyzunknown'",
            status == 200
            and len(data["products"]) == 0
            and len(data["categories"]) == 0
            and len(data["brands"]) == 0
            and len(data["corrections"]) == 0,
            f"(products: {len(data['products'])}, categories: {len(data['categories'])})",
        )

        # 10. Fallback Query When OpenSearch Unavailable
        fallback_res = SearchIndexerService.get_suggestions(
            query="MacBook",
            index_name="non_existent_dummy_index",
            fallback_db=db,
        )
        record_result(
            "Test 10: Graceful Fallback When OpenSearch Unavailable",
            fallback_res.fallback_used is True
            and len(fallback_res.products) >= 1
            and any("MacBook" in p.name for p in fallback_res.products),
            f"(fallback_used: {fallback_res.fallback_used}, products: {len(fallback_res.products)})",
        )

    finally:
        db.close()

    print("\n" + "=" * 70)
    print(f" RESULTS: {passed_tests} PASSED / {failed_tests} FAILED (TOTAL: {passed_tests + failed_tests})")
    print("=" * 70)
    return 0 if failed_tests == 0 else 1


if __name__ == "__main__":
    sys.exit(run_tests())
