// src/stores/analyticsStore.ts
import { create } from 'zustand'
import { getAnalytics } from '../lib/api'

export interface Analytics {
  avg_response: string
  success_rate: string
  tasks_today: number
  tokens_used: string
  requests: number[]
  tokens: number[]
}

interface AnalyticsStore {
  metrics: Analytics | null
  loading: boolean
  error: string | null
  fetch: () => Promise<void>
  setError: (e: string | null) => void
}

export const useAnalyticsStore = create<AnalyticsStore>((set) => ({
  metrics: null,
  loading: false,
  error: null,

  fetch: async () => {
    set({ loading: true, error: null })
    try {
      const data = await getAnalytics()
      set({ metrics: data })
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to fetch analytics'
      set({ error: errMsg })
    } finally {
      set({ loading: false })
    }
  },

  setError: (error) => set({ error }),
}))
