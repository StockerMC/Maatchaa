"""
Relevance scoring utilities for product-to-creator matching
"""
import json
from typing import Optional


def calculate_relevance_score(
    product: dict,
    video: dict,
    analysis: dict,
    source_keyword: str
) -> tuple[float, str]:
    """
    Calculate relevance score (0-10) between a product and creator video.

    Args:
        product: Product dict with title, description
        video: Video dict with title, description
        analysis: Gemini analysis dict
        source_keyword: The keyword that found this video

    Returns:
        tuple of (score, reasoning)
    """

    score = 0.0
    reasons = []

    product_title = product.get("title", "").lower()
    product_desc = product.get("description", "").lower()
    video_title = video.get("title", "").lower()
    video_desc = video.get("description", "").lower()

    # 1. Keyword match in video title/desc (0-3 points)
    keyword_lower = source_keyword.lower()
    if keyword_lower in video_title:
        score += 2.0
        reasons.append("keyword in title")
    if keyword_lower in video_desc:
        score += 1.0
        reasons.append("keyword in description")

    # 2. Product name in video (0-3 points)
    # Extract main product name (remove common words)
    product_words = set(product_title.split()) - {"the", "a", "an", "and", "or", "for"}
    matches = sum(1 for word in product_words if word in video_title or word in video_desc)
    if matches > 0:
        score += min(3.0, matches * 1.5)
        reasons.append(f"{matches} product terms matched")

    # 3. Content type indicators (0-2 points)
    review_terms = ["review", "unboxing", "haul", "try on", "test", "first impressions"]
    if any(term in video_title for term in review_terms):
        score += 2.0
        reasons.append("review/unboxing content")

    # 4. Category alignment (0-2 points)
    product_categories = set()
    if "snowboard" in product_title or "ski" in product_title:
        product_categories.update(["sports", "outdoors", "winter sports"])
    if "gift" in product_title or "card" in product_title:
        product_categories.update(["gifts", "shopping", "lifestyle"])
    if "tech" in product_title or "gadget" in product_title:
        product_categories.update(["tech", "technology", "gadgets"])

    video_categories = set(analysis.get("potential_categories", []))
    category_overlap = len(product_categories & video_categories)
    if category_overlap > 0:
        score += min(2.0, category_overlap)
        reasons.append(f"category match: {category_overlap}")

    # Normalize to 0-10 scale
    score = min(10.0, score)

    reasoning = "; ".join(reasons) if reasons else "low relevance"

    return score, reasoning


def is_video_relevant(
    score: float,
    views: int,
    min_score: float = 5.0,
    min_views: int = 5000
) -> tuple[bool, str]:
    """
    Determine if a video meets minimum relevance and quality thresholds.

    Args:
        score: Relevance score (0-10)
        views: Video view count
        min_score: Minimum relevance score required
        min_views: Minimum view count required

    Returns:
        tuple of (is_relevant, reason)
    """

    if score < min_score:
        return False, f"low relevance score: {score:.1f} < {min_score}"

    if views < min_views:
        return False, f"low view count: {views:,} < {min_views:,}"

    return True, f"score: {score:.1f}, views: {views:,}"
