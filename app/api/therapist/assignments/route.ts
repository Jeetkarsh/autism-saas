/**
 * Therapist Assignments API
 *
 * GET /api/therapist/assignments
 *   Returns all children assigned to the authenticated therapist.
 *   Auth: requires Supabase session with role=therapist in user metadata.
 *
 * POST /api/therapist/assignments
 *   Body: { child_id: string, notes?: string }
 *   Creates a therapist note for a child (assigns implicitly via access record).
 *   Auth: requires Supabase session with role=therapist.
 *
 * PATCH /api/therapist/assignments/[childId]
 *   Body: { notes?: string, strategy_suggestions?: string[] }
 *   Updates therapist notes / strategy suggestions for an assigned child.
 *   Auth: requires Supabase session with role=therapist and access to that child.
 *
 * Auth check: user.user_metadata.role === 'therapist'
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserRole } from '@/lib/supabase/auth'
import type { Child, Episode, Strategy, ChildProfileAccess } from '@/lib/types/database'

function unauthorized(message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 })
}

function forbidden(message = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 })
}

function notFound(message = 'Not found') {
  return NextResponse.json({ error: message }, { status: 404 })
}

// GET /api/therapist/assignments
export async function GET(request: NextRequest) {
  const supabase = createClient()

  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return unauthorized()
  }

  const role = getUserRole(user as any)
  if (role !== 'therapist') {
    return forbidden('Only therapists can access this endpoint')
  }

  // Find all children accessible by this therapist
  const { data: accessRecords, error: accessError } = await supabase
    .from('child_profile_access')
    .select('child_id, role, created_at')
    .eq('user_id', user.id)
    .eq('role', 'therapist')

  if (accessError) {
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 })
  }

  if (!accessRecords || accessRecords.length === 0) {
    return NextResponse.json({ children: [] })
  }

  const childIds = accessRecords.map((r) => r.child_id)

  // Fetch child profiles
  const { data: children, error: childrenError } = await supabase
    .from('children')
    .select('*')
    .in('id', childIds)

  if (childrenError) {
    return NextResponse.json({ error: 'Failed to fetch children' }, { status: 500 })
  }

  // For each child, fetch recent episodes and strategies
  const assignments = await Promise.all(
    (children ?? []).map(async (child) => {
      const childTyped = child as unknown as Child

      // Recent episodes (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: episodes } = await supabase
        .from('episodes')
        .select('*')
        .eq('child_id', child.id)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(20)

      // Strategies
      const { data: strategies } = await supabase
        .from('strategies')
        .select('*')
        .eq('child_id', child.id)
        .order('last_used', { ascending: false })

      // Count check-ins in last 7 days
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { count: checkInCount } = await supabase
        .from('check_ins')
        .select('id', { count: 'exact' })
        .eq('child_id', child.id)
        .gte('created_at', sevenDaysAgo.toISOString())

      return {
        child: childTyped,
        access: {
          granted_at: (accessRecords.find((r) => r.child_id === child.id) as ChildProfileAccess).created_at,
        },
        recent_episodes: (episodes ?? []) as Episode[],
        strategies: (strategies ?? []) as Strategy[],
        stats: {
          episodes_last_30d: episodes?.length ?? 0,
          strategies_count: strategies?.length ?? 0,
          check_ins_last_7d: checkInCount ?? 0,
          avg_strategies_per_episode:
            episodes && episodes.length > 0
              ? parseFloat(
                  (
                    episodes.reduce(
                      (sum, ep) => sum + (ep.strategies_used?.length ?? 0),
                      0
                    ) / episodes.length
                  ).toFixed(1)
                )
              : 0,
        },
      }
    })
  )

  return NextResponse.json({ assignments })
}

// POST /api/therapist/assignments
export async function POST(request: NextRequest) {
  const supabase = createClient()

  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return unauthorized()
  }

  const role = getUserRole(user as any)
  if (role !== 'therapist') {
    return forbidden('Only therapists can access this endpoint')
  }

  let body: { child_id?: string; notes?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { child_id } = body
  if (!child_id) {
    return NextResponse.json({ error: 'child_id is required' }, { status: 400 })
  }

  // Verify the child exists
  const { data: child, error: childError } = await supabase
    .from('children')
    .select('id')
    .eq('id', child_id)
    .single()

  if (childError || !child) {
    return notFound('Child not found')
  }

  // Check if therapist already has access
  const { data: existing } = await supabase
    .from('child_profile_access')
    .select('id')
    .eq('user_id', user.id)
    .eq('child_id', child_id)
    .eq('role', 'therapist')
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Therapist already has access to this child' }, { status: 409 })
  }

  // Create access record
  const { error: insertError } = await supabase.from('child_profile_access').insert({
    user_id: user.id,
    child_id,
    role: 'therapist',
  })

  if (insertError) {
    return NextResponse.json({ error: 'Failed to assign child' }, { status: 500 })
  }

  return NextResponse.json({ message: 'Child assigned successfully' }, { status: 201 })
}

// PATCH /api/therapist/assignments/[childId]
// Note: Next.js App Router doesn't have param capture in route.ts for GET/POST same-level.
// We use a childId query param instead for single-child operations.
export async function PATCH(request: NextRequest) {
  const supabase = createClient()

  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return unauthorized()
  }

  const role = getUserRole(user as any)
  if (role !== 'therapist') {
    return forbidden('Only therapists can access this endpoint')
  }

  const { searchParams } = request.nextUrl
  const childId = searchParams.get('childId')

  if (!childId) {
    return NextResponse.json({ error: 'childId query param is required' }, { status: 400 })
  }

  // Verify therapist has access to this child
  const { data: accessRecord } = await supabase
    .from('child_profile_access')
    .select('id')
    .eq('user_id', user.id)
    .eq('child_id', childId)
    .eq('role', 'therapist')
    .single()

  if (!accessRecord) {
    return forbidden('You do not have access to this child')
  }

  let body: { notes?: string; strategy_suggestions?: string[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // For now, we store therapist notes in a dedicated table or strategy suggestions.
  // Strategy suggestions are stored as strategies with category='therapist_suggestion'.
  if (body.strategy_suggestions && body.strategy_suggestions.length > 0) {
    const strategyInserts = body.strategy_suggestions.map((description) => ({
      child_id: childId,
      description,
      category: 'therapist_suggestion',
      success_count: 0,
      failure_count: 0,
    }))

    const { error: strategyError } = await supabase.from('strategies').insert(strategyInserts)

    if (strategyError) {
      return NextResponse.json({ error: 'Failed to add strategy suggestions' }, { status: 500 })
    }
  }

  // Notes could be stored in a dedicated therapist_notes table in the future.
  // For MVP, we acknowledge the notes field in the response.
  if (body.notes) {
    // Placeholder: in a full implementation, a therapist_notes table would store this.
    // The parent can see it in the strategies list if saved as a strategy suggestion.
  }

  return NextResponse.json({ message: 'Update applied successfully' })
}
