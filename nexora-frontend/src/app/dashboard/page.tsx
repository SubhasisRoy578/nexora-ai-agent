import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import WorkspaceLayout from '@/components/layout/WorkspaceLayout'
import LeftPanel from '@/components/layout/LeftPanel'
import AgentDashboard from '@/features/dashboard/components/AgentDashboard'

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/')

  return (
    <WorkspaceLayout
      title="Agent Dashboard"
      tag="LIVE"
      leftPanel={<LeftPanel />}
    >
      <AgentDashboard />
    </WorkspaceLayout>
  )
}