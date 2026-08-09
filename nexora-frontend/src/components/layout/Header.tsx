'use client';

import { usePathname } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { useDashboardStore } from '@/store/dashboardStore';
import { formatDistanceToNow } from 'date-fns';

const PAGE_TITLES: Record<string, { title: string; desc: string }> = {
  '/chat':      { title: 'Chat',      desc: 'AI-powered conversations' },
  '/dashboard': { title: 'Dashboard', desc: 'Agent fleet & analytics' },
};

export default function Header() {
  const pathname = usePathname();
  const page = PAGE_TITLES[pathname] ?? { title: 'Nexora', desc: '' };
  const { isConnected, lastRefresh } = useDashboardStore();

  return (
    <header
      className="flex items-center justify-between px-6 py-3.5 border-b flex-shrink-0"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div>
        <h1
          className="text-sm font-bold leading-tight"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}
        >
          {page.title}
        </h1>
        <p className="text-[11px]" style={{ color: 'var(--text-3)' }}>
          {page.desc}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Last refresh */}
        <div className="flex items-center gap-1.5" style={{ color: 'var(--text-3)' }}>
          <RefreshCw size={11} />
          <span className="text-[10px]" style={{ fontFamily: 'var(--font-mono)' }}>
            {formatDistanceToNow(lastRefresh, { addSuffix: true })}
          </span>
        </div>

        {/* Connection status */}
        <div className="flex items-center gap-1.5">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: isConnected ? '#10b981' : '#f59e0b' }}
          />
          <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>
            {isConnected ? 'Connected' : 'Mock data'}
          </span>
        </div>
      </div>
    </header>
  );
}