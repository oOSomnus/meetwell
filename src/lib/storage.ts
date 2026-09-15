import type { SchedulerState, TimeRule } from '../types'
import { isValidTimeZone, parseDate, timeToMinutes } from './dateUtils'
import { sanitizeRecentTimezones } from './timezones'

const STORAGE_KEY = 'meetwell.scheduler.v2'
const LEGACY_STORAGE_KEY = 'meetwell.scheduler.v1'

export function loadState(): SchedulerState | null {
  for (const key of [STORAGE_KEY, LEGACY_STORAGE_KEY]) {
    try {
      const raw = window.localStorage.getItem(key)
      if (!raw) continue
      const parsed = parseState(JSON.parse(raw))
      if (parsed) return parsed
    } catch {
      // Try the next storage key so a corrupt v2 entry cannot hide a valid legacy entry.
    }
  }
  return null
}

export function saveState(state: SchedulerState): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

export function parseState(value: unknown): SchedulerState | null {
  if (!isRecord(value)) return null
  if (value.version !== 1 && value.version !== 2) return null
  if (
    typeof value.rangeStart !== 'string' ||
    typeof value.rangeEnd !== 'string' ||
    !parseDate(value.rangeStart) ||
    !parseDate(value.rangeEnd) ||
    typeof value.targetTimezone !== 'string' ||
    !isValidTimeZone(value.targetTimezone) ||
    (value.exportLanguage !== 'zh' && value.exportLanguage !== 'en') ||
    !Array.isArray(value.rules)
  ) {
    return null
  }

  const minimumDurationMinutes = value.minimumDurationMinutes === undefined
    ? 0
    : value.minimumDurationMinutes
  if (
    typeof minimumDurationMinutes !== 'number' ||
    !Number.isInteger(minimumDurationMinutes) ||
    minimumDurationMinutes < 0 ||
    minimumDurationMinutes > 1440
  ) {
    return null
  }

  const rules = value.rules.map(parseRule)
  if (rules.some((rule) => rule === null)) return null
  const primaryTimezone = typeof value.primaryTimezone === 'string' && isValidTimeZone(value.primaryTimezone)
    ? value.primaryTimezone
    : value.targetTimezone
  const secondaryTimezone = typeof value.secondaryTimezone === 'string' &&
      isValidTimeZone(value.secondaryTimezone) &&
      value.secondaryTimezone !== primaryTimezone
    ? value.secondaryTimezone
    : null
  const recentTimezones = Array.isArray(value.recentTimezones)
    ? sanitizeRecentTimezones(value.recentTimezones, isValidTimeZone)
    : []

  return {
    version: 2,
    rangeStart: value.rangeStart,
    rangeEnd: value.rangeEnd,
    targetTimezone: value.targetTimezone,
    primaryTimezone,
    secondaryTimezone,
    recentTimezones,
    exportLanguage: value.exportLanguage,
    minimumDurationMinutes,
    rules: rules as TimeRule[],
  }
}

function parseRule(value: unknown): TimeRule | null {
  if (!isRecord(value)) return null
  if (
    typeof value.id !== 'string' ||
    typeof value.name !== 'string' ||
    (value.type !== 'override' && value.type !== 'exclude') ||
    (value.schedule !== 'date' && value.schedule !== 'weekly' && value.schedule !== 'daily') ||
    typeof value.timezone !== 'string' ||
    !isValidTimeZone(value.timezone) ||
    typeof value.startTime !== 'string' ||
    typeof value.endTime !== 'string' ||
    timeToMinutes(value.startTime) === null ||
    timeToMinutes(value.endTime) === null ||
    timeToMinutes(value.startTime) === timeToMinutes(value.endTime) ||
    typeof value.enabled !== 'boolean'
  ) {
    return null
  }

  if (value.schedule === 'date') {
    const legacyDate = typeof value.date === 'string' ? value.date : undefined
    const dateStart = typeof value.dateStart === 'string' ? value.dateStart : legacyDate
    const dateEnd = typeof value.dateEnd === 'string' ? value.dateEnd : dateStart
    if (
      !dateStart ||
      !dateEnd ||
      !parseDate(dateStart) ||
      !parseDate(dateEnd) ||
      dateStart > dateEnd
    ) {
      return null
    }
  } else if (
    value.schedule === 'weekly' &&
    (!Array.isArray(value.weekdays) ||
      value.weekdays.length === 0 ||
      value.weekdays.some((day) => typeof day !== 'number' || day < 1 || day > 7))
  ) {
    return null
  }

  const legacyDate = typeof value.date === 'string' ? value.date : undefined
  const dateStart = typeof value.dateStart === 'string' ? value.dateStart : legacyDate
  const dateEnd = typeof value.dateEnd === 'string' ? value.dateEnd : dateStart

  return {
    id: value.id,
    name: value.name,
    type: value.type,
    schedule: value.schedule,
    timezone: value.timezone,
    dateStart: value.schedule === 'date' ? dateStart : undefined,
    dateEnd: value.schedule === 'date' ? dateEnd : undefined,
    date: undefined,
    weekdays: value.schedule === 'weekly' ? (value.weekdays as number[]) : undefined,
    startTime: value.startTime,
    endTime: value.endTime,
    enabled: value.enabled,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export { LEGACY_STORAGE_KEY, STORAGE_KEY }
