'use client'

import { useState } from 'react'

const SENSITIVITIES = ['Loud Noises', 'Bright Lights', 'Crowds', 'Textures (Clothing)', 'Textures (Food)', 'Smells']
const TRIGGERS = ['Transitioning activities', 'Unexpected changes', 'Demands', 'Fatigue', 'Hunger', 'Overstimulation']
const STRATEGIES = ['Deep pressure', 'Noise-canceling headphones', 'Quiet dark space', 'Fidget tools', 'Favorite shows/music', 'Space and time']
const WHAT_NOT_TO_DO = [
  'Raised voice or shouting',
  'Forced eye contact',
  'Physical restraint',
  'Ultimatums or threats',
  'Too many questions at once',
  'Taking away comfort objects'
]

type WizardProps = {
  initialName?: string
  initialAge?: string
  onComplete: (data: {
    name: string
    age: string
    sensitivities: string[]
    triggers: string[]
    strategies: string[]
    whatNotToDo: string[]
  }) => void
}

export default function ChildProfileWizard({ initialName = '', initialAge = '', onComplete }: WizardProps) {
  const [step, setStep] = useState(1)
  const [name, setName] = useState(initialName)
  const [age, setAge] = useState(initialAge)
  const [sensitivities, setSensitivities] = useState<string[]>([])
  const [triggers, setTriggers] = useState<string[]>([])
  const [strategies, setStrategies] = useState<string[]>([])
  const [whatNotToDo, setWhatNotToDo] = useState<string[]>([])

  const toggle = (item: string, list: string[], setList: (l: string[]) => void) => {
    setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item])
  }

  const handleFinish = () => {
    onComplete({ name, age, sensitivities, triggers, strategies, whatNotToDo })
  }

  const titles = [
    "Let's set up a profile",
    `What is ${name || 'your child'} sensitive to?`,
    'Any known meltdown triggers?',
    `What helps ${name || 'them'} calm down?`,
    'What should NOT be done?'
  ]

  const subtitles = [
    'This helps personalize guidance during stressful moments.',
    'Select any that apply, or skip for now.',
    "We'll use this to predict behavior patterns.",
    'Select strategies that have worked before.',
    'The AI will never recommend these during a crisis.'
  ]

  return (
    <div className="wizard-container">
      {/* Progress bar */}
      <div className="wizard-progress">
        {[1, 2, 3, 4, 5].map(s => (
          <div key={s} className={`wizard-bar ${step >= s ? 'wizard-bar-active' : ''}`} />
        ))}
      </div>

      <h1 className="wizard-title">{titles[step - 1]}</h1>
      <p className="wizard-subtitle">{subtitles[step - 1]}</p>

      <div className="wizard-body">
        {step === 1 && (
          <div className="wizard-fields">
            <div className="wizard-field">
              <label className="wizard-label">Child&apos;s Name</label>
              <input
                className="wizard-input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Alex"
              />
            </div>
            <div className="wizard-field">
              <label className="wizard-label">Age</label>
              <input
                type="number"
                className="wizard-input"
                value={age}
                onChange={e => setAge(e.target.value)}
                placeholder="e.g. 7"
                min="0"
                max="18"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="wizard-chips">
            {SENSITIVITIES.map(s => (
              <button
                key={s}
                className={`wizard-chip ${sensitivities.includes(s) ? 'wizard-chip-active' : ''}`}
                onClick={() => toggle(s, sensitivities, setSensitivities)}
              >
                {sensitivities.includes(s) && '✓ '}{s}
              </button>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="wizard-chips">
            {TRIGGERS.map(t => (
              <button
                key={t}
                className={`wizard-chip ${triggers.includes(t) ? 'wizard-chip-active' : ''}`}
                onClick={() => toggle(t, triggers, setTriggers)}
              >
                {triggers.includes(t) && '✓ '}{t}
              </button>
            ))}
          </div>
        )}

        {step === 4 && (
          <div className="wizard-chips">
            {STRATEGIES.map(s => (
              <button
                key={s}
                className={`wizard-chip ${strategies.includes(s) ? 'wizard-chip-active' : ''}`}
                onClick={() => toggle(s, strategies, setStrategies)}
              >
                {strategies.includes(s) && '✓ '}{s}
              </button>
            ))}
          </div>
        )}

        {step === 5 && (
          <div className="wizard-chips">
            {WHAT_NOT_TO_DO.map(w => (
              <button
                key={w}
                className={`wizard-chip wizard-chip-danger ${whatNotToDo.includes(w) ? 'wizard-chip-danger-active' : ''}`}
                onClick={() => toggle(w, whatNotToDo, setWhatNotToDo)}
              >
                {whatNotToDo.includes(w) && '✗ '}{w}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="wizard-nav">
        {step > 1 && (
          <button className="wizard-btn wizard-btn-back" onClick={() => setStep(s => s - 1)}>
            Back
          </button>
        )}
        {step < 5 ? (
          <button className="wizard-btn wizard-btn-next" onClick={() => setStep(s => s + 1)}>
            {step === 1 && !name ? 'Skip' : 'Next'}
          </button>
        ) : (
          <button className="wizard-btn wizard-btn-next wizard-btn-finish" onClick={handleFinish}>
            Finish Setup
          </button>
        )}
      </div>

      <style jsx>{`
        .wizard-container {
          background: var(--surface);
          border-radius: 16px;
          padding: 32px;
          max-width: 600px;
          margin: 0 auto;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
        }
        .wizard-progress {
          display: flex;
          gap: 4px;
          margin-bottom: 28px;
        }
        .wizard-bar {
          flex: 1;
          height: 4px;
          border-radius: 4px;
          background: var(--border);
          transition: background 0.3s;
        }
        .wizard-bar-active {
          background: var(--primary);
        }
        .wizard-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 8px;
        }
        .wizard-subtitle {
          font-size: 1rem;
          color: var(--text-muted);
          margin-bottom: 28px;
          line-height: 1.5;
        }
        .wizard-body {
          min-height: 250px;
        }
        .wizard-fields {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .wizard-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .wizard-label {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
        }
        .wizard-input {
          font-size: 1.125rem;
          padding: 16px;
          border: 2px solid var(--border);
          border-radius: 12px;
          background: var(--background);
          color: var(--text-primary);
          transition: border-color 0.15s;
        }
        .wizard-input:focus {
          outline: none;
          border-color: var(--primary);
        }
        .wizard-chips {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .wizard-chip {
          display: block;
          width: 100%;
          text-align: left;
          padding: 16px 20px;
          font-size: 1.05rem;
          border: 2px solid var(--border);
          border-radius: 12px;
          background: var(--surface);
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.15s;
          font-weight: 500;
        }
        .wizard-chip:hover {
          border-color: var(--primary);
          background: rgba(107, 143, 113, 0.05);
        }
        .wizard-chip-active {
          border-color: var(--primary);
          background: rgba(107, 143, 113, 0.1);
          color: var(--primary-dark);
          font-weight: 600;
        }
        .wizard-chip-danger:hover {
          border-color: var(--error, #D47272);
          background: rgba(212, 114, 114, 0.05);
        }
        .wizard-chip-danger-active {
          border-color: var(--error, #D47272);
          background: rgba(212, 114, 114, 0.1);
          color: #b94a4a;
          font-weight: 600;
        }
        .wizard-nav {
          display: flex;
          gap: 12px;
          margin-top: 32px;
        }
        .wizard-btn {
          padding: 16px 24px;
          font-size: 1.125rem;
          font-weight: 600;
          border-radius: 12px;
          cursor: pointer;
          border: none;
          transition: all 0.15s;
        }
        .wizard-btn-back {
          flex: 1;
          background: var(--background);
          color: var(--text-primary);
          border: 1px solid var(--border);
        }
        .wizard-btn-back:hover {
          background: var(--border);
        }
        .wizard-btn-next {
          flex: 2;
          background: var(--primary);
          color: white;
        }
        .wizard-btn-next:hover {
          background: var(--primary-dark);
        }
        .wizard-btn-finish {
          background: var(--success, #81B29A);
        }
        .wizard-btn-finish:hover {
          background: #6a9a83;
        }
        @media (max-width: 600px) {
          .wizard-container {
            padding: 20px;
            border-radius: 12px;
          }
          .wizard-title {
            font-size: 1.4rem;
          }
        }
      `}</style>
    </div>
  )
}
