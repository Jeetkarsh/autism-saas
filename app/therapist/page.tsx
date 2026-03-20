export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'
import { getUserRole } from '../../lib/supabase/auth'
import TherapistPortalClient from './TherapistPortalClient'

interface ChildSummary {
  child: {
    id: string
    name: string
    age: number | null
    sensitivities: string[]
    triggers: string[]
    strategies: string[]
    what_not_to_do: string[]
    created_at: string
  }
  access: { granted_at: string }
  recent_episodes: Array<{
    id: string
    trigger: string
    behavior: string
    strategies_used: string[]
    strategies_effective: string[]
    outcome_successful: boolean
    duration_minutes: number | null
    created_at: string
    notes: string | null
  }>
  strategies: Array<{
    id: string
    description: string
    category: string
    success_count: number
    failure_count: number
    last_used: string | null
    notes: string | null
  }>
  stats: {
    episodes_last_30d: number
    strategies_count: number
    check_ins_last_7d: number
    avg_strategies_per_episode: number
  }
}

export default async function TherapistPage() {
  const supabase = createClient()

  // Offline / unconfigured mode — show message
  if (!supabase) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', color: 'var(--text-muted)' }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
        <p>Therapist portal requires database connection.</p>
        <p style={{ fontSize: '0.875rem' }}>Connect Supabase to access your assigned families.</p>
      </div>
    )
  }

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/therapist')
  }

  const role = getUserRole(user as any)
  if (role !== 'therapist') {
    redirect('/dashboard')
  }

  // Fetch assignments
  const { data: accessRecords } = await supabase
    .from('child_profile_access')
    .select('child_id, created_at')
    .eq('user_id', user.id)
    .eq('role', 'therapist')

  if (!accessRecords || accessRecords.length === 0) {
    return (
      <TherapistPortalClient
        assignments={[]}
        therapistName={user.user_metadata?.first_name ?? user.email?.split('@')[0] ?? 'Therapist'}
        isEmpty
      />
    )
  }

  const childIds = accessRecords.map((r) => r.child_id)

  const { data: children } = await supabase
    .from('children')
    .select('*')
    .in('id', childIds)

  const assignments: ChildSummary[] = await Promise.all(
    (children ?? []).map(async (child) => {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: episodes } = await supabase
        .from('episodes')
        .select('*')
        .eq('child_id', child.id)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(20)

      const { data: strategies } = await supabase
        .from('strategies')
        .select('*')
        .eq('child_id', child.id)
        .order('last_used', { ascending: false })

      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { count: checkInCount } = await supabase
        .from('check_ins')
        .select('id', { count: 'exact' })
        .eq('child_id', child.id)
        .gte('created_at', sevenDaysAgo.toISOString())

      const episodesArr = episodes ?? []
      const epsWithStratCount = episodesArr.reduce((sum, ep) => sum + (ep.strategies_used?.length ?? 0), 0)

      return {
        child: child as ChildSummary['child'],
        access: {
          granted_at: (accessRecords.find((r) => r.child_id === child.id) as { created_at: string }).created_at,
        },
        recent_episodes: episodesArr,
        strategies: (strategies ?? []).filter(
          (s) => s.category !== 'therapist_note' && s.category !== 'therapist_suggestion'
        ),
        stats: {
          episodes_last_30d: episodesArr.length,
          strategies_count: strategies?.length ?? 0,
          check_ins_last_7d: checkInCount ?? 0,
          avg_strategies_per_episode:
            episodesArr.length > 0 ? parseFloat((epsWithStratCount / episodesArr.length).toFixed(1)) : 0,
        },
      }
    })
  )

  const therapistName = user.user_metadata?.first_name ?? user.email?.split('@')[0] ?? 'Therapist'

  return (
    <TherapistPortalClient assignments={assignments} therapistName={therapistName} isEmpty={false} />
  )
}
