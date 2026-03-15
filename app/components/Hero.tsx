'use client'

import Link from 'next/link'

export default function Hero() {
  return (
    <section className="hero">
      <div className="container">
        <div className="hero-content">
          <div className="hero-text">
            <div className="trust-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <span>Trusted by 500+ parents</span>
            </div>
            <h1 className="hero-title">
              Track Your Child&apos;s Progress with
              <span className="text-gradient"> Confidence</span>
            </h1>
            <p className="hero-subtitle">
              AutismConnect helps parents of autistic children track daily progress,
              access curated resources, and connect with a supportive community.
              Start your journey today.
            </p>
            <div className="hero-ctas">
              <Link href="/join" className="btn btn-primary btn-lg">
                Start Free Trial
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </Link>
              <Link href="#features" className="btn btn-secondary btn-lg">
                Learn More
              </Link>
            </div>
            <div className="hero-stats">
              <div className="stat">
                <span className="stat-number">500+</span>
                <span className="stat-label">Families</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat">
                <span className="stat-number">10K+</span>
                <span className="stat-label">Sessions</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat">
                <span className="stat-number">200+</span>
                <span className="stat-label">Resources</span>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-illustration">
              <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Background circle */}
                <circle cx="200" cy="200" r="180" fill="#F4A261" fillOpacity="0.1"/>
                <circle cx="200" cy="200" r="140" fill="#6B8F71" fillOpacity="0.1"/>

                {/* Main card */}
                <rect x="80" y="100" width="240" height="200" rx="16" fill="white" stroke="#E8E4DE" strokeWidth="2"/>

                {/* Card header */}
                <rect x="80" y="100" width="240" height="48" rx="16" fill="#6B8F71" fillOpacity="0.1"/>
                <circle cx="120" cy="124" r="12" fill="#6B8F71"/>
                <rect x="145" y="118" width="80" height="12" rx="4" fill="#E8E4DE"/>
                <rect x="240" y="118" width="50" height="12" rx="4" fill="#81B29A"/>

                {/* Progress bars */}
                <rect x="100" y="170" width="200" height="8" rx="4" fill="#E8E4DE"/>
                <rect x="100" y="170" width="140" height="8" rx="4" fill="#6B8F71"/>

                <rect x="100" y="195" width="200" height="8" rx="4" fill="#E8E4DE"/>
                <rect x="100" y="195" width="100" height="8" rx="4" fill="#F4A261"/>

                <rect x="100" y="220" width="200" height="8" rx="4" fill="#E8E4DE"/>
                <rect x="100" y="220" width="160" height="8" rx="4" fill="#E9C46A"/>

                {/* Streak badge */}
                <circle cx="300" cy="280" r="40" fill="#6B8F71"/>
                <text x="300" y="285" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">7</text>
                <text x="300" y="300" textAnchor="middle" fill="white" fontSize="8">DAY STREAK</text>

                {/* Floating elements */}
                <circle cx="60" cy="150" r="8" fill="#E9C46A"/>
                <circle cx="340" cy="250" r="8" fill="#F4A261"/>
                <circle cx="350" cy="120" r="6" fill="#6B8F71"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .hero {
          padding: 80px 0;
          min-height: 90vh;
          display: flex;
          align-items: center;
          background: linear-gradient(180deg, var(--background) 0%, #F5F0E8 100%);
        }

        .hero-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 64px;
          align-items: center;
        }

        .hero-text {
          max-width: 560px;
        }

        .trust-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background-color: white;
          padding: 8px 16px;
          border-radius: 24px;
          font-size: 14px;
          font-weight: 500;
          color: var(--secondary);
          margin-bottom: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .trust-badge svg {
          color: var(--accent);
        }

        .hero-title {
          font-size: 52px;
          font-weight: 800;
          line-height: 1.1;
          color: var(--text-primary);
          margin-bottom: 24px;
        }

        .hero-subtitle {
          font-size: 18px;
          line-height: 1.7;
          color: var(--text-muted);
          margin-bottom: 32px;
        }

        .hero-ctas {
          display: flex;
          gap: 16px;
          margin-bottom: 48px;
        }

        .btn-lg {
          padding: 16px 32px;
          font-size: 18px;
          border-radius: 24px;
        }

        .btn-lg svg {
          margin-left: 8px;
        }

        .hero-stats {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .stat {
          display: flex;
          flex-direction: column;
        }

        .stat-number {
          font-size: 28px;
          font-weight: 700;
          color: var(--primary);
        }

        .stat-label {
          font-size: 14px;
          color: var(--text-muted);
        }

        .stat-divider {
          width: 1px;
          height: 40px;
          background-color: var(--border);
        }

        .hero-visual {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .hero-illustration {
          width: 100%;
          max-width: 480px;
          animation: float 6s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @media (max-width: 1024px) {
          .hero-content {
            grid-template-columns: 1fr;
            gap: 48px;
            text-align: center;
          }

          .hero-text {
            max-width: 100%;
          }

          .hero-ctas {
            justify-content: center;
          }

          .hero-stats {
            justify-content: center;
          }

          .hero-title {
            font-size: 42px;
          }
        }

        @media (max-width: 768px) {
          .hero {
            padding: 48px 0;
            min-height: auto;
          }

          .hero-title {
            font-size: 36px;
          }

          .hero-subtitle {
            font-size: 16px;
          }

          .hero-ctas {
            flex-direction: column;
            align-items: center;
          }

          .btn-lg {
            width: 100%;
            max-width: 280px;
          }

          .hero-stats {
            flex-wrap: wrap;
            gap: 16px;
          }

          .stat-divider {
            display: none;
          }

          .hero-visual {
            display: none;
          }
        }
      `}</style>
    </section>
  )
}