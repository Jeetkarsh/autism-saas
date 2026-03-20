'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Subscription } from '@/lib/types/database'
import type { Plan } from '@/lib/types/database'
import { PLAN_LIMITS } from '@/lib/plans'

const PLANS: Array<{
  id: Plan
  name: string
  price: string
  description: string
  features: string[]
  highlighted?: boolean
}> = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    description: 'For families just getting started.',
    features: PLAN_LIMITS.free.features,
  },
  {
    id: 'basic',
    name: 'Basic',
    price: '$19/mo',
    description: 'For families who want structured tracking.',
    features: PLAN_LIMITS.basic.features,
    highlighted: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$49/mo',
    description: 'For families working with therapists.',
    features: PLAN_LIMITS.pro.features,
  },
]

function CheckIcon() {
  return (
    <svg className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function FaqItem({ question, children }: { question: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-sm font-medium text-gray-900">{question}</h4>
      <p className="mt-1 text-sm text-gray-600">{children}</p>
    </div>
  )
}

function PricingContent() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCheckingOut, setIsCheckingOut] = useState<string | null>(null)
  const [isOpeningPortal, setIsOpeningPortal] = useState(false)
  const searchParams = useSearchParams()
  const supabase = createClient()

  const checkoutStatus = searchParams.get('checkout')
  const currentPlan = subscription?.plan as Plan | undefined

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
      if (data.user) {
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', data.user.id)
          .maybeSingle()
        setSubscription(sub)
      }
      setIsLoading(false)
    }
    getUser()
  }, [supabase])

  const handleCheckout = async (priceId: string, planName: 'basic' | 'pro') => {
    if (!priceId) {
      alert('Stripe price ID not configured. Set NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID or NEXT_PUBLIC_STRIPE_PRO_PRICE_ID in your environment.')
      return
    }
    setIsCheckingOut(planName)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, planName }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error ?? 'Failed to start checkout')
      }
    } catch {
      alert('Network error. Please try again.')
    } finally {
      setIsCheckingOut(null)
    }
  }

  const handleManageBilling = async () => {
    setIsOpeningPortal(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error ?? 'Failed to open billing portal')
      }
    } catch {
      alert('Network error. Please try again.')
    } finally {
      setIsOpeningPortal(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Checkout status banners */}
      {checkoutStatus === 'success' && (
        <div className="bg-green-50 border-b border-green-200 px-4 py-3 text-center text-sm text-green-800">
          <span className="font-medium">Upgrade successful!</span> Your plan has been updated.
        </div>
      )}
      {checkoutStatus === 'canceled' && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-center text-sm text-amber-800">
          Checkout was canceled. No charges were made.
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Simple, transparent pricing</h1>
          <p className="mt-2 text-gray-600">
            Start free. Upgrade when you need more.
          </p>
          {!user && (
            <p className="mt-2 text-sm text-blue-600">
              <a href="/login" className="underline hover:no-underline">Sign in</a> to manage your plan
            </p>
          )}
        </div>
      </div>

      {/* Current plan indicator */}
      {user && !isLoading && currentPlan && (
        <div className="bg-indigo-50 border-b border-indigo-200 px-4 py-2 text-center text-sm text-indigo-800">
          Your current plan: <span className="font-medium">{PLANS.find(p => p.id === currentPlan)?.name}</span>
          {' '}({subscription?.status})
          {subscription?.cancel_at_period_end && ' — cancels at period end'}
          {' '}
          <button
            onClick={handleManageBilling}
            disabled={isOpeningPortal}
            className="ml-2 underline hover:no-underline disabled:opacity-50"
          >
            {isOpeningPortal ? 'Opening...' : 'Manage billing'}
          </button>
        </div>
      )}

      {/* Pricing cards */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          {PLANS.map((plan) => {
            const isCurrent = currentPlan === plan.id
            const canUpgrade =
              !isCurrent &&
              plan.id !== 'free' &&
              PLANS.findIndex(p => p.id === currentPlan) < PLANS.findIndex(p => p.id === plan.id)
            const canDowngrade = currentPlan === 'pro' && plan.id === 'basic'
            const needsStripeConfig =
              plan.id !== 'free' &&
              !(
                plan.id === 'basic'
                  ? process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID
                  : process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID
              )

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border p-6 ${
                  plan.highlighted
                    ? 'border-indigo-500 bg-white shadow-lg ring-2 ring-indigo-500'
                    : 'border-gray-200 bg-white'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-indigo-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">{plan.name}</h2>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                    {plan.id !== 'free' && (
                      <span className="text-gray-500 text-sm">/ month</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
                </div>

                <ul className="mb-6 flex-1 space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckIcon />
                      {feature}
                    </li>
                  ))}
                </ul>

                {plan.id === 'free' ? (
                  <div className="mt-auto rounded-lg bg-gray-50 px-4 py-2 text-center text-sm text-gray-600">
                    {user ? 'Your current free plan' : 'Included with your account'}
                  </div>
                ) : user ? (
                  isCurrent ? (
                    <div className="mt-auto rounded-lg bg-indigo-50 px-4 py-2 text-center text-sm font-medium text-indigo-700">
                      Current plan
                    </div>
                  ) : canUpgrade ? (
                    <button
                      onClick={() => {
                        const priceId =
                          plan.id === 'basic'
                            ? process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID ?? ''
                            : process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ?? ''
                        handleCheckout(priceId, plan.id as 'basic' | 'pro')
                      }}
                      disabled={isCheckingOut !== null || !!needsStripeConfig}
                      className="mt-auto w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {needsStripeConfig
                        ? 'Price not configured'
                        : isCheckingOut === plan.id
                        ? 'Redirecting...'
                        : `Upgrade to ${plan.name}`}
                    </button>
                  ) : canDowngrade ? (
                    <button
                      onClick={handleManageBilling}
                      disabled={isOpeningPortal || !subscription?.stripe_customer_id}
                      className="mt-auto w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {isOpeningPortal ? 'Opening...' : 'Manage billing to downgrade'}
                    </button>
                  ) : (
                    <div className="mt-auto rounded-lg bg-gray-100 px-4 py-2 text-center text-sm text-gray-500">
                      {currentPlan === 'free' ? 'Upgrade to unlock' : 'Higher plan active'}
                    </div>
                  )
                ) : (
                  <a
                    href="/login"
                    className="mt-auto block w-full rounded-lg bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-indigo-700"
                  >
                    Get started
                  </a>
                )}
              </div>
            )
          })}
        </div>

        {/* FAQ */}
        <div className="mt-16 grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Frequently Asked Questions</h3>
            <div className="mt-4 space-y-4">
              <FaqItem question="Can I cancel anytime?">
                Yes. Cancel at any time from your billing portal. You&apos;ll keep access until the end of
                your billing period.
              </FaqItem>
              <FaqItem question="What happens to my data if I downgrade?">
                All your data is preserved. Downgrading limits the number of child profiles you can manage,
                but existing data stays intact.
              </FaqItem>
              <FaqItem question="Is there a free trial?">
                The free plan gives you full access to core features. No credit card required to start.
              </FaqItem>
              <FaqItem question="Can I switch plans?">
                Yes. Upgrades take effect immediately. Downgrades take effect at the next billing cycle.
              </FaqItem>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <PricingContent />
    </Suspense>
  )
}
