#!/usr/bin/env python3
"""
CLI script to trigger indexing of active PATRONET products from PostgreSQL into OpenSearch.

Usage:
    python scripts/index_products.py
"""
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.database import SessionLocal
from app.core.opensearch import get_opensearch_client, get_opensearch_index_name
from app.services.search_indexer import SearchIndexerService


def run_indexing():
    print("=" * 65)
    print(" PATRONET — OpenSearch Product Catalogue Indexing")
    print("=" * 65)

    index_name = get_opensearch_index_name()
    print(f"\n[TARGET INDEX] : {index_name}")

    client = get_opensearch_client()
    db = SessionLocal()

    try:
        # 1. Execute indexing
        print("\n[STEP 1] Indexing active products from PostgreSQL into OpenSearch...")
        result = SearchIndexerService.index_all_active_products(
            db=db,
            client=client,
            index_name=index_name,
        )

        print("-" * 65)
        print(" [INDEXING COMPLETED]")
        print("-" * 65)
        print(f"  Target Index       : {result.index_name}")
        print(f"  Active Products DB : {result.total_active_in_db}")
        print(f"  Successfully Indexed: {result.indexed}")
        print(f"  Failed Operations  : {result.failed}")
        print(f"  Duration           : {result.duration_seconds}s")
        print("-" * 65)

        # 2. Verify total document count in OpenSearch
        count_res = client.count(index=index_name)
        doc_count = count_res.get("count", 0)
        print(f"\n[VERIFICATION] OpenSearch Document Count in '{index_name}': {doc_count}")
        assert doc_count == result.total_active_in_db, (
            f"Expected {result.total_active_in_db} docs, but index reports {doc_count}"
        )
        print("  \u2705 Document count perfectly matches active products in PostgreSQL!")

        # 3. Test Idempotency (re-index)
        print("\n[STEP 2] Verifying Idempotency (re-running indexing)...")
        reindex_result = SearchIndexerService.index_all_active_products(
            db=db,
            client=client,
            index_name=index_name,
        )
        count_after = client.count(index=index_name).get("count", 0)
        print(f"  Re-indexed docs    : {reindex_result.indexed}")
        print(f"  Document count after: {count_after}")
        assert count_after == doc_count, (
            f"Idempotency failed: document count changed from {doc_count} to {count_after}"
        )
        print("  \u2705 Idempotency verified: re-running updated existing documents without duplicates!")

        # 4. Perform sample searches
        print("\n[STEP 3] Performing sample search queries against OpenSearch...")
        test_queries = ["Apple", "novel", "wallet", "chips"]
        for query in test_queries:
            search_res = SearchIndexerService.search_products(
                query=query,
                client=client,
                index_name=index_name,
                limit=3,
            )
            print(f"\n  Query: '{query}' -> Found {search_res.total_hits} hits (displaying top {len(search_res.hits)}):")
            for hit in search_res.hits:
                print(f"    - [{hit.score:.2f}] {hit.name} | Brand: {hit.brand} | Cat: {hit.category_name} | \u20b9{hit.price}")

        print("\n" + "=" * 65)
        print(" ALL INDEXING & VERIFICATION STEPS PASSED SUCCESSFULLY! \u2705")
        print("=" * 65)
        return 0

    except Exception as exc:
        print(f"\n[ERROR] Indexing failed: {type(exc).__name__}: {exc}")
        return 1

    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(run_indexing())
