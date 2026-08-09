"""
Nexora AI — Prompt Management System (Phase 5)

Centralized prompt template management with versioning, variable substitution,
and configuration support.

Provides templates for:
  - planning (task decomposition)
  - chat (general conversational AI)
  - research (search result synthesis)
  - code (code generation, debugging, refactoring)
  - documents (RAG / document Q&A)
  - tools (tool selection & formatting)
  - preference_extraction (user preference detection)
  - orchestrator_synthesis (master orchestrator final answer)
"""

import os
import json
import logging
from dataclasses import dataclass, field
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


@dataclass
class PromptTemplate:
    """Represents a versioned prompt template."""
    name: str
    version: str
    category: str
    description: str
    template: str
    variables: list = field(default_factory=list)

    def render(self, **kwargs) -> str:
        """Substitute variables into the template string safely."""
        try:
            return self.template.format(**kwargs)
        except KeyError as e:
            logger.warning(f"[PromptTemplate] Missing variable {e} when rendering '{self.name}' (v{self.version})")
            # Fallback to string replacement for missing keys
            result = self.template
            for k, v in kwargs.items():
                result = result.replace(f"{{{k}}}", str(v))
            return result


# Default System Templates (v1.0)
DEFAULT_TEMPLATES: Dict[str, PromptTemplate] = {

    # 1. PLANNING
    "planning": PromptTemplate(
        name="planning",
        version="1.0",
        category="planning",
        description="Task decomposition prompt for AIPlanningEngine",
        template="""You are the AI Planning Engine for Nexora AI.
Analyze the following user goal and decompose it into a structured, multi-step execution plan.

User Goal: {goal}
{context_str}

Analyze the requirements, determine what tools or agents are needed, and output a valid JSON object EXACTLY in this format:
```json
{{
  "reasoning": "Internal analysis of goal requirements",
  "steps": [
    {{
      "step_id": 1,
      "title": "Step Title",
      "description": "Detailed step instruction",
      "agent_type": "research|rag|memory|browser|coder|general",
      "tool": "web_search|calculator|python_executor|file_reader|none",
      "dependencies": []
    }}
  ]
}}
```

Rules:
- Provide 2 to 6 logical steps.
- Set dependencies correctly.
- Output ONLY valid JSON.
""",
        variables=["goal", "context_str"]
    ),

    # 2. CHAT
    "chat": PromptTemplate(
        name="chat",
        version="1.0",
        category="chat",
        description="Standard system prompt for chat assistant",
        template="""You are Nexora AI, an intelligent, helpful, and friendly AI assistant built in 2026.

Conversation History:
{history}

User Question: {query}

Instructions:
- Respond directly, concisely, and accurately.
- Maintain a natural, engaging, and professional tone.
""",
        variables=["history", "query"]
    ),

    # 3. RESEARCH
    "research": PromptTemplate(
        name="research",
        version="1.0",
        category="research",
        description="Prompt for synthesizing web search and research findings",
        template="""You are the Research Agent for Nexora AI.
Synthesize the following live web search results for the user query.

Query: {query}

Search Results:
{search_results}

Instructions:
- Provide a clear, well-structured summary of the key findings.
- Cite sources where applicable.
- Focus on fresh 2026 information.
""",
        variables=["query", "search_results"]
    ),

    # 4. CODE
    "code": PromptTemplate(
        name="code",
        version="1.0",
        category="code",
        description="Prompt for code generation, execution, and debugging",
        template="""You are the Coding Agent for Nexora AI.

Task Intent: {intent}
User Request: {query}

Code Context:
{code_context}

Instructions:
- Provide clean, efficient, production-ready code with appropriate type hints.
- Explain the implementation logic clearly.
- Handle edge cases and include error handling where appropriate.
""",
        variables=["intent", "query", "code_context"]
    ),

    # 5. DOCUMENTS (RAG)
    "documents": PromptTemplate(
        name="documents",
        version="1.0",
        category="documents",
        description="Prompt for answering questions using RAG document context",
        template="""You are the Document Intelligence Agent for Nexora AI.
Answer the user query based ONLY on the provided document context.

Query: {query}

Document Context:
{doc_context}

Instructions:
- Rely strictly on facts mentioned in the document context.
- If the answer is not contained in the context, state that clearly.
""",
        variables=["query", "doc_context"]
    ),

    # 6. TOOLS
    "tools": PromptTemplate(
        name="tools",
        version="1.0",
        category="tools",
        description="Prompt for tool selection analysis",
        template="""You are the Tool Selection Engine for Nexora AI.
Analyze the user query and select the necessary tool(s) to execute.

Available Tools:
{available_tools}

User Query: {query}

Output the selected tool name and parameters.
""",
        variables=["available_tools", "query"]
    ),

    # 7. PREFERENCE EXTRACTION
    "preference_extraction": PromptTemplate(
        name="preference_extraction",
        version="1.0",
        category="preference_extraction",
        description="Prompt for extracting user preferences from message stream",
        template="""Analyze this user message and extract any personal preferences, facts, or identity information.

User message: "{message}"

Rules:
- Extract ONLY concrete preferences, facts about the user, or identity details.
- Each preference should be a short, standalone statement.
- If no preferences found, return "NONE".
- Output one preference per line, no numbering.
""",
        variables=["message"]
    ),

    # 8. ORCHESTRATOR SYNTHESIS
    "orchestrator_synthesis": PromptTemplate(
        name="orchestrator_synthesis",
        version="1.0",
        category="orchestrator_synthesis",
        description="Master synthesis prompt for AgentOrchestrator final response",
        template="""You are Nexora AI, an advanced AI agent platform built in 2026.

Conversation Memory (this user's previous chats):
{memory_context}

{pref_text}

User Question:
{goal}

{live_results}

{doc_context}

Agent Findings:
{agent_summary}

Dynamic Agent Result:
{dynamic_result}

Critic Review:
{critic_feedback}

Instructions:
- Answer the user's question directly, helpfully, and accurately.
- If web search or tool results are provided, use them to give up-to-date 2026 information.
- Use conversation memory and user preferences to personalize — remember the user's name, preferences, and past topics.
- Be detailed, clear, and confident.
- Never say you don't have access to the internet if web/tool results are provided above.
""",
        variables=[
            "memory_context", "pref_text", "goal", "live_results",
            "doc_context", "agent_summary", "dynamic_result", "critic_feedback"
        ]
    ),
}


class PromptManager:
    """
    Centralized Prompt Manager for loading, versioning, and rendering templates.
    Supports dynamic overrides from custom JSON files or environment configs.
    """

    def __init__(self):
        self._templates: Dict[str, PromptTemplate] = dict(DEFAULT_TEMPLATES)
        self._load_custom_overrides()

    def get_template(self, name: str) -> PromptTemplate:
        """Get template by name. Returns default chat template if name not found."""
        if name not in self._templates:
            logger.warning(f"[PromptManager] Template '{name}' not found, falling back to 'chat'")
            return self._templates["chat"]
        return self._templates[name]

    def render(self, name: str, **kwargs) -> str:
        """Get and render a prompt template in a single call."""
        template = self.get_template(name)
        return template.render(**kwargs)

    def register_template(self, template: PromptTemplate):
        """Register or update a template dynamically."""
        self._templates[template.name] = template
        logger.info(f"[PromptManager] Registered template '{template.name}' (v{template.version})")

    def list_templates(self) -> list:
        """List metadata of all registered templates."""
        return [
            {
                "name": t.name,
                "version": t.version,
                "category": t.category,
                "description": t.description,
                "variables": t.variables
            }
            for t in self._templates.values()
        ]

    def _load_custom_overrides(self):
        """Load custom prompt overrides from PROMPTS_CONFIG_PATH if set."""
        config_path = os.getenv("PROMPTS_CONFIG_PATH")
        if config_path and os.path.exists(config_path):
            try:
                with open(config_path, "r", encoding="utf-8") as f:
                    custom_data = json.load(f)
                    for item in custom_data:
                        t = PromptTemplate(
                            name=item["name"],
                            version=item.get("version", "1.0"),
                            category=item.get("category", "custom"),
                            description=item.get("description", ""),
                            template=item["template"],
                            variables=item.get("variables", [])
                        )
                        self._templates[t.name] = t
                logger.info(f"[PromptManager] Loaded prompt overrides from {config_path}")
            except Exception as e:
                logger.warning(f"[PromptManager] Failed to load prompt overrides: {e}")


# Global singleton
prompt_manager = PromptManager()
