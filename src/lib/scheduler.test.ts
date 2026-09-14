import { describe, expect, it } from 'vitest'
import { formatTimeForDay, zonedDateTimeToEpoch } from './dateUtils'
import { buildTextExport } from './export'
import { computeSchedule, intersectIntervalSets, intervalMinutes, subtractIntervals } from './scheduler'
import type { SchedulerState, TimeInterval, TimeRule } from '../types'

function state(rules: TimeRule[], overrides: Partial<SchedulerState> = {}): SchedulerState {
  return {
    version: 1,
    rangeStart: '2026-09-14',
    rangeEnd: '2026-09-18',
    targetTimezone: 'UTC',
    exportLanguage: 'zh',
    rules,
    ...overrides,
  }
}

function rule(overrides: Partial<TimeRule>): TimeRule {
  return {
    id: crypto.randomUUID(),
    name: 'test rule',
    type: 'override',
    schedule: 'weekly',
    timezone: 'UTC',
    weekdays: [1, 2, 3, 4, 5],
    startTime: '09:00',
    endTime: '17:00',
    enabled: true,
    ...overrides,
  }
}

describe('interval operations', () => {
  it('intersects every active override window', () => {
    const left: TimeInterval[] = [{ start: 1, end: 10 }]
    const right: TimeInterval[] = [{ start: 5, end: 15 }]
    expect(intersectIntervalSets([left, right])).toEqual([{ start: 5, end: 10 }])
  })

  it('subtracts exclusions and keeps both sides of a split', () => {
    expect(
      subtractIntervals(
        [{ start: 0, end: 60 }],
        [
          { start: 20, end: 30 },
          { start: 45, end: 70 },
        ],
      ),
    ).toEqual([
      { start: 0, end: 20 },
      { start: 30, end: 45 },
    ])
  })
})

describe('schedule calculation', () => {
  it('uses the full calculation day as the default coverage without availability rules', () => {
    const result = computeSchedule(state([]))

    expect(result.hasEnabledOverride).toBe(false)
    expect(result.days.every((day) => day.coverage.length === 1)).toBe(true)
    expect(result.days.every((day) => intervalMinutes(day.available[0]) === 1440)).toBe(true)
  })

  it('subtracts exclusions from the default full-day coverage', () => {
    const result = computeSchedule(
      state([
        rule({
          id: 'lunch',
          name: 'lunch',
          type: 'exclude',
          weekdays: [2],
          startTime: '12:00',
          endTime: '13:00',
        }),
      ]),
    )

    expect(result.days[0].available).toEqual([
      { start: result.days[0].dayStart, end: result.days[0].dayEnd },
    ])
    expect(result.days[1].available.map((interval) => intervalMinutes(interval))).toEqual([720, 660])
  })

  it('does not use default coverage on dates where an availability rule is inactive', () => {
    const result = computeSchedule(
      state([
        rule({ id: 'monday-only', weekdays: [1] }),
      ], {
        rangeStart: '2026-09-14',
        rangeEnd: '2026-09-15',
      }),
    )

    expect(result.days[0].available.map((interval) => intervalMinutes(interval))).toEqual([480])
    expect(result.days[1].available).toEqual([])
  })

  it('expands weekly rules and removes an exclusion on one weekday', () => {
    const result = computeSchedule(
      state([
        rule({ id: 'team', name: 'team hours' }),
        rule({
          id: 'lunch',
          name: 'lunch',
          type: 'exclude',
          weekdays: [2],
          startTime: '12:00',
          endTime: '13:00',
        }),
      ]),
    )

    expect(result.days[0].available).toHaveLength(1)
    expect(intervalMinutes(result.days[0].available[0])).toBe(480)
    expect(result.days[1].available.map((interval) => intervalMinutes(interval))).toEqual([180, 240])
  })

  it('applies daily rules to every date in the calculation range', () => {
    const result = computeSchedule(
      state([
        rule({ id: 'daily', schedule: 'daily', weekdays: undefined }),
      ]),
    )

    expect(result.days).toHaveLength(5)
    expect(result.days.every((day) => intervalMinutes(day.available[0]) === 480)).toBe(true)
  })

  it('converts a date rule from New York into UTC output time', () => {
    const result = computeSchedule(
      state(
        [
          rule({
            id: 'ny',
            schedule: 'date',
            dateStart: '2026-01-05',
            dateEnd: '2026-01-05',
            timezone: 'America/New_York',
            weekdays: undefined,
            startTime: '09:00',
            endTime: '17:00',
          }),
        ],
        { rangeStart: '2026-01-05', rangeEnd: '2026-01-05', targetTimezone: 'UTC' },
      ),
    )

    const day = result.days[0]
    expect(formatTimeForDay(day.available[0].start, day.dayStart, day.dayEnd, 'UTC')).toBe('14:00')
    expect(formatTimeForDay(day.available[0].end, day.dayStart, day.dayEnd, 'UTC')).toBe('22:00')
  })

  it('splits a cross-midnight weekly rule into two target dates', () => {
    const result = computeSchedule(
      state(
        [rule({ id: 'overnight', weekdays: [1], startTime: '23:00', endTime: '01:00' })],
        { rangeStart: '2026-09-14', rangeEnd: '2026-09-15' },
      ),
    )

    expect(result.days[0].available.map((interval) => intervalMinutes(interval))).toEqual([60])
    expect(result.days[1].available.map((interval) => intervalMinutes(interval))).toEqual([60])
    expect(formatTimeForDay(result.days[0].available[0].end, result.days[0].dayStart, result.days[0].dayEnd, 'UTC')).toBe('24:00')
    expect(formatTimeForDay(result.days[1].available[0].start, result.days[1].dayStart, result.days[1].dayEnd, 'UTC')).toBe('00:00')
  })

  it('uses actual elapsed time when a window crosses the spring DST transition', () => {
    const result = computeSchedule(
      state(
        [
          rule({
            id: 'dst',
            weekdays: [7],
            timezone: 'America/New_York',
            startTime: '01:00',
            endTime: '04:00',
          }),
        ],
        {
          rangeStart: '2026-03-08',
          rangeEnd: '2026-03-08',
          targetTimezone: 'America/New_York',
        },
      ),
    )

    expect(intervalMinutes(result.days[0].available[0])).toBe(120)
  })

  it('reports an empty result when the configured date range is invalid', () => {
    const result = computeSchedule(
      state([], { rangeStart: '2026-09-20', rangeEnd: '2026-09-14' }),
    )
    expect(result.hasInvalidDateRange).toBe(true)
    expect(result.days).toEqual([])
  })
})

describe('zoned date conversion', () => {
  it('keeps a UTC wall-clock time stable', () => {
    const epoch = zonedDateTimeToEpoch('2026-09-14', '09:30', 'UTC')
    expect(new Date(epoch).toISOString()).toBe('2026-09-14T09:30:00.000Z')
  })
})

describe('text export', () => {
  it('exports the same schedule in Chinese and English', () => {
    const result = computeSchedule(
      state(
        [rule({ id: 'export', schedule: 'date', dateStart: '2026-09-14', dateEnd: '2026-09-14', weekdays: undefined })],
        { rangeStart: '2026-09-14', rangeEnd: '2026-09-14' },
      ),
    )
    const config = state([], { rangeStart: '2026-09-14', rangeEnd: '2026-09-14' })

    const chinese = buildTextExport(result, config, 'zh')
    const english = buildTextExport(result, config, 'en')
    expect(chinese).toContain('会议时间表')
    expect(chinese).toContain('星期一')
    expect(chinese).toContain('09:00–17:00')
    expect(english).toContain('Meeting Scheduler')
    expect(english).toContain('Monday')
    expect(english).toContain('09:00–17:00')
  })

  it('applies a specific-date rule to every date in its inclusive range', () => {
    const result = computeSchedule(
      state(
        [
          rule({
            id: 'date-range',
            schedule: 'date',
            dateStart: '2026-09-14',
            dateEnd: '2026-09-16',
            weekdays: undefined,
          }),
        ],
        { rangeStart: '2026-09-14', rangeEnd: '2026-09-16' },
      ),
    )

    expect(result.days).toHaveLength(3)
    expect(result.days.every((day) => intervalMinutes(day.available[0]) === 480)).toBe(true)
  })
})
