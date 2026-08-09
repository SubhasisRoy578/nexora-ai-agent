'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Database, Code2, Globe, Brain,
  ClipboardList, ShieldCheck, CheckCircle2,
  XCircle, Clock, Loader2, AlertCircle
} from 'lucide-react';
import { Task, AgentName, TaskStatus } from '@/store/dashboardStore';
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

const AGENT_COLORS: Record<AgentName, string> = {
  planner:  '#6366f1',
  research: '#3b82f6',
  rag:      '#8b5cf6',
  code:     '#10b981',
  browser:  '#f59e0b',
  memory:   '#ec4899',
  critic:   '#ef4444',
};

const STATUS_ICONS: Record<TaskStatus, React.ElementType> = {
  running:   Loader2,
  completed: CheckCircle2,
  failed:    XCircle,
  queued:    Clock,
};

const STATUS_COLORS: Record<TaskStatus, string> = {
  running:   '#10b981',
  completed: '#6366f1',
  failed:    '#ef4444',
  queued:    '#f59e0b',
};

const PROVIDER_BADGE: Record<string, { label: string; color: string }> = {
  groq:   { label: 'Groq',   color: '#f97316' },
  gemini: { label: 'Gemini', color: '#3b82f6' },
  openai: { label: 'OpenAI', color: '#10b981' },
};

// ── Task Row ──────────────────────────────────────────────────────────────

function TaskRow({ task, index }: { task: Task; index: number }) {
  const AgentIcon  = AGENT_ICONS[task.agent];
  const StatusIcon = STATUS_ICONS[task.status];
  const agentColor  = AGENT_COLORS[task.agent];
  const statusColor = STATUS_COLORS[task.status];
  const provBadge   = PROVIDER_BADGE[task.provider];

  const formatDuration = (ms?: number) => {
    if (!ms) return null;
    return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      className="group flex items-start gap-3 px-4 py-3.5 rounded-xl transition-colors hover:bg-white/[0.03]"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      {/* Agent icon */}
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: `${agentColor}15`, border: `1px solid ${agentColor}30` }}
      >
        <AgentIcon size={13} style={{ color: agentColor }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className="text-sm font-medium leading-tight truncate"
            style={{ color: 'var(--text)' }}
          >
            {task.title}
          </p>

          {/* Status icon */}
          <StatusIcon
            size={14}
            className={`flex-shrink-0 mt-0.5 ${task.status === 'running' ? 'animate-spin' : ''}`}
            style={{ color: statusColor }}
          />
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Agent label */}
          <span
            className="text-[10px] font-semibold uppercase tracking-wide"
            style={{ color: agentColor, fontFamily: 'var(--font-mono)' }}
          >
            {task.agent}
          </span>

          <span style={{ color: 'var(--border)' }}>·</span>

          {/* Provider */}
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
            style={{
              background: `${provBadge.color}15`,
              color: provBadge.color,
              border: `1px solid ${provBadge.color}30`,
            }}
          >
            {provBadge.label}
          </span>

          <span style={{ color: 'var(--border)' }}>·</span>

          {/* Time */}
          <span
            className="text-[10px]"
            style={{ color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}
          >
            {formatDistanceToNow(new Date(task.startedAt), { addSuffix: true })}
          </span>

          {/* Duration */}
          {formatDuration(task.durationMs) && (
            <>
              <span style={{ color: 'var(--border)' }}>·</span>
              <span
                className="text-[10px] tabular-nums"
                style={{ color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}
              >
                {formatDuration(task.durationMs)}
              </span>
            </>
          )}
        </div>

        {/* Error message */}
        {task.error && (
          <div
            className="flex items-center gap-1.5 mt-1 px-2.5 py-1.5 rounded-lg text-xs"
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              color: '#ef4444',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <AlertCircle size={11} className="flex-shrink-0" />
            {task.error}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────

export default function TaskFeed({ tasks }: { tasks: Task[] }) {
  const running   = tasks.filter((t) => t.status === 'running').length;
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const failed    = tasks.filter((t) => t.status === 'failed').length;

  return (
    <section className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2
          className="text-lg font-bold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}
        >
          Task Feed
        </h2>

        {/* Counters */}
        <div className="flex items-center gap-2">
          {running > 0 && (
            <span
              className="text-[10px] px-2 py-1 rounded-full font-mono font-semibold"
              style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' }}
            >
              {running} running
            </span>
          )}
          {failed > 0 && (
            <span
              className="text-[10px] px-2 py-1 rounded-full font-mono font-semibold"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              {failed} failed
            </span>
          )}
          <span
            className="text-[10px] tabular-nums"
            style={{ color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}
          >
            {completed} done
          </span>
        </div>
      </div>

      {/* Feed */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
      >
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Clock size={28} style={{ color: 'var(--muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>
              No tasks yet. Start a conversation to see agent activity here.
            </p>
          </div>
        ) : (
          <div className="flex flex-col overflow-y-auto" style={{ maxHeight: 480 }}>
            <AnimatePresence initial={false}>
              {tasks.map((task, i) => (
                <TaskRow key={task.id} task={task} index={i} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </section>
  );
}