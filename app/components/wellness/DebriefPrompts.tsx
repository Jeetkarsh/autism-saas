'use client'

import { useState } from 'react'

const PROMPTS = [
  "What made this episode harder to handle than usual?",
  "Did you spot the early warning signs this time?",
  "What would you tell yourself just before the next one starts?",
  "What part of the guidance felt most natural for you to do?",
  "What's one thing you handled better today than last time?",
  "How did your body feel during the episode? (Tight chest? Racing heart?)",
  "Who could you call next time to get 10 minutes of relief?",
]

export default function DebriefPrompts() {
  const [idx, setIdx] = useState(0)

  return (
    <div className="dp-container">
      <div className="dp-header">
        <span className="dp-icon">📖</span>
        <h3 className="dp-title">Debrief Prompts</h3>
      </div>
      <p className="dp-intro">
        Take a moment after the storm passes. Reflect on one question at a time.
      </p>

      <div className="dp-card">
        <p className="dp-prompt">&ldquo;{PROMPTS[idx]}&rdquo;</p>
      </div>

      <div className="dp-nav">
        <button
          className="dp-btn"
          onClick={() => setIdx(i => (i - 1 + PROMPTS.length) % PROMPTS.length)}
        >
          ← Previous
        </button>
        <button
          className="dp-btn dp-btn-primary"
          onClick={() => setIdx(i => (i + 1) % PROMPTS.length)}
        >
          Next →
        </button>
      </div>
      <p className="dp-counter">{idx + 1} of {PROMPTS.length}</p>

      <style jsx>{`
        .dp-container {
          background: var(--surface);
          border-radius: 16px;
          padding: 28px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
        }
        .dp-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }
        .dp-icon { font-size: 20px; }
        .dp-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }
        .dp-intro {
          font-size: 0.9rem;
          color: var(--text-muted);
          margin-bottom: 20px;
          line-height: 1.5;
        }
        .dp-card {
          background: var(--background);
          border-radius: 12px;
          padding: 24px;
          min-height: 80px;
          display: flex;
          align-items: center;
          margin-bottom: 20px;
        }
        .dp-prompt {
          font-size: 1.05rem;
          line-height: 1.7;
          font-style: italic;
          color: var(--text-primary);
          margin: 0;
        }
        .dp-nav {
          display: flex;
          gap: 12px;
        }
        .dp-btn {
          flex: 1;
          padding: 10px;
          font-size: 0.9rem;
          font-weight: 600;
          border-radius: 10px;
          cursor: pointer;
          border: 1.5px solid var(--border);
          background: var(--surface);
          color: var(--text-primary);
          transition: all 0.15s;
        }
        .dp-btn:hover {
          border-color: var(--primary);
        }
        .dp-btn-primary {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }
        .dp-btn-primary:hover {
          background: var(--primary-dark);
        }
        .dp-counter {
          text-align: center;
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-top: 12px;
        }
      `}</style>
    </div>
  )
}
