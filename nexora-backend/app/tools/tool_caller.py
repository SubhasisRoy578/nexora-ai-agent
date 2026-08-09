"""
Nexora AI — Intelligent Tool Calling Framework (Phase 4)

Provides automatic tool selection and multi-tool execution based on
user intent analysis. Wraps the existing ToolRegistry and integrates
with RAG, Code Assistant, Content Generation, Web Search, and
Document Intelligence.

Key design:
  - ToolDescriptor: Metadata class describing each tool's purpose and triggers.
  - ToolSelector: Analyzes a user query and selects the best tool(s).
  - ToolCaller: Orchestrates tool execution (single or multi-tool).
  - All existing tools are reused; no duplicated logic.
"""

import logging
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional

from app.tools.tool_registry import ToolRegistry

logger = logging.getLogger(__name__)


@dataclass
class ToolDescriptor:
    """Metadata about a tool for intelligent selection."""
    name: str
    description: str
    triggers: List[str]       # keywords that suggest this tool
    category: str             # search | document | code | content | general
    supports_async: bool = False
    priority: int = 0         # higher = preferred when multiple match


# Registry of all available tool descriptors
TOOL_DESCRIPTORS: List[ToolDescriptor] = [
    ToolDescriptor(
        name="web_search",
        description="Search the internet for current information, news, and real-time data",
        triggers=[
            "search", "find", "look up", "latest", "news", "current",
            "today", "2026", "update", "recent", "trending", "what is",
            "who is", "web", "internet", "google", "research"
        ],
        category="search",
        priority=5
    ),
    ToolDescriptor(
        name="file_reader",
        description="Read and extract text from PDF and document files",
        triggers=[
            "pdf", "document", "file", "read", "extract", "upload",
            "docx", "txt", "paper", "report"
        ],
        category="document",
        priority=3
    ),
    ToolDescriptor(
        name="python_executor",
        description="Execute Python code, run scripts, and compute results",
        triggers=[
            "run", "execute", "python", "code", "script", "compute",
            "calculate", "program", "function", "algorithm", "test"
        ],
        category="code",
        priority=4
    ),
    ToolDescriptor(
        name="calculator",
        description="Perform mathematical calculations and expressions",
        triggers=[
            "calculate", "math", "equation", "sum", "average",
            "multiply", "divide", "percentage", "+", "-", "*", "/"
        ],
        category="code",
        priority=2
    ),
    ToolDescriptor(
        name="open_website",
        description="Open and navigate to websites",
        triggers=[
            "open", "visit", "navigate", "website", "url", "browse", "go to"
        ],
        category="general",
        priority=1
    ),
    ToolDescriptor(
        name="google_search",
        description="Search Google for information",
        triggers=[
            "google", "search google"
        ],
        category="search",
        priority=1
    ),
]


class ToolSelector:
    """
    Analyzes user queries and selects the most appropriate tool(s)
    based on keyword matching, priority, and category scoring.
    """

    def __init__(self):
        self.descriptors = {td.name: td for td in TOOL_DESCRIPTORS}

    def select_tools(
        self,
        query: str,
        max_tools: int = 3
    ) -> List[ToolDescriptor]:
        """
        Select the best tool(s) for a query.
        Returns tools sorted by relevance score (descending).
        """
        query_lower = query.lower()
        scored: List[tuple] = []

        for td in TOOL_DESCRIPTORS:
            score = 0
            for trigger in td.triggers:
                if trigger in query_lower:
                    score += 1
            if score > 0:
                # Weight by priority
                score = score * 10 + td.priority
                scored.append((score, td))

        # Sort by score descending
        scored.sort(key=lambda x: x[0], reverse=True)
        return [td for _, td in scored[:max_tools]]

    def select_best_tool(self, query: str) -> Optional[ToolDescriptor]:
        """Select the single best tool for a query."""
        tools = self.select_tools(query, max_tools=1)
        return tools[0] if tools else None

    def get_tool_descriptor(self, tool_name: str) -> Optional[ToolDescriptor]:
        """Get descriptor for a specific tool."""
        return self.descriptors.get(tool_name)

    def list_available_tools(self) -> List[Dict[str, str]]:
        """List all available tools with descriptions."""
        return [
            {"name": td.name, "description": td.description, "category": td.category}
            for td in TOOL_DESCRIPTORS
        ]


class ToolCaller:
    """
    Executes selected tools and aggregates results.
    Wraps the existing ToolRegistry — no duplicated execution logic.
    """

    def __init__(self):
        self.registry = ToolRegistry()
        self.selector = ToolSelector()

    def execute_tool(
        self,
        tool_name: str,
        input_data: str
    ) -> Dict[str, Any]:
        """Execute a single tool by name."""
        result = self.registry.execute(tool_name, input_data)
        return {
            "tool": tool_name,
            "input": input_data[:200],
            "output": result,
            "success": not (isinstance(result, dict) and result.get("success") is False)
        }

    def execute_tools(
        self,
        query: str,
        max_tools: int = 3
    ) -> Dict[str, Any]:
        """
        Automatically select and execute the best tools for a query.
        Returns aggregated results from all executed tools.
        """
        selected = self.selector.select_tools(query, max_tools=max_tools)

        if not selected:
            return {
                "tools_selected": [],
                "results": [],
                "tool_count": 0,
                "has_results": False
            }

        results = []
        for td in selected:
            try:
                result = self.execute_tool(td.name, query)
                results.append(result)
                logger.info(f"[ToolCaller] Executed '{td.name}': success={result['success']}")
            except Exception as e:
                logger.warning(f"[ToolCaller] Tool '{td.name}' failed: {e}")
                results.append({
                    "tool": td.name,
                    "input": query[:200],
                    "output": None,
                    "success": False,
                    "error": str(e)
                })

        return {
            "tools_selected": [td.name for td in selected],
            "results": results,
            "tool_count": len(results),
            "has_results": any(r["success"] for r in results)
        }

    def format_tool_results_for_prompt(self, tool_output: Dict[str, Any]) -> str:
        """Format tool execution results into a string for LLM synthesis."""
        if not tool_output or not tool_output.get("has_results"):
            return ""

        lines = []
        for result in tool_output.get("results", []):
            if not result.get("success"):
                continue

            tool_name = result.get("tool", "unknown")
            output = result.get("output")

            if tool_name == "web_search" and isinstance(output, dict):
                formatted = output.get("formatted", "")
                if formatted:
                    lines.append(f"[Web Search Results]\n{formatted}")
            elif isinstance(output, dict):
                content = str(output)[:500]
                lines.append(f"[{tool_name}]\n{content}")
            elif isinstance(output, str):
                lines.append(f"[{tool_name}]\n{output[:500]}")

        return "\n\n".join(lines)


# Global singletons
tool_selector = ToolSelector()
tool_caller = ToolCaller()
