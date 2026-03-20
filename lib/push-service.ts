/**
 * Web Push Notification Service
 *
 * Handles:
 * - VAPID key initialization
 * - Push subscription management (save/remove via Supabase)
 * - Sending push notifications for milestones, daily reminders,
 *   and weekly report availability
 *
 * Uses web-push library with VAPID authentication.
 * VAPID keys generated once via: npx web-push generate-vapid-keys
 */

import webpush from 'web-push'

// ── Types ───────────────────────────────────────────────────────────────────

export interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export interface PushPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: Record<string, unknown>
}

export type NotificationType = 'milestone' | 'daily_reminder' | 'weekly_report' | 'episode_alert'

// ── VAPID Configuration ─────────────────────────────────────────────────────

function getVapidKeys(): { publicKey: string; privateKey: string } {
  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY

  if (!publicKey || !privateKey) {
    throw new Error('VAPID keys are not configured. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.')
  }

  return { publicKey, privateKey }
}

function initWebPush(): void {
  const keys = getVapidKeys()
  const vapidDetails = {
    subject: process.env.VAPID_SUBJECT ?? 'mailto:hello@neurobridge.app',
    publicKey: keys.publicKey,
    privateKey: keys.privateKey,
  }
  webpush.setVapidDetails(vapidDetails.subject, vapidDetails.publicKey, vapidDetails.privateKey)
}

// ── Public Key endpoint ──────────────────────────────────────────────────────

/**
 * Returns the VAPID public key for clients to use when subscribing.
 */
export function getVapidPublicKey(): string {
  return getVapidKeys().publicKey
}

// ── Send Push Notification ───────────────────────────────────────────────────

export interface SendPushResult {
  success: boolean
  statusCode?: number
  error?: string
}

/**
 * Send a push notification to a single subscription.
 */
export async function sendPushNotification(
  subscription: PushSubscription,
  payload: PushPayload
): Promise<SendPushResult> {
  try {
    initWebPush()

    const payloadStr = JSON.stringify({
      ...payload,
      timestamp: Date.now(),
    })

    const result = await webpush.sendNotification(subscription, payloadStr)
    return { success: true, statusCode: result.statusCode }
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error'

    // 410 Gone = subscription no longer valid, should be removed
    if (error.includes('410') || error.includes('Not registered')) {
      return { success: false, statusCode: 410, error: 'Subscription expired' }
    }

    console.error('[Push] Failed to send notification:', error)
    return { success: false, error }
  }
}

/**
 * Send a push notification to multiple subscriptions.
 */
export async function sendPushToMultiple(
  subscriptions: PushSubscription[],
  payload: PushPayload
): Promise<{ sent: number; failed: number; expired: string[] }> {
  const expired: string[] = []
  let sent = 0
  let failed = 0

  await Promise.all(
    subscriptions.map(async (sub) => {
      const result = await sendPushNotification(sub, payload)
      if (result.success) {
        sent++
      } else if (result.statusCode === 410) {
        expired.push(sub.endpoint)
        failed++
      } else {
        failed++
      }
    })
  )

  return { sent, failed, expired }
}

// ── Notification Templates ───────────────────────────────────────────────────

export function buildMilestonePush(
  childName: string,
  milestoneTitle: string
): PushPayload {
  return {
    title: '🎉 Milestone Reached!',
    body: `${childName} achieved: "${milestoneTitle}"`,
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: 'milestone',
    data: { type: 'milestone', childName, milestoneTitle },
  }
}

export function buildDailyReminderPush(childName: string): PushPayload {
  return {
    title: '☀️ Daily check-in ready',
    body: `How was ${childName}'s night and morning? A 60-second check-in helps track patterns.`,
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: 'daily-reminder',
    data: { type: 'daily_reminder', childName },
  }
}

export function buildWeeklyReportPush(childName: string): PushPayload {
  return {
    title: '📊 Weekly report ready',
    body: `Your Week X summary for ${childName} is ready — perfect for your next therapist visit.`,
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: 'weekly-report',
    data: { type: 'weekly_report', childName },
  }
}

export function buildEpisodeAlertPush(
  childName: string,
  trigger: string
): PushPayload {
  return {
    title: '🔔 Episode logged',
    body: `${childName}'s episode (${trigger}) has been saved. Tap for details and strategies.`,
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: 'episode-alert',
    data: { type: 'episode_alert', childName, trigger },
  }
}

// ── Subscription Management via Supabase ─────────────────────────────────────

type AnySupabaseClient = import('@supabase/supabase-js').SupabaseClient

/**
 * Save a push subscription for a user in Supabase.
 * Stores the serialized subscription object in profiles.push_subscriptions.
 */
export async function savePushSubscription(
  supabase: AnySupabaseClient,
  userId: string,
  subscription: PushSubscription
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('profiles')
    .select('push_subscriptions')
    .eq('id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned, which is fine for new subscriptions
    return { success: false, error: error.message }
  }

  // Get current subscriptions
  const { data: current } = await supabase
    .from('profiles')
    .select('push_subscriptions')
    .eq('id', userId)
    .single()

  const currentSubs: PushSubscription[] =
    (current?.push_subscriptions as PushSubscription[] | null) ?? []

  // Avoid duplicates by endpoint
  const filtered = currentSubs.filter((s) => s.endpoint !== subscription.endpoint)
  const updated = [...filtered, subscription]

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ push_subscriptions: updated })
    .eq('id', userId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  return { success: true }
}

/**
 * Remove a push subscription for a user by endpoint.
 */
export async function removePushSubscription(
  supabase: AnySupabaseClient,
  userId: string,
  endpoint: string
): Promise<{ success: boolean; error?: string }> {
  const { data: current } = await supabase
    .from('profiles')
    .select('push_subscriptions')
    .eq('id', userId)
    .single()

  if (!current?.push_subscriptions) {
    return { success: true } // Already gone
  }

  const currentSubs: PushSubscription[] = current.push_subscriptions as PushSubscription[]
  const updated = currentSubs.filter((s) => s.endpoint !== endpoint)

  const { error } = await supabase
    .from('profiles')
    .update({ push_subscriptions: updated })
    .eq('id', userId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Get all push subscriptions for a user.
 */
export async function getPushSubscriptions(
  supabase: AnySupabaseClient,
  userId: string
): Promise<PushSubscription[]> {
  const { data } = await supabase
    .from('profiles')
    .select('push_subscriptions')
    .eq('id', userId)
    .single()

  if (!data?.push_subscriptions) return []

  return data.push_subscriptions as PushSubscription[]
}

/**
 * Remove expired subscriptions (called after sendPushToMultiple reports expired ones).
 * Call this after sending to prune dead subscriptions.
 */
export async function pruneExpiredSubscriptions(
  supabase: AnySupabaseClient,
  userId: string,
  expiredEndpoints: string[]
): Promise<void> {
  if (expiredEndpoints.length === 0) return

  const { data: current } = await supabase
    .from('profiles')
    .select('push_subscriptions')
    .eq('id', userId)
    .single()

  if (!current?.push_subscriptions) return

  const currentSubs: PushSubscription[] = current.push_subscriptions as PushSubscription[]
  const updated = currentSubs.filter((s) => !expiredEndpoints.includes(s.endpoint))

  await supabase
    .from('profiles')
    .update({ push_subscriptions: updated })
    .eq('id', userId)
}

// ── Cron helpers ─────────────────────────────────────────────────────────────

export interface PushCronResult {
  sent: number
  skipped: number
  errors: number
  expiredCount: number
}

/**
 * Send daily push reminders to all opted-in users.
 * Called by a cron job (e.g., 9am IST daily).
 */
export async function sendDailyPushReminders(
  supabase: AnySupabaseClient
): Promise<PushCronResult> {
  const result: PushCronResult = { sent: 0, skipped: 0, errors: 0, expiredCount: 0 }

  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, push_subscriptions')
    .not('push_subscriptions', 'is', null)

  if (error || !users) {
    console.error('[Push Cron] Failed to fetch users:', error)
    return result
  }

  for (const user of users) {
    const subs: PushSubscription[] =
      (user.push_subscriptions as PushSubscription[] | null) ?? []

    if (subs.length === 0) {
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
    const payload = buildDailyReminderPush(childName)

    const { sent, failed, expired } = await sendPushToMultiple(subs, payload)
    result.sent += sent
    result.errors += failed
    result.expiredCount += expired.length

    if (expired.length > 0) {
      await pruneExpiredSubscriptions(supabase, user.id, expired)
    }
  }

  return result
}
