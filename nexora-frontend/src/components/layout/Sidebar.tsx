'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  MessageSquare, LayoutDashboard, Plus,
  Sun, Moon, Zap, ChevronLeft, ChevronRight
} from 'lucide-react';
import { UserButton } from '@clerk/nextjs';
import { useChatStore } from '@/store/chatStore';

const NAV = [
  { href: '/chat',      icon: MessageSquare,  label: 'Chat' },
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { setCurrentSessionId } = useChatStore();
  
  // ✅ Local state for sidebar
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // ✅ Local state for theme with localStorage
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // Create a new chat session
  const createSession = () => {
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    setCurrentSessionId(newSessionId);
  };

  return (
    <>
      {/* Collapse toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute top-4 z-50 flex items-center justify-center w-6 h-6 rounded-full border transition-all hover:scale-110"
        style={{
          left: sidebarOpen ? '252px' : '8px',
          background: 'var(--surface)',
          borderColor: 'var(--border)',
          color: 'var(--text-2)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          transition: 'left 0.25s ease',
        }}
      >
        {sidebarOpen ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
      </button>

      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="h-full flex flex-col border-r overflow-hidden flex-shrink-0"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            {/* Logo */}
            <div className="flex items-center gap-2.5 px-4 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
              >
                N
              </div>
              <span className="font-bold text-base" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
                Nexora
              </span>
              <Zap size={13} className="ml-auto" style={{ color: '#8b5cf6' }} />
            </div>

            {/* New Chat button */}
            <div className="px-3 pt-3 pb-2">
              <Link href="/chat" onClick={createSession}>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-[1.01]"
                  style={{
                    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                    color: '#fff',
                    boxShadow: '0 2px 12px rgba(99,102,241,0.3)',
                  }}
                >
                  <Plus size={15} />
                  New Chat
                </button>
              </Link>
            </div>

            {/* Nav links */}
            <nav className="flex flex-col gap-0.5 px-2 py-2">
              {NAV.map(({ href, icon: Icon, label }) => {
                const active = pathname.startsWith(href);
                return (
                  <Link key={href} href={href}>
                    <div
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer"
                      style={{
                        background: active ? 'var(--accent-soft)' : 'transparent',
                        color: active ? 'var(--accent)' : 'var(--text-2)',
                        border: active ? '1px solid rgba(99,102,241,0.2)' : '1px solid transparent',
                      }}
                    >
                      <Icon size={15} />
                      {label}
                    </div>
                  </Link>
                );
              })}
            </nav>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Footer */}
            <div className="px-3 py-3 border-t flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
              <UserButton afterSignOutUrl="/" />
              <div className="flex-1" />
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl transition-all hover:scale-110"
                style={{ background: 'var(--elevated)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
                title="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
