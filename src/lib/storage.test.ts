import { describe, expect, it } from 'vitest'
import { parseState } from './storage'

const rule = {
  id: 'availability',
  name: 'Working hours',
  type: 'override',
  schedule: 'weekly',
  timezone: 'UTC',
  weekdays: [1, 2, 3, 4, 5],
  startTime: '09:00',
  endTime: '17:00',
  enabled: true,
}

describe('configuration migration', () => {
  it('migrates a version 1 configuration to the timezone preference shape', () => {
    const parsed = parseState({
      version: 1,
      rangeStart: '2026-09-14',
      rangeEnd: '2026-09-18',
      targetTimezone: 'America/New_York',
      exportLanguage: 'en',
      rules: [rule],
    })

    expect(parsed).toMatchObject({
      version: 2,
      primaryTimezone: 'America/New_York',
      secondaryTimezone: null,
      recentTimezones: [],
      minimumDurationMinutes: 0,
    })
  })

  it('preserves a valid minimum duration', () => {
    const parsed = parseState({
      version: 2,
      rangeStart: '2026-09-14',
      rangeEnd: '2026-09-18',
      targetTimezone: 'UTC',
      exportLanguage: 'zh',
      minimumDurationMinutes: 90,
      rules: [rule],
    })

    expect(parsed?.minimumDurationMinutes).toBe(90)
  })

  it.each([1441, -1, 30.5, null, '90'])('rejects an invalid minimum duration: %s', (minimumDurationMinutes) => {
    const parsed = parseState({
      version: 2,
      rangeStart: '2026-09-14',
      rangeEnd: '2026-09-18',
      targetTimezone: 'UTC',
      exportLanguage: 'zh',
      minimumDurationMinutes,
      rules: [rule],
    })

    expect(parsed).toBeNull()
  })

  it('keeps valid preferences and cleans invalid optional values', () => {
    const parsed = parseState({
      version: 2,
      rangeStart: '2026-09-14',
      rangeEnd: '2026-09-18',
      targetTimezone: 'UTC',
      primaryTimezone: 'Asia/Tokyo',
      secondaryTimezone: 'Not/AZone',
      recentTimezones: ['Europe/London', 'Not/AZone', 'Europe/London', 'UTC'],
      exportLanguage: 'zh',
      rules: [rule],
    })

    expect(parsed).toMatchObject({
      primaryTimezone: 'Asia/Tokyo',
      secondaryTimezone: null,
      recentTimezones: ['Europe/London', 'UTC'],
    })
  })
})
