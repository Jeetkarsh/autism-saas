'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import { z } from 'zod'

const emailSchema = z.string().email('Please enter a valid email address')

function LoginForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [touched, setTouched] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const searchParams = useSearchParams()
  const authError = searchParams.get('error')
  const next = searchParams.get('next') ?? '/dashboard'

  const supabase = createClient()

  useEffect(() => {
    setIsClient(true)
    // If Supabase not configured, redirect to dashboard (offline mode)
    if (!supabase) {
      window.location.href = '/dashboard'
    }
  }, [])

  const validateEmail = (value: string) => {
    if (!value.trim()) return touched ? 'Please enter your email address' : ''
    const result = emailSchema.safeParse(value)
    return result.success ? '' : result.error.issues[0].message
  }

  const handleEmailChange = (value: string) => {
    setEmail(value)
    if (touched) setError(validateEmail(value))
  }

  const handleEmailBlur = () => {
    setTouched(true)
    if (email.trim()) setError(validateEmail(email))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)

    const validationError = validateEmail(email)
    if (validationError) {
      setError(validationError)
      return
    }

    if (!supabase) {
      window.location.href = '/dashboard'
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      })

      if (authError) throw authError
      setIsSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isClient) {
    return (
      <main className="login-page">
        <div className="login-container">
          <div className="login-card">
            <div className="loading-spinner" />
          </div>
        </div>
        <style jsx>{styles}</style>
      </main>
    )
  }

  if (isSuccess) {
    return (
      <main className="login-page">
        <div className="login-container">
          <div className="login-card">
            <div className="success-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h1 className="login-title">Check your email</h1>
            <p className="login-subtitle">
              We sent a magic link to <strong>{email}</strong>. Click the link to sign in.
            </p>
            <p className="login-hint">No email? Check your spam folder or try again.</p>
            <button
              className="btn btn-secondary btn-back"
              onClick={() => setIsSuccess(false)}
            >
              Try a different email
            </button>
          </div>
        </div>
        <style jsx>{styles}</style>
      </main>
    )
  }

  return (
    <main className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <Link href="/" className="logo-link">
              <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="14" fill="#6B8F71" />
                <path d="M16 8C12.686 8 10 10.686 10 14C10 17.314 12.686 20 16 20C19.314 20 22 17.314 22 14C22 10.686 19.314 8 16 8Z" fill="white" fillOpacity="0.9" />
                <circle cx="13" cy="13" r="2" fill="#6B8F71" />
                <circle cx="19" cy="13" r="2" fill="#6B8F71" />
                <path d="M12 18C13 19 15 20 16 20C17 20 19 19 20 18" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span className="logo-text">AutismConnect</span>
            </Link>
            <h1 className="login-title">Welcome back</h1>
            <p className="login-subtitle">Sign in with your email — we'll send you a magic link.</p>
          </div>

          {authError === 'auth_failed' && (
            <div className="error-banner">
              The sign-in link was invalid or expired. Please try again.
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form" noValidate>
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email address</label>
              <input
                type="email"
                id="email"
                className={`form-input ${error ? 'form-input-error' : ''}`}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                onBlur={handleEmailBlur}
                disabled={isSubmitting}
                autoComplete="email"
                autoFocus
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
                  <span className="spinner" />
                  Sending link...
                </>
              ) : (
                'Send magic link'
              )}
            </button>
          </form>

          <div className="login-footer">
            <p className="footer-text">
              New here?{' '}
              <Link href="/join" className="footer-link">Join the waitlist</Link>
            </p>
            <p className="footer-secure">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Secure passwordless sign-in
            </p>
          </div>
        </div>
      </div>
      <style jsx>{styles}</style>
    </main>
  )
}

function LoginPage() {
  return (
    <Suspense fallback={
      <main className="login-page">
        <div className="login-container">
          <div className="login-card">
            <div className="loading-spinner" />
          </div>
        </div>
        <style jsx>{styles}</style>
      </main>
    }>
      <LoginForm />
    </Suspense>
  )
}

export default LoginPage

const styles = `
  .login-page {
    min-height: 100vh;
    background: var(--background);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .login-container {
    width: 100%;
    max-width: 440px;
    padding: 24px 16px;
    margin: 0 auto;
  }

  .login-card {
    background: var(--surface);
    border-radius: 16px;
    padding: 48px 40px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  }

  .login-header {
    text-align: center;
    margin-bottom: 32px;
  }

  .logo-link {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 24px;
    text-decoration: none;
  }

  .logo-text {
    font-family: var(--font-heading), 'Nunito', sans-serif;
    font-weight: 700;
    font-size: 18px;
    color: var(--primary);
  }

  .login-title {
    font-size: 28px;
    color: var(--text-primary);
    margin-bottom: 8px;
  }

  .login-subtitle {
    font-size: 15px;
    color: var(--text-muted);
    line-height: 1.5;
  }

  .login-hint {
    font-size: 13px;
    color: var(--text-muted);
    margin-top: 12px;
    margin-bottom: 24px;
  }

  .error-banner {
    background: rgba(229, 115, 115, 0.1);
    border: 1px solid rgba(229, 115, 115, 0.3);
    border-radius: 8px;
    padding: 12px 16px;
    font-size: 14px;
    color: #c62828;
    margin-bottom: 20px;
  }

  .login-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .form-label {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
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
    box-sizing: border-box;
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
    margin: 0;
  }

  .btn-submit {
    width: 100%;
    padding: 14px 24px;
    font-size: 16px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    border: none;
  }

  .btn-submit:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  .btn-back {
    width: 100%;
    padding: 12px 24px;
    border-radius: 8px;
    cursor: pointer;
    border: 2px solid var(--border);
    background: transparent;
    color: var(--text-primary);
    font-size: 15px;
    font-weight: 500;
  }

  .spinner {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    flex-shrink: 0;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .success-icon {
    width: 64px;
    height: 64px;
    background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    margin: 0 auto 20px;
  }

  .login-footer {
    margin-top: 24px;
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .footer-text {
    font-size: 14px;
    color: var(--text-muted);
  }

  .footer-link {
    color: var(--primary);
    font-weight: 600;
    text-decoration: none;
  }

  .footer-link:hover {
    text-decoration: underline;
  }

  .footer-secure {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 12px;
    color: var(--text-muted);
    opacity: 0.8;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--border);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin: 40px auto;
  }

  @media (max-width: 480px) {
    .login-card {
      padding: 36px 24px;
    }

    .login-title {
      font-size: 24px;
    }
  }
`
