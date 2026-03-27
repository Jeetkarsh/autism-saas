/**
 * GET /api/stripe/subscription — Get current user's subscription status.
 * Requires authenticated user.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserSubscription, getUserPlan, PLAN_LIMITS } from '@/lib/stripe-server'
import type { Plan } from '@/lib/types/database'

// Force dynamic rendering to avoid prerender errors during build
export const dynamic = 'force-dynamic'

export async function GET(): Promise<NextResponse> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [subscription, plan] = await Promise.all([getUserSubscription(), getUserPlan()])

  return NextResponse.json({
    subscription,
    plan,
    limits: PLAN_LIMITS[plan],
  })
}