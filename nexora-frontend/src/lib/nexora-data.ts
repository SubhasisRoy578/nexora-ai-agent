export type ToolId = "rag" | "search" | "code" | "agent" | "upload"

export type MessageRole = "user" | "assistant"

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  /** Tools that were active/used for this turn */
  tools?: ToolId[]
  timestamp: string
}

export interface ChatSession {
  id: string
  title: string
  preview: string
  updatedAt: string
  messages: ChatMessage[]
}

export type ActivityKind =
  | "thinking"
  | "search"
  | "tool"
  | "rag"
  | "code"
  | "success"
  | "info"

export interface ActivityLog {
  id: string
  kind: ActivityKind
  label: string
  detail?: string
  time: string
  /** 0-100 when the step represents progress */
  progress?: number
}

export interface ModelOption {
  id: string
  name: string
  provider: string
  context: string
}

export const MODELS: ModelOption[] = [
  { id: "groq-llama-70b", name: "Llama 3.3 70B", provider: "Groq", context: "128K" },
  { id: "groq-mixtral", name: "Mixtral 8x7B", provider: "Groq", context: "32K" },
  { id: "gpt-5-mini", name: "GPT-5 mini", provider: "OpenAI", context: "256K" },
  { id: "claude-opus", name: "Claude Opus 4.6", provider: "Anthropic", context: "200K" },
  { id: "gemini-flash", name: "Gemini 3 Flash", provider: "Google", context: "1M" },
]

export const SESSIONS: ChatSession[] = [
  {
    id: "s1",
    title: "Vector index migration plan",
    preview: "Outline a zero-downtime migration from pgvector to a managed index…",
    updatedAt: "2m ago",
    messages: [
      {
        id: "m1",
        role: "user",
        content:
          "We're hitting latency limits on our pgvector setup. Draft a zero-downtime migration plan to a managed vector index, and flag any risks.",
        timestamp: "10:42",
      },
      {
        id: "m2",
        role: "assistant",
        tools: ["rag", "search", "agent"],
        content:
          "Here's a phased, zero-downtime migration plan.\n\n1. Dual-write phase — Mirror every embedding write to both pgvector and the new managed index behind a feature flag. This keeps the source of truth intact while you backfill.\n2. Backfill — Stream historical embeddings in batches of 5k with checkpointing so a failure resumes instead of restarting.\n3. Shadow reads — Route a sampled % of queries to the new index and compare recall@10 against pgvector. Promote only when parity holds for 24h.\n4. Cutover — Flip the read flag, keep dual-write for one more day, then retire pgvector writes.\n\nTop risks: embedding dimension mismatch, recall regressions from a different ANN algorithm, and cost spikes during backfill. I'd gate the cutover on a recall dashboard.",
        timestamp: "10:42",
      },
    ],
  },
  {
    id: "s2",
    title: "Customer churn analysis agent",
    preview: "Build an agent that reads Stripe + support tickets to predict churn…",
    updatedAt: "1h ago",
    messages: [
      {
        id: "m1",
        role: "user",
        content:
          "Design an agent workflow that combines Stripe billing events with support ticket sentiment to surface accounts at risk of churning.",
        timestamp: "09:15",
      },
      {
        id: "m2",
        role: "assistant",
        tools: ["agent", "code"],
        content:
          "I'd structure this as a three-tool agent: a billing reader, a sentiment scorer, and a risk aggregator. The orchestrator fans out, scores each signal 0–1, then weights them into a single churn probability. I can scaffold the tool definitions whenever you're ready.",
        timestamp: "09:16",
      },
    ],
  },
  {
    id: "s3",
    title: "Docs RAG quality eval",
    preview: "Why is retrieval returning stale sections? Let's debug the chunker…",
    updatedAt: "Yesterday",
    messages: [
      {
        id: "m1",
        role: "user",
        content: "Our docs RAG keeps citing outdated sections. Where do I start debugging?",
        timestamp: "16:30",
      },
    ],
  },
  {
    id: "s4",
    title: "On-call incident summarizer",
    preview: "Summarize the last 24h of PagerDuty alerts into a standup brief…",
    updatedAt: "2d ago",
    messages: [
      {
        id: "m1",
        role: "user",
        content: "Summarize the last 24h of incidents into a 5-bullet standup brief.",
        timestamp: "08:01",
      },
    ],
  },
]

export const BASE_ACTIVITY: ActivityLog[] = [
  {
    id: "a1",
    kind: "info",
    label: "Session initialized",
    detail: "Context window loaded · 4 documents",
    time: "10:41:58",
  },
  {
    id: "a2",
    kind: "rag",
    label: "Knowledge base attached",
    detail: "vector-index/prod · 1.2M chunks",
    time: "10:42:01",
  },
  {
    id: "a3",
    kind: "thinking",
    label: "Agent reasoning",
    detail: "Decomposing request into 4 sub-tasks",
    time: "10:42:03",
  },
  {
    id: "a4",
    kind: "search",
    label: "Searching knowledge base",
    detail: "query: zero-downtime vector migration",
    time: "10:42:04",
    progress: 100,
  },
  {
    id: "a5",
    kind: "tool",
    label: "Tool call: semantic_search",
    detail: "top_k=8 · recall@10 0.94",
    time: "10:42:05",
  },
  {
    id: "a6",
    kind: "success",
    label: "Response synthesized",
    detail: "2,140 tokens · 1.8s · Groq",
    time: "10:42:07",
  },
]
