export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'
import DashboardClient from './DashboardClient'

const MOCK_USER = {
  id: 'test-user-123',
  email: 'test@example.com',
  user_metadata: { first_name: 'Test Parent', role: 'parent' },
}

const MOCK_CHILD = {
  id: 'child-123',
  name: 'Alex',
  age: 6,
  diagnosis_date: '2023-01-15',
  communication_level: 'verbal',
  sensitivities: ['Loud noises', 'Bright lights'],
  triggers: ['Changes in routine'],
  interests: ['Trains', 'Dinosaurs'],
}

const MOCK_STATS = {
  streak: 5,
  last_visit_date: new Date().toISOString().split('T')[0],
}

const MOCK_LOGS = [
  {
    id: 'log-1',
    user_id: 'test-user-123',
    child_id: 'child-123',
    type: 'check_in',
    value: 'mood_good',
    timestamp: new Date().toISOString(),
    notes: 'Had a good morning routine.',
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
    duration: 15,
  },
]

export default async function DashboardPage() {
  const supabase = createClient()

  // Offline / unconfigured mode — use mock data
  if (!supabase) {
    return (
      <DashboardClient
        initialUser={MOCK_USER as any}
        initialChildData={MOCK_CHILD}
        initialStatsData={MOCK_STATS as any}
        initialLogsData={MOCK_LOGS}
        initialCheckedInToday={true}
      />
    )
  }

  // Supabase configured — get real authenticated user
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login?next=/dashboard')
  }

  // Real user found — use real user data, mock child/stats until Task 2 (DB schema)
  const realUser = {
    id: user.id,
    email: user.email ?? '',
    user_metadata: user.user_metadata ?? {},
  }

  return (
    <DashboardClient
      initialUser={realUser as any}
      initialChildData={MOCK_CHILD}
      initialStatsData={MOCK_STATS as any}
      initialLogsData={MOCK_LOGS}
      initialCheckedInToday={false}
    />
  )
}
