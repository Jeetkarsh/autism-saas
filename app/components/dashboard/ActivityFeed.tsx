import { ActivityLog } from '../../../lib/types/database'

type ActivityFeedProps = {
  logs: ActivityLog[];
}

export default function ActivityFeed({ logs }: ActivityFeedProps) {
  if (logs.length === 0) return null

  return (
    <div className="content-card activity-card">
      <h2 className="card-title">Recent Activity</h2>
      <div className="activity-list">
        {logs.slice(0, 5).map((log) => (
          <div key={log.id} className="activity-item">
            <div className="activity-icon">
              {log.type === 'mood' && '😊'}
              {log.type === 'speech' && '🗣️'}
              {log.type === 'therapy' && '🧩'}
            </div>
            <div className="activity-content">
              <span className="activity-type">{log.type.charAt(0).toUpperCase() + log.type.slice(1)}</span>
              <span className="activity-value">{log.value}</span>
            </div>
            <span className="activity-time">
              {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
