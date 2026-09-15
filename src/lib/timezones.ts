export type TimezoneGroup = 'pinned' | 'recent' | 'all'

export interface TimezoneOption {
  timezone: string
  group: TimezoneGroup
  label?: 'primary' | 'secondary'
}

export interface TimezoneSection {
  group: TimezoneGroup
  options: TimezoneOption[]
}

/** Keep a small, predictable history of the most recently selected time zones. */
export function recordRecentTimezone(recentTimezones: readonly string[], timezone: string): string[] {
  return [timezone, ...recentTimezones.filter((item) => item !== timezone)].slice(0, 3)
}

export function sanitizeRecentTimezones(
  recentTimezones: readonly string[],
  isValid: (timezone: string) => boolean,
): string[] {
  return recentTimezones
    .filter((timezone): timezone is string => typeof timezone === 'string' && isValid(timezone))
    .filter((timezone, index, values) => values.indexOf(timezone) === index)
    .slice(0, 3)
}

export function buildTimezoneSections(
  timezones: readonly string[],
  primaryTimezone: string,
  secondaryTimezone: string | null,
  recentTimezones: readonly string[],
  query = '',
): TimezoneSection[] {
  const normalizedQuery = query.trim().toLowerCase()
  const matches = (timezone: string) => {
    if (!normalizedQuery) return true
    return timezone.toLowerCase().includes(normalizedQuery) ||
      timezone.replace(/_/g, ' ').toLowerCase().includes(normalizedQuery)
  }

  const pinned = [
    { timezone: primaryTimezone, group: 'pinned' as const, label: 'primary' as const },
    ...(secondaryTimezone && secondaryTimezone !== primaryTimezone
      ? [{ timezone: secondaryTimezone, group: 'pinned' as const, label: 'secondary' as const }]
      : []),
  ]
  const pinnedValues = new Set(pinned.map((option) => option.timezone))
  const recent = recentTimezones
    .filter((timezone, index, values) => values.indexOf(timezone) === index)
    .filter((timezone) => !pinnedValues.has(timezone))
    .map((timezone) => ({ timezone, group: 'recent' as const }))
  const recentValues = new Set(recent.map((option) => option.timezone))
  const all = [...new Set(timezones)]
    .filter((timezone) => !pinnedValues.has(timezone) && !recentValues.has(timezone))
    .sort((left, right) => left.localeCompare(right))
    .map((timezone) => ({ timezone, group: 'all' as const }))

  const sections: TimezoneSection[] = [
    { group: 'pinned', options: pinned.filter((option) => matches(option.timezone)) },
    { group: 'recent', options: recent.filter((option) => matches(option.timezone)) },
    { group: 'all', options: all.filter((option) => matches(option.timezone)) },
  ]
  return sections.filter((section) => section.options.length > 0)
}
