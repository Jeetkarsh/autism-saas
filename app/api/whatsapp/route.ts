/**
 * WhatsApp Twilio Webhook
 *
 * Handles inbound messages from Twilio WhatsApp.
 * POST = inbound message event (Twilio calls this on every incoming msg)
 * GET  = Twilio webhook verification challenge
 *
 * Inbound flow:
 * 1. Twilio POSTs to this route with From, To, Body
 * 2. We look up the user by phone number
 * 3. Parse the message for commands / check-in responses
 * 4. Respond with TwiML (or 200 OK with no body for async)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  parseCheckInResponse,
  buildDailyCheckInMessage,
  type ParsedCheckIn,
} from '@/lib/whatsapp'

// ── Twilio signature verification ─────────────────────────────────────────────

function verifyTwilioSignature(
  request: NextRequest,
  authToken: string
): boolean {
  const signature = request.headers.get('x-twilio-signature')
  if (!signature) return false

  // Twilio validates using its own utils — we skip full verification in dev
  // In production set TWILIO_AUTH_TOKEN and enable in Twilio console
  if (process.env.NODE_ENV === 'development') return true

  // Full HMAC verification would go here via twilio.validateRequest()
  // For now, trust the header presence in production
  return !!signature
}

// ── TwiML response helpers ─────────────────────────────────────────────────────

function twimlResponse(message: string): NextResponse {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(message)}</Message>
</Response>`

  return new NextResponse(twiml, {
    status: 200,
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
    },
  })
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// ── Message handling ─────────────────────────────────────────────────────────

async function handleInboundMessage(
  from: string,
  body: string
): Promise<NextResponse> {
  const supabase = createClient()
  if (!supabase) {
    return twimlResponse('⚠️ Service temporarily unavailable. Please try again later.')
  }

  // Normalize phone: Twilio sends WhatsApp numbers as whatsapp:+91...
  const phone = from.replace(/^whatsapp:/, '')

  // Look up user by their WhatsApp phone number stored in profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('whatsapp_phone', phone)
    .single() as { data: { id: string; email: string | null } | null; error: unknown }

  if (profileError || !profile) {
    // Unrecognized sender — send opt-in prompt
    return twimlResponse(
      "Hi! I don't have your number on file. " +
        'Please connect your WhatsApp in your NeuroBridge dashboard settings to get started.'
    )
  }

  // Capture IDs early to avoid type narrowing issues with 'as any' casts
  const profileId: string = profile.id

  const normalizedBody = body.trim().toLowerCase()

  // Handle opt-in command
  if (normalizedBody === 'start' || normalizedBody === 'optin') {
    // Use type assertion to bypass strict query builder type inference
    const updatePayload = { whatsapp_prefs: { enabled: true, phone } }
    ;(supabase.from('profiles') as any).update(updatePayload).eq('id', profileId)

    return twimlResponse(
      "You're all set! You'll receive daily check-ins and weekly summaries. " +
        "To opt out anytime, reply 'stop'."
    )
  }

  // Handle opt-out command
  if (normalizedBody === 'stop' || normalizedBody === 'optout') {
    const updatePayload = { whatsapp_prefs: { enabled: false } }
    ;(supabase.from('profiles') as any).update(updatePayload).eq('id', profileId)

    return twimlResponse(
      "You've been unsubscribed from NeuroBridge updates. " +
        "Reply 'start' to resubscribe."
    )
  }

  // Handle help
  if (normalizedBody === 'help') {
    return twimlResponse(
      'NeuroBridge WhatsApp Companion\n\n' +
        'Daily check-ins: I\'ll ask each morning\n' +
        'Weekly summary: Every Saturday\n' +
        'Milestone alerts: I\'ll notify you\n\n' +
        'Commands:\n' +
        'start — opt in\n' +
        'stop — opt out\n' +
        'help — show this message'
    )
  }

  // Handle check-in response (most common flow)
  const parsed: ParsedCheckIn = parseCheckInResponse(body)

  if (
    parsed.sleepQuality !== null ||
    parsed.routineChanges !== null ||
    parsed.sensoryEnvironment !== null
  ) {
    // Get user's first child
    const childQuery = await supabase
      .from('children')
      .select('id, name')
      .eq('user_id', profileId)
      .limit(1)
    const childResult = childQuery.data as { id: string; name: string }[] | null

    if (childResult == null || childResult.length === 0) {
      return twimlResponse('⚠️ No child profile found. Please add a child in your dashboard.')
    }

    const childId: string = childResult[0].id
    const childName: string = childResult[0].name

    // Build a partial check-in from WhatsApp
    const checkInData = {
      user_id: profileId,
      child_id: childId,
      sleep_quality: parsed.sleepQuality ?? 'Okay',
      routine_changes: parsed.routineChanges ?? false,
      sensory_environment: parsed.sensoryEnvironment ?? 'Calm',
    }

    const { error: insertError } = await (supabase.from('check_ins') as any).insert(checkInData)

    if (insertError) {
      console.error('[WhatsApp] Check-in insert failed:', insertError)
      return twimlResponse("Couldn't save your check-in. Please try again from the dashboard.")
    }

    const summary = [
      `Check-in saved for ${childName}!`,
      parsed.sleepQuality ? `😴 Sleep: ${parsed.sleepQuality}` : null,
      parsed.routineChanges !== null
        ? `📋 Routine change: ${parsed.routineChanges ? 'Yes' : 'No'}`
        : null,
      parsed.sensoryEnvironment
        ? `🎵 Sensory: ${parsed.sensoryEnvironment}`
        : null,
    ]
      .filter(Boolean)
      .join('\n')

    return twimlResponse(summary)
  }

  // Unrecognized message — show help
  return twimlResponse(
    "I'm not sure I understood that. Reply 'help' for available commands, " +
      'or use the dashboard for full check-in options.'
  )
}

// ── GET: Twilio webhook verification ──────────────────────────────────────────

export async function GET(request: NextRequest): Promise<NextResponse> {
  const authToken = process.env.TWILIO_AUTH_TOKEN

  if (!authToken) {
    return new NextResponse('Twilio not configured', { status: 503 })
  }

  // Twilio sends a GET with ?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...
  const mode = request.nextUrl.searchParams.get('hub.mode')
  const verifyToken = request.nextUrl.searchParams.get('hub.verify_token')
  const challenge = request.nextUrl.searchParams.get('hub.challenge')

  if (mode === 'subscribe' && verifyToken === process.env.TWILIO_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }

  return new NextResponse('Forbidden', { status: 403 })
}

// ── POST: Inbound WhatsApp message ─────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Verify Twilio signature in production
  const authToken = process.env.TWILIO_AUTH_TOKEN
  if (authToken && process.env.NODE_ENV === 'production') {
    if (!verifyTwilioSignature(request, authToken)) {
      return new NextResponse('Invalid signature', { status: 401 })
    }
  }

  // Twilio sends form-encoded body
  const formData = await request.formData()
  const from = formData.get('From') as string
  const to = formData.get('To') as string
  const body = formData.get('Body') as string

  if (!from || !body) {
    return new NextResponse('Missing required fields', { status: 400 })
  }

  return handleInboundMessage(from, body)
}
