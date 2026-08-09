import logging
from urllib.parse import quote_plus

logger = logging.getLogger(__name__)

try:
    from playwright.async_api import async_playwright
except ImportError:
    async_playwright = None


async def google_search(query: str):
    if async_playwright is None:
        logger.info("playwright_not_installed; browser google search disabled")
        return []

    results = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        try:
            page = await browser.new_page()
            await page.goto(f"https://www.google.com/search?q={quote_plus(query)}")
            await page.wait_for_timeout(3000)
            links = await page.locator("h3").all_text_contents()
            results.extend(links[:5])
        finally:
            await browser.close()
    return results
