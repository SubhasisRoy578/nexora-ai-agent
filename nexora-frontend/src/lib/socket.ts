// src/lib/socket.ts

// ✅ Define the AgentEvent type
export interface AgentEvent {
  agent: string
  status: 'running' | 'idle' | 'queued' | 'completed' | 'error'
  pct?: number
  step?: string
  message?: string
  timestamp?: string
}

export function connectAgentSocket(onEvent: (e: AgentEvent) => void) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://nexora-ai-agent.onrender.com';
  const host = apiUrl.replace(/^https?:\/\//, '');
  const protocol = apiUrl.startsWith('https') || window.location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = new WebSocket(`${protocol}://${host}/ws/agent-activity`);
  
  ws.onmessage = (msg) => {
    try {
      const event = JSON.parse(msg.data);  // { agent, status, pct, step }
      onEvent(event);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
  
  ws.onclose = () => {
    console.log('WebSocket disconnected');
  };
  
  return ws;
}
