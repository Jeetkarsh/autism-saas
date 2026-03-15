'use client'

import { useState, useEffect } from 'react'

const EXERCISES = [
  {
    name: '4-7-8 Breathing',
    description: 'Inhale 4s · Hold 7s · Exhale 8s',
    detail: 'Activates the parasympathetic nervous system. Best for acute stress.',
    inhale: 4, hold: 7, exhale: 8
  },
  {
    name: 'Box Breathing',
    description: 'Inhale 4s · Hold 4s · Exhale 4s',
    detail: 'Used by Navy SEALs. Balances the nervous system quickly.',
    inhale: 4, hold: 4, exhale: 4
  },
  {
    name: 'Quick Reset',
    description: 'Inhale 3s · Exhale 6s',
    detail: 'When you only have a moment. Longer exhale activates the vagus nerve.',
    inhale: 3, hold: 0, exhale: 6
  }
]

type Phase = 'idle' | 'inhale' | 'hold' | 'exhale'

export default function BreathingPlayer() {
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [phase, setPhase] = useState<Phase>('idle')
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)

  const exercise = EXERCISES[selectedIdx]

  useEffect(() => {
    if (!running) return
    const interval = setInterval(() => {
      setSeconds(s => {
        const next = s - 1
        if (next <= 0) {
          setPhase(prev => {
            if (prev === 'inhale') {
              setSeconds(exercise.hold || exercise.exhale)
              return exercise.hold ? 'hold' : 'exhale'
            }
            if (prev === 'hold') {
              setSeconds(exercise.exhale)
              return 'exhale'
            }
            if (prev === 'exhale') {
              setSeconds(exercise.inhale)
              return 'inhale'
            }
            return prev
          })
          return s
        }
        return next
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [running, exercise])

  const start = () => {
    setPhase('inhale')
    setSeconds(exercise.inhale)
    setRunning(true)
  }

  const stop = () => {
    setPhase('idle')
    setRunning(false)
  }

  const phaseColors: Record<Phase, string> = {
    idle: 'var(--primary)',
    inhale: '#3B82F6',
    hold: '#8B5CF6',
    exhale: '#10B981'
  }

  const phaseLabels: Record<Phase, string> = {
    idle: 'Ready',
    inhale: 'Breathe In',
    hold: 'Hold',
    exhale: 'Breathe Out'
  }

  const circleScale = phase === 'inhale' ? 1.25 : phase === 'exhale' ? 0.8 : 1

  return (
    <div className="bp-container">
      <div className="bp-header">
        <span className="bp-icon">🌬️</span>
        <h3 className="bp-title">Breathing Exercises</h3>
      </div>

      {/* Exercise picker */}
      <div className="bp-picker">
        {EXERCISES.map((ex, i) => (
          <button
            key={ex.name}
            className={`bp-tab ${selectedIdx === i ? 'bp-tab-active' : ''}`}
            onClick={() => { setSelectedIdx(i); stop() }}
          >
            {ex.name}
          </button>
        ))}
      </div>

      <p className="bp-desc">{exercise.description}</p>
      <p className="bp-detail">{exercise.detail}</p>

      {/* Animated circle */}
      <div className="bp-circle-area">
        <div
          className="bp-circle"
          style={{
            backgroundColor: phaseColors[phase],
            transform: `scale(${circleScale})`,
            boxShadow: `0 0 40px ${phaseColors[phase]}40`,
          }}
        >
          <span className="bp-countdown">{running ? seconds : ''}</span>
        </div>
        <p className="bp-phase" style={{ color: phaseColors[phase] }}>
          {phaseLabels[phase]}
        </p>
      </div>

      {!running ? (
        <button className="bp-btn bp-btn-start" onClick={start}>Start</button>
      ) : (
        <button className="bp-btn bp-btn-stop" onClick={stop}>Stop</button>
      )}

      <style jsx>{`
        .bp-container {
          background: var(--surface);
          border-radius: 16px;
          padding: 28px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
        }
        .bp-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
        }
        .bp-icon { font-size: 20px; }
        .bp-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }
        .bp-picker {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .bp-tab {
          padding: 6px 14px;
          font-size: 0.85rem;
          font-weight: 600;
          border: 1.5px solid var(--border);
          border-radius: 8px;
          background: var(--surface);
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.15s;
        }
        .bp-tab:hover { border-color: var(--primary); }
        .bp-tab-active {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }
        .bp-desc {
          font-size: 0.9rem;
          color: var(--text-muted);
          margin-bottom: 4px;
        }
        .bp-detail {
          font-size: 0.825rem;
          color: var(--text-muted);
          margin-bottom: 24px;
          opacity: 0.8;
        }
        .bp-circle-area {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 20px 0;
        }
        .bp-circle {
          width: 110px;
          height: 110px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.8s ease, background-color 0.5s ease, box-shadow 0.5s ease;
        }
        .bp-countdown {
          color: white;
          font-weight: 700;
          font-size: 1.5rem;
        }
        .bp-phase {
          font-weight: 600;
          font-size: 1rem;
          margin: 0;
          transition: color 0.3s;
        }
        .bp-btn {
          display: block;
          width: 100%;
          padding: 12px;
          font-size: 1rem;
          font-weight: 600;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.15s;
          margin-top: 8px;
        }
        .bp-btn-start {
          background: var(--primary);
          color: white;
        }
        .bp-btn-start:hover { background: var(--primary-dark); }
        .bp-btn-stop {
          background: var(--background);
          color: var(--text-primary);
          border: 1px solid var(--border);
        }
        .bp-btn-stop:hover { background: var(--border); }
      `}</style>
    </div>
  )
}
