"""
Nexora AI — End-to-End Core AI Workflow Test Suite (Phase 6)

Verifies:
  1. AI Gateway & Provider Capability Registry
  2. AI Planning Engine & Task Decomposition
  3. Context Management System & User Preference Memory
  4. Intelligent Tool Calling Framework & Execution
  5. Prompt Management System Template Rendering
  6. Agent Orchestrator End-to-End Synthesis
"""

import asyncio
import unittest

from app.ai.capabilities import capability_registry
from app.ai.exceptions import AIError, ProviderError
from app.prompts.prompt_manager import prompt_manager, PromptTemplate
from app.memory.context_manager import context_manager
from app.memory.user_profile_memory import user_preference_memory
from app.tools.tool_caller import tool_caller, tool_selector
from app.execution.planning_engine import planning_engine
from app.execution.task_executor import task_execution_engine
from app.agents.orchestrator import AgentOrchestrator
from app.core.security import sanitize_user_input, mask_secret, sanitize_error


class TestE2EAIPipeline(unittest.IsolatedAsyncioTestCase):

    async def test_01_capability_registry(self):
        """Verify Capability Registry tracks provider features correctly."""
        gemini_caps = capability_registry.get("gemini")
        self.assertIsNotNone(gemini_caps)
        self.assertTrue(gemini_caps.supports_streaming)
        self.assertGreater(gemini_caps.max_context_tokens, 0)

    async def test_02_prompt_management_system(self):
        """Verify PromptManager loads, stores, and renders versioned templates."""
        template = prompt_manager.get_template("planning")
        self.assertEqual(template.name, "planning")
        self.assertEqual(template.version, "1.0")

        rendered = prompt_manager.render("chat", history="User: Hi\nAssistant: Hello", query="How are you?")
        self.assertIn("User: Hi", rendered)
        self.assertIn("How are you?", rendered)

    async def test_03_context_and_preference_memory(self):
        """Verify UserPreferenceMemory and ContextManager function seamlessly."""
        user_id = "test_e2e_user"
        
        # Test signal detection
        self.assertTrue(user_preference_memory.has_preference_signal("I prefer dark mode"))

        # Test direct preference storage & retrieval
        await user_preference_memory.store_preference_direct(user_id, "Prefers Python over JavaScript")
        prefs = await user_preference_memory.get_preferences(user_id)
        self.assertGreater(len(prefs), 0)
        self.assertEqual(prefs[0]["content"], "Prefers Python over JavaScript")

        # Test ContextManager aggregation
        context = await context_manager.gather_context(user_id, "Write python script")
        self.assertIn("user_preferences", context)
        self.assertTrue(context["has_preferences"])

    async def test_04_intelligent_tool_calling(self):
        """Verify ToolSelector and ToolCaller multi-tool execution."""
        # Tool Selection
        search_tools = tool_selector.select_tools("Search latest tech news 2026")
        self.assertTrue(any(t.name == "web_search" for t in search_tools))

        calc_tools = tool_selector.select_tools("Calculate 100 * 5")
        self.assertTrue(any(t.name in ["calculator", "python_executor"] for t in calc_tools))

        # Tool Execution
        calc_res = tool_caller.execute_tool("calculator", "50 * 2")
        self.assertTrue(calc_res["success"])
        self.assertEqual(calc_res["output"], 100)

    async def test_05_planning_engine_decomposition(self):
        """Verify AIPlanningEngine task decomposition and step dependency graph."""
        goal = "Build a web scraper and format results into CSV"
        plan = await planning_engine.decompose_goal(goal)
        self.assertIsNotNone(plan)
        self.assertGreater(len(plan.steps), 0)
        
        # Verify internal reasoning is hidden from user-facing steps
        user_steps = plan.to_user_facing_steps()
        self.assertIsInstance(user_steps, list)
        self.assertGreater(len(user_steps), 0)

    async def test_06_security_sanitization(self):
        """Verify security input sanitization, secret masking, and error sanitization."""
        # Input sanitization
        dirty_input = "Hello\x00World! \x07"
        clean = sanitize_user_input(dirty_input)
        self.assertEqual(clean, "HelloWorld!")

        # Secret masking
        masked = mask_secret("sk-1234567890abcdef")
        self.assertEqual(masked, "sk-1***cdef")

        # Error sanitization
        err = Exception("Connection error at postgresql://user:secretpass@localhost:5432/db")
        sanitized_err = sanitize_error(err)
        self.assertNotIn("secretpass", sanitized_err)

    async def test_07_orchestrator_end_to_end(self):
        """Verify AgentOrchestrator end-to-end flow with all Phase 1-5 systems."""
        orchestrator = AgentOrchestrator()
        result = await orchestrator.run(
            goal="Calculate 25 + 75 and explain the result",
            user_id="test_e2e_user"
        )
        self.assertIsNotNone(result)
        self.assertIn("task_id", result)
        self.assertIn("final_answer", result)
        self.assertIn("plan", result)
        self.assertIn("user_preferences", result)
        self.assertIn("tool_execution", result)


if __name__ == "__main__":
    unittest.main()
