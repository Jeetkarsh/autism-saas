/**
 * WhatsApp Parent Companion — Twilio integration service
 *
 * Handles:
 * - Daily check-in prompts (9am IST)
 * - Milestone celebration alerts
 * - Weekly summary notifications (Saturday 10am IST)
 * - Inbound message parsing and command handling
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { WhatsAppPrefs } from '@/lib/supabase/types'

// Use SupabaseClient (untyped) to avoid Database generic strictness issues
// The caller passes the real client; we accept the generic form
type AnySupabaseClient = SupabaseClient

// ── Twilio client (lazy singleton, initialized on first use) ─────────────────

type TwilioClient = ReturnType<typeof import('twilio')>
let _twilioClient: TwilioClient | null = null
let _twilioFrom: string | null = null

async function getTwilioClient(): Promise<[TwilioClient, string]> {
  if (_twilioClient) return [_twilioClient, _twilioFrom!]

  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error('Twilio credentials not configured')
  }

  const twilioModule = await import('twilio')
  _twilioClient = twilioModule.default(accountSid, authToken)
  _twilioFrom = fromNumber

  return [_twilioClient, _twilioFrom]
}

// ── Outbound message sending ───────────────────────────────────────────────────

export interface SendWhatsAppMessageOptions {
  to: string      // E.164 format: +919876543210
  body: string
  mediaUrl?: string
}

export async function sendWhatsAppMessage(
  options: SendWhatsAppMessageOptions
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const { to, body, mediaUrl } = options

    const [client, fromNumber] = await getTwilioClient()

    const message = await client.messages.create({
      from: fromNumber,
      to,
      body,
      ...(mediaUrl ? { mediaUrl: [mediaUrl] } : {}),
    })

    return { success: true, messageId: message.sid }
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error'
    console.error('[WhatsApp] Failed to send message:', error)
    return { success: false, error }
  }
}

// ── India-market formatting helpers ───────────────────────────────────────────

function formatTimeIST(date: Date = new Date()): string {
  return date.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

function formatDateIST(date: Date = new Date()): string {
  return date.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// ── Message templates ──────────────────────────────────────────────────────────

export function buildDailyCheckInMessage(childName: string): string {
  return `🌅 Good morning!

Time for ${childName}'s daily check-in:

Reply with numbers:
1️⃣ Sleep: GREAT / OKAY / BAD
2️⃣ Routine changes? YES / NO
3️⃣ Sensory env: CALM / LOUD / HECTIC

E.g., "1-Great 2-No 3-Calm"
Or just say "skip" to do it later.`
}

export function buildMilestoneAlertMessage(
  childName: string,
  milestoneTitle: string
): string {
  return `🎉 Milestone reached!

${childName} just achieved:
"${milestoneTitle}"

Keep up the amazing work!
— NeuroBridge`
}

export function buildWeeklySummaryMessage(
  childName: string,
  weekNumber: number,
  episodeCount: number,
  topTriggers: string[],
  effectiveStrategies: string[]
): string {
  const triggerText =
    topTriggers.length > 0
      ? `Top triggers:\n${topTriggers.map((t) => `• ${t}`).join('\n')}`
      : 'No crisis episodes this week!'

  const strategyText =
    effectiveStrategies.length > 0
      ? `What worked:\n${effectiveStrategies.map((s) => `✅ ${s}`).join('\n')}`
      : ''

  return `📊 Week ${weekNumber} Summary for ${childName}

Episodes: ${episodeCount}
${triggerText}
${strategyText}

Full PDF report ready in your dashboard.
— NeuroBridge`
}

// ── Inbound message parsing ────────────────────────────────────────────────────

export interface ParsedCheckIn {
  sleepQuality: 'Great' | 'Okay' | 'Bad' | null
  routineChanges: boolean | null
  sensoryEnvironment: 'Calm' | 'Loud' | 'Hectic' | null
}

export function parseCheckInResponse(messageBody: string): ParsedCheckIn {
  const normalized = messageBody.trim().toLowerCase()

  if (normalized === 'skip' || normalized === 'done' || normalized === 'later') {
    return { sleepQuality: null, routineChanges: null, sensoryEnvironment: null }
  }

  // Pattern: "1-Great 2-No 3-Calm" or "great, no, calm" etc.
  const sleepMatch = messageBody.match(
    /(?:1[:\s-]?)?(great|okay|bad)/i
  )
  const routineMatch = messageBody.match(
    /(?:2[:\s-]?)?(yes|no)/i
  )
  const sensoryMatch = messageBody.match(
    /(?:3[:\s-?])?(calm|loud|hectic)/i
  )

  const sleepQualityMap: Record<string, 'Great' | 'Okay' | 'Bad'> = {
    great: 'Great',
    okay: 'Okay',
    bad: 'Bad',
  }
  const sensoryMap: Record<string, 'Calm' | 'Loud' | 'Hectic'> = {
    calm: 'Calm',
    loud: 'Loud',
    hectic: 'Hectic',
  }

  return {
    sleepQuality: sleepMatch
      ? sleepQualityMap[sleepMatch[1].toLowerCase()] ?? null
      : null,
    routineChanges: routineMatch
      ? routineMatch[1].toLowerCase() === 'yes'
      : null,
    sensoryEnvironment: sensoryMatch
      ? sensoryMap[sensoryMatch[1].toLowerCase()] ?? null
      : null,
  }
}

// ── WhatsApp opt-in management via Supabase ───────────────────────────────────

/**
 * Get WhatsApp preferences for a user from profiles metadata
 */
export async function getWhatsAppPrefs(
  supabase: AnySupabaseClient,
  userId: string
): Promise<WhatsAppPrefs | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('whatsapp_prefs')
    .eq('id', userId)
    .single()

  if (error || !data) return null

  const defaults: WhatsAppPrefs = {
    enabled: false,
    phone: null,
    dailyCheckInTime: '09:00',
    weeklySummaryDay: 6,
    weeklySummaryTime: '10:00',
    milestonesAlerts: true,
  }

  return { ...defaults, ...(data.whatsapp_prefs as Partial<WhatsAppPrefs>) }
}

/**
 * Update WhatsApp preferences for a user
 */
export async function updateWhatsAppPrefs(
  supabase: AnySupabaseClient,
  userId: string,
  prefs: Partial<WhatsAppPrefs>
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('profiles')
    .update({ whatsapp_prefs: prefs })
    .eq('id', userId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

// ── Cron helpers (called by Vercel Cron or similar) ───────────────────────────

export interface CronCheckInResult {
  sent: number
  skipped: number
  errors: number
}

/**
 * Send daily check-in prompts to all opted-in parents.
 * Should be called by a cron job at ~9am IST daily.
 */
export async function sendDailyCheckInPrompts(
  supabase: AnySupabaseClient
): Promise<CronCheckInResult> {
  const result: CronCheckInResult = { sent: 0, skipped: 0, errors: 0 }

  // Get all users with WhatsApp enabled
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, email, whatsapp_prefs')
    .not('whatsapp_prefs', 'is', null)

  if (error || !users) {
    console.error('[WhatsApp Cron] Failed to fetch users:', error)
    return result
  }

  for (const user of users) {
    const prefs = user.whatsapp_prefs as WhatsAppPrefs | null
    if (!prefs?.enabled || !prefs?.phone) {
      result.skipped++
      continue
    }

    // Get first child for this user
    const { data: children, error: childError } = await supabase
      .from('children')
      .select('id, name')
      .eq('user_id', user.id)
      .limit(1)

    if (childError || !children || children.length === 0) {
      result.skipped++
      continue
    }

    const childName = children[0].name
    const message = buildDailyCheckInMessage(childName)
    const sent = await sendWhatsAppMessage({ to: prefs.phone, body: message })

    if (sent.success) {
      result.sent++
    } else {
      result.errors++
      console.error(`[WhatsApp Cron] Failed to send to ${prefs.phone}:`, sent.error)
    }
  }

  return result
}

/**
 * Send weekly summaries to all opted-in parents.
 * Should be called by a cron job on Saturdays at ~10am IST.
 */
export async function sendWeeklySummaries(
  supabase: AnySupabaseClient
): Promise<CronCheckInResult> {
  const result: CronCheckInResult = { sent: 0, skipped: 0, errors: 0 }

  // Get all users with WhatsApp enabled
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, email, whatsapp_prefs')
    .not('whatsapp_prefs', 'is', null)

  if (error || !users) {
    console.error('[WhatsApp Cron] Failed to fetch users:', error)
    return result
  }

  for (const user of users) {
    const prefs = user.whatsapp_prefs as WhatsAppPrefs | null
    if (!prefs?.enabled || !prefs?.phone) {
      result.skipped++
      continue
    }

    // Get all children for this user
    const { data: children, error: childError } = await supabase
      .from('children')
      .select('id, name')
      .eq('user_id', user.id)

    if (childError || !children || children.length === 0) {
      result.skipped++
      continue
    }

    for (const child of children) {
      const weekNumber = getWeekNumber()
      const { episodeCount, topTriggers, effectiveStrategies } =
        await getWeeklyEpisodeStats(supabase, child.id)

      const message = buildWeeklySummaryMessage(
        child.name,
        weekNumber,
        episodeCount,
        topTriggers,
        effectiveStrategies
      )

      const sent = await sendWhatsAppMessage({ to: prefs.phone, body: message })

      if (sent.success) {
        result.sent++
      } else {
        result.errors++
      }
    }
  }

  return result
}

// ── Analytics helpers ─────────────────────────────────────────────────────────

function getWeekNumber(): number {
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const days = Math.floor(
    (now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)
  )
  return Math.ceil((days + startOfYear.getDay() + 1) / 7)
}

async function getWeeklyEpisodeStats(
  supabase: AnySupabaseClient,
  childId: string
): Promise<{
  episodeCount: number
  topTriggers: string[]
  effectiveStrategies: string[]
}> {
  // Get episodes from the past 7 days
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: episodes, error } = await supabase
    .from('episodes')
    .select('trigger, strategies_effective, outcome_successful')
    .eq('child_id', childId)
    .gte('created_at', sevenDaysAgo.toISOString())

  if (error || !episodes || episodes.length === 0) {
    return { episodeCount: 0, topTriggers: [], effectiveStrategies: [] }
  }

  // Count triggers
  const triggerCounts: Record<string, number> = {}
  const strategyCounts: Record<string, number> = {}

  for (const ep of episodes) {
    if (ep.trigger) {
      triggerCounts[ep.trigger] = (triggerCounts[ep.trigger] || 0) + 1
    }
    if (ep.strategies_effective && Array.isArray(ep.strategies_effective)) {
      for (const strategy of ep.strategies_effective) {
        strategyCounts[strategy] = (strategyCounts[strategy] || 0) + 1
      }
    }
  }

  const topTriggers = Object.entries(triggerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([t]) => t)

  const effectiveStrategies = Object.entries(strategyCounts)
    .filter(([, count]) => count >= 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([s]) => s)

  return {
    episodeCount: episodes.length,
    topTriggers,
    effectiveStrategies,
  }
}
