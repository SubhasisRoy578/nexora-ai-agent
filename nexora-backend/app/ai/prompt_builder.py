"""
Nexora AI — Prompt Builder Bridge (Phase 5)

Re-exports prompt_manager and provides convenience functions for
prompt building across the AI system.
"""

from app.prompts.prompt_manager import prompt_manager, PromptManager, PromptTemplate


class PromptBuilder:
    """Convenience builder class wrapping PromptManager."""

    @staticmethod
    def build_prompt(template_name: str, **kwargs) -> str:
        return prompt_manager.render(template_name, **kwargs)

    @staticmethod
    def get_template(template_name: str) -> PromptTemplate:
        return prompt_manager.get_template(template_name)


prompt_builder = PromptBuilder()
