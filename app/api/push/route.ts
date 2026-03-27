/**
 * Push Notifications API — Send endpoint
 *
 * POST /api/push — Send a push notification to the authenticated user
 *     Body: { type: 'milestone' | 'daily_reminder' | 'weekly_report' | 'episode_alert', data: {...} }
 *
 * Also used internally by cron jobs (authenticated via CRON_SECRET).
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  sendPushNotification,
  buildMilestonePush,
  buildDailyReminderPush,
  buildWeeklyReportPush,
  buildEpisodeAlertPush,
  getPushSubscriptions,
  pruneExpiredSubscriptions,
  type NotificationType,
} from '@/lib/push-service'

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Cron job authentication via secret
  const isCron = request.headers.get('x-cron-secret') === process.env.CRON_SECRET

  if (!isCron) {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  let body: { type: NotificationType; childName?: string; milestoneTitle?: string; trigger?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { type, childName, milestoneTitle, trigger } = body

  if (!type) {
    return NextResponse.json({ error: 'Missing required field: type' }, { status: 400 })
  }

  const validTypes: NotificationType[] = ['milestone', 'daily_reminder', 'weekly_report', 'episode_alert']
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: `Invalid type. Must be one of: ${validTypes.join(', ')}` }, { status: 400 })
  }

  let payload
  switch (type) {
    case 'milestone':
      payload = buildMilestonePush(childName ?? 'Your child', milestoneTitle ?? 'a new milestone')
      break
    case 'daily_reminder':
      payload = buildDailyReminderPush(childName ?? 'your child')
      break
    case 'weekly_report':
      payload = buildWeeklyReportPush(childName ?? 'your child')
      break
    case 'episode_alert':
      payload = buildEpisodeAlertPush(childName ?? 'your child', trigger ?? 'unknown')
      break
  }

  if (isCron) {
    // Cron jobs need to fan out to all opted-in users — handled by separate cron route
    return NextResponse.json({ error: 'Use /api/push/cron for bulk sends' }, { status: 400 })
  }

  // Authenticated user push
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const subscriptions = await getPushSubscriptions(supabase, user.id)

  if (subscriptions.length === 0) {
    return NextResponse.json({ success: false, error: 'No push subscriptions found' }, { status: 404 })
  }

  let sent = 0
  let failed = 0
  const expiredEndpoints: string[] = []

  for (const sub of subscriptions) {
    const result = await sendPushNotification(sub, payload)
    if (result.success) {
      sent++
    } else if (result.statusCode === 410) {
      expiredEndpoints.push(sub.endpoint)
      failed++
    } else {
      failed++
    }
  }

  if (expiredEndpoints.length > 0) {
    await pruneExpiredSubscriptions(supabase, user.id, expiredEndpoints)
  }

  return NextResponse.json({ sent, failed, expired: expiredEndpoints.length })
}