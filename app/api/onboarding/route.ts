/**
 * Onboarding Email Sequence API
 *
 * Handles waitlist subscription and triggers the email drip sequence:
 * - Day 1: Welcome + curated resources
 * - Day 3: Check-in email
 * - Day 7: Trial invite with feature highlights
 *
 * Also exposes a cron endpoint for Vercel Cron to trigger daily processing.
 *
 * POST /api/onboarding          — Subscribe to waitlist (Day 1 email fires immediately)
 * GET  /api/onboarding/cron     — Cron: process pending day-3 and day-7 sends
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'

import {
  sendEmail,
  buildDay1Email,
  buildDay3Email,
  buildDay7Email,
  type EmailAddress,
} from '@/lib/email-sequence'

export const runtime = 'nodejs'

// ── POST: Waitlist subscription ───────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = createClient()

  if (!supabase) {
    return NextResponse.json({ error: 'Service not configured' }, { status: 503 })
  }

  let body: { email?: string; name?: string; referral_source?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { email, name, referral_source } = body

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'email is required' }, { status: 400 })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  const normalizedEmail = email.toLowerCase().trim()
  const displayName = typeof name === 'string' ? name.trim() : null

  // Upsert into waitlist table
  const { data: entry, error: upsertError } = await (supabase.from('waitlist') as any)
    .upsert(
      {
        email: normalizedEmail,
        name: displayName,
        referral_source: referral_source ?? null,
        subscribed_at: new Date().toISOString(),
        email_sequence_day: 1,
        email_sent_at: new Date().toISOString(),
        converted: false,
      },
      {
        onConflict: 'email',
        update: {
          // If already subscribed, update name and reset to day 1
          name: displayName ?? undefined,
          referral_source: referral_source ?? undefined,
          email_sequence_day: 1,
          email_sent_at: new Date().toISOString(),
          converted: false,
        },
      }
    )
    .select()
    .single()

  if (upsertError) {
    console.error('[Onboarding] Waitlist upsert failed:', upsertError)
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
  }

  // Send Day 1 welcome email immediately
  const to: EmailAddress = {
    email: normalizedEmail,
    name: displayName ?? undefined,
  }

  const day1Html = buildDay1Email({ name: displayName ?? 'there' })
  const emailResult = await sendEmail({
    to,
    subject: 'Welcome to NeuroBridge — your autism parenting companion',
    html: day1Html,
  })

  if (!emailResult.success) {
    console.error('[Onboarding] Day 1 email failed for', normalizedEmail, emailResult.error)
    // Don't fail the subscription — email is non-critical
  }

  return NextResponse.json(
    {
      success: true,
      message: "You're on the list! Check your inbox for Day 1 resources.",
    },
    { status: 201 }
  )
}

// ── GET: Cron endpoint for processing email sequence ───────────────────────────

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Verify cron secret to prevent abuse
  const cronSecret = request.headers.get('x-cron-secret')
  const expectedSecret = process.env.CRON_SECRET

  if (expectedSecret && cronSecret !== expectedSecret) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createClient()

  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const now = new Date()
  const result = {
    day3: { processed: 0, sent: 0, errors: 0 },
    day7: { processed: 0, sent: 0, errors: 0 },
  }

  // ── Day 3 check-in emails ───────────────────────────────────────────────────
  const threeDaysAgo = new Date(now)
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
  const threeDaysAgoStr = threeDaysAgo.toISOString()

  const { data: day3Candidates, error: day3Error } = await (supabase.from('waitlist') as any)
    .select('*')
    .eq('email_sequence_day', 1)
    .eq('converted', false)
    .lte('email_sent_at', threeDaysAgoStr)

  if (day3Error) {
    console.error('[Onboarding Cron] Day 3 fetch failed:', day3Error)
  } else if (day3Candidates && day3Candidates.length > 0) {
    for (const entry of day3Candidates) {
      result.day3.processed++
      const to: EmailAddress = { email: entry.email, name: entry.name ?? undefined }
      const html = buildDay3Email({ name: entry.name ?? 'there' })
      const sent = await sendEmail({
        to,
        subject: 'How are you finding NeuroBridge? A quick check-in',
        html,
      })

      if (sent.success) {
        result.day3.sent++
        await (supabase.from('waitlist') as any)
          .update({ email_sequence_day: 3, email_sent_at: now.toISOString() })
          .eq('id', entry.id)
      } else {
        result.day3.errors++
        console.error(`[Onboarding Cron] Day 3 failed for ${entry.email}:`, sent.error)
      }
    }
  }

  // ── Day 7 trial invite emails ───────────────────────────────────────────────
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const sevenDaysAgoStr = sevenDaysAgo.toISOString()

  const { data: day7Candidates, error: day7Error } = await (supabase.from('waitlist') as any)
    .select('*')
    .eq('email_sequence_day', 3)
    .eq('converted', false)
    .lte('email_sent_at', sevenDaysAgoStr)

  if (day7Error) {
    console.error('[Onboarding Cron] Day 7 fetch failed:', day7Error)
  } else if (day7Candidates && day7Candidates.length > 0) {
    for (const entry of day7Candidates) {
      result.day7.processed++
      const to: EmailAddress = { email: entry.email, name: entry.name ?? undefined }
      const html = buildDay7Email({ name: entry.name ?? 'there' })
      const sent = await sendEmail({
        to,
        subject: "Your free trial is ready — see what NeuroBridge can do",
        html,
      })

      if (sent.success) {
        result.day7.sent++
        await (supabase.from('waitlist') as any)
          .update({ email_sequence_day: 7, email_sent_at: now.toISOString() })
          .eq('id', entry.id)
      } else {
        result.day7.errors++
        console.error(`[Onboarding Cron] Day 7 failed for ${entry.email}:`, sent.error)
      }
    }
  }

  return NextResponse.json({
    ok: true,
    processed_at: now.toISOString(),
    results: result,
  })
}
