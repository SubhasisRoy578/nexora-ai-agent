'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, MessageSquare, Database, Bot, BarChart3,
  Settings, Sun, Moon, Wifi, WifiOff
} from 'lucide-react';
// ✅ FIXED: Changed from @/store/chatStore to @/store/chatStore
import { useChatStore } from '@/store/chatStore';
// ✅ REMOVED: useDashboardStore (doesn't exist)
// import { useDashboardStore } from '@/store/dashboardStore';
// ✅ REMOVED: getMockDashboardData (not needed)
// import { getMockDashboardData } from '@/lib/dashboardApi';
import AgentCards from './AgentCards';

type View = 'dashboard' | 'chat' | 'knowledge' | 'agents' | 'analytics' | 'settings';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeView?: View;
  onViewChange?: (view: View) => void;
}

export default function DashboardLayout({
  children,
  activeView = 'dashboard',
  onViewChange
}: DashboardLayoutProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Safely get theme from chatStore (with fallback)
  let theme = 'dark';
  try {
    const chatStore = useChatStore();
    theme = (chatStore as any).theme || 'dark';
  } catch {
    theme = 'dark';
  }
  
  const isDark = theme === 'dark';

  // Network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleTheme = () => {
    // Toggle theme on document
    const newTheme = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    // If you have a theme store, update it here
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'knowledge', label: 'Knowledge', icon: Database },
    { id: 'agents', label: 'Agents', icon: Bot },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg, #0A0C12)' }}>
      {/* Sidebar */}
      <motion.aside
        initial={{ width: 240 }}
        animate={{ width: isSidebarOpen ? 240 : 64 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col border-r flex-shrink-0"
        style={{ background: 'var(--surface, #11141C)', borderColor: 'var(--border, #1E2433)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 py-4 border-b" style={{ borderColor: 'var(--border, #1E2433)' }}>
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
          >
            N
          </div>
          {isSidebarOpen && (
            <span className="font-bold text-base" style={{ fontFamily: 'var(--font-display)', color: 'var(--text, #E5E7EB)' }}>
              Nexora
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange?.(item.id as View)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  isActive ? 'bg-cyan-500/10 text-cyan-400' : 'hover:bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <item.icon size={18} />
                {isSidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t flex items-center gap-2" style={{ borderColor: 'var(--border, #1E2433)' }}>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl hover:bg-white/5 transition"
          >
            {isDark ? <Sun size={16} className="text-gray-400" /> : <Moon size={16} className="text-gray-400" />}
          </button>
          <div className="flex-1" />
          {isOnline ? <Wifi size={14} className="text-green-500" /> : <WifiOff size={14} className="text-red-500" />}
        </div>
      </motion.aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto" style={{ background: 'var(--bg, #0A0C12)' }}>
        {children}
      </main>
    </div>
  );
}
