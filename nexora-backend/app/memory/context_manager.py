"""
Nexora AI — Context Management System (Phase 3)

Centralized context aggregation layer that automatically collects and
assembles all relevant context before planning and task execution:
  - Conversation memory (PostgreSQL)
  - User preferences (LongTermMemory)
  - Long-term facts (LongTermMemory)
  - RAG document context (Qdrant)
  - ChromaDB semantic memory

Provides a single async method to gather everything the Orchestrator
and Planning Engine need, eliminating scattered context-fetch logic.
"""

import logging
from typing import Dict, Any, Optional

from app.memory.memory_manager import MemoryManager
from app.memory.memory_repository import memory_repository
from app.memory.user_profile_memory import user_preference_memory
from app.rag.rag_engine import RAGEngine

logger = logging.getLogger(__name__)


class ContextManager:
    """
    Aggregates all context sources into a single enriched context dict.
    Used by the Orchestrator before planning, tool selection, and synthesis.
    """

    def __init__(self):
        self.memory = MemoryManager()
        self.rag = RAGEngine()
        self.preference_memory = user_preference_memory

    async def gather_context(
        self,
        user_id: str,
        query: str,
        include_rag: bool = True,
        include_preferences: bool = True,
        include_long_term: bool = True,
        memory_limit: int = 10,
        long_term_limit: int = 10
    ) -> Dict[str, Any]:
        """
        Gather all relevant context for a user query in one call.

        Returns:
            {
                "conversation_memory": str,
                "user_preferences": list[dict],
                "long_term_facts": list[dict],
                "rag_context": str,
                "has_memory": bool,
                "has_preferences": bool,
                "has_rag": bool,
            }
        """
        context: Dict[str, Any] = {
            "conversation_memory": "",
            "user_preferences": [],
            "long_term_facts": [],
            "rag_context": "",
            "has_memory": False,
            "has_preferences": False,
            "has_rag": False,
        }

        # 1. Conversation memory
        try:
            memory_text = await self.memory.build_context_async(
                user_id=user_id,
                current_query=query
            )
            if memory_text:
                context["conversation_memory"] = memory_text
                context["has_memory"] = True
        except Exception as e:
            logger.warning(f"[ContextManager] Memory retrieval failed: {e}")

        # 2. User preferences
        if include_preferences:
            try:
                preferences = await self.preference_memory.get_preferences(
                    user_id=user_id,
                    limit=long_term_limit
                )
                if preferences:
                    context["user_preferences"] = preferences
                    context["has_preferences"] = True
            except Exception as e:
                logger.warning(f"[ContextManager] Preference retrieval failed: {e}")


        # 3. Long-term facts
        if include_long_term:
            try:
                facts = await memory_repository.get_long_term(
                    user_id=user_id,
                    memory_type="fact",
                    limit=long_term_limit
                )
                if facts:
                    context["long_term_facts"] = facts
            except Exception as e:
                logger.warning(f"[ContextManager] Long-term retrieval failed: {e}")

        # 4. RAG document context
        if include_rag:
            try:
                rag_text = self.rag.generate_context(
                    user_id=user_id,
                    query=query
                )
                if rag_text and isinstance(rag_text, str) and len(rag_text.strip()) > 10:
                    context["rag_context"] = rag_text
                    context["has_rag"] = True
            except Exception as e:
                logger.warning(f"[ContextManager] RAG retrieval failed: {e}")

        logger.info(
            f"[ContextManager] Context gathered for user={user_id}: "
            f"memory={context['has_memory']}, prefs={context['has_preferences']}, "
            f"rag={context['has_rag']}"
        )

        return context

    def format_preferences_for_prompt(self, preferences: list) -> str:
        """Format user preferences into a string for LLM prompts."""
        if not preferences:
            return ""
        lines = ["User Preferences:"]
        for pref in preferences:
            lines.append(f"- {pref.get('content', '')}")
        return "\n".join(lines)

    def format_facts_for_prompt(self, facts: list) -> str:
        """Format long-term facts into a string for LLM prompts."""
        if not facts:
            return ""
        lines = ["Known Facts About This User:"]
        for fact in facts:
            lines.append(f"- {fact.get('content', '')}")
        return "\n".join(lines)


# Global singleton
context_manager = ContextManager()
