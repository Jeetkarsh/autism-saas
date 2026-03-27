/**
 * Push Subscription Management API
 *
 * POST   /api/push/subscription  — Subscribe: save push subscription for the authenticated user
 * DELETE /api/push/subscription — Unsubscribe: remove a push subscription by endpoint
 * GET    /api/push/subscription  — Get subscribed status for the authenticated user
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'

import {
  savePushSubscription,
  removePushSubscription,
  getPushSubscriptions,
  getVapidPublicKey,
  type PushSubscription,
} from '@/lib/push-service'

// ── POST: Subscribe ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let subscription: PushSubscription
  try {
    subscription = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    return NextResponse.json(
      { error: 'Missing required subscription fields (endpoint, keys.p256dh, keys.auth)' },
      { status: 400 }
    )
  }

  const result = await savePushSubscription(supabase, user.id, subscription)

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({ success: true }, { status: 200 })
}

// ── DELETE: Unsubscribe ──────────────────────────────────────────────────────

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let endpoint: string
  try {
    const body = await request.json()
    endpoint = body.endpoint
  } catch {
    // Also accept endpoint as a query param
    endpoint = request.nextUrl.searchParams.get('endpoint') ?? ''
  }

  if (!endpoint) {
    return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 })
  }

  const result = await removePushSubscription(supabase, user.id, endpoint)

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({ success: true }, { status: 200 })
}

// ── GET: Get subscription status + VAPID public key ─────────────────────────

export async function GET(): Promise<NextResponse> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let publicKey: string
  try {
    publicKey = getVapidPublicKey()
  } catch {
    return NextResponse.json({ error: 'Push notifications not configured' }, { status: 503 })
  }

  const subscriptions = await getPushSubscriptions(supabase, user.id)

  return NextResponse.json({
    publicKey,
    subscribed: subscriptions.length > 0,
    subscriptionCount: subscriptions.length,
  })
}
