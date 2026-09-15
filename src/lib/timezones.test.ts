import { describe, expect, it } from 'vitest'
import { buildTimezoneSections, recordRecentTimezone, sanitizeRecentTimezones } from './timezones'

describe('timezone history', () => {
  it('moves a selected timezone to the front and keeps three unique entries', () => {
    expect(recordRecentTimezone(['UTC', 'Europe/London', 'Asia/Tokyo'], 'Europe/London'))
      .toEqual(['Europe/London', 'UTC', 'Asia/Tokyo'])
    expect(recordRecentTimezone(['UTC', 'Europe/London', 'Asia/Tokyo'], 'America/New_York'))
      .toEqual(['America/New_York', 'UTC', 'Europe/London'])
  })

  it('removes invalid and duplicate persisted history entries', () => {
    expect(sanitizeRecentTimezones(
      ['UTC', 'Not/AZone', 'UTC', 'Europe/London', 'Asia/Tokyo', 'America/New_York'],
      (timezone) => timezone !== 'Not/AZone',
    )).toEqual(['UTC', 'Europe/London', 'Asia/Tokyo'])
  })
})

describe('timezone sections', () => {
  const timezones = ['UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo', 'Europe/Berlin']

  it('places primary, secondary, recent, and remaining zones in order without duplicates', () => {
    const sections = buildTimezoneSections(
      timezones,
      'America/New_York',
      'Asia/Tokyo',
      ['Europe/London', 'Asia/Tokyo', 'UTC'],
    )

    expect(sections.map((section) => section.group)).toEqual(['pinned', 'recent', 'all'])
    expect(sections[0].options.map((option) => option.timezone)).toEqual([
      'America/New_York',
      'Asia/Tokyo',
    ])
    expect(sections[1].options.map((option) => option.timezone)).toEqual(['Europe/London', 'UTC'])
    expect(sections[2].options.map((option) => option.timezone)).toEqual(['Europe/Berlin'])
  })

  it('filters by either IANA spelling or a human-readable spelling', () => {
    const sections = buildTimezoneSections(timezones, 'UTC', null, [], 'new york')
    expect(sections.flatMap((section) => section.options.map((option) => option.timezone)))
      .toEqual(['America/New_York'])
  })
})
