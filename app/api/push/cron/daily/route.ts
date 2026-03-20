/**
 * Daily Push Reminders Cron Job
 *
 * GET /api/push/cron/daily — Send daily push reminders to all opted-in users
 * Called by Vercel Cron at 9am IST daily.
 * Auth: x-cron-secret header must match CRON_SECRET env var.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendDailyPushReminders } from '@/lib/push-service'

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (request.headers.get('x-cron-secret') !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient()
  const result = await sendDailyPushReminders(supabase)

  return NextResponse.json({
    job: 'daily_push_reminders',
    ...result,
    timestamp: new Date().toISOString(),
  })
}
