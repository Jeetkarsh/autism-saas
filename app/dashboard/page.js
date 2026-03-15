'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Dashboard() {
  const [isClient, setIsClient] = useState(false)
  const [childName, setChildName] = useState('')
  const [childAge, setChildAge] = useState('')
  const [isEditing, setIsEditing] = useState(true)
  const [streak, setStreak] = useState(0)
  const [sessions, setSessions] = useState(0)
  const [milestones, setMilestones] = useState([])
  const [logs, setLogs] = useState([])
  const [showLogSuccess, setShowLogSuccess] = useState(false)

  useEffect(() => {
    setIsClient(true)

    // Load data from localStorage
    const savedName = localStorage.getItem('child_name')
    const savedAge = localStorage.getItem('child_age')
    const savedStreak = localStorage.getItem('dashboard_streak')
    const savedSessions = localStorage.getItem('dashboard_sessions')
    const savedMilestones = localStorage.getItem('dashboard_milestones')
    const savedLogs = localStorage.getItem('dashboard_logs')
    const lastVisit = localStorage.getItem('last_visit_date')
    const today = new Date().toDateString()

    if (savedName) {
      setChildName(savedName)
      setChildAge(savedAge || '')
      setIsEditing(false)
    }

    // Check streak
    if (lastVisit) {
      const lastVisitDate = new Date(lastVisit)
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      if (lastVisit === today) {
        // Already visited today
        setStreak(parseInt(savedStreak) || 0)
      } else if (lastVisitDate.toDateString() === yesterday.toDateString()) {
        // Visited yesterday, increment streak
        const newStreak = (parseInt(savedStreak) || 0) + 1
        setStreak(newStreak)
        localStorage.setItem('dashboard_streak', newStreak.toString())
      } else {
        // Streak broken, reset to 1
        setStreak(1)
        localStorage.setItem('dashboard_streak', '1')
      }
    } else {
      // First visit
      setStreak(1)
      localStorage.setItem('dashboard_streak', '1')
    }

    localStorage.setItem('last_visit_date', today)

    // Load other data
    setSessions(parseInt(savedSessions) || 0)
    setMilestones(savedMilestones ? JSON.parse(savedMilestones) : [
      { id: 1, title: 'First Check-in', completed: false },
      { id: 2, title: '7-Day Streak', completed: false },
      { id: 3, title: '10 Sessions', completed: false },
      { id: 4, title: 'First Activity Log', completed: false },
      { id: 5, title: 'Explore Resources', completed: false }
    ])
    setLogs(savedLogs ? JSON.parse(savedLogs) : [])
  }, [])

  const saveProfile = () => {
    if (!childName.trim()) return

    localStorage.setItem('child_name', childName)
    if (childAge) localStorage.setItem('child_age', childAge)
    setIsEditing(false)

    // Mark first milestone as complete
    const updatedMilestones = [...milestones]
    if (!updatedMilestones[0].completed) {
      updatedMilestones[0].completed = true
      setMilestones(updatedMilestones)
      localStorage.setItem('dashboard_milestones', JSON.stringify(updatedMilestones))
    }
  }

  const handleLog = (type, value) => {
    const newLog = {
      id: Date.now(),
      type,
      value,
      timestamp: new Date().toISOString()
    }
    const updatedLogs = [newLog, ...logs].slice(0, 50) // Keep last 50 logs
    setLogs(updatedLogs)
    localStorage.setItem('dashboard_logs', JSON.stringify(updatedLogs))

    // Increment session count
    const newSessions = sessions + 1
    setSessions(newSessions)
    localStorage.setItem('dashboard_sessions', newSessions.toString())

    // Check for milestone achievements
    checkMilestones(updatedLogs, newSessions)

    // Show success feedback
    setShowLogSuccess(true)
    setTimeout(() => setShowLogSuccess(false), 2000)
  }

  const checkMilestones = (updatedLogs, newSessions) => {
    const updatedMilestones = [...milestones]
    let hasChanges = false

    // Check 7-day streak
    if (streak >= 7 && !updatedMilestones[1].completed) {
      updatedMilestones[1].completed = true
      hasChanges = true
    }

    // Check 10 sessions
    if (newSessions >= 10 && !updatedMilestones[2].completed) {
      updatedMilestones[2].completed = true
      hasChanges = true
    }

    // Check first activity log
    if (updatedLogs.length > 0 && !updatedMilestones[3].completed) {
      updatedMilestones[3].completed = true
      hasChanges = true
    }

    if (hasChanges) {
      setMilestones(updatedMilestones)
      localStorage.setItem('dashboard_milestones', JSON.stringify(updatedMilestones))
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  if (!isClient) {
    return (
      <main className="min-h-screen bg-background">
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
        </div>
      </main>
    )
  }

  const completedMilestones = milestones.filter(m => m.completed).length

  return (
    <main className="min-h-screen bg-background">
      <div className="dashboard-container">
        {/* Success Toast */}
        {showLogSuccess && (
          <div className="success-toast">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Activity logged successfully!
          </div>
        )}

        {/* Header Section */}
        <div className="dashboard-header">
          <div className="welcome-section">
            {isEditing ? (
              <div className="setup-card">
                <h1 className="setup-title">Welcome! Let&apos;s get started</h1>
                <p className="setup-subtitle">Enter your child&apos;s name to personalize your dashboard</p>
                <div className="setup-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Child&apos;s Name</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Enter name"
                        value={childName}
                        onChange={(e) => setChildName(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Age (optional)</label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="Age"
                        value={childAge}
                        onChange={(e) => setChildAge(e.target.value)}
                        min="0"
                        max="18"
                      />
                    </div>
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={saveProfile}
                    disabled={!childName.trim()}
                  >
                    Start Tracking
                  </button>
                </div>
              </div>
            ) : (
              <div className="welcome-content">
                <div className="welcome-text">
                  <h1 className="welcome-title">{getGreeting()}, {childName}&apos;s parent!</h1>
                  <p className="welcome-subtitle">Here&apos;s your progress update for today</p>
                </div>
                <button className="edit-btn" onClick={() => setIsEditing(true)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Edit Profile
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon streak-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
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
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
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
                <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z"/>
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-value">{completedMilestones}/{milestones.length}</span>
              <span className="stat-label">Milestones</span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="content-grid">
          {/* Quick Log Section */}
          <div className="content-card quick-log-card">
            <h2 className="card-title">Quick Log</h2>
            <p className="card-subtitle">Record today&apos;s activities</p>

            <div className="log-categories">
              <div className="log-category">
                <h3 className="category-title">Mood</h3>
                <div className="log-buttons">
                  <button className="log-btn mood-btn" onClick={() => handleLog('mood', 'happy')}>
                    <span className="emoji">😊</span>
                    <span>Happy</span>
                  </button>
                  <button className="log-btn mood-btn" onClick={() => handleLog('mood', 'calm')}>
                    <span className="emoji">😌</span>
                    <span>Calm</span>
                  </button>
                  <button className="log-btn mood-btn" onClick={() => handleLog('mood', 'energetic')}>
                    <span className="emoji">⚡</span>
                    <span>Energetic</span>
                  </button>
                  <button className="log-btn mood-btn" onClick={() => handleLog('mood', 'neutral')}>
                    <span className="emoji">😐</span>
                    <span>Neutral</span>
                  </button>
                </div>
              </div>

              <div className="log-category">
                <h3 className="category-title">Speech</h3>
                <div className="log-buttons">
                  <button className="log-btn speech-btn" onClick={() => handleLog('speech', 'verbal')}>
                    <span className="emoji">🗣️</span>
                    <span>Verbal</span>
                  </button>
                  <button className="log-btn speech-btn" onClick={() => handleLog('speech', 'attempted')}>
                    <span className="emoji">🎯</span>
                    <span>Attempted</span>
                  </button>
                  <button className="log-btn speech-btn" onClick={() => handleLog('speech', 'gesture')}>
                    <span className="emoji">👋</span>
                    <span>Gesture</span>
                  </button>
                </div>
              </div>

              <div className="log-category">
                <h3 className="category-title">Therapy</h3>
                <div className="log-buttons">
                  <button className="log-btn therapy-btn" onClick={() => handleLog('therapy', 'ot')}>
                    <span className="emoji">🎨</span>
                    <span>OT</span>
                  </button>
                  <button className="log-btn therapy-btn" onClick={() => handleLog('therapy', 'speech')}>
                    <span className="emoji">🩺</span>
                    <span>Speech</span>
                  </button>
                  <button className="log-btn therapy-btn" onClick={() => handleLog('therapy', 'aba')}>
                    <span className="emoji">🧩</span>
                    <span>ABA</span>
                  </button>
                  <button className="log-btn therapy-btn" onClick={() => handleLog('therapy', 'play')}>
                    <span className="emoji">🎮</span>
                    <span>Play</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Milestones Section */}
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
                        <polyline points="20 6 9 17 4 12"/>
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
        </div>

        {/* Recent Activity */}
        {logs.length > 0 && (
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
        )}

        {/* Quick Actions */}
        <div className="quick-actions">
          <Link href="/resources" className="action-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            Browse Resources
          </Link>
          <button className="action-btn secondary" onClick={() => setIsEditing(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Edit Profile
          </button>
        </div>
      </div>

      <style jsx>{`
        .dashboard-container {
          padding: 100px 16px 64px;
          max-width: 1000px;
          margin: 0 auto;
        }

        .dashboard-loading {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--border);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Success Toast */
        .success-toast {
          position: fixed;
          top: 100px;
          right: 24px;
          background: var(--success);
          color: white;
          padding: 16px 24px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          animation: slideIn 0.3s ease;
          z-index: 100;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        /* Header */
        .dashboard-header {
          margin-bottom: 32px;
        }

        .welcome-section {
          background: linear-gradient(135deg, var(--primary) 0%, #5a7d60 100%);
          border-radius: 16px;
          padding: 32px;
          color: white;
        }

        .setup-card {
          text-align: center;
        }

        .setup-title {
          font-size: 28px;
          margin-bottom: 8px;
        }

        .setup-subtitle {
          opacity: 0.9;
          margin-bottom: 24px;
        }

        .setup-form {
          max-width: 400px;
          margin: 0 auto;
        }

        .form-row {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
        }

        .form-group {
          flex: 1;
        }

        .form-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 8px;
          text-align: left;
          color: rgba(255, 255, 255, 0.9);
        }

        .form-input {
          width: 100%;
          padding: 12px 16px;
          font-size: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.15);
          color: white;
          backdrop-filter: blur(4px);
          transition: all 0.2s;
        }

        .form-input:focus {
          outline: none;
          border-color: rgba(255, 255, 255, 0.6);
          background: rgba(255, 255, 255, 0.2);
        }

        .form-input::placeholder {
          color: rgba(255, 255, 255, 0.6);
        }

        .welcome-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .welcome-title {
          font-size: 28px;
          margin-bottom: 4px;
        }

        .welcome-subtitle {
          opacity: 0.9;
          font-size: 16px;
        }

        .edit-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          color: white;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .edit-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }

        .stat-card {
          background: var(--surface);
          border-radius: 12px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .streak-icon {
          background: linear-gradient(135deg, #FFE5B4 0%, #FFD699 100%);
          color: #D97706;
        }

        .sessions-icon {
          background: linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%);
          color: #0284C7;
        }

        .milestones-icon {
          background: linear-gradient(135deg, #DCFCE7 0%, #86EFAC 100%);
          color: #16A34A;
        }

        .stat-content {
          display: flex;
          flex-direction: column;
        }

        .stat-value {
          font-size: 28px;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1;
        }

        .stat-label {
          font-size: 14px;
          color: var(--text-muted);
          margin-top: 4px;
        }

        /* Content Grid */
        .content-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 24px;
        }

        .content-card {
          background: var(--surface);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
        }

        .card-title {
          font-size: 20px;
          color: var(--text-primary);
          margin-bottom: 4px;
        }

        .card-subtitle {
          font-size: 14px;
          color: var(--text-muted);
          margin-bottom: 20px;
        }

        /* Quick Log */
        .log-categories {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .log-category {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .category-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .log-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .log-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 14px;
          border: 2px solid var(--border);
          border-radius: 8px;
          background: var(--background);
          font-size: 14px;
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.2s;
        }

        .log-btn:hover {
          border-color: var(--primary);
          background: rgba(107, 143, 113, 0.08);
          transform: translateY(-2px);
        }

        .log-btn .emoji {
          font-size: 18px;
        }

        /* Milestones */
        .milestones-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .milestone-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 8px;
          background: var(--background);
          transition: all 0.2s;
        }

        .milestone-item.completed {
          background: rgba(129, 178, 154, 0.1);
        }

        .milestone-check {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .milestone-empty {
          width: 20px;
          height: 20px;
          border: 2px solid var(--border);
          border-radius: 50%;
        }

        .milestone-item.completed .milestone-empty {
          display: none;
        }

        .milestone-item.completed .milestone-check {
          color: var(--success);
        }

        .milestone-title {
          font-size: 15px;
          color: var(--text-primary);
        }

        .milestone-item.completed .milestone-title {
          color: var(--text-muted);
        }

        /* Activity */
        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .activity-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 8px;
          background: var(--background);
        }

        .activity-icon {
          font-size: 24px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--surface);
          border-radius: 8px;
        }

        .activity-content {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .activity-type {
          font-size: 12px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .activity-value {
          font-size: 15px;
          color: var(--text-primary);
          text-transform: capitalize;
        }

        .activity-time {
          font-size: 13px;
          color: var(--text-muted);
        }

        /* Quick Actions */
        .quick-actions {
          display: flex;
          gap: 12px;
        }

        .action-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 16px;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-btn:hover {
          background: var(--primary-dark);
          transform: translateY(-2px);
        }

        .action-btn.secondary {
          background: var(--surface);
          color: var(--text-primary);
          border: 2px solid var(--border);
        }

        .action-btn.secondary:hover {
          border-color: var(--primary);
          background: rgba(107, 143, 113, 0.08);
        }

        /* Buttons */
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 24px;
          font-size: 16px;
          font-weight: 600;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background: white;
          color: var(--primary);
        }

        .btn-primary:hover {
          background: rgba(255, 255, 255, 0.9);
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .dashboard-container {
            padding: 80px 16px 48px;
          }

          .welcome-content {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }

          .welcome-title {
            font-size: 24px;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .content-grid {
            grid-template-columns: 1fr;
          }

          .form-row {
            flex-direction: column;
          }

          .quick-actions {
            flex-direction: column;
          }

          .log-buttons {
            display: grid;
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </main>
  )
}