'use client'

export const dynamic = 'force-dynamic';




import { useEffect, useState } from 'react'
import { createClient } from '../../lib/supabase/client'
import Breadcrumbs from '../components/Breadcrumbs'
import type { Episode, Strategy } from '../../lib/types/database'

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--background)', borderRadius: '4px', overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: '4px', transition: 'width 0.5s ease' }} />
    </div>
  )
}

export default function AnalyticsPage() {
  const supabase = createClient()
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

      const { data: eps } = await supabase
        .from('episodes')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: false })

      const { data: childRow } = await supabase.from('children').select('id').eq('user_id', user.id).limit(1).single()
      let strats: Strategy[] = []
      if (childRow) {
        const { data: s } = await supabase.from('strategies').select('*').eq('child_id', childRow.id)
        strats = s || []
      }

      setEpisodes(eps || [])
      setStrategies(strats)
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Compute analytics
  const totalEpisodes = episodes.length
  const successCount = episodes.filter(e => e.outcome_successful).length
  const successRate = totalEpisodes > 0 ? Math.round((successCount / totalEpisodes) * 100) : 0
  const durationsWithValue = episodes.filter(e => e.duration_minutes != null).map(e => e.duration_minutes!)
  const avgDuration = durationsWithValue.length > 0 ? Math.round(durationsWithValue.reduce((a, b) => a + b, 0) / durationsWithValue.length) : null

  // Trigger counts
  const triggerCounts: Record<string, number> = {}
  episodes.forEach(e => { triggerCounts[e.trigger] = (triggerCounts[e.trigger] || 0) + 1 })
  const maxTrigger = Math.max(...Object.values(triggerCounts), 1)

  // Day-of-week
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const dayCounts: Record<string, number> = {}
  dayNames.forEach(d => { dayCounts[d] = 0 })
  episodes.forEach(e => { const d = dayNames[new Date(e.created_at).getDay()]; dayCounts[d]++ })
  const maxDay = Math.max(...Object.values(dayCounts), 1)

  // Time-of-day
  const timeBuckets: Record<string, number> = { 'Early Morning (5-8)': 0, 'Morning (8-12)': 0, 'Afternoon (12-17)': 0, 'Evening (17-21)': 0, 'Night (21-5)': 0 }
  episodes.forEach(e => {
    const h = new Date(e.created_at).getHours()
    if (h >= 5 && h < 8) timeBuckets['Early Morning (5-8)']++
    else if (h >= 8 && h < 12) timeBuckets['Morning (8-12)']++
    else if (h >= 12 && h < 17) timeBuckets['Afternoon (12-17)']++
    else if (h >= 17 && h < 21) timeBuckets['Evening (17-21)']++
    else timeBuckets['Night (21-5)']++
  })
  const maxTime = Math.max(...Object.values(timeBuckets), 1)

  // Strategy effectiveness
  const sortedStrategies = [...strategies].sort((a, b) => {
    const ra = (a.success_count + a.failure_count) > 0 ? a.success_count / (a.success_count + a.failure_count) : 0
    const rb = (b.success_count + b.failure_count) > 0 ? b.success_count / (b.success_count + b.failure_count) : 0
    return rb - ra
  })

  if (loading) return <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading analytics…</div>

  return (
    <main style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Analytics' }]} />

        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4, color: 'var(--text-primary)' }}>Analytics</h1>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>Last 30 days · Behavioral intelligence report</p>
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <StatCard label="Total Episodes" value={totalEpisodes.toString()} />
          <StatCard label="Success Rate" value={`${successRate}%`} color={successRate >= 60 ? '#10B981' : '#F97316'} />
          <StatCard label="Avg Duration" value={avgDuration ? `${avgDuration}m` : '—'} />
          <StatCard label="Strategies Tracked" value={strategies.length.toString()} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {/* Triggers */}
          <Card title="📊 Common Triggers">
            {Object.keys(triggerCounts).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {Object.entries(triggerCounts).map(([trigger, count]) => (
                  <div key={trigger}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: 4 }}>
                      <span style={{ fontWeight: 500 }}>{trigger}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{count} ({Math.round((count / totalEpisodes) * 100)}%)</span>
                    </div>
                    <MiniBar value={count} max={maxTrigger} color="var(--primary)" />
                  </div>
                ))}
              </div>
            ) : <EmptyMsg text="No trigger data yet." />}
          </Card>

          {/* Day-of-week */}
          <Card title="📅 Day-of-Week Pattern">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.entries(dayCounts).map(([day, count]) => (
                <div key={day}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 3 }}>
                    <span style={{ color: 'var(--text-muted)' }}>{day.slice(0, 3)}</span>
                    <span style={{ fontWeight: 600 }}>{count}</span>
                  </div>
                  <MiniBar value={count} max={maxDay} color="#6366F1" />
                </div>
              ))}
            </div>
          </Card>

          {/* Time-of-day */}
          <Card title="🕐 Time-of-Day Pattern">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Object.entries(timeBuckets).map(([bucket, count]) => {
                const intensity = maxTime > 0 ? count / maxTime : 0
                const alpha = Math.round(intensity * 255).toString(16).padStart(2, '0')
                return (
                  <div key={bucket} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', minWidth: 140 }}>{bucket}</span>
                    <div style={{ flex: 1, height: 32, backgroundColor: `#6366F1${alpha}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.875rem', color: intensity > 0.4 ? 'white' : 'var(--text-primary)' }}>{count}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Strategy effectiveness */}
          <Card title="⚡ Strategy Effectiveness">
            {sortedStrategies.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {sortedStrategies.slice(0, 6).map(s => {
                  const total = s.success_count + s.failure_count
                  const rate = total > 0 ? Math.round((s.success_count / total) * 100) : 0
                  const color = rate >= 70 ? '#10B981' : rate >= 40 ? '#F59E0B' : '#EF4444'
                  return (
                    <div key={s.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: 4 }}>
                        <span style={{ fontWeight: 500, flex: 1, paddingRight: 8 }}>{s.description}</span>
                        <span style={{ fontWeight: 700, color }}>{rate}%</span>
                      </div>
                      <MiniBar value={rate} max={100} color={color} />
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 3 }}>
                        {s.success_count}✓ {s.failure_count}✗ · {total} uses
                      </p>
                    </div>
                  )
                })}
              </div>
            ) : <EmptyMsg text="Complete a few sessions to see which strategies work best." />}
          </Card>
        </div>
      </div>
    </main>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 16, padding: '20px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: '2rem', fontWeight: 700, color: color || 'var(--text-primary)' }}>{value}</p>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 16, padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16 }}>{title}</h3>
      {children}
    </div>
  )
}

function EmptyMsg({ text }: { text: string }) {
  return <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{text}</p>
}
