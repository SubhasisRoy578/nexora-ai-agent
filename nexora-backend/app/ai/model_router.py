"""
Nexora AI — Model Router (Legacy Bridge)

Delegates to the unified AIGateway. Preserves the browser-agent
routing check so existing callers (coder_agent, routes/chat.py)
continue working unchanged.
"""

import logging

# Backward-compatible imports — kept for any code that does:
#   from app.ai.model_router import generate_response
from app.ai.providers.gemini_provider import generate_gemini_response
from app.ai.providers.groq_provider import generate_groq_response
from app.ai.providers.openrouter_provider import generate_openrouter_response

logger = logging.getLogger(__name__)


def _get_gateway():
    from app.ai.gateway import gateway
    return gateway


async def generate_response(
    model: str,
    prompt: str
):
    """
    Generate a response using the unified AIGateway.

    Preserves the legacy browser-agent routing check:
    if the prompt contains "search", delegates to the browser agent.

    Args:
        model: Provider name hint (e.g. "gemini", "groq", "openrouter").
        prompt: The user prompt string.

    Returns:
        The AI-generated response string.
    """
    try:
        # Preserve existing browser-agent routing
        if "search" in prompt.lower():
            try:
                from app.browser.browser_agent import run_browser_agent
                browser_result = await run_browser_agent(prompt)
                return str(browser_result)
            except Exception as e:
                logger.warning(
                    f"[ModelRouter] Browser agent failed: {e}, "
                    f"falling back to LLM"
                )

        # Delegate to unified gateway
        gw = _get_gateway()
        messages = [{"role": "user", "content": prompt}]
        response, provider_used = await gw.get_chat_response(
            messages=messages,
            requested_provider=model,
        )
        logger.info(f"[ModelRouter] Response via {provider_used}")
        return response

    except Exception as e:
        logger.error(f"[ModelRouter] All providers failed: {e}")
        return "All AI providers failed."