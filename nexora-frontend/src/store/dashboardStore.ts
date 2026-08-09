import { create } from 'zustand';

// ── Types ──────────────────────────────────────────────────────────────────

export type AgentStatus = 'idle' | 'running' | 'success' | 'error' | 'queued';
export type AgentName =
  | 'research'
  | 'rag'
  | 'code'
  | 'browser'
  | 'memory'
  | 'planner'
  | 'critic';

export type TaskStatus = 'running' | 'completed' | 'failed' | 'queued';
export type Provider = 'groq' | 'gemini' | 'openai';

export interface Agent {
  id: AgentName;
  label: string;
  description: string;
  status: AgentStatus;
  tasksCompleted: number;
  successRate: number;   // 0-100
  avgResponseMs: number;
  lastUsed: Date | null;
  currentTask?: string;
}

export interface Task {
  id: string;
  title: string;
  agent: AgentName;
  status: TaskStatus;
  provider: Provider;
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
  error?: string;
}

export interface ProviderStat {
  provider: Provider;
  calls: number;
  successRate: number;
  avgLatencyMs: number;
  tokensUsed: number;
}

export interface DailyUsage {
  date: string;   // 'Mon', 'Tue' etc.
  calls: number;
  tokens: number;
}

interface DashboardStore {
  // Agents
  agents: Agent[];
  setAgentStatus: (id: AgentName, status: AgentStatus, task?: string) => void;
  incrementAgent: (id: AgentName, success: boolean, ms: number) => void;

  // Tasks
  tasks: Task[];
  addTask: (t: Omit<Task, 'id'>) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;

  // Analytics
  providerStats: ProviderStat[];
  dailyUsage: DailyUsage[];
  totalMessages: number;
  totalTokens: number;
  incrementProviderStat: (provider: Provider, success: boolean, ms: number, tokens: number) => void;

  // UI
  isConnected: boolean;
  setConnected: (v: boolean) => void;
  lastRefresh: Date;
  setLastRefresh: (d: Date) => void;
}

// ── Default data ──────────────────────────────────────────────────────────

const DEFAULT_AGENTS: Agent[] = [
  { id: 'planner',  label: 'Planner',  description: 'Decomposes goals into sub-tasks',       status: 'idle', tasksCompleted: 0, successRate: 100, avgResponseMs: 0, lastUsed: null },
  { id: 'research', label: 'Research', description: 'Live web search with 2026 freshness',    status: 'idle', tasksCompleted: 0, successRate: 100, avgResponseMs: 0, lastUsed: null },
  { id: 'rag',      label: 'RAG',      description: 'Retrieval over your knowledge base',     status: 'idle', tasksCompleted: 0, successRate: 100, avgResponseMs: 0, lastUsed: null },
  { id: 'code',     label: 'Code',     description: 'Python sandbox execution & explanation', status: 'idle', tasksCompleted: 0, successRate: 100, avgResponseMs: 0, lastUsed: null },
  { id: 'browser',  label: 'Browser',  description: 'Playwright web automation & scraping',   status: 'idle', tasksCompleted: 0, successRate: 100, avgResponseMs: 0, lastUsed: null },
  { id: 'memory',   label: 'Memory',   description: 'Stores and retrieves long-term context', status: 'idle', tasksCompleted: 0, successRate: 100, avgResponseMs: 0, lastUsed: null },
  { id: 'critic',   label: 'Critic',   description: 'Validates and scores agent outputs',     status: 'idle', tasksCompleted: 0, successRate: 100, avgResponseMs: 0, lastUsed: null },
];

const DEFAULT_PROVIDER_STATS: ProviderStat[] = [
  { provider: 'groq',   calls: 0, successRate: 100, avgLatencyMs: 0, tokensUsed: 0 },
  { provider: 'gemini', calls: 0, successRate: 100, avgLatencyMs: 0, tokensUsed: 0 },
  { provider: 'openai', calls: 0, successRate: 100, avgLatencyMs: 0, tokensUsed: 0 },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DEFAULT_DAILY: DailyUsage[] = DAYS.map((date) => ({ date, calls: 0, tokens: 0 }));

const genId = () => Math.random().toString(36).slice(2, 10);

// ── Store ─────────────────────────────────────────────────────────────────

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  agents: DEFAULT_AGENTS,
  tasks: [],
  providerStats: DEFAULT_PROVIDER_STATS,
  dailyUsage: DEFAULT_DAILY,
  totalMessages: 0,
  totalTokens: 0,
  isConnected: false,
  lastRefresh: new Date(),

  setAgentStatus: (id, status, currentTask) =>
    set((s) => ({
      agents: s.agents.map((a) =>
        a.id === id
          ? { ...a, status, currentTask, lastUsed: status === 'running' ? new Date() : a.lastUsed }
          : a
      ),
    })),

  incrementAgent: (id, success, ms) =>
    set((s) => ({
      agents: s.agents.map((a) => {
        if (a.id !== id) return a;
        const total = a.tasksCompleted + 1;
        const prevSuccesses = Math.round((a.successRate / 100) * a.tasksCompleted);
        const newSuccesses = prevSuccesses + (success ? 1 : 0);
        const successRate = Math.round((newSuccesses / total) * 100);
        const avgResponseMs = Math.round((a.avgResponseMs * a.tasksCompleted + ms) / total);
        return { ...a, tasksCompleted: total, successRate, avgResponseMs, status: success ? 'success' : 'error' };
      }),
    })),

  addTask: (t) =>
    set((s) => ({
      tasks: [{ ...t, id: genId() }, ...s.tasks].slice(0, 50), // keep last 50
      totalMessages: s.totalMessages + 1,
    })),

  updateTask: (id, patch) =>
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    })),

  incrementProviderStat: (provider, success, ms, tokens) =>
    set((s) => ({
      totalTokens: s.totalTokens + tokens,
      providerStats: s.providerStats.map((p) => {
        if (p.provider !== provider) return p;
        const calls = p.calls + 1;
        const prevSuccesses = Math.round((p.successRate / 100) * p.calls);
        const newSuccesses = prevSuccesses + (success ? 1 : 0);
        const successRate = calls ? Math.round((newSuccesses / calls) * 100) : 100;
        const avgLatencyMs = Math.round((p.avgLatencyMs * p.calls + ms) / calls);
        const tokensUsed = p.tokensUsed + tokens;
        return { ...p, calls, successRate, avgLatencyMs, tokensUsed };
      }),
      // Increment today's usage
      dailyUsage: s.dailyUsage.map((d, i) => {
        const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
        return i === todayIdx ? { ...d, calls: d.calls + 1, tokens: d.tokens + tokens } : d;
      }),
    })),

  setConnected: (isConnected) => set({ isConnected }),
  setLastRefresh: (lastRefresh) => set({ lastRefresh }),
}));
