/**
 * Therapist Notes API
 *
 * GET /api/therapist/notes?child_id=...
 *   Returns therapist notes for a specific child.
 *
 * POST /api/therapist/notes
 *   Body: { child_id: string, content: string }
 *   Creates a therapist note for a child.
 *
 * Uses the strategies table with category='therapist_note' as storage.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserRole } from '@/lib/supabase/auth'

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

function forbidden() {
  return NextResponse.json({ error: 'Forbidden: therapist access required' }, { status: 403 })
}

export async function GET(request: NextRequest) {
  const supabase = createClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const role = getUserRole(user as any)
  if (role !== 'therapist') return forbidden()

  const childId = request.nextUrl.searchParams.get('child_id')
  if (!childId) {
    return NextResponse.json({ error: 'child_id query param required' }, { status: 400 })
  }

  // Verify therapist has access
  const { data: access } = await supabase
    .from('child_profile_access')
    .select('id')
    .eq('user_id', user.id)
    .eq('child_id', childId)
    .eq('role', 'therapist')
    .single()

  if (!access) return forbidden()

  const { data: notes, error } = await supabase
    .from('strategies')
    .select('*')
    .eq('child_id', childId)
    .eq('category', 'therapist_note')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
  }

  return NextResponse.json({ notes: notes ?? [] })
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const role = getUserRole(user as any)
  if (role !== 'therapist') return forbidden()

  let body: { child_id?: string; content?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { child_id, content } = body
  if (!child_id || !content) {
    return NextResponse.json({ error: 'child_id and content are required' }, { status: 400 })
  }

  // Verify therapist has access
  const { data: access } = await supabase
    .from('child_profile_access')
    .select('id')
    .eq('user_id', user.id)
    .eq('child_id', child_id)
    .eq('role', 'therapist')
    .single()

  if (!access) return forbidden()

  const { error } = await supabase.from('strategies').insert({
    child_id,
    description: content,
    category: 'therapist_note',
    success_count: 0,
    failure_count: 0,
  })

  if (error) {
    return NextResponse.json({ error: 'Failed to save note' }, { status: 500 })
  }

  return NextResponse.json({ message: 'Note saved' }, { status: 201 })
}
