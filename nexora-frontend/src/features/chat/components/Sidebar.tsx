'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, MessageSquare, Trash2, Edit2, Check, X,
  Sun, Moon, ChevronLeft, ChevronRight, Zap
} from 'lucide-react';
import { UserButton } from '@clerk/nextjs';
import { useChatStore } from '@/store/chatStore';
import { formatDistanceToNow } from 'date-fns';

// ============================================
// TYPES
// ============================================

interface ChatSession {
  id: string
  title: string
  createdAt: Date
  updatedAt: Date
}

// ============================================
// SIDEBAR COMPONENT
// ============================================

export default function Sidebar() {
  const { setCurrentSessionId, currentSessionId } = useChatStore();
  
  // Local state for sidebar
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  
  const editRef = useRef<HTMLInputElement>(null);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  // Focus edit input when editing starts
  useEffect(() => {
    if (editingId && editRef.current) {
      editRef.current.focus();
    }
  }, [editingId]);

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // Create a new session
  const createSession = () => {
    const newSession: ChatSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      title: `New Chat ${sessions.length + 1}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setSessions([newSession, ...sessions]);
    setActiveSessionId(newSession.id);
    setCurrentSessionId(newSession.id);
  };

  // Delete a session
  const deleteSession = (id: string) => {
    setSessions(sessions.filter(s => s.id !== id));
    if (activeSessionId === id) {
      const nextSession = sessions.find(s => s.id !== id);
      setActiveSessionId(nextSession?.id || null);
      setCurrentSessionId(nextSession?.id || null);
    }
  };

  // Rename a session
  const renameSession = (id: string, newTitle: string) => {
    setSessions(sessions.map(s => 
      s.id === id ? { ...s, title: newTitle, updatedAt: new Date() } : s
    ));
    setEditingId(null);
  };

  // Set active session
  const setActiveSession = (id: string) => {
    setActiveSessionId(id);
    setCurrentSessionId(id);
  };

  // Start editing
  const startEdit = (id: string, title: string) => {
    setEditingId(id);
    setEditValue(title);
  };

  // Commit edit
  const commitEdit = () => {
    if (editingId && editValue.trim()) {
      renameSession(editingId, editValue.trim());
    }
    setEditingId(null);
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <>
      {/* Collapse toggle (always visible) */}
      <button
        onClick={toggleSidebar}
        className="absolute top-4 z-50 flex items-center justify-center w-6 h-6 rounded-full border transition-all hover:scale-110"
        style={{
          left: sidebarOpen ? '252px' : '8px',
          background: 'var(--surface)',
          borderColor: 'var(--border)',
          color: 'var(--text-2)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          transition: 'left 0.25s ease',
        }}
        aria-label="Toggle sidebar"
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
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
              minWidth: 0,
            }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-2.5 px-4 py-4 border-b flex-shrink-0"
              style={{ borderColor: 'var(--border)' }}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
              >
                N
              </div>
              <span
                className="font-bold text-base truncate"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}
              >
                Nexora
              </span>
              <Zap size={13} className="ml-auto flex-shrink-0" style={{ color: '#8b5cf6' }} />
            </div>

            {/* New Chat */}
            <div className="px-3 pt-3 pb-2 flex-shrink-0">
              <button
                onClick={createSession}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{
                  background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                  color: '#fff',
                  boxShadow: '0 2px 12px rgba(99,102,241,0.3)',
                }}
              >
                <Plus size={15} />
                New Chat
              </button>
            </div>

            {/* Sessions list */}
            <div className="flex-1 overflow-y-auto px-2 pb-2">
              {sessions.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 px-4 text-center">
                  <MessageSquare size={28} style={{ color: 'var(--muted)' }} />
                  <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                    No chats yet. Start a new conversation!
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-0.5">
                  {sessions.map((sess) => {
                    const isActive = sess.id === activeSessionId;
                    const isEditing = editingId === sess.id;

                    return (
                      <motion.div
                        key={sess.id}
                        layout
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        className="group relative flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all"
                        style={{
                          background: isActive ? 'var(--accent-soft)' : 'transparent',
                          border: isActive
                            ? '1px solid rgba(99,102,241,0.2)'
                            : '1px solid transparent',
                        }}
                        onClick={() => !isEditing && setActiveSession(sess.id)}
                      >
                        <MessageSquare
                          size={13}
                          className="flex-shrink-0"
                          style={{ color: isActive ? 'var(--accent)' : 'var(--text-3)' }}
                        />

                        {isEditing ? (
                          <input
                            ref={editRef}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') commitEdit();
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                            onBlur={commitEdit}
                            className="flex-1 text-xs bg-transparent outline-none min-w-0"
                            style={{ color: 'var(--text)' }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-xs font-medium truncate leading-tight"
                              style={{ color: isActive ? 'var(--text)' : 'var(--text-2)' }}
                            >
                              {sess.title}
                            </p>
                            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-3)' }}>
                              {formatDistanceToNow(new Date(sess.updatedAt), { addSuffix: true })}
                            </p>
                          </div>
                        )}

                        {/* Action buttons */}
                        {isEditing ? (
                          <div className="flex gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); commitEdit(); }}
                              className="p-1 rounded hover:bg-green-500/10 text-green-500"
                            >
                              <Check size={11} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditingId(null); }}
                              className="p-1 rounded"
                              style={{ color: 'var(--text-3)' }}
                            >
                              <X size={11} />
                            </button>
                          </div>
                        ) : (
                          <div
                            className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => startEdit(sess.id, sess.title)}
                              className="p-1 rounded transition-colors hover:bg-[var(--elevated)]"
                              style={{ color: 'var(--text-3)' }}
                              title="Rename"
                            >
                              <Edit2 size={11} />
                            </button>
                            <button
                              onClick={() => deleteSession(sess.id)}
                              className="p-1 rounded transition-colors hover:bg-red-500/10 hover:text-red-500"
                              style={{ color: 'var(--text-3)' }}
                              title="Delete"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className="px-3 py-3 border-t flex items-center gap-2 flex-shrink-0"
              style={{ borderColor: 'var(--border)' }}
            >
              <UserButton afterSignOutUrl="/" />
              <div className="flex-1 min-w-0" />
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl transition-all hover:scale-110 active:scale-95"
                style={{
                  background: 'var(--elevated)',
                  color: 'var(--text-2)',
                  border: '1px solid var(--border)',
                }}
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
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
