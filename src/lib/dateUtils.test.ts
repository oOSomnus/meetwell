import { describe, expect, it } from 'vitest'
import { normalizeTimeInput, timeToMinutes } from './dateUtils'

describe('time input parsing', () => {
  it('normalizes keyboard-friendly values to HH:mm', () => {
    expect(normalizeTimeInput('9:05')).toBe('09:05')
    expect(normalizeTimeInput('905')).toBe('09:05')
    expect(normalizeTimeInput('2300')).toBe('23:00')
    expect(timeToMinutes(normalizeTimeInput('9:05'))).toBe(545)
  })

  it('leaves invalid or incomplete values for submit-time validation', () => {
    expect(normalizeTimeInput('')).toBe('')
    expect(normalizeTimeInput('9')).toBe('9')
    expect(normalizeTimeInput('25:00')).toBe('25:00')
    expect(timeToMinutes('25:00')).toBeNull()
  })
})
