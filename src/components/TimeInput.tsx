import type { ChangeEvent } from 'react'
import { normalizeTimeInput } from '../lib/dateUtils'
import { t } from '../lib/i18n'
import type { Locale } from '../types'

interface TimeInputProps {
  id: string
  value: string
  locale: Locale
  onChange: (value: string) => void
  onBlur?: () => void
  'aria-label'?: string
}

export default function TimeInput({ id, value, locale, onChange, onBlur, 'aria-label': ariaLabel }: TimeInputProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value)
  }

  function handleBlur() {
    const normalized = normalizeTimeInput(value)
    if (normalized !== value) onChange(normalized)
    onBlur?.()
  }

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      maxLength={5}
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={t(locale, 'timeInputPlaceholder')}
      aria-label={ariaLabel}
      spellCheck={false}
    />
  )
}
