'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../lib/supabase/client'
import Breadcrumbs from '../components/Breadcrumbs'
import type { ChildProfileAccess, Episode, Strategy } from '../../lib/types/database'

interface TeamMember {
  user_id: string
  email: string
  role: string
}

export default function TeamPage() {
  const supabase = createClient()
  const [childId, setChildId] = useState('')
  const [childName, setChildName] = useState('')
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [email, setEmail] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'episodes' | 'strategies'>('overview')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      // Get child profile
      const { data: child } = await supabase.from('children').select('id, name').eq('user_id', user.id).limit(1).single()
      if (!child) { setLoading(false); return }
      setChildId(child.id)
      setChildName(child.name)

      // Get team access entries
      const { data: access } = await supabase
        .from('child_profile_access')
        .select('user_id, role')
        .eq('child_id', child.id)

      // For the UI we show the user_id and role; in production you'd join to a users/profiles table
      const members: TeamMember[] = (access || []).map((a: ChildProfileAccess) => ({
        user_id: a.user_id,
        email: a.user_id.slice(0, 8) + '…', // placeholder until user profiles table exists
        role: a.role
      }))
      setTeamMembers(members)

      // Get episodes
      const { data: eps } = await supabase
        .from('episodes')
        .select('*')
        .eq('child_id', child.id)
        .order('created_at', { ascending: false })
        .limit(15)
      setEpisodes(eps || [])

      // Get strategies
      const { data: strats } = await supabase.from('strategies').select('*').eq('child_id', child.id)
      setStrategies(strats || [])

      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleInvite = async () => {
    if (!email || !childId) return
    setInviteLoading(true)
    setMessage(null)
    try {
      // Look up user by email (requires a profiles table or auth admin API in production)
      // For demo, we insert directly with a placeholder user_id
      const { error } = await supabase.from('child_profile_access').insert({
        user_id: email, // In production, resolve email → user_id
        child_id: childId,
        role: 'caregiver'
      })
      if (error) {
        setMessage({ text: error.message.includes('duplicate') ? 'This person already has access.' : error.message, type: 'error' })
      } else {
        setMessage({ text: 'Caregiver invited successfully!', type: 'success' })
        setEmail('')
        setTeamMembers(prev => [...prev, { user_id: email, email: email, role: 'caregiver' }])
      }
    } catch {
      setMessage({ text: 'Failed to invite. Please try again.', type: 'error' })
    } finally {
      setInviteLoading(false)
    }
  }

  const ROLE_COLORS: Record<string, string> = {
    primary: '#6366F1',
    caregiver: '#10B981',
    therapist: '#F59E0B',
  }

  const totalEpisodes = episodes.length
  const successRate = totalEpisodes > 0 ? Math.round((episodes.filter(e => e.outcome_successful).length / totalEpisodes) * 100) : 0

  if (loading) return <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading…</div>

  return (
    <main style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Care Team' }]} />

        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4, color: 'var(--text-primary)' }}>Care Team</h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>
            {childName ? `Shared view for ${childName} · ${teamMembers.length} team member${teamMembers.length !== 1 ? 's' : ''}` : 'Shared insights and care coordination.'}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>
          {/* Left: Shared data */}
          <div>
            {/* Tab bar */}
            <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 16 }}>
              {(['overview', 'episodes', 'strategies'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '6px 14px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    border: '1.5px solid',
                    borderColor: activeTab === tab ? 'var(--primary)' : 'var(--border)',
                    borderRadius: 8,
                    background: activeTab === tab ? 'var(--primary)' : 'var(--surface)',
                    color: activeTab === tab ? 'white' : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    textTransform: 'capitalize'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === 'overview' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
                <div style={{ background: 'var(--surface)', borderRadius: 14, padding: 18, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>Total Episodes</p>
                  <p style={{ fontSize: '2rem', fontWeight: 700 }}>{totalEpisodes}</p>
                </div>
                <div style={{ background: 'var(--surface)', borderRadius: 14, padding: 18, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>Success Rate</p>
                  <p style={{ fontSize: '2rem', fontWeight: 700, color: successRate >= 60 ? '#10B981' : '#F97316' }}>{successRate}%</p>
                </div>
              </div>
            )}

            {activeTab === 'episodes' && (
              <div>
                {episodes.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', padding: '2rem 0' }}>No episodes logged yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {episodes.map(ep => (
                      <div key={ep.id} style={{ background: 'var(--surface)', borderRadius: 12, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 2 }}>{ep.trigger} → {ep.behavior}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {new Date(ep.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            {ep.duration_minutes && ` · ${ep.duration_minutes}m`}
                          </p>
                        </div>
                        {ep.outcome_successful ? (
                          <span style={{ color: '#10B981', fontWeight: 700 }}>✓</span>
                        ) : (
                          <span style={{ color: '#EF4444', fontWeight: 700 }}>✗</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'strategies' && (
              <div>
                {strategies.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', padding: '2rem 0' }}>No strategy data yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {strategies.map(s => {
                      const total = s.success_count + s.failure_count
                      const rate = total > 0 ? Math.round((s.success_count / total) * 100) : 0
                      const color = rate >= 70 ? '#10B981' : rate >= 40 ? '#F59E0B' : '#EF4444'
                      return (
                        <div key={s.id} style={{ background: 'var(--surface)', borderRadius: 12, padding: '14px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{s.description}</span>
                            <span style={{ fontWeight: 700, color }}>{rate}%</span>
                          </div>
                          <div style={{ width: '100%', height: 6, background: 'var(--background)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${rate}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.5s' }} />
                          </div>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{s.success_count}✓ {s.failure_count}✗ · {total} uses</p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Team members + invite */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Team members list */}
            {teamMembers.length > 0 && (
              <div style={{ background: 'var(--surface)', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <h3 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  👥 Team Members
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {teamMembers.map((m, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 10, background: 'var(--background)' }}>
                      <span style={{ fontSize: '0.825rem', fontWeight: 500 }}>{m.email}</span>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: 100,
                        backgroundColor: `${ROLE_COLORS[m.role] || '#6B7280'}20`,
                        color: ROLE_COLORS[m.role] || '#6B7280',
                        textTransform: 'capitalize'
                      }}>
                        {m.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Invite form */}
            <div style={{ background: 'var(--surface)', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <h3 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                ✉️ Invite a Caregiver
              </h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: 14 }}>
                Inviting gives them read and write access to {childName || 'your child'}&apos;s data.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input
                  type="email"
                  placeholder="their@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{
                    padding: '10px 14px',
                    border: '1.5px solid var(--border)',
                    borderRadius: 10,
                    background: 'var(--background)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem'
                  }}
                />
                <button
                  onClick={handleInvite}
                  disabled={inviteLoading || !email}
                  style={{
                    padding: '10px',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    background: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 10,
                    cursor: inviteLoading || !email ? 'not-allowed' : 'pointer',
                    opacity: inviteLoading || !email ? 0.5 : 1,
                    transition: 'all 0.15s'
                  }}
                >
                  {inviteLoading ? 'Sending…' : 'Send Invite'}
                </button>
              </div>
              {message && (
                <div style={{
                  marginTop: 12,
                  padding: '10px 14px',
                  borderRadius: 10,
                  backgroundColor: message.type === 'success' ? '#F0FDF4' : '#FEF2F2',
                  color: message.type === 'success' ? '#065F46' : '#991B1B',
                  fontSize: '0.825rem',
                  fontWeight: 500
                }}>
                  {message.text}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
