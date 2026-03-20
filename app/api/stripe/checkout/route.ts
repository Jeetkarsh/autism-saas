/**
 * POST /api/stripe/checkout — Create a Stripe Checkout session
 * Body: { priceId: string; planName: 'basic' | 'pro' }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCheckoutSession, PRICE_IDS } from '@/lib/stripe-server'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { priceId?: string; planName?: 'basic' | 'pro' }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { priceId, planName } = body

  // Resolve price ID if not provided
  const resolvedPriceId =
    priceId ??
    (planName === 'basic' ? PRICE_IDS.basic : planName === 'pro' ? PRICE_IDS.pro : null)

  if (!resolvedPriceId) {
    return NextResponse.json(
      { error: 'priceId or planName (basic|pro) is required' },
      { status: 400 }
    )
  }

  if (!planName || !['basic', 'pro'].includes(planName)) {
    return NextResponse.json(
      { error: 'planName must be "basic" or "pro"' },
      { status: 400 }
    )
  }

  const origin = request.headers.get('origin') ?? 'http://localhost:3000'
  const baseUrl = `${origin}/api/stripe`

  const session = await createCheckoutSession({
    priceId: resolvedPriceId,
    successUrl: `${origin}/dashboard?checkout=success&plan=${planName}`,
    cancelUrl: `${origin}/pricing?checkout=canceled`,
    userId: user.id,
    email: user.email ?? '',
    planName,
  })

  if (!session.url) {
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }

  return NextResponse.json({ url: session.url })
}
