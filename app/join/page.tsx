export const dynamic = 'force-dynamic';
'use client'

export const dynamic = 'force-dynamic';

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '../../lib/supabase/client'
import { z } from 'zod'

const emailSchema = z.string().email('Please enter a valid email address so we can send your login link')

export default function Join() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [touched, setTouched] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    setIsClient(true)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setIsSuccess(true)
      }
    }
    checkSession()
  }, [])

  const validateEmail = (value) => {
    if (!value.trim()) {
      return touched ? 'Please enter your email address' : ''
    }
    const result = emailSchema.safeParse(value)
    if (!result.success) {
      return result.error.issues[0].message
    }
    return ''
  }

  const handleEmailChange = (value) => {
    setEmail(value)
    if (touched) {
      setError(validateEmail(value))
    }
  }

  const handleEmailBlur = () => {
    setTouched(true)
    if (email.trim()) {
      setError(validateEmail(email))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setTouched(true)

    const validationError = validateEmail(email)
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSubmitting(true)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      })

      if (error) throw error

      setIsSuccess(true)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isClient) {
    return (
      <main className="min-h-screen bg-background">
        <div className="join-container">
          <div className="join-card">
            <div className="loading-spinner"></div>
          </div>
        </div>
      </main>
    )
  }

  if (isSuccess) {
    return (
      <main className="min-h-screen bg-background">
        <div className="join-container">
          <div className="join-card success-card">
            <div className="success-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <h1 className="join-title">Check your email!</h1>
            <p className="join-subtitle">
              We've sent a magic login link to <strong>{email}</strong>. Click it to enter the platform.
            </p>
            <div className="success-features">
              <div className="success-feature">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>Early access to the platform</span>
              </div>
              <div className="success-feature">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>Exclusive parent resources</span>
              </div>
              <div className="success-feature">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>Priority support</span>
              </div>
            </div>
            <div className="success-actions">
              <Link href="/" className="btn btn-primary">
                Return Home
              </Link>
              <Link href="/resources" className="btn btn-secondary">
                Browse Resources
              </Link>
            </div>
          </div>
        </div>

        <style jsx>{`
          .join-container {
            min-height: calc(100vh - 200px);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 120px 16px 64px;
          }

          .join-card {
            background: var(--surface);
            border-radius: 16px;
            padding: 48px;
            max-width: 500px;
            width: 100%;
            box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
            text-align: center;
          }

          .success-icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, var(--success) 0%, var(--primary) 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
            color: white;
          }

          .join-title {
            font-size: 32px;
            color: var(--text-primary);
            margin-bottom: 16px;
          }

          .join-subtitle {
            font-size: 16px;
            color: var(--text-muted);
            line-height: 1.6;
            margin-bottom: 32px;
          }

          .success-features {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-bottom: 32px;
            text-align: left;
          }

          .success-feature {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 15px;
            color: var(--text-primary);
          }

          .success-feature svg {
            color: var(--success);
            flex-shrink: 0;
          }

          .success-actions {
            display: flex;
            gap: 12px;
            justify-content: center;
          }

          @media (max-width: 768px) {
            .join-card {
              padding: 32px 24px;
            }

            .join-title {
              font-size: 28px;
            }

            .success-actions {
              flex-direction: column;
            }
          }
        `}</style>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="join-container">
        <div className="join-card">
          <div className="join-header">
            <span className="join-badge">Early Access</span>
            <h1 className="join-title">Join Our Waitlist</h1>
            <p className="join-subtitle">
              Be the first to access our platform for tracking your child&apos;s progress.
              Join 500+ parents already on the waitlist.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="join-form">
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address</label>
              <input
                type="email"
                id="email"
                className={`form-input ${error ? 'form-input-error' : ''}`}
                placeholder="Enter your email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                onBlur={handleEmailBlur}
                disabled={isSubmitting}
                autoComplete="email"
              />
              {error && <p className="form-error">{error}</p>}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner"></span>
                  Joining...
                </>
              ) : (
                <>
                  Join the Waitlist
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="join-footer">
            <p className="join-note">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Your data is secure. We never share your email.
            </p>
          </div>
        </div>

        <div className="benefits-section">
          <h2 className="benefits-title">What you&apos;ll get</h2>
          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20V10"/>
                  <path d="M18 20V4"/>
                  <path d="M6 20v-4"/>
                </svg>
              </div>
              <h3 className="benefit-title">Progress Tracking</h3>
              <p className="benefit-text">Track your child&apos;s milestones and daily progress with easy-to-use tools.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <h3 className="benefit-title">Community Support</h3>
              <p className="benefit-text">Connect with other parents who understand your journey.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
              </div>
              <h3 className="benefit-title">Curated Resources</h3>
              <p className="benefit-text">Access worksheets, guides, and expert-approved content.</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .join-container {
          min-height: calc(100vh - 200px);
          padding: 120px 16px 64px;
          max-width: 800px;
          margin: 0 auto;
        }

        .join-card {
          background: var(--surface);
          border-radius: 16px;
          padding: 48px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
          margin-bottom: 48px;
        }

        .join-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .join-badge {
          display: inline-block;
          background: linear-gradient(135deg, var(--secondary) 0%, var(--accent) 100%);
          color: white;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          padding: 6px 16px;
          border-radius: 20px;
          margin-bottom: 16px;
        }

        .join-title {
          font-size: 36px;
          color: var(--text-primary);
          margin-bottom: 12px;
        }

        .join-subtitle {
          font-size: 16px;
          color: var(--text-muted);
          line-height: 1.6;
          max-width: 480px;
          margin: 0 auto;
        }

        .join-form {
          max-width: 400px;
          margin: 0 auto;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 8px;
          text-align: left;
        }

        .form-input {
          width: 100%;
          padding: 14px 16px;
          font-size: 16px;
          border: 2px solid var(--border);
          border-radius: 8px;
          background: var(--background);
          color: var(--text-primary);
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .form-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(107, 143, 113, 0.15);
          outline: none;
        }

        .form-input::placeholder {
          color: var(--text-muted);
          opacity: 0.7;
        }

        .form-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .form-input-error {
          border-color: #E57373;
        }

        .form-input-error:focus {
          border-color: #E57373;
          box-shadow: 0 0 0 3px rgba(229, 115, 115, 0.15);
        }

        .form-error {
          font-size: 13px;
          color: #E57373;
          margin-top: 8px;
          text-align: left;
        }

        .btn-submit {
          width: 100%;
          padding: 16px 24px;
          font-size: 16px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .btn-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .join-footer {
          margin-top: 24px;
          text-align: center;
        }

        .join-note {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 13px;
          color: var(--text-muted);
        }

        .join-note svg {
          opacity: 0.7;
        }

        .benefits-section {
          text-align: center;
        }

        .benefits-title {
          font-size: 24px;
          color: var(--text-primary);
          margin-bottom: 32px;
        }

        .benefits-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        .benefit-card {
          background: var(--surface);
          border-radius: 12px;
          padding: 24px;
          text-align: left;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .benefit-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }

        .benefit-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, rgba(107, 143, 113, 0.15) 0%, rgba(129, 178, 154, 0.15) 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
          margin-bottom: 16px;
        }

        .benefit-title {
          font-size: 16px;
          color: var(--text-primary);
          margin-bottom: 8px;
        }

        .benefit-text {
          font-size: 14px;
          color: var(--text-muted);
          line-height: 1.5;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--border);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto;
        }

        @media (max-width: 768px) {
          .join-card {
            padding: 32px 24px;
          }

          .join-title {
            font-size: 28px;
          }

          .benefits-grid {
            grid-template-columns: 1fr;
          }

          .benefit-card {
            text-align: center;
          }

          .benefit-icon {
            margin: 0 auto 16px;
          }
        }
      `}</style>
    </main>
  )
}