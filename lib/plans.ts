/**
 * Plan definitions shared between client and server.
 * This file must NOT import any server-only modules (e.g., @supabase/ssr, next/headers).
 */

import type { Plan } from '@/lib/types/database'

export const PRICE_IDS = {
  basic: process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID ?? '',
  pro: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ?? '',
} as const

export const PLAN_LIMITS: Record<Plan, { children: number; features: string[] }> = {
  free: {
    children: 1,
    features: ['1 child profile', 'Basic activity logging', 'Check-ins', 'Strategy tracking'],
  },
  basic: {
    children: 3,
    features: [
      '3 child profiles',
      'PDF progress reports',
      'WhatsApp companion',
      'Push notifications',
      'Basic analytics',
    ],
  },
  pro: {
    children: Infinity,
    features: [
      'Unlimited child profiles',
      'PDF progress reports',
      'WhatsApp companion',
      'Push notifications',
      'Advanced analytics',
      'Therapist portal access',
      'Priority support',
    ],
  },
}
