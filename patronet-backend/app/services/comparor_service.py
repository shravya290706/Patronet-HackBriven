"""
Business logic service for AI-powered Product Comparison (Comparor).
Uses Gemini API to analyze specifications, prices, and trade-offs of real products,
with strict validation and robust deterministic fallback.
"""
from decimal import Decimal
import logging
from typing import Any, Dict, List, Optional
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.catalog import Product
from app.schemas.comparor import (
    ComparorAnalysisRequest,
    ComparorAnalysisResponse,
    ComparorProductAnalysis,
)
from app.services.gemini_service import GeminiService

logger = logging.getLogger(__name__)


class ComparorService:
    """Orchestrates AI analysis and deterministic calculation for Comparor."""

    @classmethod
    def _deterministic_fallback(
        cls,
        products: List[Product],
        context: Optional[str] = None,
    ) -> ComparorAnalysisResponse:
        """Deterministic fallback when Gemini API is unavailable or returns invalid data."""
        sorted_by_price = sorted(products, key=lambda p: p.price)
        min_p = sorted_by_price[0]
        max_p = sorted_by_price[-1]
        spread = max_p.price - min_p.price

        # Best value score based on spec count and price ratio
        best_val = min_p
        highest_score = -1.0
        for p in products:
            spec_count = len(p.specifications or {})
            score = (spec_count * 10000.0) / float(p.price if p.price > 0 else 1)
            if score > highest_score:
                highest_score = score
                best_val = p

        product_analyses = []
        for p in products:
            pros = []
            cons = []
            if p.id == min_p.id:
                pros.append(f"Lowest price in selection (₹{p.price:,.2f})")
            elif p.id == max_p.id:
                cons.append(f"Highest investment tier (₹{p.price:,.2f})")

            if p.id == best_val.id:
                pros.append("Optimal price-to-specification ratio")

            spec_count = len(p.specifications or {})
            if spec_count >= 5:
                pros.append(f"Detailed specification coverage ({spec_count} key attributes)")
            else:
                cons.append("Basic feature specifications provided")

            inv_items = getattr(p, "inventory_items", None) or getattr(p, "inventory", None)
            is_in_stock = p.is_active and (
                any(inv.available_stock > 0 for inv in inv_items) if inv_items else True
            )
            if is_in_stock:
                pros.append("In stock and available for immediate dispatch")
            else:
                cons.append("Limited or out of stock")

            rating = "Best Value Champion" if p.id == best_val.id else ("Premium Tier" if p.id == max_p.id else "Balanced Choice")
            product_analyses.append(
                ComparorProductAnalysis(
                    product_id=p.id,
                    name=p.name,
                    pros=pros[:3],
                    cons=cons[:2] if cons else ["Standard warranty coverage"],
                    ideal_for=f"Buyers looking for {p.brand or 'hardware'} solutions",
                    value_rating=rating,
                )
            )

        context_str = f" for {context}" if context else ""
        summary = (
            f"Comparing {len(products)} hardware products{context_str}. "
            f"Prices span from ₹{min_p.price:,.2f} ({min_p.name}) to ₹{max_p.price:,.2f} ({max_p.name}), "
            f"representing a total spread of ₹{spread:,.2f}."
        )

        return ComparorAnalysisResponse(
            is_ai_powered=False,
            model_used="deterministic-rule-engine",
            executive_summary=summary,
            key_differences=[
                f"Price difference of ₹{spread:,.2f} between entry and premium tiers.",
                f"{best_val.name} provides the highest feature-to-cost efficiency.",
                f"{max_p.name} represents the high-end specification tier.",
            ],
            product_analyses=product_analyses,
            persona_recommendations={
                "Budget Focused": f"{min_p.name} - lowest initial cost at ₹{min_p.price:,.2f}",
                "Best Value": f"{best_val.name} - highest specification density per rupee",
                "Power User": f"{max_p.name} - top-tier hardware configuration",
            },
            best_overall_id=best_val.id,
            best_value_id=best_val.id,
            verdict=f"For optimal value{context_str}, we recommend {best_val.name}. If budget is the primary constraint, choose {min_p.name}.",
        )

    @classmethod
    def analyze_comparison(
        cls,
        db: Session,
        req: ComparorAnalysisRequest,
    ) -> ComparorAnalysisResponse:
        """Perform AI-powered comparison with strict verification against real database records."""
        # Fetch real products
        products = db.query(Product).filter(Product.id.in_(req.product_ids)).all()
        if len(products) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least 2 valid products from the catalogue are required for comparison.",
            )

        valid_ids_map = {str(p.id): p for p in products}

        # Check if Gemini is available
        if not GeminiService.is_available():
            return cls._deterministic_fallback(products, req.context)

        # Prepare sanitized real catalogue payload for Gemini
        products_payload = []
        for p in products:
            products_payload.append({
                "product_id": str(p.id),
                "name": p.name,
                "brand": p.brand or "Unknown",
                "price_inr": float(p.price),
                "category": p.category.name if p.category else "Hardware",
                "specifications": p.specifications or {},
            })

        system_instruction = (
            "You are PATRONET's Chief Hardware Comparison Architect. "
            "Analyze the provided real hardware items objectively based on their real specifications and prices. "
            "RULES:\n"
            "1. ONLY reference the provided product_ids. NEVER invent, fabricate, or change product IDs, names, or prices.\n"
            "2. Provide grounded, concise technical pros and cons.\n"
            "3. Return strict JSON matching the schema.\n"
            "JSON SCHEMA:\n"
            "{\n"
            '  "executive_summary": "string",\n'
            '  "key_differences": ["string"],\n'
            '  "product_analyses": [\n'
            '    {\n'
            '      "product_id": "string",\n'
            '      "name": "string",\n'
            '      "pros": ["string"],\n'
            '      "cons": ["string"],\n'
            '      "ideal_for": "string",\n'
            '      "value_rating": "string"\n'
            "    }\n"
            "  ],\n"
            '  "persona_recommendations": {"Persona Name": "Recommendation explanation"},\n'
            '  "best_overall_id": "string",\n'
            '  "best_value_id": "string",\n'
            '  "verdict": "string"\n'
            "}"
        )

        user_prompt = (
            f"User Context: {req.context or 'General Purchasing Decision'}\n\n"
            f"Products to Compare:\n{products_payload}"
        )

        cache_key = f"comparor:{'_'.join(sorted([str(pid) for pid in req.product_ids]))}:{req.context or 'general'}"
        ai_response = GeminiService.generate_json(
            prompt=user_prompt,
            system_instruction=system_instruction,
            cache_key=cache_key,
            temperature=0.2,
        )

        if not ai_response:
            logger.info("Gemini response unavailable; falling back to deterministic Comparor engine.")
            return cls._deterministic_fallback(products, req.context)

        try:
            # STRICT VALIDATION: Verify product IDs returned by Gemini
            analyses = []
            returned_analyses = ai_response.get("product_analyses", [])
            for item in returned_analyses:
                pid_str = str(item.get("product_id", "")).strip()
                if pid_str in valid_ids_map:
                    real_prod = valid_ids_map[pid_str]
                    analyses.append(
                        ComparorProductAnalysis(
                            product_id=real_prod.id,
                            name=real_prod.name,
                            pros=item.get("pros", [])[:4],
                            cons=item.get("cons", [])[:3],
                            ideal_for=str(item.get("ideal_for", "General users")),
                            value_rating=str(item.get("value_rating", "Competitive Value")),
                        )
                    )

            if len(analyses) < 2:
                logger.warning("Gemini returned insufficient valid product IDs; falling back to deterministic.")
                return cls._deterministic_fallback(products, req.context)

            # Validate best IDs
            best_overall_str = str(ai_response.get("best_overall_id", "")).strip()
            best_value_str = str(ai_response.get("best_value_id", "")).strip()

            best_overall_id = UUID(best_overall_str) if best_overall_str in valid_ids_map else products[0].id
            best_value_id = UUID(best_value_str) if best_value_str in valid_ids_map else analyses[0].product_id

            return ComparorAnalysisResponse(
                is_ai_powered=True,
                model_used=GeminiService.get_model_name(),
                executive_summary=str(ai_response.get("executive_summary", "")),
                key_differences=list(ai_response.get("key_differences", []))[:5],
                product_analyses=analyses,
                persona_recommendations=dict(ai_response.get("persona_recommendations", {})),
                best_overall_id=best_overall_id,
                best_value_id=best_value_id,
                verdict=str(ai_response.get("verdict", "")),
            )

        except Exception as e:
            logger.warning("Error parsing or validating Gemini Comparor output: %s", str(e))
            return cls._deterministic_fallback(products, req.context)
