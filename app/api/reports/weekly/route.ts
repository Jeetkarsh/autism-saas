/**
 * Weekly PDF Report API
 *
 * GET /api/reports/weekly
 *   - ?child_id=... (optional: specific child; defaults to first child of user)
 *   - ?week=...     (optional: ISO date; defaults to current week)
 *
 * Returns: application/pdf  — the weekly progress report for IEP meetings.
 * Auth: requires valid Supabase session cookie.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  generateWeeklyReportPDFBuffer,
  getWeekNumber,
  type WeeklyReportData,
} from '@/lib/report-generator'
import type { Episode, Strategy } from '@/lib/types/database'

export const runtime = 'nodejs'

function getWeekBounds(weekNumber: number, year: number) {
  const simple = new Date(year, 0, 1 + (weekNumber - 1) * 7)
  const dow = simple.getDay()
  const weekStart = new Date(simple)
  if (dow <= 4) weekStart.setDate(simple.getDate() - simple.getDay() + 1)
  else weekStart.setDate(simple.getDate() + 8 - simple.getDay())
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)
  return { weekStart, weekEnd }
}

export async function GET(request: NextRequest) {
  const supabase = createClient()

  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = request.nextUrl
  const childIdParam = searchParams.get('child_id')
  const weekParam = searchParams.get('week')

  let targetChildId: string | null = childIdParam

  if (!targetChildId) {
    const { data: firstChild } = await supabase
      .from('children')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    targetChildId = (firstChild as { id: string } | null)?.id ?? null
  }

  if (!targetChildId) {
    return NextResponse.json({ error: 'No child profile found' }, { status: 404 })
  }

  const { data: child } = await supabase
    .from('children')
    .select('name')
    .eq('id', targetChildId)
    .single()

  const childName = (child as { name: string } | null)?.name ?? 'Child'

  // Determine week
  let weekDate = new Date()
  if (weekParam) {
    const parsed = new Date(weekParam)
    if (!isNaN(parsed.getTime())) weekDate = parsed
  }

  const year = weekDate.getFullYear()
  const weekNumber = getWeekNumber(weekDate)
  const { weekStart, weekEnd } = getWeekBounds(weekNumber, year)

  // Fetch episodes for this child in the week window
  const { data: episodes } = await supabase
    .from('episodes')
    .select('*')
    .eq('child_id', targetChildId)
    .gte('created_at', weekStart.toISOString())
    .lte('created_at', weekEnd.toISOString())
    .order('created_at', { ascending: false })

  const episodeData = (episodes ?? []) as Episode[]

  // Fetch strategies for this child
  const { data: strategies } = await supabase
    .from('strategies')
    .select('*')
    .eq('child_id', targetChildId)

  const strategyData: Strategy[] = (strategies ?? []) as Strategy[]

  // Fetch check-ins for the week
  const { data: checkIns } = await supabase
    .from('check_ins')
    .select('id')
    .eq('child_id', targetChildId)
    .gte('created_at', weekStart.toISOString())
    .lte('created_at', weekEnd.toISOString())

  const checkInCount = checkIns?.length ?? 0

  // Fetch milestones from user_stats
  const { data: stats } = await supabase
    .from('user_stats')
    .select('milestones')
    .eq('user_id', user.id)
    .single()

  const completedMilestones: string[] = []
  if (stats) {
    const typedStats = stats as { milestones?: Array<{ id: number; title: string; completed: boolean }> }
    if (Array.isArray(typedStats.milestones)) {
      completedMilestones.push(
        ...typedStats.milestones.filter((m) => m.completed).map((m) => m.title)
      )
    }
  }

  const reportData: WeeklyReportData = {
    childName,
    weekNumber,
    weekStart,
    weekEnd,
    episodes: episodeData,
    strategies: strategyData,
    checkInCount,
    completedMilestones,
  }

  const pdfBuffer = generateWeeklyReportPDFBuffer(reportData)

  const filename = `NeuroBridge_Week${weekNumber}_${childName.replace(/\s+/g, '_')}.pdf`

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
