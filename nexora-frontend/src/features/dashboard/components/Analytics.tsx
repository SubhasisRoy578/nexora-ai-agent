'use client';

import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Zap, MessageSquare, Cpu, TrendingUp } from 'lucide-react';
import { ProviderStat, DailyUsage } from '@/store/dashboardStore';
// ✅ FIXED: Changed from @/store/chatStore to @/store/chatStore
import { useChatStore } from '@/store/chatStore';

// ── Config ────────────────────────────────────────────────────────────────

const PROVIDER_COLORS: Record<string, string> = {
  groq:   '#f97316',
  gemini: '#3b82f6',
  openai: '#10b981',
};

// ── Stat Card ─────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, sub, color, index,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      className="flex flex-col gap-3 p-5 rounded-2xl"
      style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ background: `${color}15`, border: `1px solid ${color}25` }}
      >
        <Icon size={17} style={{ color }} />
      </div>
      <div>
        <p
          className="text-2xl font-bold tabular-nums"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--text)' }}
        >
          {value}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>{label}</p>
        {sub && (
          <p className="text-[10px] mt-1" style={{ color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
            {sub}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ── Custom tooltip ────────────────────────────────────────────────────────

function CustomBarTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number; dataKey: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-3 py-2.5 rounded-xl text-xs"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        fontFamily: 'var(--font-mono)',
        color: 'var(--text)',
      }}
    >
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: '#6366f1' }}>
          {p.dataKey === 'calls' ? `${p.value} calls` : `${p.value.toLocaleString()} tokens`}
        </p>
      ))}
    </div>
  );
}

function CustomPieTooltip({ active, payload }: {
  active?: boolean;
  payload?: { name: string; value: number }[];
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-3 py-2 rounded-xl text-xs"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        fontFamily: 'var(--font-mono)',
        color: 'var(--text)',
      }}
    >
      <p>{payload[0].name}: <strong>{payload[0].value} calls</strong></p>
    </div>
  );
}

// ── Provider Table ────────────────────────────────────────────────────────

function ProviderTable({ stats }: { stats: ProviderStat[] }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
    >
      <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <h3
          className="text-sm font-bold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}
        >
          Model Performance
        </h3>
      </div>
      <table className="w-full">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {['Provider', 'Calls', 'Success', 'Avg Latency', 'Tokens'].map((h) => (
              <th
                key={h}
                className="px-5 py-3 text-left text-[10px] uppercase tracking-widest"
                style={{ color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {stats.map((stat, i) => {
            const color = PROVIDER_COLORS[stat.provider] ?? '#6366f1';
            return (
              <motion.tr
                key={stat.provider}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                className="transition-colors hover:bg-white/[0.02]"
                style={{ borderBottom: i < stats.length - 1 ? '1px solid var(--border)' : 'none' }}
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: color }}
                    />
                    <span
                      className="text-sm font-semibold capitalize"
                      style={{ color: 'var(--text)' }}
                    >
                      {stat.provider}
                    </span>
                  </div>
                </td>
                <td
                  className="px-5 py-3.5 text-sm tabular-nums"
                  style={{ color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}
                >
                  {stat.calls.toLocaleString()}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-1.5 rounded-full flex-shrink-0"
                      style={{ width: 48, background: 'var(--border)' }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${stat.successRate}%`, background: color }}
                      />
                    </div>
                    <span
                      className="text-xs tabular-nums"
                      style={{ color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}
                    >
                      {stat.successRate}%
                    </span>
                  </div>
                </td>
                <td
                  className="px-5 py-3.5 text-xs tabular-nums"
                  style={{ color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}
                >
                  {stat.avgLatencyMs >= 1000
                    ? `${(stat.avgLatencyMs / 1000).toFixed(1)}s`
                    : `${stat.avgLatencyMs}ms`}
                </td>
                <td
                  className="px-5 py-3.5 text-xs tabular-nums"
                  style={{ color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}
                >
                  {stat.tokensUsed >= 1000
                    ? `${(stat.tokensUsed / 1000).toFixed(1)}k`
                    : stat.tokensUsed}
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────

interface Props {
  providerStats: ProviderStat[];
  dailyUsage: DailyUsage[];
  totalMessages: number;
  totalTokens: number;
}

export default function Analytics({ providerStats, dailyUsage, totalMessages, totalTokens }: Props) {
  // ✅ FIXED: Safely access theme with fallback
  let isDark = true;
  try {
    const theme = useChatStore((s) => (s as any).theme);
    isDark = theme === 'dark';
  } catch {
    isDark = true;
  }

  const axisColor = isDark ? '#3a3a48' : '#e2e2ee';
  const textColor = isDark ? '#8a8aaa' : '#8888a8';

  const totalCalls = providerStats.reduce((s, p) => s + p.calls, 0);
  const avgSuccess = providerStats.length
    ? Math.round(providerStats.reduce((s, p) => s + p.successRate, 0) / providerStats.length)
    : 100;

  const pieData = providerStats
    .filter((p) => p.calls > 0)
    .map((p) => ({ name: p.provider, value: p.calls }));

  return (
    <section className="flex flex-col gap-6">
      <h2
        className="text-lg font-bold"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}
      >
        Analytics
      </h2>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={MessageSquare} label="Total Messages"   value={totalMessages.toLocaleString()} color="#6366f1" index={0} />
        <StatCard icon={Cpu}          label="Tokens Used"       value={totalTokens >= 1000 ? `${(totalTokens / 1000).toFixed(1)}k` : totalTokens.toString()} color="#8b5cf6" index={1} />
        <StatCard icon={Zap}          label="API Calls"         value={totalCalls.toLocaleString()} color="#f59e0b" index={2} />
        <StatCard icon={TrendingUp}   label="Avg Success Rate"  value={`${avgSuccess}%`}              color="#10b981" index={3} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Daily usage bar chart — 2/3 width */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 rounded-2xl p-5 flex flex-col gap-4"
          style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
        >
          <h3
            className="text-sm font-bold"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}
          >
            Daily API Calls (this week)
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={dailyUsage} barSize={24}>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: textColor, fontFamily: 'var(--font-mono)' }}
                axisLine={{ stroke: axisColor }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: textColor, fontFamily: 'var(--font-mono)' }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
              <Bar dataKey="calls" fill="#6366f1" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Provider pie — 1/3 width */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="rounded-2xl p-5 flex flex-col gap-4"
          style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
        >
          <h3
            className="text-sm font-bold"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}
          >
            Model Split
          </h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={44}
                  outerRadius={68}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={PROVIDER_COLORS[entry.name] ?? '#6366f1'}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value: string) => (
                    <span style={{ color: 'var(--text-2)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-center" style={{ color: 'var(--text-3)' }}>
                No API calls yet
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Provider performance table */}
      <ProviderTable stats={providerStats} />
    </section>
  );
}
