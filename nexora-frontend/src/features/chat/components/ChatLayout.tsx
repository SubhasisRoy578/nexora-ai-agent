'use client';

import { useCallback, useRef, useEffect, useState } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { useChatStore } from '@/store/chatStore';
import { streamChat, uploadDocument } from '@/lib/api';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import ChatInput from './ChatInput';

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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  // Create a session ID on mount
  useEffect(() => {
    if (!currentSessionId) {
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      setCurrentSessionId(newSessionId);
    }
  }, [currentSessionId, setCurrentSessionId]);

  const handleSend = useCallback(
    async (text: string, files: File[]) => {
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
        const tools = ['rag'];
        for await (const chunk of streamChat(fullMessage, tools, token ?? undefined)) {
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
        console.error('Stream error:', error);
        updateMessage(assistantMessageId, {
          content: 'Sorry, an error occurred while processing your request.',
          isStreaming: false,
          error: true,
        });
        toast.error('Failed to get response');
      } finally {
        setIsStreaming(false);
      }
    },
    [isStreaming, getToken, user, currentSessionId, addMessage, updateMessage]
  );

  // Convert messages to the format expected by ChatWindow
  const formattedMessages = messages.map((msg: any) => ({
    id: msg.id,
    role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
    content: msg.content,
    isStreaming: msg.isStreaming,
    error: msg.error,
  }));

  const sessionTitle = messages.find((m: any) => m.type === 'user')?.content?.slice(0, 42) ?? 'Nexora AI';

  return (
    <div
      className="flex h-screen overflow-hidden"
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

      <div className="relative flex-shrink-0" style={{ zIndex: 20 }}>
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <div
          className="flex items-center justify-between px-6 py-3.5 border-b flex-shrink-0"
          style={{
            background: 'var(--surface, #11141C)',
            borderColor: 'var(--border, #1E2433)',
          }}
        >
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <div
                className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-sm font-bold"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
              >
                N
              </div>
            )}
            <div>
              <h1
                className="text-sm font-semibold leading-tight"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--text, #E5E7EB)' }}
              >
                {sessionTitle}
              </h1>
              <p className="text-[11px]" style={{ color: 'var(--text-3, #6B7280)' }}>
                {messages.length} messages
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: '#10b981' }}
              />
              <span className="text-[11px]" style={{ color: 'var(--text-3, #6B7280)' }}>
                Connected
              </span>
            </div>
          </div>
        </div>

        <ChatWindow 
          messages={formattedMessages}
          isLoading={loading || isStreaming}
        />

        <div
          className="flex-shrink-0 px-4 pb-4 pt-2 border-t"
          style={{
            borderColor: 'var(--border, #1E2433)',
            background: 'var(--bg, #0A0C12)',
          }}
        >
          <div className="max-w-3xl mx-auto w-full">
            <ChatInput
              onSend={handleSend}
              disabled={isStreaming}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
