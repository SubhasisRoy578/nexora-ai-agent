# ==================================================
# NEXORA AI — WEB SEARCH
# Primary: DuckDuckGo (free, no key needed)
# Fallback: DuckDuckGo news search
# Always injects current year for freshness
# ==================================================

from datetime import datetime
import logging

logger = logging.getLogger(__name__)
try:
    from duckduckgo_search import DDGS
except ImportError:
    DDGS = None


CURRENT_YEAR = datetime.utcnow().year


def search_web(
    query: str,
    max_results: int = 6
) -> list:
    """
    Primary web search using DuckDuckGo text search.
    Injects current year into query for fresh 2026 results.
    Falls back to news search if text search fails.
    """

    # Inject year for freshness if not already present
    if str(CURRENT_YEAR) not in query:
        fresh_query = f"{query} {CURRENT_YEAR}"
    else:
        fresh_query = query

    results = []
    if DDGS is None:
        logger.info("duckduckgo_search_not_installed; web search disabled")
        return results

    # --- Primary: DuckDuckGo text search ---
    try:

        with DDGS() as ddgs:

            data = ddgs.text(
                fresh_query,
                max_results=max_results
            )

            for item in data:
                results.append({
                    "title": item.get("title", ""),
                    "body": item.get("body", ""),
                    "href": item.get("href", ""),
                    "source": "ddg_text"
                })

        if results:
            return results

    except Exception as e:
        logger.warning("web_search_text_failed", extra={"error_type": type(e).__name__})

    # --- Fallback: DuckDuckGo news search ---
    try:

        with DDGS() as ddgs:

            data = ddgs.news(
                fresh_query,
                max_results=max_results
            )

            for item in data:
                results.append({
                    "title": item.get("title", ""),
                    "body": item.get("body", ""),
                    "href": item.get("url", ""),
                    "source": "ddg_news",
                    "date": item.get("date", "")
                })

        if results:
            return results

    except Exception as e:
        logger.warning("web_search_news_failed", extra={"error_type": type(e).__name__})

    return []


def format_search_results(results: list) -> str:
    """
    Formats search results into a clean string for LLM context.
    """

    if not results:
        return ""

    lines = [f"Web Search Results ({CURRENT_YEAR}):\n"]

    for i, item in enumerate(results, 1):
        title = item.get("title", "No title")
        body = item.get("body", "")[:300]
        href = item.get("href", "")
        lines.append(f"{i}. {title}\n   {body}\n   Source: {href}\n")

    return "\n".join(lines)