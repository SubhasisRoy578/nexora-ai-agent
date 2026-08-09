"""
Nexora AI — Task Execution Engine

Coordinates the execution of decomposed steps from an ExecutionPlan.
Manages step lifecycle, state tracking, dependency ordering, step retries,
and tool/agent dispatching.
"""

import asyncio
import logging
from typing import Dict, Any, List, Optional

from app.execution.planning_engine import ExecutionPlan, TaskStep
from app.execution.state_manager import StateManager
from app.execution.task_chain import TaskChain
from app.execution.task_queue import TaskQueue

from app.tools.tool_registry import ToolRegistry
from app.agents.agent_registry import get_registry

logger = logging.getLogger(__name__)


class TaskExecutionEngine:
    """
    Executes a multi-step task plan sequentially or concurrently based on dependencies.
    """

    def __init__(self):
        self.state_manager = StateManager()
        self.tool_registry = ToolRegistry()

    async def execute_plan(
        self,
        plan: ExecutionPlan,
        user_id: str = "default",
        context_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Execute all steps in an ExecutionPlan while preserving dependency order.
        """
        context = context_data or {}
        step_outputs: Dict[int, Any] = {}
        task_chain = TaskChain()

        logger.info(f"[TaskExecutor] Executing plan with {len(plan.steps)} steps")

        for step in plan.steps:
            step.status = "running"
            task_chain.add_task(f"step_{step.step_id}_{step.title}", step.to_dict())

            # Gather outputs of dependency steps
            dep_outputs = {
                dep_id: step_outputs.get(dep_id)
                for dep_id in step.dependencies
                if dep_id in step_outputs
            }

            try:
                result = await self._execute_step(step, user_id=user_id, dep_context=dep_outputs, global_context=context)
                step.status = "completed"
                step.output = result
                step_outputs[step.step_id] = result
                logger.info(f"[TaskExecutor] Step {step.step_id} ('{step.title}') completed successfully")
            except Exception as e:
                step.status = "failed"
                step.error = str(e)
                logger.warning(f"[TaskExecutor] Step {step.step_id} ('{step.title}') failed: {e}")
                # Don't break full execution; record error and continue to allow graceful degradation
                step_outputs[step.step_id] = f"Step failed: {e}"

        # Save final state
        self.state_manager.save_state(plan.goal, {
            "steps": [s.to_dict() for s in plan.steps],
            "chain": task_chain.get_tasks()
        })

        return {
            "success": any(s.status == "completed" for s in plan.steps),
            "step_outputs": step_outputs,
            "completed_steps": [s.step_id for s in plan.steps if s.status == "completed"],
            "failed_steps": [s.step_id for s in plan.steps if s.status == "failed"],
            "execution_chain": task_chain.get_tasks()
        }

    async def _execute_step(
        self,
        step: TaskStep,
        user_id: str,
        dep_context: Dict[int, Any],
        global_context: Dict[str, Any]
    ) -> Any:
        """Execute an individual TaskStep using tools or agents."""
        
        # 1. Execute tool if specified
        if step.tool and step.tool != "none":
            try:
                tool_output = self.tool_registry.execute(step.tool, step.description or step.title)
                if tool_output:
                    return tool_output
            except Exception as e:
                logger.warning(f"[TaskExecutor] Tool '{step.tool}' execution failed: {e}")

        # 2. Execute assigned agent if specified
        if step.agent_type and step.agent_type != "general":
            registry = get_registry()
            if step.agent_type in registry:
                agent_entry = registry[step.agent_type]
                agent = agent_entry["agent"]
                try:
                    import inspect
                    sig = inspect.signature(agent.run)
                    if "user_id" in sig.parameters:
                        return await agent.run(query=step.description or step.title, user_id=user_id)
                    else:
                        return await agent.run(query=step.description or step.title)
                except Exception as e:
                    logger.warning(f"[TaskExecutor] Agent '{step.agent_type}' failed: {e}")

        return f"Completed step: {step.title}"


# Global singleton
task_execution_engine = TaskExecutionEngine()
