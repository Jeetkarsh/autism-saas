/**
 * Waitlist → Onboarding Email Sequence Service
 *
 * Implements the drip email sequence:
 * - Day 1: Welcome + curated autism parenting resources
 * - Day 3: Check-in asking how they're finding NeuroBridge
 * - Day 7: Trial invite with feature highlights
 *
 * Email delivery works with any provider by setting EMAIL_PROVIDER:
 * - "resend"  (default) — uses RESEND_API_KEY
 * - "smtp"    — uses SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
 */

import nodemailer from 'nodemailer'

// ── Types ───────────────────────────────────────────────────────────────────

export interface EmailAddress {
  email: string
  name?: string
}

export interface SendEmailOptions {
  to: EmailAddress
  subject: string
  html: string
  text?: string
}

export interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

// ── Email Provider: Resend (default) ─────────────────────────────────────────

async function sendViaResend(
  to: EmailAddress,
  subject: string,
  html: string,
  text?: string
): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return { success: false, error: 'RESEND_API_KEY is not set' }
  }

  const fromEmail = process.env.EMAIL_FROM ?? 'NeuroBridge <hello@neurobridge.app>'
  const toAddress = to.name ? `"${to.name}" <${to.email}>` : to.email

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: toAddress,
      subject,
      html,
      ...(text ? { text } : {}),
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    return { success: false, error: `Resend API error ${response.status}: ${errorBody}` }
  }

  const data = (await response.json()) as { id?: string }
  return { success: true, messageId: data.id }
}

// ── Email Provider: SMTP (nodemailer) ─────────────────────────────────────────

async function sendViaSMTP(
  to: EmailAddress,
  subject: string,
  html: string,
  text?: string
): Promise<SendEmailResult> {
  const host = process.env.SMTP_HOST
  const port = parseInt(process.env.SMTP_PORT ?? '587', 10)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const fromEmail = process.env.EMAIL_FROM ?? 'NeuroBridge <hello@neurobridge.app>'

  if (!host || !user || !pass) {
    return { success: false, error: 'SMTP credentials not fully configured' }
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })

  try {
    const info = await transporter.sendMail({
      from: fromEmail,
      to: to.name ? `"${to.name}" <${to.email}>` : to.email,
      subject,
      html,
      text,
    })
    return { success: true, messageId: info.messageId }
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown SMTP error'
    return { success: false, error }
  }
}

// ── Main sendEmail dispatcher ────────────────────────────────────────────────

export async function sendEmail(
  options: SendEmailOptions
): Promise<SendEmailResult> {
  const provider = process.env.EMAIL_PROVIDER ?? 'resend'

  if (provider === 'smtp') {
    return sendViaSMTP(options.to, options.subject, options.html, options.text)
  }

  return sendViaResend(options.to, options.subject, options.html, options.text)
}

// ── Shared HTML layout helpers ───────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function baseLayout(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f8f9ff;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px;">
    <div style="background-color:#ffffff;border-radius:12px;padding:32px;border:1px solid #e8eaff;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
      <!-- Header -->
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:24px;">
        <div style="width:36px;height:36px;border-radius:8px;background-color:#6c63ff;display:flex;align-items:center;justify-content:center;">
          <span style="color:#fff;font-size:18px;font-weight:bold;">N</span>
        </div>
        <span style="font-size:18px;font-weight:bold;color:#6c63ff;">NeuroBridge</span>
      </div>

      <h1 style="font-size:22px;font-weight:bold;margin-bottom:16px;color:#1a1a2e;">${escapeHtml(title)}</h1>

      ${bodyHtml}
    </div>

    <!-- Footer -->
    <p style="font-size:12px;color:#8888aa;text-align:center;margin-top:20px;line-height:1.6;">
      You're receiving this because you signed up for the NeuroBridge waitlist.
      NeuroBridge is an AI-powered companion for autism parenting.<br/>
      <a href="https://autism-saas.vercel.app/unsubscribe" style="color:#6c63ff;">Unsubscribe</a>
    </p>
  </div>
</body>
</html>`
}

function ctaButton(href: string, label: string): string {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;background-color:#6c63ff;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;margin-top:20px;">${escapeHtml(label)}</a>`
}

// ── Day 1: Welcome + Resources ───────────────────────────────────────────────

export function buildDay1Email(opts: { name: string }): string {
  const nameStr = opts.name ? escapeHtml(opts.name) : 'there'
  const greeting = opts.name ? `, ${nameStr}` : ''

  const body = `
    <p style="font-size:15px;line-height:1.7;color:#333;">
      Thank you for joining the NeuroBridge waitlist. You're now part of a growing
      community of parents and caregivers navigating the autism journey — and we're glad you're here.
    </p>

    <p style="font-size:15px;line-height:1.7;color:#333;margin-top:16px;">
      Before your trial begins, we've curated a few resources that many parents find helpful right away:
    </p>

    <!-- Resource 1 -->
    <div style="background-color:#f8f9ff;border:1px solid #e8eaff;border-radius:8px;padding:14px 16px;margin-top:20px;">
      <p style="font-weight:bold;margin:0 0 4px;font-size:14px;">Understanding sensory processing differences</p>
      <p style="color:#555;font-size:13px;margin:0 0 8px;">
        A clear, practical guide to sensory sensitivities — and how to create a calming environment at home.
      </p>
      <a href="https://autism-saas.vercel.app/resources/sensory-guide" style="color:#6c63ff;font-size:13px;font-weight:bold;">Read more →</a>
    </div>

    <!-- Resource 2 -->
    <div style="background-color:#f8f9ff;border:1px solid #e8eaff;border-radius:8px;padding:14px 16px;margin-top:12px;">
      <p style="font-weight:bold;margin:0 0 4px;font-size:14px;">First 30 days: what to expect</p>
      <p style="color:#555;font-size:13px;margin:0 0 8px;">
        Practical tips for the first month after an autism diagnosis, from establishing routines to self-care.
      </p>
      <a href="https://autism-saas.vercel.app/resources/first-30-days" style="color:#6c63ff;font-size:13px;font-weight:bold;">Read more →</a>
    </div>

    <!-- Resource 3 -->
    <div style="background-color:#f8f9ff;border:1px solid #e8eaff;border-radius:8px;padding:14px 16px;margin-top:12px;">
      <p style="font-weight:bold;margin:0 0 4px;font-size:14px;">Building communication without words</p>
      <p style="color:#555;font-size:13px;margin:0 0 8px;">
        AAC basics, visual schedules, and low-pressure communication strategies for non-verbal or pre-verbal children.
      </p>
      <a href="https://autism-saas.vercel.app/resources/communication" style="color:#6c63ff;font-size:13px;font-weight:bold;">Read more →</a>
    </div>

    <p style="font-size:14px;color:#555;margin-top:20px;line-height:1.6;">
      We'll be in touch on Day 3 to see how you're getting on, and your full trial starts on Day 7.
      In the meantime, reply to any of our emails or reach out at
      <a href="mailto:hello@neurobridge.app" style="color:#6c63ff;">hello@neurobridge.app</a>.
    </p>

    ${ctaButton('https://autism-saas.vercel.app', 'Explore NeuroBridge')}
  `

  return baseLayout(`Welcome${greeting}!`, body)
}

// ── Day 3: Check-in ───────────────────────────────────────────────────────────

export function buildDay3Email(opts: { name: string }): string {
  const nameStr = opts.name ? ` ${escapeHtml(opts.name)}` : ''
  const body = `
    <p style="font-size:15px;line-height:1.7;color:#333;">
      Hi${nameStr}, it's been a few days since you joined the NeuroBridge waitlist.
      We wanted to check in — how are you finding things so far?
    </p>

    <p style="font-size:15px;line-height:1.7;color:#333;margin-top:16px;">
      Some parents find it helpful to:
    </p>

    <ul style="font-size:15px;line-height:2;color:#333;padding-left:20px;">
      <li>Read through the resource guide we shared (link in your Day 1 email)</li>
      <li>Join our parent community on WhatsApp or Facebook</li>
      <li>Book a free 20-min discovery call with our care team to see how NeuroBridge can be tailored to your child's needs</li>
    </ul>

    <p style="font-size:14px;color:#555;margin-top:20px;line-height:1.6;">
      Is there anything you'd like to know more about? Just reply to this email
      and we'll get back to you within one business day.
    </p>

    ${ctaButton('https://autism-saas.vercel.app/calendar', 'Book a free call')}

    <p style="font-size:14px;color:#555;margin-top:20px;line-height:1.6;">
      Your trial access starts in a few days — we're here when you're ready.
    </p>
  `

  return baseLayout("How are you finding NeuroBridge?", body)
}

// ── Day 7: Trial invite ───────────────────────────────────────────────────────

export function buildDay7Email(opts: { name: string }): string {
  const nameStr = opts.name ? `${escapeHtml(opts.name)}, y` : "Y"
  const body = `
    <p style="font-size:15px;line-height:1.7;color:#333;">
      ${nameStr}our 14-day NeuroBridge trial is now active. Here's what you can do in the app right now:
    </p>

    <!-- Feature 1 -->
    <div style="display:flex;gap:14px;margin-top:20px;align-items:flex-start;">
      <span style="font-size:22px;">📋</span>
      <div>
        <p style="font-weight:bold;margin:0 0 2px;">Track daily episodes</p>
        <p style="font-size:14px;color:#555;margin:0;">Log triggers, behaviors, and what strategies worked — in under 60 seconds.</p>
      </div>
    </div>

    <!-- Feature 2 -->
    <div style="display:flex;gap:14px;margin-top:16px;align-items:flex-start;">
      <span style="font-size:22px;">🤖</span>
      <div>
        <p style="font-weight:bold;margin:0 0 2px;">AI companion chat</p>
        <p style="font-size:14px;color:#555;margin:0;">Ask anything about ABA, sensory processing, or communication strategies.</p>
      </div>
    </div>

    <!-- Feature 3 -->
    <div style="display:flex;gap:14px;margin-top:16px;align-items:flex-start;">
      <span style="font-size:22px;">📊</span>
      <div>
        <p style="font-weight:bold;margin:0 0 2px;">Weekly PDF reports</p>
        <p style="font-size:14px;color:#555;margin:0;">Beautiful progress reports ready for your next IEP or therapist meeting.</p>
      </div>
    </div>

    <!-- Feature 4 -->
    <div style="display:flex;gap:14px;margin-top:16px;align-items:flex-start;">
      <span style="font-size:22px;">💬</span>
      <div>
        <p style="font-weight:bold;margin:0 0 2px;">WhatsApp companion</p>
        <p style="font-size:14px;color:#555;margin:0;">Daily check-ins and milestone alerts straight to your phone — no app needed.</p>
      </div>
    </div>

    <p style="font-size:14px;color:#555;margin-top:20px;line-height:1.6;">
      Your trial is free for 14 days. No credit card required.
    </p>

    ${ctaButton('https://autism-saas.vercel.app/dashboard', 'Start your trial →')}
  `

  return baseLayout("Your NeuroBridge trial is ready 🎉", body)
}
