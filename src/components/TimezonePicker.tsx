import { useEffect, useId, useMemo, useRef, useState } from 'react'
import Icon from './Icon'
import { getTimeZones } from '../lib/dateUtils'
import { buildTimezoneSections } from '../lib/timezones'
import { t } from '../lib/i18n'
import type { Locale } from '../types'

interface TimezonePickerProps {
  value: string
  locale: Locale
  primaryTimezone: string
  secondaryTimezone: string | null
  recentTimezones: readonly string[]
  onChange: (timezone: string) => void
  timezones?: readonly string[]
  excludedTimezones?: readonly string[]
  ariaLabel?: string
  placeholder?: string
}

const groupLabels = {
  pinned: 'timezonePinned',
  recent: 'timezoneRecent',
  all: 'timezoneAll',
} as const

export default function TimezonePicker({
  value,
  locale,
  primaryTimezone,
  secondaryTimezone,
  recentTimezones,
  onChange,
  timezones,
  excludedTimezones = [],
  ariaLabel,
  placeholder,
}: TimezonePickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listboxId = useId()
  const availableTimezones = timezones ?? getTimeZones()
  const excluded = useMemo(() => new Set(excludedTimezones), [excludedTimezones])
  const sections = useMemo(
    () => buildTimezoneSections(
      availableTimezones,
      primaryTimezone,
      secondaryTimezone,
      recentTimezones,
      query,
    ).map((section) => ({
      ...section,
      options: section.options.filter((option) => !excluded.has(option.timezone)),
    })).filter((section) => section.options.length > 0),
    [availableTimezones, excluded, primaryTimezone, query, recentTimezones, secondaryTimezone],
  )
  const options = useMemo(() => sections.flatMap((section) => section.options), [sections])

  useEffect(() => {
    if (!open) return
    function closeOnOutsidePointer(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('pointerdown', closeOnOutsidePointer)
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer)
  }, [open])

  useEffect(() => {
    if (highlightedIndex >= options.length) setHighlightedIndex(Math.max(0, options.length - 1))
  }, [highlightedIndex, options.length])

  function openPicker() {
    if (open) return
    setOpen(true)
    setQuery('')
    setHighlightedIndex(0)
  }

  function selectTimezone(timezone: string) {
    onChange(timezone)
    setOpen(false)
    setQuery('')
    setHighlightedIndex(0)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
      setQuery('')
      inputRef.current?.blur()
      return
    }

    if (!open && (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault()
      openPicker()
      return
    }

    if (!open || options.length === 0) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlightedIndex((current) => Math.min(current + 1, options.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlightedIndex((current) => Math.max(current - 1, 0))
    } else if (event.key === 'Home') {
      event.preventDefault()
      setHighlightedIndex(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      setHighlightedIndex(options.length - 1)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      selectTimezone(options[highlightedIndex].timezone)
    }
  }

  const selectedLabel = value.replace(/_/g, ' ')
  const inputValue = open ? query : selectedLabel

  return (
    <div className={`timezone-picker${open ? ' is-open' : ''}`} ref={containerRef}>
      <div className="timezone-picker-input-wrap">
        <Icon name="globe" size={14} />
        <input
          ref={inputRef}
          className="timezone-picker-input"
          type="text"
          value={inputValue}
          placeholder={open ? t(locale, 'timezoneSearchPlaceholder') : placeholder}
          onFocus={openPicker}
          onClick={openPicker}
          onChange={(event) => {
            setOpen(true)
            setQuery(event.target.value)
            setHighlightedIndex(0)
          }}
          onKeyDown={handleKeyDown}
          aria-label={ariaLabel}
          aria-autocomplete="list"
          aria-controls={open ? listboxId : undefined}
          aria-expanded={open}
          aria-haspopup="listbox"
          role="combobox"
        />
        <span className="timezone-picker-chevron" aria-hidden="true">⌄</span>
      </div>

      {open ? (
        <div className="timezone-picker-menu" id={listboxId} role="listbox" aria-label={ariaLabel}>
          {sections.length > 0 ? sections.map((section) => (
            <div className="timezone-picker-section" key={section.group}>
              <div className="timezone-picker-section-label">
                {section.group === 'pinned' ? <Icon name="star" size={11} /> : null}
                <span>{t(locale, groupLabels[section.group])}</span>
              </div>
              {section.options.map((option) => {
                const optionIndex = options.findIndex((item) => item.timezone === option.timezone)
                const isSelected = option.timezone === value
                const isHighlighted = optionIndex === highlightedIndex
                return (
                  <button
                    className={`timezone-picker-option${isHighlighted ? ' is-highlighted' : ''}`}
                    key={option.timezone}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setHighlightedIndex(optionIndex)}
                    onClick={() => selectTimezone(option.timezone)}
                  >
                    {option.group === 'pinned' ? <Icon name="star" size={11} /> : null}
                    <span className="timezone-option-name">{option.timezone.replace(/_/g, ' ')}</span>
                    {option.label ? (
                      <span className="timezone-option-badge">
                        {option.label === 'primary' ? t(locale, 'primaryTimezone') : t(locale, 'secondaryTimezone')}
                      </span>
                    ) : null}
                    {isSelected ? <Icon name="check" size={13} /> : null}
                  </button>
                )
              })}
            </div>
          )) : (
            <div className="timezone-picker-empty">{t(locale, 'timezoneNoResults')}</div>
          )}
        </div>
      ) : null}
    </div>
  )
}
