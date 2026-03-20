/**
 * POST /api/stripe/webhook — Handle Stripe webhook events
 *
 * Verifies the Stripe signature, then processes:
 * - checkout.session.completed  → upsert subscription
 * - customer.subscription.updated → update subscription
 * - customer.subscription.deleted → cancel subscription
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { getStripe, upsertSubscriptionFromWebhook, cancelSubscription } from '@/lib/stripe-server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const stripe = getStripe()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  const body = await request.text()
  const headersList = await headers()
  const sig = headersList.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[stripe-webhook] Signature verification failed:', message)
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 })
  }

  console.log(`[stripe-webhook] Received event: ${event.type}`)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const plan = session.metadata?.plan as 'basic' | 'pro' | undefined

        if (!userId || !plan) {
          console.error('[stripe-webhook] checkout.session.completed missing metadata:', session.id)
          break
        }

        if (!session.subscription || typeof session.subscription !== 'string') {
          console.error('[stripe-webhook] checkout.session.completed missing subscription:', session.id)
          break
        }

        // Stripe v20 returns Response<Subscription> — extract data via bracket notation to avoid TS errors
        const subRaw = (await stripe.subscriptions.retrieve(session.subscription)) as unknown as Record<string, unknown>
        const subId: string = String(subRaw['id'] ?? '')
        const subStatus: string = String(subRaw['status'] ?? '')
        const items = subRaw['items'] as { data: Array<{ price: { id: string | null }; current_period_start?: number; current_period_end?: number }> } | undefined
        const priceId: string | null = items?.data?.[0]?.price?.id ?? null
        const currentPeriodStart: number = items?.data?.[0]?.current_period_start ?? (subRaw['billing_cycle_anchor'] as number | undefined) ?? 0
        const currentPeriodEnd: number = items?.data?.[0]?.current_period_end ?? 0
        const cancelAtPeriodEnd: boolean = (subRaw['cancel_at_period_end'] as boolean | undefined) ?? false

        await upsertSubscriptionFromWebhook(
          session.customer as string,
          subId,
          subStatus,
          plan,
          priceId,
          currentPeriodStart,
          currentPeriodEnd,
          cancelAtPeriodEnd
        )
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const plan = sub.metadata?.plan as 'basic' | 'pro' | undefined
        if (!plan) {
          console.warn('[stripe-webhook] subscription.updated missing plan metadata')
          break
        }

        const subRaw = sub as unknown as Record<string, unknown>
        const items = subRaw['items'] as { data: Array<{ price: { id: string | null }; current_period_start?: number; current_period_end?: number }> } | undefined
        const currentPeriodStart: number = items?.data?.[0]?.current_period_start ?? (subRaw['billing_cycle_anchor'] as number | undefined) ?? 0
        const currentPeriodEnd: number = items?.data?.[0]?.current_period_end ?? 0
        const cancelAtPeriodEnd: boolean = (subRaw['cancel_at_period_end'] as boolean | undefined) ?? false

        await upsertSubscriptionFromWebhook(
          sub.customer as string,
          sub.id,
          sub.status,
          plan,
          items?.data?.[0]?.price?.id ?? null,
          currentPeriodStart,
          currentPeriodEnd,
          cancelAtPeriodEnd
        )
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await cancelSubscription(sub.id)
        break
      }

      default:
        console.log(`[stripe-webhook] Unhandled event type: ${event.type}`)
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[stripe-webhook] Error processing ${event.type}:`, message)
    return NextResponse.json({ error: `Processing error: ${message}` }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
