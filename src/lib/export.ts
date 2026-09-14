import { formatDisplayDate, formatTimeForDay, formatWeekday } from './dateUtils'
import { totalAvailableMinutes } from './scheduler'
import type { ExportLanguage, ScheduleResult, SchedulerState } from '../types'

export function buildTextExport(
  result: ScheduleResult,
  state: SchedulerState,
  language: ExportLanguage,
): string {
  const zh = language === 'zh'
  const lines: string[] = [
    zh ? '会议时间表' : 'Meeting Scheduler',
    zh ? `目标时区：${state.targetTimezone}` : `Target timezone: ${state.targetTimezone}`,
    zh
      ? `日期范围：${state.rangeStart} 至 ${state.rangeEnd}`
      : `Date range: ${state.rangeStart} to ${state.rangeEnd}`,
    '',
  ]

  for (const day of result.days) {
    lines.push(
      zh
        ? `${formatWeekday(day.date, language)}，${formatDisplayDate(day.date, language)}`
        : `${formatWeekday(day.date, language)}, ${formatDisplayDate(day.date, language)}`,
    )
    if (day.available.length === 0) {
      lines.push(zh ? '无可用时间' : 'No available time')
    } else {
      for (const interval of day.available) {
        lines.push(
          `${formatTimeForDay(interval.start, day.dayStart, day.dayEnd, state.targetTimezone)}–${formatTimeForDay(interval.end, day.dayStart, day.dayEnd, state.targetTimezone)}`,
        )
      }
    }
    lines.push('')
  }

  const minutes = totalAvailableMinutes(result)
  lines.push(
    zh
      ? `总可用时长：${Math.floor(minutes / 60)}小时${minutes % 60 ? ` ${minutes % 60}分钟` : ''}`
      : `Total available time: ${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ''}`,
  )
  return lines.join('\n').trimEnd() + '\n'
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

export function downloadJson(state: SchedulerState): void {
  downloadFile(
    JSON.stringify(state, null, 2),
    `meeting-scheduler-${state.rangeStart}-${state.rangeEnd}.json`,
    'application/json;charset=utf-8',
  )
}
