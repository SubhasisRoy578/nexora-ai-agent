"""
Nexora AI — User Preference Memory (Phase 3)

Manages extraction, storage, and retrieval of user preferences.
Preferences are stored as LongTermMemory entries with memory_type='preference'.

Includes an LLM-based preference extractor that analyzes user messages
for implicit and explicit preference signals (e.g., "I prefer Python",
"Call me Alex", "I like detailed explanations").
"""

import logging
from typing import List, Dict, Optional

from app.memory.memory_repository import memory_repository
from app.llm.llm_router import ask_llm

logger = logging.getLogger(__name__)

# Keywords that suggest a user is expressing a preference
PREFERENCE_SIGNALS = [
    "i prefer", "i like", "i want", "call me", "my name is",
    "i'm a", "i am a", "i work", "i use", "i need",
    "don't call me", "please use", "always", "never",
    "i love", "i hate", "my favorite", "remind me",
    "i usually", "i often", "i typically"
]


class UserPreferenceMemory:
    """
    Detects, stores, and retrieves user preferences from conversations.
    Reuses existing LongTermMemory table (memory_type='preference') with
    an in-memory fallback when database is unreachable.
    """

    def __init__(self):
        self._fallback_store: Dict[str, List[Dict]] = {}

    def has_preference_signal(self, message: str) -> bool:
        """Quick keyword check — does this message look like it contains a preference?"""
        msg_lower = message.lower()
        return any(signal in msg_lower for signal in PREFERENCE_SIGNALS)

    async def store_preference_direct(self, user_id: str, content: str):
        """Directly store a preference string (with DB + fallback handling)."""
        entry = {"memory_type": "preference", "content": content}
        if user_id not in self._fallback_store:
            self._fallback_store[user_id] = []
        self._fallback_store[user_id].append(entry)

        try:
            await memory_repository.store_long_term(
                user_id=user_id,
                memory_type="preference",
                content=content
            )
        except Exception as e:
            logger.warning(f"[PreferenceMemory] DB store failed, stored in fallback: {e}")

    async def extract_and_store_preferences(
        self,
        user_id: str,
        message: str,
        provider: str = None
    ) -> List[str]:
        """
        Analyze a user message for preferences using LLM.
        Store any detected preferences to LongTermMemory.
        Returns list of extracted preference strings.
        """
        if not self.has_preference_signal(message):
            return []

        prompt = f"""Analyze this user message and extract any personal preferences, facts, or identity information.

User message: "{message}"

Rules:
- Extract ONLY concrete preferences, facts about the user, or identity details.
- Each preference should be a short, standalone statement.
- If no preferences found, return "NONE".
- Output one preference per line, no numbering.

Examples of valid preferences:
- Prefers Python over JavaScript
- Name is Alex
- Works as a data scientist
- Likes detailed explanations
- Prefers dark mode
"""
        extracted = []
        try:
            raw = await ask_llm(prompt, provider=provider)
            if raw and "NONE" not in raw.upper():
                for line in raw.strip().splitlines():
                    line = line.strip().lstrip("- ").strip()
                    if line and len(line) > 3:
                        extracted.append(line)

            for pref in extracted:
                await self.store_preference_direct(user_id, pref)
                logger.info(f"[PreferenceMemory] Stored preference for {user_id}: {pref[:50]}")

        except Exception as e:
            logger.warning(f"[PreferenceMemory] Extraction failed: {e}")

        return extracted

    async def get_preferences(
        self,
        user_id: str,
        limit: int = 15
    ) -> List[Dict]:
        """Retrieve stored preferences for a user (DB first, fallback second)."""
        db_prefs = []
        try:
            db_prefs = await memory_repository.get_long_term(
                user_id=user_id,
                memory_type="preference",
                limit=limit
            )
        except Exception as e:
            logger.warning(f"[PreferenceMemory] Get preferences failed: {e}")

        fallback_prefs = self._fallback_store.get(user_id, [])
        combined = list(db_prefs) + list(fallback_prefs)
        
        # Deduplicate by content
        seen = set()
        unique = []
        for p in combined:
            content = p.get("content", "")
            if content and content not in seen:
                seen.add(content)
                unique.append(p)

        return unique[:limit]

    async def get_preferences_text(
        self,
        user_id: str,
        limit: int = 15
    ) -> str:
        """Get preferences as a formatted text string for LLM prompts."""
        prefs = await self.get_preferences(user_id, limit)
        if not prefs:
            return ""
        lines = [p.get("content", "") for p in prefs if p.get("content")]
        return "\n".join(f"- {line}" for line in lines)


# Global singleton
user_preference_memory = UserPreferenceMemory()

