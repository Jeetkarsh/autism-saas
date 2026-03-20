/**
 * POST /api/stripe/portal — Create a Stripe Billing Portal session
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPortalSession } from '@/lib/stripe-server'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const origin = request.headers.get('origin') ?? 'http://localhost:3000'

  // Get the user's stripe customer id from subscriptions table
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!sub?.stripe_customer_id) {
    return NextResponse.json(
      { error: 'No active paid subscription found. Subscribe to a plan first.' },
      { status: 400 }
    )
  }

  const session = await createPortalSession(sub.stripe_customer_id, `${origin}/pricing`)

  if (!session.url) {
    return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 })
  }

  return NextResponse.json({ url: session.url })
}
