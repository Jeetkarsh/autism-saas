'use client'

export const dynamic = 'force-dynamic';



import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  // MOCK USER DATA FOR LOCAL VISUAL TESTING
  // Supabase is offline/unconfigured, so we pass hardcoded test data to render the UI
  
  const mockUser = {
    id: 'test-user-123',
    email: 'test@example.com',
    user_metadata: {
      first_name: 'Test Parent',
      role: 'parent'
    }
  }

  const mockChildData = {
    id: 'child-123',
    name: 'Alex',
    age: 6,
    diagnosis_date: '2023-01-15',
    communication_level: 'verbal',
    sensitivities: ['Loud noises', 'Bright lights'],
    triggers: ['Changes in routine'],
    interests: ['Trains', 'Dinosaurs']
  }

  const mockStatsData = {
    streak: 5,
    last_visit_date: new Date().toISOString().split('T')[0]
  }

  const mockLogsData = [
    {
      id: 'log-1',
      user_id: 'test-user-123',
      child_id: 'child-123',
      type: 'check_in',
      value: 'mood_good',
      timestamp: new Date().toISOString(),
      notes: 'Had a good morning routine.'
    },
    {
      id: 'log-2',
      user_id: 'test-user-123',
      child_id: 'child-123',
      type: 'episode',
      value: 'meltdown',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      severity: 'medium',
      trigger: 'Loud noise',
      duration: 15
    }
  ]

  return (
    <DashboardClient 
      initialUser={mockUser as any}
      initialChildData={mockChildData}
      initialStatsData={mockStatsData as any}
      initialLogsData={mockLogsData}
      initialCheckedInToday={true}
    />
  )
}
