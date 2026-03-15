'use client'

import { useState } from 'react'

type Props = {
  onSubmit: (data: { sleepQuality: string; routineChanges: boolean; sensoryEnvironment: string }) => void
  alreadyCheckedIn?: boolean
}

export default function DailyCheckIn({ onSubmit, alreadyCheckedIn = false }: Props) {
  const [sleep, setSleep] = useState('')
  const [routine, setRoutine] = useState(false)
  const [sensory, setSensory] = useState('')
  const [submitted, setSubmitted] = useState(alreadyCheckedIn)

  if (submitted) {
    return (
      <div className="ci-done">
        <span>✅</span>
        <p>Today&apos;s check-in is logged. You&apos;re doing great.</p>
        <style jsx>{`
          .ci-done {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 14px 20px;
            background: rgba(107, 143, 113, 0.08);
            border-radius: 12px;
            font-size: 0.9rem;
            color: var(--text-muted);
          }
        `}</style>
      </div>
    )
  }

  const handleSubmit = () => {
    if (!sleep || !sensory) return
    onSubmit({ sleepQuality: sleep, routineChanges: routine, sensoryEnvironment: sensory })
    setSubmitted(true)
  }

  return (
    <div className="ci-container">
      <div className="ci-header">
        <span className="ci-icon">☀️</span>
        <h3 className="ci-title">Morning Check-in</h3>
      </div>

      <div className="ci-row">
        <label className="ci-label">How did they sleep?</label>
        <div className="ci-options">
          {['Great', 'Okay', 'Bad'].map(q => (
            <button
              key={q}
              className={`ci-opt ${sleep === q ? 'ci-opt-active' : ''}`}
              onClick={() => setSleep(q)}
            >
              {q === 'Great' ? '😴' : q === 'Okay' ? '😐' : '😫'} {q}
            </button>
          ))}
        </div>
      </div>

      <div className="ci-row">
        <label className="ci-label">Any routine changes today?</label>
        <div className="ci-options">
          <button className={`ci-opt ${!routine ? 'ci-opt-active' : ''}`} onClick={() => setRoutine(false)}>No</button>
          <button className={`ci-opt ${routine ? 'ci-opt-active' : ''}`} onClick={() => setRoutine(true)}>Yes</button>
        </div>
      </div>

      <div className="ci-row">
        <label className="ci-label">Sensory environment</label>
        <div className="ci-options">
          {['Calm', 'Loud', 'Hectic'].map(e => (
            <button
              key={e}
              className={`ci-opt ${sensory === e ? 'ci-opt-active' : ''}`}
              onClick={() => setSensory(e)}
            >
              {e === 'Calm' ? '🌿' : e === 'Loud' ? '🔊' : '⚡'} {e}
            </button>
          ))}
        </div>
      </div>

      <button
        className="ci-submit"
        onClick={handleSubmit}
        disabled={!sleep || !sensory}
      >
        Log Check-in
      </button>

      <style jsx>{`
        .ci-container {
          background: var(--surface);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
          margin-bottom: 20px;
        }
        .ci-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
        }
        .ci-icon { font-size: 20px; }
        .ci-title {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }
        .ci-row {
          margin-bottom: 16px;
        }
        .ci-label {
          display: block;
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 8px;
        }
        .ci-options {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .ci-opt {
          padding: 8px 16px;
          font-size: 0.875rem;
          font-weight: 500;
          border: 1.5px solid var(--border);
          border-radius: 10px;
          background: var(--surface);
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.15s;
        }
        .ci-opt:hover { border-color: var(--primary); }
        .ci-opt-active {
          background: rgba(107, 143, 113, 0.1);
          border-color: var(--primary);
          color: var(--primary-dark, var(--primary));
          font-weight: 600;
        }
        .ci-submit {
          width: 100%;
          padding: 12px;
          font-size: 0.95rem;
          font-weight: 600;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.15s;
          margin-top: 4px;
        }
        .ci-submit:hover { background: var(--primary-dark); }
        .ci-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}
