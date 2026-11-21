#!/usr/bin/env python3
"""
Comprehensive End-to-End Verification Test Suite for OpenSearch Product Search Integration in PATRONET.
Validates all 23 integration criteria covering cluster health, indexing, document accuracy,
full-text search, multi-field boosting, filters, sorting, pagination, API routes, and graceful fallback.
"""
import sys
import time
from decimal import Decimal
from pathlib import Path
from urllib.request import urlopen
import json

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.database import SessionLocal
from app.core.opensearch import get_opensearch_client, get_opensearch_index_name
from app.services.search_indexer import SearchIndexerService
from app.services.product_service import ProductService

passed_tests = 0
failed_tests = 0
test_results = []


def record_result(name: str, passed: bool, details: str = ""):
    global passed_tests, failed_tests
    if passed:
        passed_tests += 1
        print(f"  [PASS] {name} {details}")
        test_results.append((name, True, details))
    else:
        failed_tests += 1
        print(f"  [FAIL] {name} {details}")
        test_results.append((name, False, details))


def run_all_tests():
    print("=" * 70)
    print(" PATRONET — OpenSearch Product Search Integration E2E Verification")
    print("=" * 70)

    client = get_opensearch_client()
    index_name = get_opensearch_index_name()
    db = SessionLocal()

    try:
        # TEST 1: Cluster Connectivity & Health
        print("\n--- GROUP 1: Cluster Health & Index State ---")
        health = client.cluster.health()
        cluster_status = health.get("status")
        record_result(
            "Test 1: OpenSearch Cluster Connectivity & Health",
            cluster_status in ("green", "yellow"),
            f"(status: {cluster_status}, nodes: {health.get('number_of_nodes')})",
        )

        # TEST 2: Dedicated Index Existence
        exists = client.indices.exists(index=index_name)
        record_result(
            "Test 2: Dedicated Product Index Exists",
            exists,
            f"(index: '{index_name}')",
        )

        # TEST 3: Accurate Document Count (Exactly 48 active products)
        count_res = client.count(index=index_name)
        doc_count = count_res.get("count", 0)
        record_result(
            "Test 3: Accurate Document Count Matches 48 Active Products",
            doc_count == 48,
            f"(expected: 48, found: {doc_count})",
        )

        # TEST 4: Idempotent Re-indexing
        print("\n--- GROUP 2: Idempotency & Catalog Integrity ---")
        reindex_res = SearchIndexerService.index_all_active_products(
            db=db, client=client, index_name=index_name
        )
        count_after = client.count(index=index_name).get("count", 0)
        record_result(
            "Test 4: Idempotent Re-indexing Preserves Exact Document Count",
            count_after == 48 and reindex_res.indexed == 48 and reindex_res.failed == 0,
            f"(indexed: {reindex_res.indexed}, total in index: {count_after})",
        )

        # TEST 5: Full-Text Search by Exact Product Name
        print("\n--- GROUP 3: Full-Text Search Capabilities ---")
        res_exact = SearchIndexerService.search_products(
            query="Apple MacBook Air 13-inch M2 Chip",
            client=client,
            index_name=index_name,
            limit=5,
        )
        top_name = res_exact.hits[0].name if res_exact.hits else ""
        record_result(
            "Test 5: Full-Text Search by Exact Product Name",
            len(res_exact.hits) > 0 and "MacBook Air" in top_name,
            f"(top hit: '{top_name}', score: {res_exact.hits[0].score:.2f})",
        )

        # TEST 6: Partial Name Search
        res_partial = SearchIndexerService.search_products(
            query="MacBook",
            client=client,
            index_name=index_name,
            limit=5,
        )
        record_result(
            "Test 6: Partial Name Search",
            len(res_partial.hits) > 0 and any("MacBook" in h.name for h in res_partial.hits),
            f"(found {res_partial.total_hits} hits)",
        )

        # TEST 7: Brand Search with Score Boosting
        res_brand = SearchIndexerService.search_products(
            query="Apple",
            client=client,
            index_name=index_name,
            limit=5,
        )
        all_apple = all(h.brand == "Apple" for h in res_brand.hits)
        record_result(
            "Test 7: Brand Search Across Catalog",
            len(res_brand.hits) >= 2 and all_apple,
            f"(found {res_brand.total_hits} hits, brands: {[h.brand for h in res_brand.hits]})",
        )

        # TEST 8: SKU Search
        res_sku = SearchIndexerService.search_products(
            query="PN-GRO-001",
            client=client,
            index_name=index_name,
            limit=5,
        )
        top_sku = res_sku.hits[0].sku if res_sku.hits else ""
        record_result(
            "Test 8: SKU Search (Exact/Partial)",
            len(res_sku.hits) > 0 and top_sku == "PN-GRO-001",
            f"(top SKU: {top_sku}, product: '{res_sku.hits[0].name}')",
        )

        # TEST 9: Category Name Full-Text Matching
        res_cat = SearchIndexerService.search_products(
            query="Electronics",
            client=client,
            index_name=index_name,
            limit=5,
        )
        record_result(
            "Test 9: Category Keyword Matching",
            res_cat.total_hits >= 8,
            f"(found {res_cat.total_hits} hits for 'Electronics')",
        )

        # TEST 10: Description Keyword Search
        res_desc = SearchIndexerService.search_products(
            query="Retina display",
            client=client,
            index_name=index_name,
            limit=5,
        )
        record_result(
            "Test 10: Description Keyword Full-Text Search",
            res_desc.total_hits >= 1 and any("Liquid Retina" in (h.description or "") for h in res_desc.hits),
            f"(found {res_desc.total_hits} hits for 'Retina display')",
        )

        # TEST 11: Fuzzy Matching / Typo Tolerance
        res_fuzzy = SearchIndexerService.search_products(
            query="Macbok",
            client=client,
            index_name=index_name,
            limit=5,
        )
        record_result(
            "Test 11: Typo Tolerance / Fuzzy Match ('Macbok')",
            res_fuzzy.total_hits >= 1 and any("MacBook" in h.name for h in res_fuzzy.hits),
            f"(found {res_fuzzy.total_hits} hits)",
        )

        # TEST 12: Filter by Category
        print("\n--- GROUP 4: Filtering & Faceting ---")
        res_cat_filt = SearchIndexerService.search_products(
            query="Rice",
            category="Grocery",
            client=client,
            index_name=index_name,
        )
        all_grocery = all(h.category_name == "Grocery" for h in res_cat_filt.hits)
        record_result(
            "Test 12: Category Filter Restricts Results",
            res_cat_filt.total_hits >= 1 and all_grocery,
            f"(found {res_cat_filt.total_hits} Grocery hits)",
        )

        # TEST 13: Filter by Brand
        res_brand_filt = SearchIndexerService.search_products(
            query="oil",
            brand="Fortune",
            client=client,
            index_name=index_name,
        )
        all_fortune = all(h.brand == "Fortune" for h in res_brand_filt.hits)
        record_result(
            "Test 13: Brand Filter Restricts Results",
            res_brand_filt.total_hits >= 1 and all_fortune,
            f"(found {res_brand_filt.total_hits} Fortune hits)",
        )

        # TEST 14: Filter by Price Minimum
        res_min_price = SearchIndexerService.search_products(
            query="Apple",
            min_price=60000,
            client=client,
            index_name=index_name,
        )
        all_gte_60k = all(h.price >= 60000 for h in res_min_price.hits)
        record_result(
            "Test 14: Minimum Price Filter (price >= 60000)",
            res_min_price.total_hits == 1 and all_gte_60k,
            f"(found {res_min_price.total_hits} hits, price: {[h.price for h in res_min_price.hits]})",
        )

        # TEST 15: Filter by Price Maximum
        res_max_price = SearchIndexerService.search_products(
            query="Apple",
            max_price=60000,
            client=client,
            index_name=index_name,
        )
        all_lte_60k = all(h.price <= 60000 for h in res_max_price.hits)
        record_result(
            "Test 15: Maximum Price Filter (price <= 60000)",
            res_max_price.total_hits == 1 and all_lte_60k,
            f"(found {res_max_price.total_hits} hits, price: {[h.price for h in res_max_price.hits]})",
        )

        # TEST 16: Combined Filters (Category + Brand + Price)
        res_combo = SearchIndexerService.search_products(
            query="",
            category="Electronics",
            brand="Apple",
            min_price=50000,
            max_price=100000,
            client=client,
            index_name=index_name,
        )
        record_result(
            "Test 16: Combined Multi-Field Filters",
            res_combo.total_hits == 2,
            f"(found {res_combo.total_hits} hits matching category, brand, and price window)",
        )

        # TEST 17: Sorting by Price Ascending
        print("\n--- GROUP 5: Sorting & Pagination ---")
        res_sort_asc = SearchIndexerService.search_products(
            query="Apple",
            sort="price-asc",
            client=client,
            index_name=index_name,
        )
        prices_asc = [h.price for h in res_sort_asc.hits]
        record_result(
            "Test 17: Sorting by Price Ascending",
            prices_asc == sorted(prices_asc),
            f"(prices: {prices_asc})",
        )

        # TEST 18: Sorting by Price Descending
        res_sort_desc = SearchIndexerService.search_products(
            query="Apple",
            sort="price-desc",
            client=client,
            index_name=index_name,
        )
        prices_desc = [h.price for h in res_sort_desc.hits]
        record_result(
            "Test 18: Sorting by Price Descending",
            prices_desc == sorted(prices_desc, reverse=True),
            f"(prices: {prices_desc})",
        )

        # TEST 19: Pagination (Page 1 and Page 2 Disjoint)
        res_p1 = SearchIndexerService.search_products(
            query="",
            category="Electronics",
            page=1,
            limit=4,
            client=client,
            index_name=index_name,
        )
        res_p2 = SearchIndexerService.search_products(
            query="",
            category="Electronics",
            page=2,
            limit=4,
            client=client,
            index_name=index_name,
        )
        ids_p1 = {h.product_id for h in res_p1.hits}
        ids_p2 = {h.product_id for h in res_p2.hits}
        record_result(
            "Test 19: Pagination Metadata & Disjoint Page Windows",
            len(ids_p1) == 4 and len(ids_p2) == 4 and ids_p1.isdisjoint(ids_p2) and res_p1.total_pages == 2,
            f"(page 1: {len(ids_p1)} items, page 2: {len(ids_p2)} items, total pages: {res_p1.total_pages})",
        )

        # TEST 20: Catalogue Browsing Without Query (Database Direct)
        print("\n--- GROUP 6: API Integration & Resilience ---")
        catalog_res = ProductService.get_products(db=db, page=1, limit=10)
        record_result(
            "Test 20: Standard Catalogue Browsing (q=None preserves database browse)",
            catalog_res.pagination.total == 48 and len(catalog_res.items) == 10,
            f"(total: {catalog_res.pagination.total}, page items: {len(catalog_res.items)})",
        )

        # TEST 21: FastAPI Live Search Endpoint (/api/v1/search/query)
        try:
            req = urlopen("http://127.0.0.1:8000/api/v1/search/query?q=Apple", timeout=5)
            api_search_data = json.loads(req.read().decode())
            record_result(
                "Test 21: FastAPI /api/v1/search/query Endpoint",
                req.status == 200 and api_search_data.get("total_hits") == 2 and api_search_data.get("fallback_used") is False,
                f"(status: {req.status}, total_hits: {api_search_data.get('total_hits')}, fallback: {api_search_data.get('fallback_used')})",
            )
        except Exception as e:
            record_result("Test 21: FastAPI /api/v1/search/query Endpoint", False, f"({type(e).__name__}: {e})")

        # TEST 22: FastAPI Live Products Endpoint With Search Query (/api/v1/products?q=Apple)
        try:
            req2 = urlopen("http://127.0.0.1:8000/api/v1/products?q=Apple", timeout=5)
            api_prod_data = json.loads(req2.read().decode())
            record_result(
                "Test 22: FastAPI /api/v1/products?q=... OpenSearch Routing",
                req2.status == 200 and api_prod_data.get("pagination", {}).get("total") == 2,
                f"(status: {req2.status}, returned: {len(api_prod_data.get('items', []))} items)",
            )
        except Exception as e:
            record_result("Test 22: FastAPI /api/v1/products?q=... OpenSearch Routing", False, f"({type(e).__name__}: {e})")

        # TEST 23: Graceful Fallback When OpenSearch Fails
        try:
            # Pass a non-existent index to simulate OpenSearch index/cluster failure
            fallback_res = SearchIndexerService.search_products(
                query="Apple",
                index_name="non_existent_dummy_index_for_testing",
                fallback_db=db,
            )
            record_result(
                "Test 23: Graceful Fallback to PostgreSQL on OpenSearch Failure",
                fallback_res.fallback_used is True and fallback_res.total_hits >= 1,
                f"(fallback_used: {fallback_res.fallback_used}, total_hits: {fallback_res.total_hits})",
            )
        except Exception as e:
            record_result("Test 23: Graceful Fallback to PostgreSQL on OpenSearch Failure", False, f"({type(e).__name__}: {e})")

    finally:
        db.close()

    print("\n" + "=" * 70)
    print(f" RESULTS: {passed_tests} PASSED / {failed_tests} FAILED (TOTAL: {passed_tests + failed_tests})")
    print("=" * 70)
    return 0 if failed_tests == 0 else 1


if __name__ == "__main__":
    sys.exit(run_all_tests())
