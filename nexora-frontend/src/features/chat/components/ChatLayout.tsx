'use client';

import { useCallback, useRef, useEffect, useState, useMemo } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { useChatStore } from '@/store/chatStore';
import { streamChat, uploadDocument } from '@/lib/api';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import ChatInput from './ChatInput';
import { Menu } from 'lucide-react';

export default function ChatLayout() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { 
    messages, 
    addMessage, 
    updateMessage, 
    loading, 
    setCurrentSessionId, 
    currentSessionId 
  } = useChatStore();
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(
    typeof window !== 'undefined' ? window.innerWidth > 768 : true
  );
  const [isOffline, setIsOffline] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Offline detection
  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    setIsOffline(!navigator.onLine);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  // Create a session ID on mount
  useEffect(() => {
    if (!currentSessionId) {
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      setCurrentSessionId(newSessionId);
    }
  }, [currentSessionId, setCurrentSessionId]);

  const handleSend = useCallback(
    async (text: string, files: File[], tools: string[] = []) => {
      if (isStreaming || (!text.trim() && files.length === 0)) return;

      const token = await getToken();
      const userId = user?.id ?? 'anonymous';
      const sessionId = currentSessionId || `session_${Date.now()}`;

      // Upload files if any
      let fileContext = '';
      if (files.length > 0) {
        try {
          const uploadResults = await Promise.all(
            files.map(async (file) => {
              const result = await uploadDocument(file, token ?? undefined);
              return `[Uploaded: ${result.name || file.name}]`;
            })
          );
          fileContext = uploadResults.join(' ');
          toast.success(`${files.length} file(s) uploaded successfully`);
        } catch (error) {
          console.error('Upload error:', error);
          toast.error('File upload failed. Proceeding without files.');
        }
      }

      const fullMessage = fileContext ? `${fileContext}\n\n${text}` : text;

      // Add user message
      addMessage({
        type: 'user',
        content: fullMessage,
      });

      // Add placeholder for AI response
      const assistantMessageId = addMessage({
        type: 'ai',
        content: '',
        isStreaming: true,
      });

      let accumulatedResponse = '';
      setIsStreaming(true);

      try {
        abortRef.current = new AbortController();
        for await (const chunk of streamChat(fullMessage, tools, token ?? undefined, userId, undefined, abortRef.current.signal)) {
          accumulatedResponse += chunk;
          updateMessage(assistantMessageId, {
            content: accumulatedResponse,
            isStreaming: true,
          });
        }

        updateMessage(assistantMessageId, {
          content: accumulatedResponse || 'I processed your request.',
          isStreaming: false,
        });
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          updateMessage(assistantMessageId, {
            content: accumulatedResponse + '\n\n*(Generation stopped)*',
            isStreaming: false,
          });
          toast('Generation stopped', { icon: '🛑' });
        } else {
          console.error('Stream error:', error);
          updateMessage(assistantMessageId, {
            content: 'Sorry, an error occurred while processing your request.',
            isStreaming: false,
            error: true,
          });
          toast.error('Failed to get response');
        }
      } finally {
        setIsStreaming(false);
      }
    },
    [isStreaming, getToken, user, currentSessionId, addMessage, updateMessage]
  );

  const handleStop = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
  }, []);

  useEffect(() => {
    const handleRetry = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      handleSend(customEvent.detail, []);
    };
    window.addEventListener('nexora:retry', handleRetry);
    return () => window.removeEventListener('nexora:retry', handleRetry);
  }, [handleSend]);

  // Memoize message mapping to prevent unnecessary ChatWindow re-renders
  const formattedMessages = useMemo(() => messages.map((msg: any) => ({
    id: msg.id,
    role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
    content: msg.content,
    isStreaming: msg.isStreaming,
    error: msg.error,
  })), [messages]);

  const sessionTitle = useMemo(
    () => messages.find((m: any) => m.type === 'user')?.content?.slice(0, 42) ?? 'Nexora AI',
    [messages]
  );

  return (
    <div
      className="flex h-screen h-dvh overflow-hidden"
      style={{ background: 'var(--bg, #0A0C12)' }}
    >
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'var(--surface, #11141C)',
            color: 'var(--text, #E5E7EB)',
            border: '1px solid var(--border, #1E2433)',
            borderRadius: 12,
            fontSize: 13,
          },
        }}
      />

      {/* Offline banner */}
      {isOffline && (
        <div className="offline-banner">⚡ You are offline — responses may fail</div>
      )}

      {/* Sidebar — hidden on mobile via CSS class */}
      <div className="relative flex-shrink-0 sidebar-desktop-only" style={{ zIndex: 20 }}>
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Header — responsive padding & mobile hamburger */}
        <div
          className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-3.5 border-b flex-shrink-0"
          style={{
            background: 'var(--surface, #11141C)',
            borderColor: 'var(--border, #1E2433)',
          }}
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile hamburger menu */}
            <button
              className="flex sm:hidden items-center justify-center w-8 h-8 rounded-lg"
              style={{ background: 'var(--elevated, #1a1d28)', color: 'var(--text-2)' }}
              onClick={() => setSidebarOpen(prev => !prev)}
              aria-label="Toggle menu"
            >
              <Menu size={16} />
            </button>
            {!sidebarOpen && (
              <div
                className="hidden sm:flex w-7 h-7 rounded-xl items-center justify-center text-white text-sm font-bold"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
              >
                N
              </div>
            )}
            <div className="min-w-0">
              <h1
                className="text-xs sm:text-sm font-semibold leading-tight truncate"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--text, #E5E7EB)' }}
              >
                {sessionTitle}
              </h1>
              <p className="text-[10px] sm:text-[11px]" style={{ color: 'var(--text-3, #6B7280)' }}>
                {messages.length} messages
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: isOffline ? '#ef4444' : '#10b981' }}
              />
              <span className="text-[10px] sm:text-[11px]" style={{ color: 'var(--text-3, #6B7280)' }}>
                {isOffline ? 'Offline' : 'Connected'}
              </span>
            </div>
          </div>
        </div>

        <ChatWindow 
          messages={formattedMessages}
          isLoading={loading || isStreaming}
        />

        {/* Input area — responsive padding */}
        <div
          className="flex-shrink-0 px-2 sm:px-4 pb-3 sm:pb-4 pt-1 sm:pt-2 border-t"
          style={{
            borderColor: 'var(--border, #1E2433)',
            background: 'var(--bg, #0A0C12)',
          }}
        >
          <div className="max-w-3xl mx-auto w-full">
            <ChatInput
              onSend={handleSend}
              onStop={handleStop}
              disabled={isStreaming || isOffline}
              isStreaming={isStreaming}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
