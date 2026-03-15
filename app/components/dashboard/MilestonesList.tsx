import { Milestone } from '../../../lib/types/database'

type MilestonesListProps = {
  milestones: Milestone[];
}

export default function MilestonesList({ milestones }: MilestonesListProps) {
  return (
    <div className="content-card milestones-card">
      <h2 className="card-title">Milestones</h2>
      <p className="card-subtitle">Track your achievements</p>

      <div className="milestones-list">
        {milestones.map((milestone) => (
          <div
            key={milestone.id}
            className={`milestone-item ${milestone.completed ? 'completed' : ''}`}
          >
            <div className="milestone-check">
              {milestone.completed ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <div className="milestone-empty"></div>
              )}
            </div>
            <span className="milestone-title">{milestone.title}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
