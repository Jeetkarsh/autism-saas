import { Milestone } from '../../../lib/types/database'

type StatsGridProps = {
  streak: number;
  sessions: number;
  milestones: Milestone[];
}

export default function StatsGrid({ streak, sessions, milestones }: StatsGridProps) {
  const completedMilestones = milestones.filter(m => m.completed).length

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-icon streak-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>
        <div className="stat-content">
          <span className="stat-value">{streak}</span>
          <span className="stat-label">Day Streak</span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon sessions-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <div className="stat-content">
          <span className="stat-value">{sessions}</span>
          <span className="stat-label">Sessions</span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon milestones-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z" />
          </svg>
        </div>
        <div className="stat-content">
          <span className="stat-value">{completedMilestones}/{milestones.length}</span>
          <span className="stat-label">Milestones</span>
        </div>
      </div>
    </div>
  )
}
