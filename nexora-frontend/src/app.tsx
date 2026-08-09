import { useState } from 'react'
import Sidebar from './components/Sidebar'
import ChatView from './components/ChatView'
import DashboardView from './components/DashboardView'
import KnowledgeView from './components/KnowledgeView'
import SettingsView from './components/SettingsView'
import AnalyticsView from './components/AnalyticsView'
import AgentsView from './components/AgentsView'
import CommandPalette from './components/CommandPalette'
import RightPanel from './components/RightPanel'
import LoginView from './components/LoginView'
import TopBar from './components/Topbar'
import './nexora.css'

export type View = 'chat' | 'dashboard' | 'knowledge' | 'settings' | 'analytics' | 'agents' | 'code'

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [activeView, setActiveView] = useState<View>('dashboard')
  const [commandOpen, setCommandOpen] = useState(false)
  const [rightPanelOpen, setRightPanelOpen] = useState(true)
  const [activeChat, setActiveChat] = useState('AI competitor analysis')

  if (!isLoggedIn) {
    return <LoginView onLogin={() => setIsLoggedIn(true)} />
  }

  return (
    <div className="nexora-root" onKeyDown={(e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandOpen(true)
      }
    }} tabIndex={0}>
      {commandOpen && <CommandPalette onClose={() => setCommandOpen(false)} onNavigate={(v) => { setActiveView(v); setCommandOpen(false) }} />}
      <Sidebar activeView={activeView} setActiveView={setActiveView} activeChat={activeChat} setActiveChat={setActiveChat} onCommandOpen={() => setCommandOpen(true)} />
      <div className="nexora-main">
        <TopBar activeView={activeView} rightPanelOpen={rightPanelOpen} setRightPanelOpen={setRightPanelOpen} onCommandOpen={() => setCommandOpen(true)} />
        <div className="nexora-content">
          {activeView === 'dashboard' && <DashboardView setActiveView={setActiveView} />}
          {activeView === 'chat' && <ChatView />}
          {activeView === 'knowledge' && <KnowledgeView />}
          {activeView === 'settings' && <SettingsView />}
          {activeView === 'analytics' && <AnalyticsView />}
          {activeView === 'agents' && <AgentsView />}
        </div>
      </div>
      {rightPanelOpen && (activeView === 'chat' || activeView === 'dashboard') && <RightPanel />}
    </div>
  )
}

