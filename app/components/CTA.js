'use client'

import Link from 'next/link'

export default function CTA() {
  return (
    <section className="cta">
      <div className="container">
        <div className="cta-content">
          <h2 className="cta-title">
            Ready to Start Your
            <span className="text-gradient"> Journey?</span>
          </h2>
          <p className="cta-subtitle">
            Join hundreds of parents who are already tracking their children&apos;s progress
            and building a supportive community. Start your free trial today.
          </p>
          <div className="cta-buttons">
            <Link href="/join" className="btn btn-primary btn-lg">
              Start Free Trial
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </Link>
            <Link href="/resources" className="btn btn-secondary btn-lg">
              Browse Resources
            </Link>
          </div>
          <p className="cta-note">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            No credit card required. Cancel anytime.
          </p>
        </div>
      </div>

      <style jsx>{`
        .cta {
          padding: 100px 0;
          background: linear-gradient(180deg, var(--background) 0%, #F5F0E8 100%);
        }

        .cta-content {
          max-width: 700px;
          margin: 0 auto;
          text-align: center;
        }

        .cta-title {
          font-size: 44px;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 20px;
          line-height: 1.2;
        }

        .cta-subtitle {
          font-size: 18px;
          line-height: 1.7;
          color: var(--text-muted);
          margin-bottom: 40px;
        }

        .cta-buttons {
          display: flex;
          gap: 16px;
          justify-content: center;
          margin-bottom: 24px;
        }

        .btn-lg {
          padding: 18px 36px;
          font-size: 18px;
          border-radius: 24px;
        }

        .btn-lg svg {
          margin-left: 8px;
        }

        .cta-note {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 14px;
          color: var(--text-muted);
        }

        .cta-note svg {
          color: var(--success);
        }

        @media (max-width: 768px) {
          .cta {
            padding: 64px 0;
          }

          .cta-title {
            font-size: 32px;
          }

          .cta-subtitle {
            font-size: 16px;
          }

          .cta-buttons {
            flex-direction: column;
            align-items: center;
          }

          .btn-lg {
            width: 100%;
            max-width: 280px;
          }
        }
      `}</style>
    </section>
  )
}