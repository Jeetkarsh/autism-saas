'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../lib/supabase/client'
import Breadcrumbs from '../components/Breadcrumbs'
import type { Episode } from '../../lib/types/database'

export default function HistoryPage() {
  const supabase = createClient()
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data } = await supabase
        .from('episodes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      setEpisodes(data || [])
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <main style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <div style={{ maxWidth: 750, margin: '0 auto', padding: '32px 24px' }}>
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'History' }]} />

        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4, color: 'var(--text-primary)' }}>
            Pattern History
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>
            Tracking patterns helps us learn what works best over time.
          </p>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading…</p>
        ) : episodes.length === 0 ? (
          <div style={{ background: 'var(--surface)', borderRadius: 16, padding: '3rem', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: '3rem', marginBottom: 12 }}>📋</p>
            <p style={{ color: 'var(--text-muted)' }}>No patterns recorded yet. Episodes logged during crisis sessions will appear here.</p>
          </div>
        ) : (
          <div style={{ position: 'relative', borderLeft: '2px solid var(--border)', marginLeft: 16, paddingLeft: 24 }}>
            {episodes.map(ep => (
              <div key={ep.id} style={{ position: 'relative', marginBottom: 28 }}>
                {/* Timeline dot */}
                <div style={{
                  position: 'absolute',
                  left: -24,
                  transform: 'translateX(-50%)',
                  top: 4,
                  backgroundColor: 'var(--surface)',
                  borderRadius: '50%',
                  padding: 4
                }}>
                  {ep.outcome_successful ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="16 9 10.5 15 8 12.5" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="13" />
                      <circle cx="12" cy="16" r="0.5" fill="#94a3b8" />
                    </svg>
                  )}
                </div>

                <div style={{ background: 'var(--surface)', borderRadius: 14, padding: '18px 22px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: 8 }}>
                    {new Date(ep.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at {new Date(ep.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {ep.duration_minutes && <span> · {ep.duration_minutes}m</span>}
                    {ep.parent_stress_level && <span> · Stress: {ep.parent_stress_level}/5</span>}
                  </p>
                  <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {ep.trigger}
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>→</span>
                    {ep.behavior}
                  </p>
                  {ep.notes && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 8 }}>{ep.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
