'use client';

import { useState, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, User, Bot, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useChatStore } from '@/store/chatStore';

// ============================================
// TYPES DEFINED LOCALLY (since chatStore doesn't export them)
// ============================================

interface Message {
  id: string
  role?: 'user' | 'assistant'
  type?: 'user' | 'ai'
  content: string
  tools?: string[]
  timestamp: Date | string
  sessionId?: string
  isStreaming?: boolean
  error?: boolean
  agent?: AgentTag
  provider?: string
}

type AgentTag = 'research' | 'rag' | 'code' | 'browser' | 'memory' | 'planner' | 'critic'

// ============================================
// AGENT LABELS
// ============================================

const AGENT_LABELS: Record<AgentTag, { label: string; color: string }> = {
  research: { label: 'Research',  color: '#3b82f6' },
  rag:      { label: 'RAG',       color: '#8b5cf6' },
  code:     { label: 'Code',      color: '#10b981' },
  browser:  { label: 'Browser',   color: '#f59e0b' },
  memory:   { label: 'Memory',    color: '#ec4899' },
  planner:  { label: 'Planner',   color: '#6366f1' },
  critic:   { label: 'Critic',    color: '#ef4444' },
};

// ============================================
// COPY BUTTON
// ============================================

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button
      onClick={copy}
      className="p-1.5 rounded-lg transition-all hover:scale-110 active:scale-95"
      style={{
        background: 'rgba(255,255,255,0.08)',
        color: copied ? '#10b981' : 'rgba(255,255,255,0.5)',
      }}
      title="Copy code"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}

// ============================================
// CODE BLOCK
// ============================================

interface CodeBlockProps {
  language: string;
  code: string;
  darkMode: boolean;
}

function CodeBlock({ language, code, darkMode }: CodeBlockProps) {
  return (
    <div
      className="rounded-xl overflow-hidden my-2 border"
      style={{ borderColor: 'var(--border)' }}
    >
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ background: darkMode ? '#1a1a2e' : '#f0f0f8' }}
      >
        <span
          className="text-xs font-medium"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-3)' }}
        >
          {language || 'code'}
        </span>
        <CopyButton text={code} />
      </div>
      <SyntaxHighlighter
        style={darkMode ? oneDark : oneLight}
        language={language || 'text'}
        PreTag="div"
        customStyle={{
          margin: 0,
          borderRadius: 0,
          fontSize: '0.82rem',
          background: darkMode ? '#0f0f1a' : '#f8f8fc',
          padding: '1rem 1.25rem',
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

// ============================================
// MESSAGE BUBBLE
// ============================================

interface Props {
  message: Message;
}

const MessageBubble = memo(function MessageBubble({ message }: Props) {
  // Get theme from store (if available)
  let isDark = true;
  try {
    const theme = useChatStore((s) => (s as any).theme);
    isDark = theme === 'dark';
  } catch {
    // If theme doesn't exist, default to dark
    isDark = true;
  }
  
  const isUser = message.role === 'user' || message.type === 'user';
  const agentInfo = message.agent ? AGENT_LABELS[message.agent] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`flex gap-3 px-2 py-1 group ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 mt-0.5">
        <div
          className="w-7 h-7 rounded-xl flex items-center justify-center"
          style={{
            background: isUser
              ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
              : isDark ? '#1c1c22' : '#f0f0f8',
            border: isUser ? 'none' : '1px solid var(--border)',
          }}
        >
          {isUser
            ? <User size={13} color="#fff" />
            : message.error
              ? <AlertCircle size={13} color="#ef4444" />
              : <Bot size={13} style={{ color: 'var(--accent)' }} />
          }
        </div>
      </div>

      <div className={`flex flex-col gap-1 max-w-[82%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Agent badge */}
        {!isUser && agentInfo && (
          <div
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
            style={{
              background: `${agentInfo.color}15`,
              color: agentInfo.color,
              border: `1px solid ${agentInfo.color}30`,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: agentInfo.color }}
            />
            {agentInfo.label} Agent
          </div>
        )}

        {/* Message bubble */}
        <div
          className="relative rounded-2xl px-4 py-3"
          style={
            isUser
              ? {
                  background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                  color: '#fff',
                  borderBottomRightRadius: 6,
                  boxShadow: '0 2px 12px rgba(99,102,241,0.25)',
                }
              : {
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  borderBottomLeftRadius: 6,
                }
          }
        >
          {/* Typing indicator */}
          {message.isStreaming && !message.content && (
            <div className="flex gap-1 items-center h-5">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
          )}

          {/* Content */}
          {message.content && (
            isUser ? (
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#fff' }}>
                {message.content}
              </p>
            ) : (
              <div className="prose-nexora text-sm">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    code({ inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || '');
                      const codeStr = String(children).replace(/\n$/, '');
                      if (!inline && match) {
                        return (
                          <CodeBlock
                            language={match[1]}
                            code={codeStr}
                            darkMode={isDark}
                          />
                        );
                      }
                      return (
                        <code
                          className={className}
                          style={{ fontFamily: 'var(--font-mono)' }}
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )
          )}

          {/* Error message */}
          {message.error && (
            <p className="text-sm" style={{ color: '#ef4444' }}>
              Something went wrong. Please try again.
            </p>
          )}
        </div>

        {/* Timestamp + copy */}
        <div
          className="flex items-center gap-2 px-1 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: 'var(--text-3)' }}
        >
          <span className="text-[10px]">
            {message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }) : ''}
          </span>
          {message.provider && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full"
              style={{ background: 'var(--elevated)', color: 'var(--text-3)' }}
            >
              {message.provider}
            </span>
          )}
          {!isUser && message.content && (
            <button
              onClick={() => navigator.clipboard.writeText(message.content)}
              className="p-0.5 rounded transition-colors hover:text-[var(--accent)]"
              title="Copy response"
            >
              <Copy size={11} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
});

export default MessageBubble;
