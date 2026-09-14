import type { Locale } from '../types'

const formatterCache = new Map<string, Intl.DateTimeFormat>()

function getFormatter(
  timeZone: string,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  const key = `${timeZone}|${JSON.stringify(options)}`
  const existing = formatterCache.get(key)
  if (existing) return existing

  const formatter = new Intl.DateTimeFormat('en-US', {
    calendar: 'gregory',
    numberingSystem: 'latn',
    ...options,
    timeZone,
  })
  formatterCache.set(key, formatter)
  return formatter
}

function getPart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): number {
  const value = parts.find((part) => part.type === type)?.value
  return Number(value ?? 0)
}

export interface ZonedParts {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

export function getZonedParts(epoch: number, timeZone: string): ZonedParts {
  const formatter = getFormatter(timeZone, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })
  const parts = formatter.formatToParts(new Date(epoch))
  return {
    year: getPart(parts, 'year'),
    month: getPart(parts, 'month'),
    day: getPart(parts, 'day'),
    hour: getPart(parts, 'hour'),
    minute: getPart(parts, 'minute'),
    second: getPart(parts, 'second'),
  }
}

export function formatDateInTimeZone(epoch: number, timeZone: string): string {
  const parts = getZonedParts(epoch, timeZone)
  return [parts.year, String(parts.month).padStart(2, '0'), String(parts.day).padStart(2, '0')].join('-')
}

export function parseDate(date: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const check = new Date(Date.UTC(year, month - 1, day))
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return null
  }
  return { year, month, day }
}

export function addDays(date: string, amount: number): string {
  const parsed = parseDate(date)
  if (!parsed) return date
  const value = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day))
  value.setUTCDate(value.getUTCDate() + amount)
  return [
    value.getUTCFullYear(),
    String(value.getUTCMonth() + 1).padStart(2, '0'),
    String(value.getUTCDate()).padStart(2, '0'),
  ].join('-')
}

export function enumerateDates(start: string, end: string): string[] {
  if (!parseDate(start) || !parseDate(end) || start > end) return []
  const dates: string[] = []
  let date = start
  while (date <= end) {
    dates.push(date)
    date = addDays(date, 1)
  }
  return dates
}

export function weekdayNumber(date: string): number {
  const parsed = parseDate(date)
  if (!parsed) return 1
  const day = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day)).getUTCDay()
  return day === 0 ? 7 : day
}

export function timeToMinutes(time: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(time)
  if (!match) return null
  const hour = Number(match[1])
  const minute = Number(match[2])
  if (hour > 23 || minute > 59) return null
  return hour * 60 + minute
}

export function getTimeZoneOffsetMs(epoch: number, timeZone: string): number {
  const parts = getZonedParts(epoch, timeZone)
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  )
  return asUtc - epoch
}

/** Convert a local wall-clock date/time in an IANA zone to an epoch instant. */
export function zonedDateTimeToEpoch(date: string, time: string, timeZone: string): number {
  const parsed = parseDate(date)
  const minutes = timeToMinutes(time)
  if (!parsed || minutes === null) return Number.NaN

  const wallClock = Date.UTC(
    parsed.year,
    parsed.month - 1,
    parsed.day,
    Math.floor(minutes / 60),
    minutes % 60,
    0,
  )
  let guess = wallClock

  // Two passes are normally enough; extra passes handle a transition close to the guess.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const next = wallClock - getTimeZoneOffsetMs(guess, timeZone)
    if (next === guess) return next
    guess = next
  }
  return guess
}

export function formatTimeInZone(epoch: number, timeZone: string): string {
  return getFormatter(timeZone, {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(epoch))
}

export function formatTimeForDay(
  epoch: number,
  dayStart: number,
  dayEnd: number,
  timeZone: string,
): string {
  if (epoch === dayStart) return '00:00'
  if (epoch === dayEnd) return '24:00'
  return formatTimeInZone(epoch, timeZone)
}

export function formatDisplayDate(date: string, language: Locale): string {
  const parsed = parseDate(date)
  if (!parsed) return date
  const locale = language === 'zh' ? 'zh-CN' : 'en-US'
  return new Intl.DateTimeFormat(locale, {
    timeZone: 'UTC',
    year: 'numeric',
    month: language === 'zh' ? 'long' : 'short',
    day: 'numeric',
  }).format(new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day)))
}

export function formatWeekday(date: string, language: Locale): string {
  const parsed = parseDate(date)
  if (!parsed) return ''
  return new Intl.DateTimeFormat(language === 'zh' ? 'zh-CN' : 'en-US', {
    timeZone: 'UTC',
    weekday: 'long',
  }).format(new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day)))
}

export function formatDateWithWeekday(date: string, language: Locale): string {
  const displayDate = formatDisplayDate(date, language)
  const weekday = formatWeekday(date, language)
  return language === 'zh' ? `${weekday} · ${displayDate}` : `${weekday} · ${displayDate}`
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format()
    return true
  } catch {
    return false
  }
}

export function resolveBrowserTimeZone(): string {
  const browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  return browserZone && isValidTimeZone(browserZone) ? browserZone : 'UTC'
}

export function todayInTimeZone(timeZone: string): string {
  return formatDateInTimeZone(Date.now(), timeZone)
}

const COMMON_TIMEZONES = [
  'UTC',
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Kolkata',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Pacific/Auckland',
]

export function getTimeZones(): string[] {
  const supportedValuesOf = (Intl as typeof Intl & {
    supportedValuesOf?: (key: string) => string[]
  }).supportedValuesOf
  const supported = supportedValuesOf?.('timeZone') ?? []
  return [...new Set([...COMMON_TIMEZONES, ...supported])]
}

const WEEKDAY_REFERENCE_DATES = [
  '2026-01-05',
  '2026-01-06',
  '2026-01-07',
  '2026-01-08',
  '2026-01-09',
  '2026-01-10',
  '2026-01-11',
]

export function formatWeekdayNumber(
  weekday: number,
  language: Locale,
  style: 'short' | 'long' = 'short',
): string {
  const referenceDate = WEEKDAY_REFERENCE_DATES[weekday - 1]
  if (!referenceDate) return ''
  const parsed = parseDate(referenceDate)!
  return new Intl.DateTimeFormat(language === 'zh' ? 'zh-CN' : 'en-US', {
    timeZone: 'UTC',
    weekday: style,
  }).format(new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day)))
}

export function formatRuleDays(
  ruleDate: string | undefined,
  weekdays: number[] | undefined,
  language: Locale = 'zh',
): string {
  if (ruleDate) return formatDisplayDate(ruleDate, language)
  return (weekdays ?? [])
    .slice()
    .sort((left, right) => left - right)
    .map((day) => formatWeekdayNumber(day, language))
    .filter(Boolean)
    .join(language === 'zh' ? '、' : ', ')
}
