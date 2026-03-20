/**
 * Stripe server-side utilities.
 * Used by API routes only — never import from client components.
 */

import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import type { SupabaseClientType } from '@/lib/supabase/types'
import type { Subscription, Plan } from '@/lib/types/database'
import { PLAN_LIMITS, PRICE_IDS } from '@/lib/plans'
export { PLAN_LIMITS, PRICE_IDS }

// ── Stripe client ────────────────────────────────────────────────────────────

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not set')
  }
  return new Stripe(key, {
    apiVersion: '2026-02-25.clover',
    typescript: true,
  })
}

// ── Supabase helpers ─────────────────────────────────────────────────────────

async function getSupabase(): Promise<SupabaseClientType> {
  return createClient() as SupabaseClientType
}

export async function getUserSubscription(): Promise<Subscription | null> {
  const supabase = await getSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('[stripe-server] getUserSubscription error:', error)
    return null
  }

  return data as Subscription
}

export async function getUserPlan(): Promise<Plan> {
  const sub = await getUserSubscription()
  if (!sub) return 'free'
  return sub.plan as Plan
}

export async function canAddChild(userId: string): Promise<{ allowed: boolean; plan: Plan; limit: number }> {
  const supabase = await getSupabase()

  const { data, error } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !data) {
    return { allowed: true, plan: 'free', limit: PLAN_LIMITS.free.children }
  }

  const rawPlan = (data as unknown as { plan: unknown }).plan
  const plan: Plan = (typeof rawPlan === 'string' && ['free', 'basic', 'pro'].includes(rawPlan))
    ? rawPlan as Plan
    : 'free'
  const limit = PLAN_LIMITS[plan].children

  const { count } = await supabase
    .from('children')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  const allowed = (count ?? 0) < limit
  return { allowed, plan, limit }
}

// ── Checkout session ─────────────────────────────────────────────────────────

export interface CreateCheckoutParams {
  priceId: string
  successUrl: string
  cancelUrl: string
  userId: string
  email: string
  planName: 'basic' | 'pro'
}

export async function createCheckoutSession({
  priceId,
  successUrl,
  cancelUrl,
  userId,
  email,
  planName,
}: CreateCheckoutParams): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe()

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: email,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
      plan: planName,
    },
    subscription_data: {
      metadata: {
        userId,
        plan: planName,
      },
    },
  })

  return session
}

// ── Customer portal session ──────────────────────────────────────────────────

export async function createPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  const stripe = getStripe()
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
}

// ── Webhook helpers ──────────────────────────────────────────────────────────

export async function upsertSubscriptionFromWebhook(
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  status: string,
  plan: 'basic' | 'pro',
  priceId: string,
  currentPeriodStart: number,
  currentPeriodEnd: number,
  cancelAtPeriodEnd: boolean
): Promise<void> {
  const supabase = await getSupabase()

  const { data, error: fetchError } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', stripeCustomerId)
    .maybeSingle()

  if (fetchError) {
    console.error('[stripe-webhook] error fetching subscription:', fetchError)
    return
  }

  if (!data) {
    console.warn('[stripe-webhook] no user found for customer:', stripeCustomerId)
    return
  }

  const userId = (data as unknown as { user_id: string }).user_id

  const upsertData = {
    user_id: userId,
    stripe_customer_id: stripeCustomerId,
    stripe_subscription_id: stripeSubscriptionId,
    stripe_price_id: priceId,
    status,
    plan,
    current_period_start: new Date(currentPeriodStart * 1000).toISOString(),
    current_period_end: new Date(currentPeriodEnd * 1000).toISOString(),
    cancel_at_period_end: cancelAtPeriodEnd,
  }

  const { error: upsertError } = await (supabase.from('subscriptions') as ReturnType<typeof supabase.from>)
    .upsert(upsertData as Parameters<ReturnType<typeof supabase.from>['upsert']>[0], { onConflict: 'stripe_customer_id' })
}

export async function cancelSubscription(stripeSubscriptionId: string): Promise<void> {
  const supabase = await getSupabase()
  // Cast supabase to bypass strict Supabase type narrowing on this table
  const subTable = supabase.from('subscriptions') as ReturnType<SupabaseClientType['from']>
  const { error } = await subTable
    .update({ status: 'canceled', plan: 'free' } as Parameters<typeof subTable.update>[0])
    .eq('stripe_subscription_id', stripeSubscriptionId)

  if (error) {
    console.error('[stripe-server] cancelSubscription error:', error)
  }
}
