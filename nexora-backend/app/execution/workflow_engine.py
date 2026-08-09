from app.execution.task_chain import TaskChain
from app.execution.planning_engine import planning_engine
from app.execution.task_executor import task_execution_engine


class WorkflowEngine:

    def __init__(self):
        self.chain = TaskChain()
        self.planner = planning_engine
        self.executor = task_execution_engine

    def create_workflow(
        self,
        user_goal
    ):
        self.chain.add_task("analyze_goal", user_goal)
        self.chain.add_task("research", user_goal)
        self.chain.add_task("generate_response", user_goal)
        return self.chain.get_tasks()

    async def execute_workflow_async(
        self,
        user_goal: str,
        user_id: str = "default",
        provider: str = None
    ):
        plan = await self.planner.decompose_goal(user_goal, provider=provider)
        result = await self.executor.execute_plan(plan, user_id=user_id)
        return {
            "plan": plan.to_dict(),
            "execution": result
        }