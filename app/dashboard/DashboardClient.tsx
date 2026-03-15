'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import { z } from 'zod'
import type { User } from '@supabase/supabase-js'
import type { Milestone, ActivityLog as ActivityLogType } from '../../lib/types/database'
import StatsGrid from '../components/dashboard/StatsGrid'
import QuickLog from '../components/dashboard/QuickLog'
import MilestonesList from '../components/dashboard/MilestonesList'
import ActivityFeed from '../components/dashboard/ActivityFeed'
import Breadcrumbs from '../components/Breadcrumbs'
import ChildProfileWizard from '../components/dashboard/ChildProfileWizard'
import DailyCheckIn from '../components/dashboard/DailyCheckIn'

const nameSchema = z.string().min(1, "Please enter your child's name")
const ageSchema = z.coerce.number().int().min(0, "Age must be 0 or above").max(18, "Age must be 18 or below").optional()

export default function DashboardClient({ 
  initialUser, 
  initialChildData, 
  initialStatsData, 
  initialLogsData, 
  initialCheckedInToday 
}: {
  initialUser: User,
  initialChildData: any,
  initialStatsData: any,
  initialLogsData: ActivityLogType[],
  initialCheckedInToday: boolean
}) {
  const router = useRouter()
  const supabase = createClient()
  
  const [user] = useState<User>(initialUser)
  const [childName, setChildName] = useState<string>(initialChildData?.name || '')
  const [childAge, setChildAge] = useState<string>(initialChildData?.age?.toString() || '')
  const [childId, setChildId] = useState<string | null>(initialChildData?.id || null)
  const [isEditing, setIsEditing] = useState<boolean>(!initialChildData)
  
  const [streak, setStreak] = useState<number>(initialStatsData?.streak || 0)
  const [sessions, setSessions] = useState<number>(initialStatsData?.total_sessions || 0)
  const [milestones, setMilestones] = useState<Milestone[]>(initialStatsData?.milestones?.length ? initialStatsData.milestones : [
    { id: 1, title: 'First Check-in', completed: false },
    { id: 2, title: '7-Day Streak', completed: false },
    { id: 3, title: '10 Sessions', completed: false },
    { id: 4, title: 'First Activity Log', completed: false },
    { id: 5, title: 'Explore Resources', completed: false }
  ])
  
  const [logs, setLogs] = useState<ActivityLogType[]>(initialLogsData)
  const [showLogSuccess, setShowLogSuccess] = useState(false)
  const [nameError, setNameError] = useState('')
  const [ageError, setAgeError] = useState('')
  const [nameTouched, setNameTouched] = useState(false)
  const [ageTouched, setAgeTouched] = useState(false)
  const [checkedInToday, setCheckedInToday] = useState(initialCheckedInToday)

  const validateName = (value: string) => {
    const result = nameSchema.safeParse(value)
    return result.success ? '' : result.error.issues[0].message
  }

  const validateAge = (value: string) => {
    if (!value.trim()) return ''
    const result = ageSchema.safeParse(value)
    if (!result.success) return result.error.issues[0].message
    return ''
  }

  const handleNameChange = (value: string) => {
    setChildName(value)
    if (nameTouched) setNameError(validateName(value))
  }

  const handleAgeChange = (value: string) => {
    setChildAge(value)
    if (ageTouched) setAgeError(validateAge(value))
  }

  const saveProfile = async () => {
    setNameTouched(true)
    setAgeTouched(true)
    const nErr = validateName(childName)
    const aErr = validateAge(childAge)
    setNameError(nErr)
    setAgeError(aErr)
    if (nErr || aErr) return
    if (!user) return

    if (childId) {
      // Update existing child
      await supabase.from('children').update({
        name: childName,
        age: childAge ? parseInt(childAge) : null
      }).eq('id', childId)
    } else {
      // Insert new child
      const { data } = await supabase.from('children').insert({
        user_id: user.id,
        name: childName,
        age: childAge ? parseInt(childAge) : null
      }).select()
      
      if (data && data.length > 0) setChildId(data[0].id)
    }
    
    setIsEditing(false)

    // Mark first milestone as complete
    const updatedMilestones = [...milestones]
    if (updatedMilestones.length > 0 && !updatedMilestones[0].completed) {
      updatedMilestones[0].completed = true
      setMilestones(updatedMilestones)
      await supabase.from('user_stats').update({ milestones: updatedMilestones }).eq('user_id', user.id)
    }
  }

  const handleLog = async (type: string, value: string) => {
    if (!user || !childId) {
      alert("Please set up your child's profile first.")
      return
    }

    const { data: newLog } = await supabase.from('activity_logs').insert({
      user_id: user.id,
      child_id: childId,
      type,
      value
    }).select().single()

    if (newLog) {
      const updatedLogs = [newLog, ...logs].slice(0, 50)
      setLogs(updatedLogs)
      
      const newSessions = sessions + 1
      setSessions(newSessions)
      
      await supabase.from('user_stats').update({ total_sessions: newSessions }).eq('user_id', user.id)

      checkMilestones(updatedLogs, newSessions)

      setShowLogSuccess(true)
      setTimeout(() => setShowLogSuccess(false), 2000)
    }
  }

  const checkMilestones = async (updatedLogs: ActivityLogType[], newSessions: number) => {
    const updatedMilestones = [...milestones]
    let hasChanges = false

    if (streak >= 7 && updatedMilestones.length > 1 && !updatedMilestones[1].completed) {
      updatedMilestones[1].completed = true
      hasChanges = true
    }
    if (newSessions >= 10 && updatedMilestones.length > 2 && !updatedMilestones[2].completed) {
      updatedMilestones[2].completed = true
      hasChanges = true
    }
    if (updatedLogs.length > 0 && updatedMilestones.length > 3 && !updatedMilestones[3].completed) {
      updatedMilestones[3].completed = true
      hasChanges = true
    }

    if (hasChanges && user) {
      setMilestones(updatedMilestones)
      await supabase.from('user_stats').update({ milestones: updatedMilestones }).eq('user_id', user.id)
    }
  }

  const handleCheckIn = async (data: { sleepQuality: string; routineChanges: boolean; sensoryEnvironment: string }) => {
    if (!user || !childId) return
    await supabase.from('check_ins').insert({
      user_id: user.id,
      child_id: childId,
      sleep_quality: data.sleepQuality,
      routine_changes: data.routineChanges,
      sensory_environment: data.sensoryEnvironment
    })
    setCheckedInToday(true)
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  if (!user) return null

  return (
    <main className="min-h-screen bg-background">
      <div className="dashboard-container">
        {/* Breadcrumbs */}
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Dashboard' }]} />

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
              <ChildProfileWizard
                initialName={childName}
                initialAge={childAge}
                onComplete={async (data) => {
                  setChildName(data.name)
                  setChildAge(data.age)
                  if (!user) return
                  const profileData = {
                    name: data.name,
                    age: data.age ? parseInt(data.age) : null,
                    sensitivities: data.sensitivities,
                    triggers: data.triggers,
                    strategies: data.strategies,
                    what_not_to_do: data.whatNotToDo,
                  }
                  if (childId) {
                    await supabase.from('children').update(profileData).eq('id', childId)
                  } else {
                    const { data: inserted } = await supabase.from('children').insert({
                      user_id: user.id,
                      ...profileData,
                    }).select()
                    if (inserted && inserted.length > 0) setChildId(inserted[0].id)
                  }
                  setIsEditing(false)
                  // Mark first milestone
                  const updatedMilestones = [...milestones]
                  if (updatedMilestones.length > 0 && !updatedMilestones[0].completed) {
                    updatedMilestones[0].completed = true
                    setMilestones(updatedMilestones)
                    await supabase.from('user_stats').update({ milestones: updatedMilestones }).eq('user_id', user.id)
                  }
                }}
              />
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

        {!isEditing && childId && (
          <DailyCheckIn onSubmit={handleCheckIn} alreadyCheckedIn={checkedInToday} />
        )}

        {/* Stats Cards */}
        <StatsGrid streak={streak} sessions={sessions} milestones={milestones} />

        {/* Main Content Grid */}
        <div className="content-grid">
          <QuickLog handleLog={handleLog} />
          <MilestonesList milestones={milestones} />
        </div>

        {/* Recent Activity */}
        <ActivityFeed logs={logs} />

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

      <style jsx global>{`
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

        .form-input-error {
          border-color: var(--error) !important;
        }

        .form-error {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.9);
          margin-top: 6px;
          text-align: left;
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