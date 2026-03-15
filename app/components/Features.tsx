'use client'

const features = [
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
    title: 'Progress Tracking',
    description: 'Track your child\'s daily milestones, speech attempts, and therapy activities with easy-to-use logging tools.',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
    ),
    title: 'Resource Library',
    description: 'Access curated articles, videos, and worksheets vetted by experts to support your child\'s development.',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: 'Community Support',
    description: 'Connect with other parents who understand your journey. Share experiences and find encouragement.',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
    title: 'Streak Rewards',
    description: 'Stay motivated with daily check-ins and track your consistency streak. Celebrate every small victory.',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    title: 'Daily Reminders',
    description: 'Never miss a session with gentle reminders. Set custom notifications for activities that matter.',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
    title: 'Visual Progress',
    description: 'See progress at a glance with beautiful charts and visualizations. Understand patterns over time.',
  },
]

export default function Features() {
  return (
    <section id="features" className="features">
      <div className="container">
        <div className="features-header">
          <span className="section-label">Features</span>
          <h2 className="section-title">
            Everything You Need to Support
            <span className="text-gradient"> Your Child</span>
          </h2>
          <p className="section-subtitle">
            Powerful tools designed specifically for parents of autistic children.
            Simple, intuitive, and effective.
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card" style={{ animationDelay: `${index * 100}ms` }}>
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .features {
          padding: 100px 0;
          background-color: var(--surface);
        }

        .features-header {
          text-align: center;
          max-width: 640px;
          margin: 0 auto 64px;
        }

        .section-label {
          display: inline-block;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--primary);
          margin-bottom: 16px;
        }

        .section-title {
          font-size: 40px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 16px;
          line-height: 1.2;
        }

        .section-subtitle {
          font-size: 18px;
          color: var(--text-muted);
          line-height: 1.6;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
        }

        .feature-card {
          background-color: var(--background);
          padding: 32px;
          border-radius: 16px;
          border: 1px solid var(--border);
          transition: all 0.3s ease;
          animation: fadeInUp 0.5s ease-out forwards;
          opacity: 0;
        }

        .feature-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 32px rgba(107, 143, 113, 0.12);
          border-color: var(--primary);
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .feature-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 64px;
          height: 64px;
          background-color: var(--primary);
          background-opacity: 0.1;
          border-radius: 16px;
          margin-bottom: 20px;
          color: white;
          background-color: var(--primary);
        }

        .feature-title {
          font-size: 20px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 12px;
        }

        .feature-description {
          font-size: 15px;
          color: var(--text-muted);
          line-height: 1.6;
        }

        @media (max-width: 1024px) {
          .features-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .features {
            padding: 64px 0;
          }

          .features-header {
            margin-bottom: 48px;
          }

          .section-title {
            font-size: 32px;
          }

          .section-subtitle {
            font-size: 16px;
          }

          .features-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .feature-card {
            padding: 24px;
          }
        }
      `}</style>
    </section>
  )
}