from app.llm.llm_router import ask_llm
from app.execution.planning_engine import planning_engine, AIPlanningEngine, ExecutionPlan


class PlannerAgent:
    """
    Planner Agent — uses AIPlanningEngine to decompose user tasks into actionable steps.
    Preserves full backward compatibility with existing callers.
    """

    def __init__(self):
        self.engine = planning_engine

    async def create_plan_async(
        self,
        task: str,
        provider: str = None
    ) -> list:
        """Async multi-step task decomposition via AIPlanningEngine."""
        try:
            execution_plan = await self.engine.decompose_goal(task, provider=provider)
            return execution_plan.to_user_facing_steps()
        except Exception:
            return self._keyword_plan(task)

    def create_plan(
        self,
        task: str
    ) -> list:
        """Sync multi-step task decomposition (rule-based fallback)."""
        execution_plan = self.engine._rule_based_decomposition(task)
        return execution_plan.to_user_facing_steps()

    def _keyword_plan(
        self,
        task: str
    ) -> list:
        """Fallback keyword-based planner."""
        execution_plan = self.engine._rule_based_decomposition(task)
        return execution_plan.to_user_facing_steps()


planner_agent = PlannerAgent()


def create_plan(task: str) -> list:
    return planner_agent.create_plan(task)