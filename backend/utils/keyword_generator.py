"""
Smart Keyword Generator for YouTube Search
Generates searchable keywords from product titles and descriptions
"""

import re
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()


def extract_core_product_terms(title: str) -> list[str]:
    """
    Extract core product terms from title using simple string processing.
    Removes test prefixes and common words.

    Args:
        title: Product title (e.g. "Selling Plans Ski Wax")

    Returns:
        List of extracted terms (e.g. ["ski wax"])
    """
    # Remove common Shopify test prefixes
    test_prefixes = [
        "selling plans",
        "the 3p fulfilled",
        "the archived",
        "the collection",
        "the complete",
        "the multi-location",
        "the hidden",
        "the out of stock"
    ]

    title_lower = title.lower()
    for prefix in test_prefixes:
        if title_lower.startswith(prefix):
            title = title[len(prefix):].strip()

    # Remove leading articles
    title = re.sub(r'^(the|a|an)\s+', '', title, flags=re.IGNORECASE)

    # Remove special characters and extra spaces
    title = re.sub(r'[:\-_]+', ' ', title)
    title = re.sub(r'\s+', ' ', title).strip()

    # If title is very short after cleaning, it's probably the core term
    if title:
        return [title.lower()]

    return []


async def generate_keywords_with_ai(title: str, description: str = None, product_type: str = None) -> list[str]:
    """
    Generate smart YouTube search keywords using Gemini AI.

    Args:
        title: Product title
        description: Product description (optional)
        product_type: Product type/category (optional)

    Returns:
        List of 6-8 YouTube search keywords
    """
    try:
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        model = genai.GenerativeModel("gemini-2.0-flash-exp")

        description = description or ""
        product_type = product_type or ""

        prompt = f"""Generate 6 realistic YouTube search keywords for this product.
Focus on generic, searchable terms that content creators actually use.
Avoid overly specific product names - focus on product types and categories.

Product Title: {title}
Description: {description or "N/A"}
Product Type: {product_type or "N/A"}

Requirements:
- Keywords should be generic enough to find actual YouTube content
- Include variations like "review", "unboxing", "comparison", "guide"
- Focus on product category/type, not exact product name
- Make them realistic searches people actually type
- For multi-word product types, use quotes to keep words together (e.g. "ski wax" not just wax)
- This prevents matching wrong categories (e.g. "ski wax" won't match "hair wax")

Return ONLY a JSON array of keywords, nothing else:
["keyword1", "keyword2", ...]

Examples:
Input: "The Collection Snowboard: Hydrogen"
Output: ["snowboard review", "all mountain snowboard", "best snowboards 2024", "snowboard gear guide", "beginner snowboard", "snowboard unboxing"]

Input: "Selling Plans Ski Wax"
Output: ["\\"ski wax\\" tutorial", "\\"ski wax\\" application", "how to wax skis", "\\"ski wax\\" review", "ski tuning", "snowboard wax"]
"""

        response = model.generate_content(prompt)
        result = response.text.strip()

        # Extract JSON array from response
        if "```json" in result:
            start = result.find("```json") + 7
            end = result.find("```", start)
            result = result[start:end].strip()
        elif "```" in result:
            start = result.find("```") + 3
            end = result.find("```", start)
            result = result[start:end].strip()

        # Parse JSON
        import json
        keywords = json.loads(result)

        if isinstance(keywords, list) and len(keywords) > 0:
            return keywords[:8]  # Limit to 8 keywords

        return []

    except Exception as e:
        print(f"Error generating AI keywords: {e}")
        return []


def generate_simple_keywords(title: str, description: str = None) -> list[str]:
    """
    Generate keywords using simple extraction (fast, no AI).

    Args:
        title: Product title
        description: Product description (optional)

    Returns:
        List of search keywords
    """
    # Extract core terms
    core_terms = extract_core_product_terms(title)

    if not core_terms:
        return []

    core_term = core_terms[0]

    # Add context-specific keywords for better matching
    patterns = []

    # Use quoted phrases for multi-word terms to keep them together
    # This prevents "ski wax" from matching "hair wax" videos

    # Determine if we should use exact phrase matching
    words = core_term.split()
    use_quotes = len(words) >= 2  # Use quotes for multi-word terms

    if use_quotes:
        # Exact phrase matching with quotes
        core_quoted = f'"{core_term}"'
        patterns = [
            f"{core_quoted} review",
            f"{core_quoted} tutorial",
            f"how to use {core_quoted}",
            f"best {core_quoted}",
            f"{core_quoted} guide",
            f"{core_quoted} unboxing"
        ]
    else:
        # Single word terms - no quotes needed
        patterns = [
            f"{core_term} review",
            f"{core_term} unboxing",
            f"best {core_term}",
            f"{core_term} guide",
            f"{core_term} comparison",
            f"{core_term} haul"
        ]

    return patterns


async def generate_keywords_for_product(
    title: str,
    description: str = None,
    product_type: str = None,
    use_ai: bool = True
) -> list[str]:
    """
    Generate YouTube search keywords for a product.
    Hybrid approach: tries AI first, falls back to simple extraction.

    Args:
        title: Product title
        description: Product description
        product_type: Product type/category
        use_ai: Whether to use AI (default: True)

    Returns:
        List of search keywords
    """
    keywords = []

    # Ensure None values are converted to empty strings
    description = description or ""
    product_type = product_type or ""

    # Try AI if enabled and we have description
    if use_ai and (description or product_type):
        print(f"   🤖 Generating AI keywords for: {title[:50]}...")
        keywords = await generate_keywords_with_ai(title, description, product_type)

    # Fallback to simple extraction if AI failed or disabled
    if not keywords:
        print(f"   📝 Using simple keyword extraction for: {title[:50]}...")
        keywords = generate_simple_keywords(title, description)

    print(f"   ✅ Generated {len(keywords)} keywords: {', '.join(keywords[:3])}...")
    return keywords
