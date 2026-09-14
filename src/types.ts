export type RuleType = 'override' | 'exclude'
export type ScheduleKind = 'date' | 'weekly' | 'daily'
export type ExportLanguage = 'zh' | 'en'

export interface TimeRule {
  id: string
  name: string
  type: RuleType
  schedule: ScheduleKind
  timezone: string
  /** Specific-date rules can cover an inclusive date range. */
  dateStart?: string
  dateEnd?: string
  /** Legacy single-date field accepted when importing older configurations. */
  date?: string
  weekdays?: number[]
  startTime: string
  endTime: string
  enabled: boolean
}

export interface SchedulerState {
  version: 1
  rangeStart: string
  rangeEnd: string
  targetTimezone: string
  exportLanguage: ExportLanguage
  rules: TimeRule[]
}

export interface TimeInterval {
  start: number
  end: number
}

export interface DailySchedule {
  date: string
  weekday: number
  dayStart: number
  dayEnd: number
  coverage: TimeInterval[]
  exclusions: TimeInterval[]
  available: TimeInterval[]
}

export interface ScheduleResult {
  days: DailySchedule[]
  hasEnabledOverride: boolean
  hasInvalidDateRange: boolean
}
