'use client'

import { useState } from 'react'

interface Episode {
  id: string
  trigger: string
  behavior: string
  strategies_used: string[]
  strategies_effective: string[]
  outcome_successful: boolean
  duration_minutes: number | null
  created_at: string
  notes: string | null
}

interface Strategy {
  id: string
  description: string
  category: string
  success_count: number
  failure_count: number
  last_used: string | null
  notes: string | null
}

interface ChildData {
  id: string
  name: string
  age: number | null
  sensitivities: string[]
  triggers: string[]
  strategies: string[]
  what_not_to_do: string[]
  created_at: string
}

interface Assignment {
  child: ChildData
  access: { granted_at: string }
  recent_episodes: Episode[]
  strategies: Strategy[]
  stats: {
    episodes_last_30d: number
    strategies_count: number
    check_ins_last_7d: number
    avg_strategies_per_episode: number
  }
}

interface Props {
  assignments: Assignment[]
  therapistName: string
  isEmpty: boolean
}

type ActiveTab = 'overview' | 'episodes' | 'strategies'

export default function TherapistPortalClient({ assignments, therapistName, isEmpty }: Props) {
  const [selectedChildId, setSelectedChildId] = useState<string | null>(
    assignments.length > 0 ? assignments[0].child.id : null
  )
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview')
  const [newNote, setNewNote] = useState('')
  const [newSuggestion, setNewSuggestion] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [noteSaved, setNoteSaved] = useState(false)
  const [savingSuggestion, setSavingSuggestion] = useState(false)
  const [suggestionSaved, setSuggestionSaved] = useState(false)

  const selectedChild = assignments.find((a) => a.child.id === selectedChildId)

  const handleSaveNote = async () => {
    if (!newNote.trim() || !selectedChildId) return
    setSavingNote(true)
    try {
      const res = await fetch('/api/therapist/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ child_id: selectedChildId, content: newNote }),
      })
      if (res.ok) {
        setNewNote('')
        setNoteSaved(true)
        setTimeout(() => setNoteSaved(false), 3000)
      }
    } finally {
      setSavingNote(false)
    }
  }

  const handleSaveSuggestion = async () => {
    if (!newSuggestion.trim() || !selectedChildId) return
    setSavingSuggestion(true)
    try {
      const res = await fetch(`/api/therapist/assignments?childId=${selectedChildId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy_suggestions: [newSuggestion] }),
      })
      if (res.ok) {
        setNewSuggestion('')
        setSuggestionSaved(true)
        setTimeout(() => setSuggestionSaved(false), 3000)
      }
    } finally {
      setSavingSuggestion(false)
    }
  }

  if (isEmpty) {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--background)', padding: '2rem' }}>
        <div style={{ maxWidth: 640, margin: '4rem auto', textAlign: 'center' }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5" style={{ margin: '0 auto 1.5rem' }}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
            Welcome, {therapistName}
          </h1>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
            No families have assigned you yet. Share your therapist code with families to get started — they&apos;ll add you to their care team from their settings.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 4 }}>Therapist Portal</p>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Welcome back, {therapistName}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {assignments.length} family{assignments.length !== 1 ? 'ies' : ''} assigned to you
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Left: Child selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <h2 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 12 }}>
                Your Families
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {assignments.map((a) => (
                  <button
                    key={a.child.id}
                    onClick={() => { setSelectedChildId(a.child.id); setActiveTab('overview') }}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 12,
                      border: 'none',
                      background: selectedChildId === a.child.id ? 'var(--primary)' : 'var(--background)',
                      color: selectedChildId === a.child.id ? 'white' : 'var(--text-primary)',
                      fontWeight: selectedChildId === a.child.id ? 600 : 500,
                      fontSize: '0.9rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{a.child.name}</div>
                    <div style={{ fontSize: '0.75rem', opacity: selectedChildId === a.child.id ? 0.8 : 0.6, marginTop: 2 }}>
                      {a.stats.episodes_last_30d} episodes · {a.stats.check_ins_last_7d} check-ins/wk
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Detail panel */}
          {selectedChild ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Child header */}
              <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                      {selectedChild.child.name}
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      {selectedChild.child.age ? `Age ${selectedChild.child.age}` : 'Age not set'}
                      {selectedChild.access.granted_at && (
                        <> · Added {new Date(selectedChild.access.granted_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</>
                      )}
                    </p>
                  </div>
                </div>

                {/* Key info grid */}
                <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                  <div style={{ background: 'var(--background)', borderRadius: 12, padding: '14px 16px' }}>
                    <p style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 4 }}>Episodes (30d)</p>
                    <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>{selectedChild.stats.episodes_last_30d}</p>
                  </div>
                  <div style={{ background: 'var(--background)', borderRadius: 12, padding: '14px 16px' }}>
                    <p style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 4 }}>Check-ins (7d)</p>
                    <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>{selectedChild.stats.check_ins_last_7d}</p>
                  </div>
                  <div style={{ background: 'var(--background)', borderRadius: 12, padding: '14px 16px' }}>
                    <p style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 4 }}>Avg Strategies</p>
                    <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>{selectedChild.stats.avg_strategies_per_episode}</p>
                  </div>
                  <div style={{ background: 'var(--background)', borderRadius: 12, padding: '14px 16px' }}>
                    <p style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 4 }}>Strategies</p>
                    <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>{selectedChild.stats.strategies_count}</p>
                  </div>
                </div>
              </div>

              {/* Care context */}
              {(selectedChild.child.sensitivities?.length > 0 || selectedChild.child.triggers?.length > 0 || selectedChild.child.what_not_to_do?.length > 0) && (
                <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 14, color: 'var(--text-primary)' }}>Care Context</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {selectedChild.child.sensitivities?.length > 0 && (
                      <div>
                        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>🔅 SENSITIVITIES</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {selectedChild.child.sensitivities.map((s) => (
                            <span key={s} style={{ background: '#FEF9C3', color: '#854D0E', padding: '4px 10px', borderRadius: 100, fontSize: '0.8rem', fontWeight: 500 }}>{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedChild.child.triggers?.length > 0 && (
                      <div>
                        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>⚡ TRIGGERS</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {selectedChild.child.triggers.map((t) => (
                            <span key={t} style={{ background: '#FEE2E2', color: '#991B1B', padding: '4px 10px', borderRadius: 100, fontSize: '0.8rem', fontWeight: 500 }}>{t}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedChild.child.what_not_to_do?.length > 0 && (
                      <div>
                        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>🚫 WHAT NOT TO DO</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {selectedChild.child.what_not_to_do.map((n) => (
                            <span key={n} style={{ background: '#F3F4F6', color: '#374151', padding: '4px 10px', borderRadius: 100, fontSize: '0.8rem', fontWeight: 500 }}>{n}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div style={{ background: 'var(--surface)', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
                  {(['overview', 'episodes', 'strategies'] as ActiveTab[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      style={{
                        flex: 1,
                        padding: '14px 16px',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        border: 'none',
                        borderBottom: activeTab === tab ? '2.5px solid var(--primary)' : '2.5px solid transparent',
                        background: 'transparent',
                        color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        textTransform: 'capitalize',
                      }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div style={{ padding: 24 }}>
                  {activeTab === 'overview' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {/* Strategy suggestions form */}
                      <div style={{ background: 'var(--background)', borderRadius: 12, padding: 18 }}>
                        <h4 style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4 }}>💡 Suggest a Strategy</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                          Recommend a strategy the family can try. It will appear in their strategies list.
                        </p>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input
                            type="text"
                            placeholder="e.g., Use visual schedule for transitions"
                            value={newSuggestion}
                            onChange={(e) => setNewSuggestion(e.target.value)}
                            style={{ flex: 1, padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10, background: 'var(--surface)', color: 'var(--text-primary)', fontSize: '0.875rem' }}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveSuggestion()}
                          />
                          <button
                            onClick={handleSaveSuggestion}
                            disabled={!newSuggestion.trim() || savingSuggestion}
                            style={{
                              padding: '10px 18px',
                              background: newSuggestion.trim() ? 'var(--primary)' : 'var(--border)',
                              color: 'white',
                              border: 'none',
                              borderRadius: 10,
                              fontWeight: 600,
                              fontSize: '0.875rem',
                              cursor: newSuggestion.trim() && !savingSuggestion ? 'pointer' : 'not-allowed',
                              opacity: savingSuggestion ? 0.7 : 1,
                              transition: 'all 0.15s',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {savingSuggestion ? 'Saving…' : 'Suggest'}
                          </button>
                        </div>
                        {suggestionSaved && (
                          <p style={{ color: '#059669', fontSize: '0.8rem', marginTop: 8 }}>✓ Strategy suggestion saved</p>
                        )}
                      </div>

                      {/* Add note form */}
                      <div style={{ background: 'var(--background)', borderRadius: 12, padding: 18 }}>
                        <h4 style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4 }}>📝 Clinical Notes</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                          Private notes visible only to you. Document observations, session summaries, or recommendations.
                        </p>
                        <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
                          <textarea
                            placeholder="Write a clinical note about this child..."
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            rows={3}
                            style={{ width: '100%', padding: '12px 14px', border: '1.5px solid var(--border)', borderRadius: 10, background: 'var(--surface)', color: 'var(--text-primary)', fontSize: '0.875rem', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                          />
                          <button
                            onClick={handleSaveNote}
                            disabled={!newNote.trim() || savingNote}
                            style={{
                              padding: '10px 18px',
                              background: newNote.trim() ? 'var(--primary)' : 'var(--border)',
                              color: 'white',
                              border: 'none',
                              borderRadius: 10,
                              fontWeight: 600,
                              fontSize: '0.875rem',
                              cursor: newNote.trim() && !savingNote ? 'pointer' : 'not-allowed',
                              opacity: savingNote ? 0.7 : 1,
                              transition: 'all 0.15s',
                              alignSelf: 'flex-end',
                            }}
                          >
                            {savingNote ? 'Saving…' : 'Save Note'}
                          </button>
                        </div>
                        {noteSaved && (
                          <p style={{ color: '#059669', fontSize: '0.8rem', marginTop: 8 }}>✓ Note saved privately</p>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'episodes' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {selectedChild.recent_episodes.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>No episodes logged in the last 30 days.</p>
                      ) : (
                        selectedChild.recent_episodes.map((ep) => (
                          <div key={ep.id} style={{ background: 'var(--background)', borderRadius: 12, padding: '16px 18px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                              <div>
                                <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                  {ep.trigger} → {ep.behavior}
                                </p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                  {new Date(ep.created_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                  {ep.duration_minutes && ` · ${ep.duration_minutes}m`}
                                  {ep.outcome_successful ? (
                                    <span style={{ color: '#059669', marginLeft: 8 }}>✓ Resolved</span>
                                  ) : (
                                    <span style={{ color: '#DC2626', marginLeft: 8 }}>✗ Unresolved</span>
                                  )}
                                </p>
                              </div>
                            </div>
                            {ep.strategies_used?.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                                {ep.strategies_used.map((s) => (
                                  <span key={s} style={{ background: 'var(--surface)', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: 6, fontSize: '0.75rem' }}>{s}</span>
                                ))}
                              </div>
                            )}
                            {ep.notes && (
                              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8, fontStyle: 'italic' }}>{ep.notes}</p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === 'strategies' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {selectedChild.strategies.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>No strategies documented yet.</p>
                      ) : (
                        selectedChild.strategies.map((s) => {
                          const total = s.success_count + s.failure_count
                          const rate = total > 0 ? Math.round((s.success_count / total) * 100) : 0
                          const color = rate >= 70 ? '#059669' : rate >= 40 ? '#D97706' : '#DC2626'
                          return (
                            <div key={s.id} style={{ background: 'var(--background)', borderRadius: 12, padding: '16px 18px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <span style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{s.description}</span>
                                <span style={{ fontWeight: 700, color, fontSize: '0.9rem' }}>{rate}%</span>
                              </div>
                              <div style={{ width: '100%', height: 6, background: 'var(--surface)', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ width: `${rate}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.5s' }} />
                              </div>
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                {s.success_count}✓ {s.failure_count}✗ · {total} uses
                                {s.last_used && ` · Last used ${new Date(s.last_used).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`}
                              </p>
                            </div>
                          )
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
              Select a family to view their details.
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
