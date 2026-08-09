import { AgentName, Provider, TaskStatus } from '@/store/dashboardStore';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

// ── Response types ────────────────────────────────────────────────────────

export interface AgentStatusResponse {
  id: AgentName;
  status: 'idle' | 'running' | 'success' | 'error' | 'queued';
  tasks_completed: number;
  success_rate: number;
  avg_response_ms: number;
  last_used: string | null;
  current_task?: string;
}

export interface TaskResponse {
  id: string;
  title: string;
  agent: AgentName;
  status: TaskStatus;
  provider: Provider;
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  error?: string;
}

export interface AnalyticsResponse {
  total_messages: number;
  total_tokens: number;
  provider_stats: {
    provider: Provider;
    calls: number;
    success_rate: number;
    avg_latency_ms: number;
    tokens_used: number;
  }[];
  daily_usage: {
    date: string;
    calls: number;
    tokens: number;
  }[];
}

// ── API calls ─────────────────────────────────────────────────────────────

export async function fetchAgentStatuses(): Promise<AgentStatusResponse[]> {
  const res = await fetch(`${BASE}/api/agents/status`, {
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`Agent status fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchTasks(limit = 20): Promise<TaskResponse[]> {
  const res = await fetch(`${BASE}/api/tasks?limit=${limit}`, {
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`Tasks fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchAnalytics(): Promise<AnalyticsResponse> {
  const res = await fetch(`${BASE}/api/analytics`, {
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`Analytics fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchDashboardAll(): Promise<{
  agents: AgentStatusResponse[];
  tasks: TaskResponse[];
  analytics: AnalyticsResponse;
}> {
  const [agents, tasks, analytics] = await Promise.all([
    fetchAgentStatuses(),
    fetchTasks(),
    fetchAnalytics(),
  ]);
  return { agents, tasks, analytics };
}

// ── Mock data (used when backend is unavailable) ──────────────────────────
// Remove this once your backend /api/agents/status, /api/tasks, /api/analytics are live.

export function getMockDashboardData() {
  const agents: AgentStatusResponse[] = [
    { id: 'planner',  status: 'idle',    tasks_completed: 42,  success_rate: 98, avg_response_ms: 340,  last_used: new Date(Date.now() - 120000).toISOString() },
    { id: 'research', status: 'running', tasks_completed: 128, success_rate: 95, avg_response_ms: 1240, last_used: new Date().toISOString(), current_task: 'Searching: AI trends 2026' },
    { id: 'rag',      status: 'idle',    tasks_completed: 87,  success_rate: 99, avg_response_ms: 280,  last_used: new Date(Date.now() - 600000).toISOString() },
    { id: 'code',     status: 'success', tasks_completed: 63,  success_rate: 94, avg_response_ms: 890,  last_used: new Date(Date.now() - 30000).toISOString() },
    { id: 'browser',  status: 'idle',    tasks_completed: 19,  success_rate: 89, avg_response_ms: 3200, last_used: new Date(Date.now() - 3600000).toISOString() },
    { id: 'memory',   status: 'idle',    tasks_completed: 201, success_rate: 100, avg_response_ms: 95,  last_used: new Date(Date.now() - 10000).toISOString() },
    { id: 'critic',   status: 'queued',  tasks_completed: 55,  success_rate: 96, avg_response_ms: 420,  last_used: new Date(Date.now() - 45000).toISOString() },
  ];

  const tasks: TaskResponse[] = [
    { id: '1', title: 'Search: AI trends in robotics 2026',      agent: 'research', status: 'running',   provider: 'groq',   started_at: new Date(Date.now() - 8000).toISOString() },
    { id: '2', title: 'Execute: data analysis script',           agent: 'code',     status: 'completed', provider: 'groq',   started_at: new Date(Date.now() - 60000).toISOString(),  completed_at: new Date(Date.now() - 52000).toISOString(), duration_ms: 8100 },
    { id: '3', title: 'Retrieve: project documents from RAG',    agent: 'rag',      status: 'completed', provider: 'gemini', started_at: new Date(Date.now() - 120000).toISOString(), completed_at: new Date(Date.now() - 119500).toISOString(), duration_ms: 320 },
    { id: '4', title: 'Plan: multi-step research workflow',       agent: 'planner',  status: 'completed', provider: 'groq',   started_at: new Date(Date.now() - 240000).toISOString(), completed_at: new Date(Date.now() - 239600).toISOString(), duration_ms: 410 },
    { id: '5', title: 'Store: conversation memory checkpoint',   agent: 'memory',   status: 'completed', provider: 'groq',   started_at: new Date(Date.now() - 300000).toISOString(), completed_at: new Date(Date.now() - 299900).toISOString(), duration_ms: 88 },
    { id: '6', title: 'Validate: research output quality score', agent: 'critic',   status: 'queued',    provider: 'groq',   started_at: new Date(Date.now() - 5000).toISOString() },
    { id: '7', title: 'Browse: competitor pricing page',         agent: 'browser',  status: 'failed',    provider: 'openai', started_at: new Date(Date.now() - 900000).toISOString(), completed_at: new Date(Date.now() - 897000).toISOString(), duration_ms: 3000, error: 'Page blocked anti-bot' },
  ];

  const analytics: AnalyticsResponse = {
    total_messages: 341,
    total_tokens: 284500,
    provider_stats: [
      { provider: 'groq',   calls: 218, success_rate: 97, avg_latency_ms: 480,  tokens_used: 162000 },
      { provider: 'gemini', calls: 89,  success_rate: 94, avg_latency_ms: 920,  tokens_used: 78000 },
      { provider: 'openai', calls: 34,  success_rate: 99, avg_latency_ms: 1340, tokens_used: 44500 },
    ],
    daily_usage: [
      { date: 'Mon', calls: 38, tokens: 31200 },
      { date: 'Tue', calls: 52, tokens: 43800 },
      { date: 'Wed', calls: 47, tokens: 39100 },
      { date: 'Thu', calls: 61, tokens: 51600 },
      { date: 'Fri', calls: 74, tokens: 62400 },
      { date: 'Sat', calls: 43, tokens: 36200 },
      { date: 'Sun', calls: 26, tokens: 20200 },
    ],
  };

  return { agents, tasks, analytics };
}