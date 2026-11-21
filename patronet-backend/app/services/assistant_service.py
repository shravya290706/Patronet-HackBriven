"""
AI Shopping Assistant Service.
Understands natural language shopping intent, budget constraints, categories, and attributes.
Combines Google Gemini API for intelligent context reasoning with strict database-backed
product verification and deterministic fallback.
"""
from decimal import Decimal
import hashlib
import json
import logging
import re
from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.catalog import Product, Category
from app.schemas.assistant import (
    AssistantChatRequest,
    AssistantChatResponse,
    ProductRecommendationItem,
)
from app.schemas.category import CategorySimple
from app.services.gemini_service import GeminiService

logger = logging.getLogger(__name__)

# Category keyword synonyms mapped to official database category names
CATEGORY_KEYWORDS: Dict[str, List[str]] = {
    "Laptops & Computers": [
        "laptop", "laptops", "notebook", "macbook", "computer", "pc",
        "desktop", "workstation", "programming", "coding", "developer", "software",
    ],
    "Smartphones & Accessories": [
        "phone", "phones", "smartphone", "smartphones", "iphone", "galaxy",
        "mobile", "charger", "adapter", "android",
    ],
    "Audio & Headphones": [
        "headphone", "headphones", "earphone", "earphones", "earbuds", "earbud",
        "audio", "sound", "speaker", "speakers", "noise cancelling", "anc", "tws",
    ],
    "Wearables & Smart Tech": [
        "watch", "watches", "smartwatch", "smart watch", "fitness", "tracker",
        "band", "wearable",
    ],
    "Cameras & Photography": [
        "camera", "cameras", "dslr", "mirrorless", "lens", "lenses",
        "photography", "photo", "vlog", "vlogging", "tripod",
    ],
    "Gaming & Entertainment": [
        "gaming", "game", "games", "console", "playstation", "ps5", "xbox",
        "controller", "nintendo", "joystick", "gpu",
    ],
}


class AssistantService:

    @classmethod
    def _extract_budget(cls, text: str) -> Optional[Decimal]:
        """Extract budget limit from natural language expressions like 'under ₹3,000' or 'below 50k'."""
        text_lower = text.lower()

        # Regex for budget phrases
        pattern = r"(?:under|below|less than|within|budget of?|max(?:imum)? of?|upto|up to)\s*(?:₹|rs\.?|inr)?\s*([0-9]+(?:,[0-9]+)?(?:\.[0-9]+)?)\s*(k|lakh|lac|thousand)?"
        match = re.search(pattern, text_lower)
        if match:
            raw_num = match.group(1).replace(",", "")
            multiplier = match.group(2)
            try:
                val = float(raw_num)
                if multiplier in ["k", "thousand"]:
                    val *= 1000
                elif multiplier in ["lakh", "lac"]:
                    val *= 100000
                return Decimal(str(val)).quantize(Decimal("0.01"))
            except (ValueError, TypeError):
                pass

        # Standalone currency mention like '₹3000' or '3000 inr'
        currency_pattern = r"(?:₹|rs\.?|inr)\s*([0-9]+(?:,[0-9]+)?)"
        match_curr = re.search(currency_pattern, text_lower)
        if match_curr:
            try:
                raw_num = match_curr.group(1).replace(",", "")
                return Decimal(raw_num).quantize(Decimal("0.01"))
            except (ValueError, TypeError):
                pass

        return None

    @classmethod
    def _detect_category(cls, text: str) -> Optional[str]:
        """Detect the most relevant official product category from query keywords."""
        text_lower = text.lower()
        for cat_name, keywords in CATEGORY_KEYWORDS.items():
            for kw in keywords:
                if re.search(r"\b" + re.escape(kw) + r"\b", text_lower):
                    return cat_name
        return None

    @classmethod
    def _detect_intent(cls, text: str) -> str:
        """Detect shopping intent (alternative, recommendation, programming, gaming, gift, budget)."""
        text_lower = text.lower()
        if any(w in text_lower for w in ["cheaper", "alternative", "similar to", "substitute"]):
            return "alternative"
        if any(w in text_lower for w in ["programming", "coding", "developer", "software development", "cs"]):
            return "programming"
        if any(w in text_lower for w in ["gaming", "game", "esports", "fps", "rtx"]):
            return "gaming"
        if any(w in text_lower for w in ["gift", "present", "birthday", "friend"]):
            return "gift"
        if any(w in text_lower for w in ["compare", "versus", "vs", "which is better"]):
            return "compare"
        return "general_recommendation"

    @classmethod
    def _format_product_rec(cls, prod: Product, reason: str, kspecs: Dict[str, Any]) -> ProductRecommendationItem:
        primary_img = None
        if prod.images:
            prim = next((i for i in prod.images if i.is_primary), None)
            primary_img = prim.image_url if prim else prod.images[0].image_url

        return ProductRecommendationItem(
            id=prod.id,
            name=prod.name,
            description=prod.description,
            brand=prod.brand,
            sku=prod.sku,
            price=Decimal(str(prod.price)).quantize(Decimal("0.01")),
            is_active=prod.is_active,
            category=CategorySimple(id=prod.category.id, name=prod.category.name) if prod.category else None,
            primary_image_url=primary_img,
            match_reason=reason,
            key_specs=kspecs,
        )

    @classmethod
    def _process_deterministic(
        cls,
        all_products: List[Product],
        message: str,
        budget: Optional[Decimal],
        category_name: Optional[str],
        intent: str,
    ) -> AssistantChatResponse:
        """Original robust rule-based recommendation engine for immediate fallback."""
        tokens = [t for t in re.findall(r"\w+", message.lower()) if len(t) > 2]
        scored_products: List[Tuple[float, Product, str, Dict[str, Any]]] = []

        for p in all_products:
            score = 0.0
            reasons = []
            key_specs: Dict[str, Any] = {}

            p_cat = p.category.name if p.category else ""
            p_name = p.name.lower()
            p_desc = (p.description or "").lower()
            p_brand = (p.brand or "").lower()
            p_price = Decimal(str(p.price))

            specs = p.specifications or {}
            specs_text = " ".join([f"{k} {v}" for k, v in specs.items() if isinstance(v, (str, int, float))]).lower()

            if category_name:
                if p_cat.lower() == category_name.lower():
                    score += 25.0
                    reasons.append(f"Official {category_name} hardware")
                else:
                    score -= 15.0

            for t in tokens:
                if t in p_name:
                    score += 8.0
                elif t in p_brand:
                    score += 6.0
                elif t in specs_text:
                    score += 4.0
                elif t in p_desc:
                    score += 2.0

            if intent == "programming":
                if "laptop" in p_name or "macbook" in p_name or "thinkpad" in p_name or p_cat == "Laptops & Computers":
                    score += 20.0
                    if any(ram in specs_text for ram in ["16gb", "32gb", "64gb", "m1", "m2", "m3", "i7", "i9", "ryzen 7"]):
                        score += 15.0
                        reasons.append("High RAM and multi-core processing suitable for IDEs, Docker, and compilation")

            elif intent == "gaming":
                if any(k in p_name or k in specs_text for k in ["gaming", "rtx", "gpu", "playstation", "xbox", "144hz", "165hz", "240hz"]):
                    score += 20.0
                    reasons.append("Dedicated gaming architecture and high-refresh performance")

            elif intent == "alternative":
                score += 10.0

            if budget:
                if p_price <= budget:
                    score += 20.0
                    savings = budget - p_price
                    if savings > 0:
                        reasons.append(f"Within your budget of ₹{budget:,.0f} (₹{savings:,.0f} under budget)")
                    else:
                        reasons.append(f"Matches your exact budget of ₹{budget:,.0f}")
                elif p_price <= budget * Decimal("1.10"):
                    score += 5.0
                    reasons.append(f"Just ₹{(p_price - budget):,.0f} above budget for superior specifications")
                else:
                    score -= 30.0

            if specs and isinstance(specs, dict):
                for k, v in specs.items():
                    if k not in ["data_provenance", "Category"] and len(key_specs) < 3:
                        key_specs[k] = v

            if score > 0:
                explanation = "; ".join(reasons[:2]) if reasons else "High relevance match based on your search criteria"
                scored_products.append((score, p, explanation, key_specs))

        scored_products.sort(key=lambda x: x[0], reverse=True)

        if not scored_products:
            fallback_list = [p for p in all_products if (not category_name or (p.category and p.category.name == category_name))]
            if not fallback_list:
                fallback_list = all_products
            fallback_list = sorted(fallback_list, key=lambda x: x.price)[:3]
            for p in fallback_list:
                scored_products.append((
                    1.0,
                    p,
                    "Alternative recommendation from our verified catalogue",
                    {k: v for k, v in (p.specifications or {}).items() if k not in ["data_provenance", "Category"]},
                ))

        top_matches = scored_products[:3]
        recommendations = [cls._format_product_rec(prod, reason, kspecs) for _, prod, reason, kspecs in top_matches]

        reply_lines = []
        if intent == "programming":
            reply_lines.append("Here are top-tier developer machines engineered for compiling code, running Docker containers, and handling heavy multitasking:")
        elif intent == "gaming":
            reply_lines.append("For an immersive gaming experience with high framerates and responsive performance, take a look at these picks:")
        elif intent == "alternative":
            reply_lines.append("I found these high-value alternatives that deliver great performance while offering competitive pricing:")
        elif budget:
            reply_lines.append(f"I found {len(recommendations)} great options tailored for your budget of ₹{budget:,.0f}:")
        elif category_name:
            reply_lines.append(f"Here are our most recommended hardware selections in {category_name}:")
        else:
            reply_lines.append("Based on what you're looking for, here are our best recommendations from the catalogue:")

        for rec in recommendations:
            reply_lines.append(f"• **{rec.name}** (₹{rec.price:,.0f}) — *{rec.match_reason}*")

        reply_lines.append("\nFeel free to ask me to compare these, filter by a different budget, or find cheaper alternatives!")
        reply = "\n".join(reply_lines)

        suggested_queries = []
        if category_name:
            suggested_queries.append(f"Show cheaper {category_name.lower()}")
        if budget:
            suggested_queries.append(f"Options under ₹{(budget * Decimal('0.7')):,.0f}")
        suggested_queries.extend([
            "Compare top 2 options side-by-side",
            "What warranty is included?",
        ])

        return AssistantChatResponse(
            reply=reply,
            recommendations=recommendations,
            suggested_queries=suggested_queries[:4],
            intent=intent,
            detected_category=category_name,
            detected_budget=budget,
            is_ai_powered=False,
            model_used=None,
        )

    @classmethod
    def process_chat(cls, db: Session, req: AssistantChatRequest) -> AssistantChatResponse:
        """
        Process chat with intelligent Gemini reasoning when available,
        coupled with strict catalog validation and deterministic fallback.
        """
        message = req.message.strip()
        budget = cls._extract_budget(message)
        category_name = cls._detect_category(message)
        intent = cls._detect_intent(message)

        # Retrieve all active products
        query = db.query(Product).filter(Product.is_active == True)
        all_products = query.all()

        if not all_products:
            return AssistantChatResponse(
                reply="Our catalogue is currently undergoing maintenance. Please check back shortly!",
                recommendations=[],
                suggested_queries=["Browse categories", "Contact support"],
                is_ai_powered=False,
                model_used=None,
            )

        # Map products by ID for strict verification
        products_map: Dict[str, Product] = {str(p.id): p for p in all_products}

        # Check if Gemini is available
        if GeminiService.is_available():
            try:
                # Pre-filter candidate products (up to 12) to fit token budget and speed
                candidates: List[Product] = []
                tokens = [t for t in re.findall(r"\w+", message.lower()) if len(t) > 2]

                def candidate_relevance(p: Product) -> float:
                    rel = 0.0
                    p_cat = p.category.name if p.category else ""
                    if category_name and p_cat.lower() == category_name.lower():
                        rel += 20.0
                    for t in tokens:
                        if t in p.name.lower():
                            rel += 10.0
                        if p.brand and t in p.brand.lower():
                            rel += 5.0
                    if budget and Decimal(str(p.price)) <= budget:
                        rel += 15.0
                    return rel

                sorted_candidates = sorted(all_products, key=candidate_relevance, reverse=True)
                candidates = sorted_candidates[:12]

                # Format candidates for Gemini prompt
                candidate_summary = []
                for p in candidates:
                    cat = p.category.name if p.category else "General"
                    specs = p.specifications or {}
                    specs_str = ", ".join([f"{k}: {v}" for k, v in list(specs.items())[:4] if k not in ["data_provenance", "Category"]])
                    candidate_summary.append({
                        "id": str(p.id),
                        "name": p.name,
                        "brand": p.brand or "Generic",
                        "price": float(p.price),
                        "category": cat,
                        "specs": specs_str,
                    })

                cache_raw = f"{message}_{budget}_{category_name}"
                cache_key = f"assistant_{hashlib.md5(cache_raw.encode('utf-8')).hexdigest()}"

                system_instruction = (
                    "You are the expert AI Shopping Buddy for PATRONET, a premium Indian hardware & electronics e-commerce store. "
                    "You strictly recommend items ONLY from the provided Candidate Catalog. "
                    "CRITICAL GUARDRAIL: NEVER invent products or product IDs. You must pick exactly 1 to 3 items from the candidates list. "
                    "Respond with a valid JSON object matching this schema:\n"
                    "{\n"
                    '  "reply": "Friendly, professional advice in markdown explaining the choices, addressing the user query directly.",\n'
                    '  "recommendations": [\n'
                    '    {\n'
                    '      "id": "exact_product_id_from_candidates",\n'
                    '      "match_reason": "Specific reason why this hardware matches user needs and budget.",\n'
                    '      "key_specs": {"spec_key": "spec_value"}\n'
                    '    }\n'
                    '  ],\n'
                    '  "suggested_queries": ["Follow-up query 1", "Follow-up query 2", "Follow-up query 3"]\n'
                    "}"
                )

                prompt = (
                    f"User Query: \"{message}\"\n"
                    f"Detected Intent: {intent}\n"
                    f"Budget Constraint: ₹{budget:,.0f}" if budget else "Budget Constraint: None specified\n"
                    f"Detected Category: {category_name if category_name else 'Open / Multi-category'}\n\n"
                    f"Candidate Catalog (Available Stock):\n"
                    f"{json.dumps(candidate_summary, indent=2)}\n\n"
                    "Select the best matching products from the candidates, craft reasoned explanations, and generate the JSON response."
                )

                ai_res = GeminiService.generate_json(
                    prompt=prompt,
                    system_instruction=system_instruction,
                    cache_key=cache_key,
                    temperature=0.3,
                )

                if ai_res and isinstance(ai_res, dict) and "recommendations" in ai_res:
                    validated_recommendations: List[ProductRecommendationItem] = []
                    raw_recs = ai_res.get("recommendations", [])
                    if isinstance(raw_recs, list):
                        for rec in raw_recs:
                            p_id = str(rec.get("id") or "").strip()
                            # STRICT GUARDRAIL: Product ID must exist in our actual database map!
                            if p_id in products_map:
                                real_prod = products_map[p_id]
                                reason = rec.get("match_reason") or f"Recommended based on your search for '{message}'"
                                kspecs = rec.get("key_specs") or {}
                                if not isinstance(kspecs, dict):
                                    kspecs = {}
                                # Supplement specs from actual product if missing
                                if not kspecs and real_prod.specifications:
                                    for k, v in real_prod.specifications.items():
                                        if k not in ["data_provenance", "Category"] and len(kspecs) < 3:
                                            kspecs[k] = v

                                validated_recommendations.append(
                                    cls._format_product_rec(real_prod, reason, kspecs)
                                )

                    if validated_recommendations:
                        raw_reply = ai_res.get("reply") or "Here are my top recommendations for you:"
                        raw_suggestions = ai_res.get("suggested_queries") or []
                        if not isinstance(raw_suggestions, list) or not raw_suggestions:
                            raw_suggestions = [
                                "Compare these options side-by-side",
                                "Show cheaper alternatives",
                                "What warranty is included?",
                            ]

                        return AssistantChatResponse(
                            reply=raw_reply,
                            recommendations=validated_recommendations[:3],
                            suggested_queries=[str(s) for s in raw_suggestions[:4]],
                            intent=intent,
                            detected_category=category_name,
                            detected_budget=budget,
                            is_ai_powered=True,
                            model_used=GeminiService.get_model_name(),
                        )

            except Exception as e:
                logger.warning("Error in Gemini shopping assistant flow: %s; falling back to deterministic engine.", str(e))

        # Fallback to deterministic engine
        return cls._process_deterministic(all_products, message, budget, category_name, intent)

    @classmethod
    def get_quick_suggestions(cls) -> List[str]:
        return [
            "Find headphones under ₹3,000",
            "Which laptop is best for programming?",
            "I need a gift for my friend under ₹5,000",
            "Show me top noise-cancelling earphones",
            "Cheaper alternative to MacBook",
            "Best smartwatches for fitness tracking",
        ]
