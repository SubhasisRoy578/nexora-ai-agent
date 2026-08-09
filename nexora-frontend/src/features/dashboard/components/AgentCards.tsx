'use client';

import { motion } from 'framer-motion';
import {
  Search, Database, Code2, Globe, Brain,
  ClipboardList, ShieldCheck, Activity
} from 'lucide-react';
import { Agent, AgentName, AgentStatus } from '@/store/dashboardStore';
import { formatDistanceToNow } from 'date-fns';

// ── Config ────────────────────────────────────────────────────────────────

const AGENT_ICONS: Record<AgentName, React.ElementType> = {
  planner:  ClipboardList,
  research: Search,
  rag:      Database,
  code:     Code2,
  browser:  Globe,
  memory:   Brain,
  critic:   ShieldCheck,
};

const STATUS_CONFIG: Record<AgentStatus, { label: string; color: string; pulse: boolean }> = {
  idle:    { label: 'Idle',    color: '#52526a', pulse: false },
  running: { label: 'Running', color: '#10b981', pulse: true  },
  success: { label: 'Done',    color: '#6366f1', pulse: false },
  error:   { label: 'Error',   color: '#ef4444', pulse: false },
  queued:  { label: 'Queued',  color: '#f59e0b', pulse: true  },
};

// ── Sub-components ────────────────────────────────────────────────────────

function StatusDot({ status }: { status: AgentStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className="relative flex h-2 w-2 flex-shrink-0">
      {cfg.pulse && (
        <span
          className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
          style={{ background: cfg.color }}
        />
      )}
      <span
        className="relative inline-flex h-2 w-2 rounded-full"
        style={{ background: cfg.color }}
      />
    </span>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex flex-col gap-0.5 px-2.5 py-1.5 rounded-lg"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <span
        className="text-[10px] uppercase tracking-widest"
        style={{ color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}
      >
        {label}
      </span>
      <span
        className="text-sm font-bold tabular-nums"
        style={{ color: 'var(--text)', fontFamily: 'var(--font-mono)' }}
      >
        {value}
      </span>
    </div>
  );
}

// ── Agent Card ────────────────────────────────────────────────────────────

function AgentCard({ agent, index }: { agent: Agent; index: number }) {
  const Icon = AGENT_ICONS[agent.id];
  const statusCfg = STATUS_CONFIG[agent.status];
  const isActive = agent.status === 'running' || agent.status === 'queued';

  const formatMs = (ms: number) =>
    ms === 0 ? '—' : ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35, ease: 'easeOut' }}
      className="relative flex flex-col gap-4 p-5 rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: isActive
          ? `linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(16,185,129,0.04) 100%)`
          : 'var(--elevated)',
        border: isActive
          ? '1px solid rgba(99,102,241,0.25)'
          : '1px solid var(--border)',
        boxShadow: isActive ? '0 4px 24px rgba(99,102,241,0.1)' : 'none',
      }}
    >
      {/* Running glow strip */}
      {agent.status === 'running' && (
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{
            background: 'linear-gradient(90deg, transparent, #10b981, transparent)',
            animation: 'shimmer 2s infinite',
          }}
        />
      )}

      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: isActive ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.05)',
              border: isActive ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <Icon size={18} style={{ color: isActive ? 'var(--accent)' : 'var(--text-3)' }} />
          </div>
          <div>
            <h3
              className="text-sm font-bold"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}
            >
              {agent.label}
            </h3>
            <p className="text-[11px] leading-tight mt-0.5" style={{ color: 'var(--text-3)' }}>
              {agent.description}
            </p>
          </div>
        </div>

        {/* Status badge */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full flex-shrink-0"
          style={{
            background: `${statusCfg.color}18`,
            border: `1px solid ${statusCfg.color}40`,
          }}
        >
          <StatusDot status={agent.status} />
          <span
            className="text-[10px] font-semibold uppercase tracking-wide"
            style={{ color: statusCfg.color, fontFamily: 'var(--font-mono)' }}
          >
            {statusCfg.label}
          </span>
        </div>
      </div>

      {/* Current task (if running) */}
      {agent.currentTask && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
          style={{
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.15)',
            color: '#10b981',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <Activity size={11} className="flex-shrink-0 animate-pulse" />
          <span className="truncate">{agent.currentTask}</span>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <StatPill label="Tasks" value={agent.tasksCompleted.toString()} />
        <StatPill label="Success" value={`${agent.successRate}%`} />
        <StatPill label="Avg" value={formatMs(agent.avgResponseMs)} />
      </div>

      {/* Last used */}
      <p className="text-[10px]" style={{ color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
        {agent.lastUsed
          ? `Last active ${formatDistanceToNow(new Date(agent.lastUsed), { addSuffix: true })}`
          : 'Never used'}
      </p>
    </motion.div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────

export default function AgentCards({ agents }: { agents: Agent[] }) {
  const running = agents.filter((a) => a.status === 'running').length;
  const queued  = agents.filter((a) => a.status === 'queued').length;
  const total   = agents.reduce((s, a) => s + a.tasksCompleted, 0);

  return (
    <section className="flex flex-col gap-5">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2
            className="text-lg font-bold"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}
          >
            Agent Fleet
          </h2>
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{
              background: running > 0 ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.05)',
              color: running > 0 ? '#10b981' : 'var(--text-3)',
              border: running > 0 ? '1px solid rgba(16,185,129,0.25)' : '1px solid var(--border)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {running > 0 ? `${running} active` : 'All idle'}
            {queued > 0 && ` · ${queued} queued`}
          </div>
        </div>
        <span
          className="text-xs tabular-nums"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}
        >
          {total.toLocaleString()} tasks total
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {agents.map((agent, i) => (
          <AgentCard key={agent.id} agent={agent} index={i} />
        ))}
      </div>
    </section>
  );
}