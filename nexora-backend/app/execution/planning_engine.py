"""
Nexora AI — AI Planning Engine

Decomposes complex user goals into structured, multi-step execution plans.
Each step specifies title, description, agent assignment, tool selection,
and prerequisite step dependencies.

Internal reasoning (Chain of Thought) is kept internal and not exposed
in final output.
"""

import json
import logging
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Any, Optional

from app.llm.llm_router import ask_llm
from app.prompts.prompt_manager import prompt_manager

logger = logging.getLogger(__name__)



@dataclass
class TaskStep:
    """Represents a single step in a decomposed task plan."""
    step_id: int
    title: str
    description: str
    agent_type: str = "general"  # research | rag | memory | browser | coder | general
    tool: str = "none"           # web_search | calculator | python_executor | file_reader | none
    dependencies: List[int] = field(default_factory=list)
    status: str = "pending"      # pending | running | completed | failed
    output: Optional[Any] = None
    error: Optional[str] = None

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class ExecutionPlan:
    """Represents a full multi-step execution plan for a user goal."""
    goal: str
    steps: List[TaskStep]
    internal_reasoning: str = ""
    is_fallback: bool = False

    def to_user_facing_steps(self) -> List[str]:
        """Return a simple list of step titles/descriptions (without internal reasoning)."""
        return [f"{step.step_id}. {step.title}" for step in self.steps]

    def to_dict(self, include_internal: bool = False) -> dict:
        data = {
            "goal": self.goal,
            "step_count": len(self.steps),
            "steps": [s.to_dict() for s in self.steps],
            "is_fallback": self.is_fallback,
        }
        if include_internal:
            data["internal_reasoning"] = self.internal_reasoning
        return data


class AIPlanningEngine:
    """
    AI Planning Engine — decomposes user goals into structured multi-step plans.
    """

    async def decompose_goal(
        self,
        goal: str,
        provider: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> ExecutionPlan:
        """
        Decompose a goal into a structured ExecutionPlan via LLM.
        Falls back to rule-based decomposition if LLM parsing fails.
        """
        context_str = ""
        if context:
            prefs = context.get("user_preferences", [])
            if prefs:
                pref_lines = [f"- {p.get('content', '')}" for p in prefs]
                context_str += f"\nUser Preferences:\n" + "\n".join(pref_lines)

        prompt = prompt_manager.render("planning", goal=goal, context_str=context_str)

        try:
            raw_response = await ask_llm(prompt, provider=provider)

            plan = self._parse_llm_json(goal, raw_response)
            if plan and plan.steps:
                logger.info(f"[PlanningEngine] Created plan with {len(plan.steps)} steps for goal: '{goal[:50]}'")
                return plan
        except Exception as e:
            logger.warning(f"[PlanningEngine] LLM planning failed: {e}. Using rule-based fallback.")

        return self._rule_based_decomposition(goal)

    def _parse_llm_json(self, goal: str, raw_text: str) -> Optional[ExecutionPlan]:
        """Extract and parse JSON plan from LLM output."""
        try:
            cleaned = raw_text.strip()
            if "```json" in cleaned:
                cleaned = cleaned.split("```json")[1].split("```")[0].strip()
            elif "```" in cleaned:
                cleaned = cleaned.split("```")[1].split("```")[0].strip()

            data = json.loads(cleaned)
            reasoning = data.get("reasoning", "")
            raw_steps = data.get("steps", [])

            steps = []
            for s in raw_steps:
                step = TaskStep(
                    step_id=int(s.get("step_id", len(steps) + 1)),
                    title=str(s.get("title", "Execute step")),
                    description=str(s.get("description", "")),
                    agent_type=str(s.get("agent_type", "general")),
                    tool=str(s.get("tool", "none")),
                    dependencies=[int(d) for d in s.get("dependencies", [])],
                )
                steps.append(step)

            if steps:
                return ExecutionPlan(
                    goal=goal,
                    steps=steps,
                    internal_reasoning=reasoning,
                    is_fallback=False
                )
        except Exception as e:
            logger.debug(f"[PlanningEngine] JSON parse failed: {e}")

        return None

    def _rule_based_decomposition(self, goal: str) -> ExecutionPlan:
        """Rule-based fallback planner."""
        goal_lower = goal.lower()
        steps = []
        step_id = 1

        # Search / Research requirement
        if any(w in goal_lower for w in ["search", "research", "latest", "news", "find", "current", "2026"]):
            steps.append(TaskStep(
                step_id=step_id,
                title="Search and gather information",
                description=f"Perform web research for: {goal}",
                agent_type="research",
                tool="web_search",
                dependencies=[]
            ))
            step_id += 1

        # Document / PDF requirement
        if any(w in goal_lower for w in ["document", "pdf", "file", "rag"]):
            steps.append(TaskStep(
                step_id=step_id,
                title="Retrieve relevant document context",
                description="Query uploaded documents for context",
                agent_type="rag",
                tool="file_reader",
                dependencies=[]
            ))
            step_id += 1

        # Memory / Conversation requirement
        if any(w in goal_lower for w in ["remember", "memory", "history", "previous"]):
            steps.append(TaskStep(
                step_id=step_id,
                title="Retrieve conversation history",
                description="Check memory database for past context",
                agent_type="memory",
                tool="none",
                dependencies=[]
            ))
            step_id += 1

        # Code requirement
        if any(w in goal_lower for w in ["code", "python", "script", "program", "function", "fix"]):
            steps.append(TaskStep(
                step_id=step_id,
                title="Generate and review code",
                description="Write code implementation for user request",
                agent_type="coder",
                tool="python_executor",
                dependencies=[s.step_id for s in steps]
            ))
            step_id += 1

        # Final Synthesis step
        deps = [s.step_id for s in steps]
        steps.append(TaskStep(
            step_id=step_id,
            title="Synthesize final answer",
            description="Combine all findings into a comprehensive response",
            agent_type="general",
            tool="none",
            dependencies=deps
        ))

        return ExecutionPlan(
            goal=goal,
            steps=steps,
            internal_reasoning="Rule-based keyword decomposition",
            is_fallback=True
        )


# Global singleton
planning_engine = AIPlanningEngine()
