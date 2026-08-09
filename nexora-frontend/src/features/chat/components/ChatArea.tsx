import ChatMessage from "./ChatMessage";

// Define Message interface locally to ensure id property exists
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  tools?: string[];
  sessionId?: string;
  model?: string;
  sources?: string[];
}

interface ChatAreaProps {
  messages: Message[];
  isLoading?: boolean;
  typingIndicator?: boolean;
}

export default function ChatArea({ messages, isLoading = false, typingIndicator = false }: ChatAreaProps) {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 text-white">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Empty State */}
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="text-5xl mb-4">💬</div>
            <h3 className="text-lg font-medium mb-2">Welcome to Nexora AI</h3>
            <p className="text-sm text-gray-400">Start a conversation by typing a message below</p>
            <div className="mt-6 flex gap-2">
              <span className="text-xs px-2 py-1 bg-gray-800 rounded">✨ Ask anything</span>
              <span className="text-xs px-2 py-1 bg-gray-800 rounded">📄 Upload documents</span>
              <span className="text-xs px-2 py-1 bg-gray-800 rounded">🤖 Use agents</span>
            </div>
          </div>
        )}

        {/* Message List */}
        {messages.map((message, index) => (
          <ChatMessage
            key={message.id || `msg-${index}`}
            message={message}
          />
        ))}

        {/* Typing Indicator */}
        {typingIndicator && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 flex items-center justify-center text-xs font-bold">
              N
            </div>
            <div className="bg-gray-800/50 rounded-lg px-4 py-3 border border-gray-700">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && !typingIndicator && (
          <div className="flex justify-center py-4">
            <div className="text-sm text-gray-400">Processing...</div>
          </div>
        )}
      </div>
    </div>
  );
}
