/**
 * Weekly PDF Progress Report Generator
 *
 * Auto-generates PDF reports for IEP meetings.
 * Format: "Week X — Child Name: Y episodes, top triggers, effective strategies."
 */

import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Episode, Strategy } from '@/lib/types/database'

export interface WeeklyReportData {
  childName: string
  weekNumber: number
  weekStart: Date
  weekEnd: Date
  episodes: Episode[]
  strategies: Strategy[]
  checkInCount: number
  completedMilestones: string[]
}

export interface TopTrigger {
  trigger: string
  count: number
  percentage: number
}

export interface StrategyEffectiveness {
  description: string
  successRate: number
  uses: number
}

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return end
}

export function getWeekNumber(date: Date = new Date()): number {
  const startOfYear = new Date(date.getFullYear(), 0, 1)
  const days = Math.floor(
    (date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)
  )
  return Math.ceil((days + startOfYear.getDay() + 1) / 7)
}

export function aggregateTopTriggers(episodes: Episode[], limit = 5): TopTrigger[] {
  const counts: Record<string, number> = {}
  for (const ep of episodes) {
    if (ep.trigger) {
      counts[ep.trigger] = (counts[ep.trigger] || 0) + 1
    }
  }
  const total = episodes.length || 1
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([trigger, count]) => ({
      trigger,
      count,
      percentage: Math.round((count / total) * 100),
    }))
}

export function aggregateStrategyEffectiveness(
  episodes: Episode[],
  strategies: Strategy[],
  limit = 5
): StrategyEffectiveness[] {
  const successCounts: Record<string, number> = {}
  const totalCounts: Record<string, number> = {}

  for (const ep of episodes) {
    if (Array.isArray(ep.strategies_used)) {
      for (const s of ep.strategies_used) {
        totalCounts[s] = (totalCounts[s] || 0) + 1
        if (ep.outcome_successful && Array.isArray(ep.strategies_effective) && ep.strategies_effective.includes(s)) {
          successCounts[s] = (successCounts[s] || 0) + 1
        }
      }
    }
  }

  const all = Object.keys(totalCounts)
  if (all.length === 0) {
    return strategies.slice(0, limit).map((s) => ({
      description: s.description,
      successRate: s.success_count + s.failure_count > 0
        ? Math.round((s.success_count / (s.success_count + s.failure_count)) * 100)
        : 0,
      uses: s.success_count + s.failure_count,
    }))
  }

  return all
    .map((desc) => ({
      description: desc,
      successRate: totalCounts[desc] > 0
        ? Math.round(((successCounts[desc] || 0) / totalCounts[desc]) * 100)
        : 0,
      uses: totalCounts[desc],
    }))
    .sort((a, b) => b.successRate - a.successRate)
    .slice(0, limit)
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
  })
}

const BRAND_COLORS = {
  primary: [99, 102, 241] as [number, number, number],    // Indigo-500
  success: [16, 185, 129] as [number, number, number],    // Emerald-500
  warning: [245, 158, 11] as [number, number, number],    // Amber-500
  danger: [239, 68, 68] as [number, number, number],      // Red-500
  muted: [107, 114, 128] as [number, number, number],     // Gray-500
  light: [245, 245, 255] as [number, number, number],     // Very light indigo tint
  dark: [30, 30, 50] as [number, number, number],         // Near-black indigo
}

export function generateWeeklyReportPDF(data: WeeklyReportData): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 18
  const contentWidth = pageWidth - margin * 2

  const weekStart = getWeekStart(new Date())
  const weekEnd = getWeekEnd(new Date())

  // ── Header banner ──────────────────────────────────────────────────────────

  doc.setFillColor(...BRAND_COLORS.primary)
  doc.rect(0, 0, pageWidth, 42, 'F')

  // App name
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(255, 255, 255)
  doc.text('NeuroBridge', margin, 18)

  // Report title
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text(`Weekly Progress Report — Week ${data.weekNumber}`, margin, 27)

  // Date range
  doc.setFontSize(9)
  doc.setTextColor(199, 210, 255)
  doc.text(`${formatDate(weekStart)} – ${formatDate(weekEnd)}`, margin, 35)

  // Child name badge (right-aligned)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(255, 255, 255)
  const badgeText = data.childName
  const badgeWidth = doc.getTextWidth(badgeText) + 16
  doc.text(badgeText, pageWidth - margin, 18, { align: 'right' })

  // IEP meeting notice
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(199, 210, 255)
  doc.text('Prepared for IEP / Therapy Review', pageWidth - margin, 27, { align: 'right' })

  let y = 54

  // ── Summary stat row ───────────────────────────────────────────────────────

  const totalEpisodes = data.episodes.length
  const successfulEpisodes = data.episodes.filter((e) => e.outcome_successful).length
  const successRate = totalEpisodes > 0 ? Math.round((successfulEpisodes / totalEpisodes) * 100) : 100
  const durations = data.episodes.filter((e) => e.duration_minutes != null).map((e) => e.duration_minutes as number)
  const avgDuration = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0

  const stats = [
    { label: 'Crisis Episodes', value: totalEpisodes.toString(), color: BRAND_COLORS.danger },
    { label: 'Success Rate', value: `${successRate}%`, color: successRate >= 60 ? BRAND_COLORS.success : BRAND_COLORS.warning },
    { label: 'Avg Duration', value: avgDuration > 0 ? `${avgDuration}m` : '—', color: BRAND_COLORS.muted },
    { label: 'Check-ins', value: data.checkInCount.toString(), color: BRAND_COLORS.primary },
    { label: 'Milestones', value: data.completedMilestones.length.toString(), color: BRAND_COLORS.success },
  ]

  const statBoxWidth = (contentWidth - (stats.length - 1) * 6) / stats.length

  stats.forEach((stat, i) => {
    const x = margin + i * (statBoxWidth + 6)
    doc.setFillColor(...BRAND_COLORS.light)
    doc.roundedRect(x, y, statBoxWidth, 22, 3, 3, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(...stat.color)
    doc.text(stat.value, x + statBoxWidth / 2, y + 10, { align: 'center' })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...BRAND_COLORS.muted)
    doc.text(stat.label, x + statBoxWidth / 2, y + 17, { align: 'center' })
  })

  y += 32

  // ── Top Triggers ───────────────────────────────────────────────────────────

  const topTriggers = aggregateTopTriggers(data.episodes, 5)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...BRAND_COLORS.dark)
  doc.text('Top Triggers This Week', margin, y)

  y += 2

  if (topTriggers.length > 0) {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Trigger', 'Episodes', 'Frequency']],
      body: topTriggers.map((t) => [t.trigger, t.count.toString(), `${t.percentage}%`]),
      theme: 'plain',
      headStyles: {
        fillColor: BRAND_COLORS.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: { fontSize: 9, textColor: BRAND_COLORS.dark },
      alternateRowStyles: { fillColor: [248, 248, 253] },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 30, halign: 'center' },
      },
      tableLineColor: [230, 230, 245],
      tableLineWidth: 0.3,
    })
    // @ts-expect-error - jspdf-autotable injects this property
    y = doc.lastAutoTable.finalY + 10
  } else {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9)
    doc.setTextColor(...BRAND_COLORS.muted)
    doc.text('No crisis episodes logged this week — great progress!', margin, y + 8)
    y += 16
  }

  // ── Effective Strategies ───────────────────────────────────────────────────

  const strategyEff = aggregateStrategyEffectiveness(data.episodes, data.strategies, 5)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...BRAND_COLORS.dark)
  doc.text('Effective Strategies', margin, y)

  y += 2

  if (strategyEff.length > 0) {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Strategy', 'Success Rate', 'Uses']],
      body: strategyEff.map((s) => [
        s.description,
        `${s.successRate}%`,
        s.uses.toString(),
      ]),
      theme: 'plain',
      headStyles: {
        fillColor: BRAND_COLORS.success,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: { fontSize: 9, textColor: BRAND_COLORS.dark },
      alternateRowStyles: { fillColor: [240, 253, 244] },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 35, halign: 'center' },
        2: { cellWidth: 20, halign: 'center' },
      },
      tableLineColor: [220, 240, 230],
      tableLineWidth: 0.3,
    })
    // @ts-expect-error - jspdf-autotable injects this property
    y = doc.lastAutoTable.finalY + 10
  } else {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9)
    doc.setTextColor(...BRAND_COLORS.muted)
    doc.text('No strategy data recorded this week yet.', margin, y + 8)
    y += 16
  }

  // ── Milestone Progress ─────────────────────────────────────────────────────

  if (data.completedMilestones.length > 0) {
    // Check if we need a new page
    if (y > pageHeight - 50) {
      doc.addPage()
      y = margin
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(...BRAND_COLORS.dark)
    doc.text('Milestones Achieved', margin, y)

    y += 6

    data.completedMilestones.forEach((milestone) => {
      doc.setFillColor(...BRAND_COLORS.success)
      doc.circle(margin + 3, y - 2.5, 2.5, 'F')
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(...BRAND_COLORS.dark)
      doc.text(milestone, margin + 8, y)
      y += 7
    })

    y += 6
  }

  // ── Episode Log (if space allows) ─────────────────────────────────────────

  if (data.episodes.length > 0 && y < pageHeight - 60) {
    if (y > pageHeight - 80) {
      doc.addPage()
      y = margin
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(...BRAND_COLORS.dark)
    doc.text('Episode Log', margin, y)

    y += 2

    const episodeRows = data.episodes.slice(0, 10).map((ep) => [
      formatDateShort(new Date(ep.created_at)),
      ep.trigger.length > 30 ? ep.trigger.slice(0, 27) + '…' : ep.trigger,
      ep.behavior.length > 30 ? ep.behavior.slice(0, 27) + '…' : ep.behavior,
      ep.outcome_successful ? 'Yes' : 'No',
    ])

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Date', 'Trigger', 'Behavior', 'Resolved']],
      body: episodeRows,
      theme: 'plain',
      headStyles: {
        fillColor: BRAND_COLORS.muted,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: { fontSize: 8, textColor: BRAND_COLORS.dark },
      alternateRowStyles: { fillColor: [250, 250, 252] },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 22, halign: 'center' },
      },
      tableLineColor: [230, 230, 235],
      tableLineWidth: 0.3,
    })
    // @ts-expect-error - jspdf-autotable injects this property
    y = doc.lastAutoTable.finalY + 10
  }

  // ── Footer ─────────────────────────────────────────────────────────────────

  const footerY = pageHeight - 12
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(7.5)
  doc.setTextColor(...BRAND_COLORS.muted)
  doc.text(
    'Generated by NeuroBridge · For personal use only · Confidential',
    pageWidth / 2,
    footerY,
    { align: 'center' }
  )

  return doc
}

export function generateWeeklyReportPDFBuffer(data: WeeklyReportData): Blob {
  const doc = generateWeeklyReportPDF(data)
  return doc.output('blob')
}
