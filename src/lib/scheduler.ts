import {
  addDays,
  enumerateDates,
  formatDateInTimeZone,
  getTimeZoneOffsetMs,
  getZonedParts,
  parseDate,
  timeToMinutes,
  weekdayNumber,
  zonedDateTimeToEpoch,
} from './dateUtils'
import type { DailySchedule, ScheduleResult, SchedulerState, TimeInterval, TimeRule } from '../types'

const SOURCE_DATE_PADDING = 3

export function mergeIntervals(intervals: TimeInterval[]): TimeInterval[] {
  const sorted = intervals
    .filter((interval) => Number.isFinite(interval.start) && Number.isFinite(interval.end))
    .filter((interval) => interval.end > interval.start)
    .sort((left, right) => left.start - right.start || left.end - right.end)

  const merged: TimeInterval[] = []
  for (const interval of sorted) {
    const previous = merged[merged.length - 1]
    if (!previous || interval.start > previous.end) {
      merged.push({ ...interval })
    } else {
      previous.end = Math.max(previous.end, interval.end)
    }
  }
  return merged
}

export function intersectIntervalSets(intervalSets: TimeInterval[][]): TimeInterval[] {
  if (intervalSets.length === 0) return []
  let current = mergeIntervals(intervalSets[0])

  for (const intervals of intervalSets.slice(1)) {
    const next = mergeIntervals(intervals)
    const intersection: TimeInterval[] = []
    let leftIndex = 0
    let rightIndex = 0

    while (leftIndex < current.length && rightIndex < next.length) {
      const left = current[leftIndex]
      const right = next[rightIndex]
      const start = Math.max(left.start, right.start)
      const end = Math.min(left.end, right.end)
      if (end > start) intersection.push({ start, end })

      if (left.end < right.end) leftIndex += 1
      else rightIndex += 1
    }
    current = intersection
    if (current.length === 0) return []
  }

  return current
}

export function subtractIntervals(
  baseIntervals: TimeInterval[],
  excludedIntervals: TimeInterval[],
): TimeInterval[] {
  const exclusions = mergeIntervals(excludedIntervals)
  const result: TimeInterval[] = []

  for (const base of mergeIntervals(baseIntervals)) {
    let cursor = base.start
    for (const exclusion of exclusions) {
      if (exclusion.end <= cursor) continue
      if (exclusion.start >= base.end) break

      if (exclusion.start > cursor) {
        result.push({ start: cursor, end: Math.min(exclusion.start, base.end) })
      }
      cursor = Math.max(cursor, exclusion.end)
      if (cursor >= base.end) break
    }
    if (cursor < base.end) result.push({ start: cursor, end: base.end })
  }

  return result
}

function isRuleSelectedOnDate(rule: TimeRule, localDate: string): boolean {
  if (rule.schedule === 'daily') return true
  if (rule.schedule === 'date') {
    const start = rule.dateStart ?? rule.date
    const end = rule.dateEnd ?? start
    return Boolean(start && end && localDate >= start && localDate <= end)
  }
  return (rule.weekdays ?? []).includes(weekdayNumber(localDate))
}

function getRuleIntervalsForTargetDay(
  rule: TimeRule,
  targetDate: string,
  targetTimezone: string,
): TimeInterval[] {
  const targetDayStart = zonedDateTimeToEpoch(targetDate, '00:00', targetTimezone)
  const targetDayEnd = zonedDateTimeToEpoch(addDays(targetDate, 1), '00:00', targetTimezone)
  const sourceStartDate = addDays(formatDateInTimeZone(targetDayStart, rule.timezone), -SOURCE_DATE_PADDING)
  const sourceEndDate = addDays(
    formatDateInTimeZone(targetDayEnd - 1, rule.timezone),
    SOURCE_DATE_PADDING,
  )
  const intervals: TimeInterval[] = []

  for (const localDate of enumerateDates(sourceStartDate, sourceEndDate)) {
    if (!isRuleSelectedOnDate(rule, localDate)) continue

    const startMinutes = timeToMinutes(rule.startTime)
    const endMinutes = timeToMinutes(rule.endTime)
    if (startMinutes === null || endMinutes === null || startMinutes === endMinutes) continue

    const start = zonedDateTimeToEpoch(localDate, rule.startTime, rule.timezone)
    const endDate = endMinutes < startMinutes ? addDays(localDate, 1) : localDate
    const end = zonedDateTimeToEpoch(endDate, rule.endTime, rule.timezone)
    const clippedStart = Math.max(start, targetDayStart)
    const clippedEnd = Math.min(end, targetDayEnd)
    if (clippedEnd > clippedStart) intervals.push({ start: clippedStart, end: clippedEnd })
  }

  return mergeIntervals(intervals)
}

export function computeSchedule(state: SchedulerState): ScheduleResult {
  const hasInvalidDateRange =
    !parseDate(state.rangeStart) || !parseDate(state.rangeEnd) || state.rangeStart > state.rangeEnd
  if (hasInvalidDateRange) {
    return { days: [], hasEnabledOverride: false, hasInvalidDateRange: true }
  }

  const enabledRules = state.rules.filter((rule) => rule.enabled)
  const hasEnabledOverride = enabledRules.some((rule) => rule.type === 'override')
  const days: DailySchedule[] = []

  for (const date of enumerateDates(state.rangeStart, state.rangeEnd)) {
    const dayStart = zonedDateTimeToEpoch(date, '00:00', state.targetTimezone)
    const dayEnd = zonedDateTimeToEpoch(addDays(date, 1), '00:00', state.targetTimezone)
    const overrideSets: TimeInterval[][] = []
    const exclusionIntervals: TimeInterval[] = []

    for (const rule of enabledRules) {
      const intervals = getRuleIntervalsForTargetDay(rule, date, state.targetTimezone)
      if (rule.type === 'override') {
        overrideSets.push(intervals)
      } else if (intervals.length > 0) {
        exclusionIntervals.push(...intervals)
      }
    }

    const coverage = hasEnabledOverride
      ? intersectIntervalSets(overrideSets)
      : [{ start: dayStart, end: dayEnd }]
    const exclusions = mergeIntervals(exclusionIntervals)
    const available = subtractIntervals(coverage, exclusions)

    days.push({
      date,
      weekday: weekdayNumber(date),
      dayStart,
      dayEnd,
      coverage,
      exclusions,
      available,
    })
  }

  return { days, hasEnabledOverride, hasInvalidDateRange: false }
}

export function intervalMinutes(interval: TimeInterval): number {
  return Math.max(0, Math.round((interval.end - interval.start) / 60_000))
}

export function totalAvailableMinutes(result: ScheduleResult): number {
  return result.days.reduce(
    (total, day) => total + day.available.reduce((minutes, interval) => minutes + intervalMinutes(interval), 0),
    0,
  )
}

export function intervalPosition(interval: TimeInterval, day: DailySchedule): { left: number; width: number } {
  const duration = day.dayEnd - day.dayStart
  return {
    left: Math.max(0, Math.min(100, ((interval.start - day.dayStart) / duration) * 100)),
    width: Math.max(0, Math.min(100, ((interval.end - interval.start) / duration) * 100)),
  }
}

// Kept as a small public helper because it is useful when debugging DST calculations.
export function describeOffsetAt(epoch: number, timezone: string): string {
  const parts = getZonedParts(epoch, timezone)
  const offset = getTimeZoneOffsetMs(epoch, timezone)
  const sign = offset >= 0 ? '+' : '-'
  const absoluteMinutes = Math.abs(Math.round(offset / 60_000))
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')} UTC${sign}${String(Math.floor(absoluteMinutes / 60)).padStart(2, '0')}:${String(absoluteMinutes % 60).padStart(2, '0')}`
}
