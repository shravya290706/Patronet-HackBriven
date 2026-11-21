"""
OpenSearch Product Indexing and Search Service for PATRONET.
Handles index schema definition, batch indexing of active products, and sample searches.
"""
import logging
import time
from typing import Any, Dict, List, Optional
from opensearchpy import OpenSearch, helpers
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload, selectinload
import app.models  # Ensure all models and relationship mappers are registered
from app.core.opensearch import get_opensearch_client, get_opensearch_index_name
from app.models.catalog import Product
from app.schemas.search import (
    IndexingResponse,
    SearchHitItem,
    SearchResponse,
    SearchSuggestionResponse,
    SuggestCategoryItem,
    SuggestProductItem,
)

logger = logging.getLogger("patronet.search_indexer")

PRODUCT_INDEX_SETTINGS_MAPPINGS = {
    "settings": {
        "number_of_shards": 1,
        "number_of_replicas": 1,
        "analysis": {
            "analyzer": {
                "product_text_analyzer": {
                    "type": "custom",
                    "tokenizer": "standard",
                    "filter": ["lowercase", "asciifolding"],
                }
            }
        },
    },
    "mappings": {
        "properties": {
            "product_id": {"type": "keyword"},
            "sku": {"type": "keyword"},
            "name": {
                "type": "text",
                "analyzer": "product_text_analyzer",
                "fields": {
                    "keyword": {"type": "keyword", "ignore_above": 256},
                },
            },
            "brand": {
                "type": "text",
                "analyzer": "product_text_analyzer",
                "fields": {
                    "keyword": {"type": "keyword", "ignore_above": 256},
                },
            },
            "category_id": {"type": "keyword"},
            "category": {
                "type": "object",
                "properties": {
                    "id": {"type": "keyword"},
                    "name": {
                        "type": "text",
                        "analyzer": "product_text_analyzer",
                        "fields": {
                            "keyword": {"type": "keyword", "ignore_above": 256},
                        },
                    },
                    "description": {"type": "text"},
                },
            },
            "description": {
                "type": "text",
                "analyzer": "product_text_analyzer",
            },
            "price": {"type": "double"},
            "is_active": {"type": "boolean"},
            "specifications": {
                "type": "object",
                "dynamic": True,
            },
            "primary_image_url": {"type": "keyword", "index": False},
            "images": {
                "type": "object",
                "properties": {
                    "id": {"type": "keyword"},
                    "image_url": {"type": "keyword", "index": False},
                    "is_primary": {"type": "boolean"},
                    "display_order": {"type": "integer"},
                },
            },
            "created_at": {"type": "date"},
            "updated_at": {"type": "date"},
        }
    },
}


class SearchIndexerService:
    """Service handling OpenSearch index creation, batch indexing, and search operations."""

    @staticmethod
    def ensure_product_index(
        client: Optional[OpenSearch] = None,
        index_name: Optional[str] = None,
        recreate: bool = False,
    ) -> bool:
        """
        Check if the dedicated PATRONET product index exists; create it with mappings if not.
        If recreate=True, deletes any existing alias or index first.
        Returns True if created, False if already exists.
        """
        if client is None:
            client = get_opensearch_client()
        if index_name is None:
            index_name = get_opensearch_index_name()

        if recreate:
            # Safely remove any existing alias pointing to this name
            try:
                if client.indices.exists_alias(name=index_name):
                    alias_mapping = client.indices.get_alias(name=index_name)
                    for target_index in alias_mapping.keys():
                        client.indices.delete_alias(index=target_index, name=index_name)
                    logger.info("Deleted stale alias '%s'", index_name)
            except Exception as e:
                logger.warning("Could not delete alias '%s': %s", index_name, e)

            # Safely delete concrete index if it exists
            try:
                if client.indices.exists(index=index_name):
                    client.indices.delete(index=index_name)
                    logger.info("Deleted existing index '%s'", index_name)
            except Exception as e:
                logger.warning("Could not delete index '%s': %s", index_name, e)

            client.indices.create(
                index=index_name,
                body=PRODUCT_INDEX_SETTINGS_MAPPINGS,
            )
            logger.info("Recreated dedicated OpenSearch product index: %s", index_name)
            return True

        exists = client.indices.exists(index=index_name)
        if not exists:
            logger.info("Creating dedicated OpenSearch product index: %s", index_name)
            client.indices.create(
                index=index_name,
                body=PRODUCT_INDEX_SETTINGS_MAPPINGS,
            )
            return True

        logger.info("OpenSearch product index '%s' already exists.", index_name)
        return False

    @classmethod
    def index_all_active_products(
        cls,
        db: Session,
        client: Optional[OpenSearch] = None,
        index_name: Optional[str] = None,
    ) -> IndexingResponse:
        """
        Query all active products from PostgreSQL and bulk-index them into OpenSearch.
        Idempotent: Uses product.id as the document _id, ensuring re-runs update existing
        documents in place without generating duplicates.
        """
        start_time = time.time()

        if client is None:
            client = get_opensearch_client()
        if index_name is None:
            index_name = get_opensearch_index_name()

        # Ensure index exists before populating
        cls.ensure_product_index(client=client, index_name=index_name)

        # Query all active products with category and images eagerly loaded
        stmt = (
            select(Product)
            .options(
                joinedload(Product.category),
                selectinload(Product.images),
            )
            .where(Product.is_active == True)
            .order_by(Product.name.asc())
        )
        products = db.execute(stmt).scalars().all()
        total_active = len(products)
        logger.info("Queried %d active products from PostgreSQL for indexing.", total_active)

        # Build bulk indexing actions
        actions = []
        for product in products:
            primary_img = next(
                (img for img in product.images if img.is_primary), None
            )
            primary_url = (
                primary_img.image_url
                if primary_img
                else (product.images[0].image_url if product.images else None)
            )

            category_data = None
            category_id_str = None
            if product.category:
                category_id_str = str(product.category.id)
                category_data = {
                    "id": category_id_str,
                    "name": product.category.name,
                    "description": product.category.description,
                }

            images_data = [
                {
                    "id": str(img.id),
                    "image_url": img.image_url,
                    "is_primary": img.is_primary,
                    "display_order": img.display_order,
                }
                for img in product.images
            ]

            doc_source = {
                "product_id": str(product.id),
                "name": product.name,
                "brand": product.brand,
                "sku": product.sku,
                "category_id": category_id_str,
                "category": category_data,
                "description": product.description,
                "price": float(product.price) if product.price is not None else 0.0,
                "is_active": product.is_active,
                "specifications": product.specifications or {},
                "primary_image_url": primary_url,
                "images": images_data,
                "created_at": (
                    product.created_at.isoformat()
                    if product.created_at
                    else None
                ),
                "updated_at": (
                    product.updated_at.isoformat()
                    if product.updated_at
                    else None
                ),
            }

            actions.append(
                {
                    "_op_type": "index",
                    "_index": index_name,
                    "_id": str(product.id),
                    "_source": doc_source,
                }
            )

        # Execute bulk indexing
        success_count, errors = helpers.bulk(
            client,
            actions,
            refresh=True,
            raise_on_error=False,
            raise_on_exception=False,
        )

        failed_count = len(errors) if isinstance(errors, list) else 0
        duration = round(time.time() - start_time, 2)

        logger.info(
            "Bulk indexing complete for index '%s': indexed=%d failed=%d duration=%.2fs",
            index_name,
            success_count,
            failed_count,
            duration,
        )

        return IndexingResponse(
            status="success",
            index_name=index_name,
            total_active_in_db=total_active,
            indexed=success_count,
            failed=failed_count,
            duration_seconds=duration,
        )

    @classmethod
    def search_products(
        cls,
        query: str,
        category: Optional[str] = None,
        brand: Optional[str] = None,
        min_price: Optional[Any] = None,
        max_price: Optional[Any] = None,
        sort: Optional[str] = None,
        page: int = 1,
        limit: int = 10,
        fallback_db: Optional[Session] = None,
        client: Optional[OpenSearch] = None,
        index_name: Optional[str] = None,
    ) -> SearchResponse:
        """
        Execute a search query against the OpenSearch products index.
        Supports multi-field matching with score boosting, filtering by category,
        brand, price range, sorting, and pagination.
        Gracefully falls back to PostgreSQL if OpenSearch is unavailable and fallback_db is provided.
        """
        import math
        from uuid import UUID

        if client is None:
            client = get_opensearch_client()
        if index_name is None:
            index_name = get_opensearch_index_name()

        q_clean = query.strip() if query else ""

        try:
            must_clauses: List[Dict[str, Any]] = []
            if q_clean:
                must_clauses.append(
                    {
                        "bool": {
                            "should": [
                                # 1. Exact phrase on product name, brand, or SKU (Highest priority)
                                {
                                    "multi_match": {
                                        "query": q_clean,
                                        "fields": [
                                            "name.keyword^15",
                                            "name^10",
                                            "brand.keyword^8",
                                            "brand^6",
                                            "sku^8",
                                        ],
                                        "type": "phrase",
                                        "boost": 5.0,
                                    }
                                },
                                # 2. Un-fuzzified best-fields match for standard keyword search
                                {
                                    "multi_match": {
                                        "query": q_clean,
                                        "fields": [
                                            "name^8",
                                            "brand^5",
                                            "category.name^3",
                                            "sku^5",
                                            "description^1",
                                        ],
                                        "type": "best_fields",
                                        "operator": "or",
                                        "boost": 2.5,
                                    }
                                },
                                # 3. Prefix matching for partial product names and brands (e.g. 'Appl', 'Nik')
                                {
                                    "multi_match": {
                                        "query": q_clean,
                                        "fields": [
                                            "name^6",
                                            "brand^4",
                                        ],
                                        "type": "phrase_prefix",
                                        "boost": 2.0,
                                    }
                                },
                                # 4. Controlled typo tolerance with fuzziness on core entity fields (name, brand, sku)
                                {
                                    "multi_match": {
                                        "query": q_clean,
                                        "fields": [
                                            "name^4",
                                            "brand^3",
                                            "category.name^2",
                                            "sku^2",
                                        ],
                                        "type": "best_fields",
                                        "fuzziness": "AUTO",
                                        "prefix_length": 1,
                                        "max_expansions": 50,
                                        "boost": 1.0,
                                    }
                                },
                            ],
                            "minimum_should_match": 1,
                        }
                    }
                )
            else:
                must_clauses.append({"match_all": {}})

            filter_clauses: List[Dict[str, Any]] = [{"term": {"is_active": True}}]

            if category and str(category).strip():
                cat_val = str(category).strip()
                try:
                    UUID(cat_val)
                    filter_clauses.append({"term": {"category_id": cat_val}})
                except ValueError:
                    filter_clauses.append(
                        {
                            "bool": {
                                "should": [
                                    {"term": {"category.name.keyword": cat_val}},
                                    {"match_phrase": {"category.name": cat_val}},
                                ],
                                "minimum_should_match": 1,
                            }
                        }
                    )

            if brand and str(brand).strip():
                brand_val = str(brand).strip()
                filter_clauses.append(
                    {
                        "bool": {
                            "should": [
                                {"term": {"brand.keyword": brand_val}},
                                {"match_phrase": {"brand": brand_val}},
                            ],
                            "minimum_should_match": 1,
                        }
                    }
                )

            if min_price is not None or max_price is not None:
                price_range: Dict[str, float] = {}
                if min_price is not None:
                    price_range["gte"] = float(min_price)
                if max_price is not None:
                    price_range["lte"] = float(max_price)
                filter_clauses.append({"range": {"price": price_range}})

            sort_clauses: List[Any] = []
            if sort in ("price-asc", "price_asc"):
                sort_clauses.append({"price": {"order": "asc"}})
            elif sort in ("price-desc", "price_desc"):
                sort_clauses.append({"price": {"order": "desc"}})
            elif sort in ("newest", "created_at_desc"):
                sort_clauses.append({"created_at": {"order": "desc"}})
            else:
                if q_clean:
                    sort_clauses.extend(["_score", {"created_at": {"order": "desc"}}])
                else:
                    sort_clauses.append({"name.keyword": {"order": "asc"}})

            offset = max(0, (page - 1) * limit)

            search_body = {
                "from": offset,
                "size": limit,
                "query": {
                    "bool": {
                        "must": must_clauses,
                        "filter": filter_clauses,
                    }
                },
                "sort": sort_clauses,
            }

            response = client.search(index=index_name, body=search_body)
            raw_hits = response.get("hits", {}).get("hits", [])
            total_hits = response.get("hits", {}).get("total", {}).get("value", 0)

            hits: List[SearchHitItem] = []
            for hit in raw_hits:
                source = hit.get("_source", {})
                cat = source.get("category")
                cat_name = cat.get("name") if isinstance(cat, dict) else None
                cat_id = cat.get("id") if isinstance(cat, dict) else source.get("category_id")

                raw_score = hit.get("_score")
                score_val = float(raw_score) if raw_score is not None else 0.0

                hits.append(
                    SearchHitItem(
                        product_id=source.get("product_id", hit.get("_id")),
                        name=source.get("name", ""),
                        brand=source.get("brand"),
                        category_id=cat_id,
                        category_name=cat_name,
                        description=source.get("description"),
                        sku=source.get("sku", ""),
                        price=float(source.get("price", 0.0)),
                        primary_image_url=source.get("primary_image_url"),
                        specifications=source.get("specifications"),
                        created_at=source.get("created_at"),
                        score=score_val,
                    )
                )

            total_pages = math.ceil(total_hits / limit) if total_hits > 0 else 0
            return SearchResponse(
                query=query,
                total_hits=total_hits,
                hits=hits,
                page=page,
                limit=limit,
                total_pages=total_pages,
                fallback_used=False,
            )

        except Exception as exc:
            logger.warning(
                "OpenSearch search query failed (%s: %s). Checking fallback...",
                type(exc).__name__,
                exc,
            )
            if fallback_db is not None:
                from app.repositories.product_repository import ProductRepository
                total = ProductRepository.count_products(
                    db=fallback_db,
                    category=category,
                    brand=brand,
                    min_price=min_price,
                    max_price=max_price,
                    q=query,
                )
                rows = ProductRepository.get_products(
                    db=fallback_db,
                    page=page,
                    limit=limit,
                    category=category,
                    brand=brand,
                    min_price=min_price,
                    max_price=max_price,
                    q=query,
                    sort=sort,
                )
                hits = [
                    SearchHitItem(
                        product_id=str(prod.id),
                        name=prod.name,
                        brand=prod.brand,
                        category_id=str(cat.id) if cat else None,
                        category_name=cat.name if cat else None,
                        description=prod.description,
                        sku=prod.sku,
                        price=float(prod.price) if prod.price is not None else 0.0,
                        primary_image_url=img_url,
                        specifications=prod.specifications,
                        created_at=prod.created_at.isoformat() if prod.created_at else None,
                        score=1.0,
                    )
                    for prod, cat, img_url in rows
                ]
                total_pages = math.ceil(total / limit) if total > 0 else 0
                return SearchResponse(
                    query=query,
                    total_hits=total,
                    hits=hits,
                    page=page,
                    limit=limit,
                    total_pages=total_pages,
                    fallback_used=True,
                )
            raise exc

    @classmethod
    def get_suggestions(
        cls,
        query: str,
        limit: int = 5,
        fallback_db: Optional[Session] = None,
        client: Optional[OpenSearch] = None,
        index_name: Optional[str] = None,
    ) -> SearchSuggestionResponse:
        """
        Generate proactive search suggestions including products, categories,
        brands, and spelling corrections ("Did you mean?").
        """
        q_clean = query.strip()
        if not q_clean or len(q_clean) < 2:
            return SearchSuggestionResponse(
                query=query,
                products=[],
                categories=[],
                brands=[],
                corrections=[],
                fallback_used=False,
            )

        if client is None:
            client = get_opensearch_client()
        if index_name is None:
            index_name = get_opensearch_index_name()

        try:
            body = {
                "size": limit,
                "query": {
                    "bool": {
                        "must": [
                            {
                                "bool": {
                                    "should": [
                                        {
                                            "multi_match": {
                                                "query": q_clean,
                                                "fields": [
                                                    "name.keyword^15",
                                                    "name^10",
                                                    "brand.keyword^8",
                                                    "brand^6",
                                                    "sku^8",
                                                ],
                                                "type": "phrase",
                                                "boost": 5.0,
                                            }
                                        },
                                        {
                                            "multi_match": {
                                                "query": q_clean,
                                                "fields": [
                                                    "name^8",
                                                    "brand^5",
                                                    "category.name^3",
                                                    "sku^5",
                                                    "description^1",
                                                ],
                                                "type": "best_fields",
                                                "operator": "or",
                                                "boost": 2.5,
                                            }
                                        },
                                        {
                                            "multi_match": {
                                                "query": q_clean,
                                                "fields": ["name^6", "brand^4"],
                                                "type": "phrase_prefix",
                                                "boost": 2.0,
                                            }
                                        },
                                        {
                                            "multi_match": {
                                                "query": q_clean,
                                                "fields": [
                                                    "name^4",
                                                    "brand^3",
                                                    "category.name^2",
                                                    "sku^2",
                                                ],
                                                "type": "best_fields",
                                                "fuzziness": "AUTO",
                                                "prefix_length": 1,
                                                "max_expansions": 50,
                                                "boost": 1.0,
                                            }
                                        },
                                    ],
                                    "minimum_should_match": 1,
                                }
                            }
                        ],
                        "filter": [{"term": {"is_active": True}}],
                    }
                },
                "suggest": {
                    "text": q_clean.lower(),
                    "name_suggest": {
                        "term": {
                            "field": "name",
                            "suggest_mode": "always",
                            "min_word_length": 3,
                        }
                    },
                    "brand_suggest": {
                        "term": {
                            "field": "brand",
                            "suggest_mode": "always",
                            "min_word_length": 3,
                        }
                    },
                },
            }

            res = client.search(index=index_name, body=body)
            raw_hits = res.get("hits", {}).get("hits", [])

            products = [
                SuggestProductItem(
                    id=hit.get("_source", {}).get("product_id", hit.get("_id")),
                    name=hit.get("_source", {}).get("name", ""),
                    brand=hit.get("_source", {}).get("brand"),
                    category_name=(
                        hit.get("_source", {}).get("category", {}).get("name")
                        if isinstance(hit.get("_source", {}).get("category"), dict)
                        else None
                    ),
                    sku=hit.get("_source", {}).get("sku"),
                    price=float(hit.get("_source", {}).get("price", 0.0)),
                    primary_image_url=hit.get("_source", {}).get("primary_image_url"),
                )
                for hit in raw_hits
            ]

            # Categories derived from hits + direct name prefix/fuzzy matching
            known_categories = [
                ("Electronics", "Electronics & Gadgets"),
                ("Fashion", "Clothing & Apparel"),
                ("Grocery", "Daily Essentials & Pantry"),
                ("Home & Kitchen", "Appliances & Dining"),
                ("Beauty & Personal Care", "Skincare & Grooming"),
                ("Accessories", "Watches, Bags & Wallets"),
            ]
            cats_map: Dict[str, Optional[str]] = {}
            for hit in raw_hits:
                cat = hit.get("_source", {}).get("category")
                if isinstance(cat, dict) and cat.get("name"):
                    cats_map[cat["name"]] = cat.get("id")

            # Also check if q_clean directly matches any category name prefix
            for cat_name, _ in known_categories:
                if q_clean.lower() in cat_name.lower():
                    if cat_name not in cats_map:
                        cats_map[cat_name] = None

            categories = [
                SuggestCategoryItem(id=cat_id, name=cat_name)
                for cat_name, cat_id in list(cats_map.items())[:4]
            ]

            # Brands derived from product hits
            brands = list(
                dict.fromkeys(
                    [
                        hit.get("_source", {}).get("brand")
                        for hit in raw_hits
                        if hit.get("_source", {}).get("brand")
                    ]
                )
            )[:4]

            # Spelling corrections from OpenSearch suggest
            corrections = []
            seen = {q_clean.lower()}
            suggest_data = res.get("suggest", {})
            for sugg_key in ["brand_suggest", "name_suggest"]:
                for entry in suggest_data.get(sugg_key, []):
                    for opt in entry.get("options", []):
                        word = opt.get("text", "").strip()
                        if (
                            word
                            and word.lower() not in seen
                            and float(opt.get("score", 0.0)) >= 0.7
                        ):
                            seen.add(word.lower())
                            brand_match = next(
                                (
                                    b
                                    for b in [
                                        "MacBook",
                                        "Samsung",
                                        "Headphones",
                                        "Apple",
                                        "Nike",
                                        "Puma",
                                        "Sony",
                                        "Dell",
                                        "Xiaomi",
                                        "OnePlus",
                                        "Tata",
                                        "Amul",
                                        "Fortune",
                                        "Wildcraft",
                                        "Fastrack",
                                    ]
                                    if b.lower() == word.lower()
                                ),
                                None,
                            )
                            corrections.append(
                                brand_match if brand_match else word.title()
                            )

            return SearchSuggestionResponse(
                query=query,
                products=products,
                categories=categories,
                brands=brands,
                corrections=corrections[:3],
                fallback_used=False,
            )

        except Exception as exc:
            logger.warning(
                "OpenSearch get_suggestions failed (%s: %s). Checking fallback...",
                type(exc).__name__,
                exc,
            )
            if fallback_db is not None:
                from app.repositories.product_repository import ProductRepository

                rows = ProductRepository.get_products(
                    db=fallback_db,
                    page=1,
                    limit=limit,
                    q=query,
                )
                products = [
                    SuggestProductItem(
                        id=str(prod.id),
                        name=prod.name,
                        brand=prod.brand,
                        category_name=cat.name if cat else None,
                        sku=prod.sku,
                        price=float(prod.price) if prod.price is not None else 0.0,
                        primary_image_url=img_url,
                    )
                    for prod, cat, img_url in rows
                ]
                cats_map = {
                    cat.name: str(cat.id) for prod, cat, _ in rows if cat
                }
                categories = [
                    SuggestCategoryItem(id=cat_id, name=cat_name)
                    for cat_name, cat_id in list(cats_map.items())[:3]
                ]
                brands = list(
                    dict.fromkeys(
                        [prod.brand for prod, _, _ in rows if prod.brand]
                    )
                )[:4]
                return SearchSuggestionResponse(
                    query=query,
                    products=products,
                    categories=categories,
                    brands=brands,
                    corrections=[],
                    fallback_used=True,
                )
            return SearchSuggestionResponse(
                query=query,
                products=[],
                categories=[],
                brands=[],
                corrections=[],
                fallback_used=True,
            )
