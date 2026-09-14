import { describe, expect, it } from 'vitest'
import { formatDisplayDate, formatRuleDays, formatWeekdayNumber } from './dateUtils'
import {
  TRANSLATION_KEYS,
  detectBrowserLocale,
  formatDuration,
  resolveLocale,
  ruleCountLabel,
  t,
} from './i18n'

describe('locale resolution', () => {
  it('keeps a valid stored locale over browser preferences', () => {
    expect(resolveLocale('en', ['zh-CN'])).toBe('en')
    expect(resolveLocale('zh', ['en-US'])).toBe('zh')
  })

  it('uses Chinese only when the preferred browser language is Chinese', () => {
    expect(detectBrowserLocale(['zh-CN', 'en-US'])).toBe('zh')
    expect(detectBrowserLocale(['en-US', 'zh-CN'])).toBe('en')
    expect(detectBrowserLocale([])).toBe('en')
  })

  it('falls back to browser preferences for an invalid stored locale', () => {
    expect(resolveLocale('fr', ['zh-TW'])).toBe('zh')
    expect(resolveLocale(null, ['de-DE'])).toBe('en')
  })
})

describe('translations', () => {
  it('provides every translation key in both supported locales', () => {
    for (const key of TRANSLATION_KEYS) {
      expect(t('zh', key)).not.toBe('')
      expect(t('en', key)).not.toBe('')
    }
  })

  it('interpolates translated values without changing the value text', () => {
    expect(t('zh', 'ruleCount', { count: 2, type: '覆盖' })).toBe('2 个覆盖规则')
    expect(t('en', 'ruleCount', { count: 2, type: 'override' })).toBe('2 override rules')
    expect(ruleCountLabel('zh', 'override', 1)).toBe('1 个覆盖规则')
    expect(ruleCountLabel('en', 'exclude', 1)).toBe('1 excluded time rule')
  })
})

describe('localized duration formatting', () => {
  it('formats empty, minute-only, and hour-and-minute durations', () => {
    expect(formatDuration(0, 'zh')).toBe('—')
    expect(formatDuration(61, 'zh')).toBe('1 小时 1 分钟')
    expect(formatDuration(61, 'en')).toBe('1 hour 1 minute')
    expect(formatDuration(120, 'en')).toBe('2 hours')
  })
})

describe('localized date and weekday formatting', () => {
  it('formats dates and weekday summaries in the selected locale', () => {
    expect(formatDisplayDate('2026-09-14', 'en')).toBe('Sep 14, 2026')
    expect(formatWeekdayNumber(1, 'zh', 'long')).toBe('星期一')
    expect(formatRuleDays(undefined, [1, 3, 5], 'en')).toBe('Mon, Wed, Fri')
  })
})
