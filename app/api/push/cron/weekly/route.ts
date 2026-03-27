/**
 * Weekly Push Report Notifications Cron Job
 *
 * GET /api/push/cron/weekly — Send weekly report ready notifications to all opted-in users
 * Called by Vercel Cron on Saturdays at 10am IST.
 * Auth: x-cron-secret header must match CRON_SECRET env var.
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  buildWeeklyReportPush,
  sendPushToMultiple,
  pruneExpiredSubscriptions,
  type PushSubscription,
} from '@/lib/push-service'

interface WeeklyResult {
  sent: number
  skipped: number
  errors: number
  expiredCount: number
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (request.headers.get('x-cron-secret') !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient()
  const result: WeeklyResult = { sent: 0, skipped: 0, errors: 0, expiredCount: 0 }

  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, push_subscriptions')
    .not('push_subscriptions', 'is', null)

  if (error || !users) {
    console.error('[Push Cron] Failed to fetch users:', error)
    return NextResponse.json({ job: 'weekly_report_push', ...result, error: error?.message })
  }

  for (const user of users) {
    const subs: PushSubscription[] =
      (user.push_subscriptions as PushSubscription[] | null) ?? []

    if (subs.length === 0) {
      result.skipped++
      continue
    }

    const { data: children, error: childError } = await supabase
      .from('children')
      .select('id, name')
      .eq('user_id', user.id)
      .limit(1)

    if (childError || !children || children.length === 0) {
      result.skipped++
      continue
    }

    const childName = children[0].name
    const payload = buildWeeklyReportPush(childName)

    const { sent, failed, expired } = await sendPushToMultiple(subs, payload)
    result.sent += sent
    result.errors += failed
    result.expiredCount += expired.length

    if (expired.length > 0) {
      await pruneExpiredSubscriptions(supabase, user.id, expired)
    }
  }

  return NextResponse.json({
    job: 'weekly_report_push',
    ...result,
    timestamp: new Date().toISOString(),
  })
}