// src/stores/agentStore.ts
import { create } from 'zustand'
import { getAgents, runAgent } from '../lib/api'

export interface Agent {
  id: string
  name: string
  status: 'idle' | 'running' | 'queued'
  tasks: number
  success: string
  icon?: string
  progress?: number  // ← ADD THIS
}

export interface AgentTask {
  id: string
  agent_id: string
  task: string
  status: 'running' | 'completed' | 'failed'
  duration?: string
}

interface AgentStore {
  agents: Agent[]
  tasks: AgentTask[]
  loading: boolean
  error: string | null
  fetchAgents: () => Promise<void>
  dispatch: (agentId: string, task: string) => Promise<void>
  setError: (e: string | null) => void
}

export const useAgentStore = create<AgentStore>((set) => ({
  agents: [],
  tasks: [],
  loading: false,
  error: null,

  fetchAgents: async () => {
    set({ loading: true, error: null })
    try {
      const data = await getAgents()
      set({ agents: data })
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to fetch agents'
      set({ error: errMsg })
    } finally {
      set({ loading: false })
    }
  },

  dispatch: async (agentId: string, task: string) => {
    set({ loading: true, error: null })
    try {
      const result = await runAgent(agentId, task)
      set((s) => ({ tasks: [result, ...s.tasks] }))
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to dispatch agent'
      set({ error: errMsg })
    } finally {
      set({ loading: false })
    }
  },

  setError: (error) => set({ error }),
}))
