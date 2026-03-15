'use client'

import Breadcrumbs from '../components/Breadcrumbs'
import BreathingPlayer from '../components/wellness/BreathingPlayer'
import DebriefPrompts from '../components/wellness/DebriefPrompts'

export default function WellnessPage() {
  return (
    <main className="wellness-page">
      <div className="wellness-container">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Wellness' }]} />

        <div className="wellness-header">
          <h1 className="wellness-title">Your Wellbeing</h1>
          <p className="wellness-subtitle">
            You can&apos;t pour from an empty cup. This space is for you.
          </p>
        </div>

        <div className="wellness-grid">
          <BreathingPlayer />
          <DebriefPrompts />
        </div>
      </div>

      <style jsx>{`
        .wellness-page {
          min-height: 100vh;
          background: var(--background);
        }
        .wellness-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 32px 24px;
        }
        .wellness-header {
          margin-bottom: 32px;
        }
        .wellness-title {
          font-size: 2rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 6px;
          letter-spacing: -0.02em;
        }
        .wellness-subtitle {
          font-size: 1.1rem;
          color: var(--text-muted);
        }
        .wellness-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        @media (max-width: 700px) {
          .wellness-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  )
}
