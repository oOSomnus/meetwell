import { useEffect, useState } from 'react'
import {
  formatWeekdayNumber,
  isValidTimeZone,
  normalizeTimeInput,
  parseDate,
  timeToMinutes,
} from '../lib/dateUtils'
import { t } from '../lib/i18n'
import Icon from './Icon'
import TimeInput from './TimeInput'
import TimezonePicker from './TimezonePicker'
import type { Locale, RuleType, ScheduleKind, TimeRule } from '../types'

interface RuleEditorProps {
  initialRule: TimeRule
  mode: 'create' | 'edit'
  locale: Locale
  primaryTimezone: string
  secondaryTimezone: string | null
  recentTimezones: readonly string[]
  timezones: readonly string[]
  onTimezoneSelected: (timezone: string) => void
  onClose: () => void
  onSave: (rule: TimeRule) => void
}

const WEEKDAYS = [
  { value: 1 },
  { value: 2 },
  { value: 3 },
  { value: 4 },
  { value: 5 },
  { value: 6 },
  { value: 7 },
]

export default function RuleEditor({
  initialRule,
  mode,
  locale,
  primaryTimezone,
  secondaryTimezone,
  recentTimezones,
  timezones,
  onTimezoneSelected,
  onClose,
  onSave,
}: RuleEditorProps) {
  const [draft, setDraft] = useState<TimeRule>(initialRule)
  const [error, setError] = useState('')

  useEffect(() => {
    setDraft(initialRule)
    setError('')
  }, [initialRule])

  function update(patch: Partial<TimeRule>) {
    setDraft((current) => ({ ...current, ...patch }))
    setError('')
  }

  function changeType(type: RuleType) {
    update({
      type,
      name: t(locale, type === 'override' ? 'defaultOverrideName' : 'defaultExcludeName'),
    })
  }

  function changeSchedule(schedule: ScheduleKind) {
    if (schedule === 'date') {
      update({
        schedule,
        dateStart: draft.dateStart ?? draft.date ?? new Date().toISOString().slice(0, 10),
        dateEnd: draft.dateEnd ?? draft.dateStart ?? draft.date ?? new Date().toISOString().slice(0, 10),
        date: undefined,
        weekdays: undefined,
      })
      return
    }

    update({
      schedule,
      dateStart: undefined,
      dateEnd: undefined,
      date: undefined,
      weekdays: schedule === 'weekly' ? (draft.weekdays?.length ? draft.weekdays : [1, 2, 3, 4, 5]) : undefined,
    })
  }

  function toggleWeekday(value: number) {
    const weekdays = draft.weekdays ?? []
    update({
      weekdays: weekdays.includes(value)
        ? weekdays.filter((day) => day !== value)
        : [...weekdays, value].sort((left, right) => left - right),
    })
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!draft.name.trim()) {
      setError(t(locale, 'errorRuleName'))
      return
    }
    if (!isValidTimeZone(draft.timezone)) {
      setError(t(locale, 'errorTimezone'))
      return
    }
    const startTime = normalizeTimeInput(draft.startTime)
    const endTime = normalizeTimeInput(draft.endTime)
    const start = timeToMinutes(startTime)
    const end = timeToMinutes(endTime)
    if (start === null || end === null || start === end) {
      setError(t(locale, 'errorTimeRange'))
      return
    }
    const dateStart = draft.dateStart ?? draft.date
    const dateEnd = draft.dateEnd ?? dateStart
    if (draft.schedule === 'date' && (!dateStart || !dateEnd || !parseDate(dateStart) || !parseDate(dateEnd))) {
      setError(t(locale, 'errorDateRange'))
      return
    }
    if (draft.schedule === 'date' && dateStart! > dateEnd!) {
      setError(t(locale, 'errorEndDate'))
      return
    }
    if (draft.schedule === 'weekly' && !(draft.weekdays?.length ?? 0)) {
      setError(t(locale, 'errorWeekday'))
      return
    }
    onSave({
      ...draft,
      name: draft.name.trim(),
      startTime,
      endTime,
      weekdays: draft.schedule === 'weekly' ? draft.weekdays : undefined,
      dateStart: draft.schedule === 'date' ? dateStart : undefined,
      dateEnd: draft.schedule === 'date' ? dateEnd : undefined,
      date: undefined,
    })
  }

  return (
    <div className="editor-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="rule-editor"
        aria-labelledby="rule-editor-title"
        role="dialog"
        aria-modal="true"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="editor-heading">
          <div>
            <span className={`editor-kicker ${draft.type}`}>
              <i /> {t(locale, draft.type === 'override' ? 'overrideTime' : 'excludeTime')}
            </span>
            <h2 id="rule-editor-title">{t(locale, mode === 'create' ? 'addTimeRule' : 'editTimeRule')}</h2>
          </div>
          <button className="icon-button" onClick={onClose} type="button" aria-label={t(locale, 'closeEditor')}>
            <Icon name="close" size={17} />
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="form-section-heading">{t(locale, 'ruleType')}</div>
          <div className="segmented-control type-control" aria-label={t(locale, 'ruleType')}>
            <button
              className={draft.type === 'override' ? 'active override-tab' : ''}
              onClick={() => changeType('override')}
              type="button"
            >
              <span className="legend-dot override-dot" />{t(locale, 'overrideTime')}
            </button>
            <button
              className={draft.type === 'exclude' ? 'active exclude-tab' : ''}
              onClick={() => changeType('exclude')}
              type="button"
            >
              <span className="legend-dot exclude-dot" />{t(locale, 'excludeTime')}
            </button>
          </div>

          <label className="field-label" htmlFor="rule-name">
            {t(locale, 'ruleName')}
            <input
              id="rule-name"
              value={draft.name}
              onChange={(event) => update({ name: event.target.value })}
              placeholder={t(locale, 'ruleNamePlaceholder')}
              autoFocus
            />
          </label>

          <div className="form-grid">
            <label className="field-label">
              {t(locale, 'recurrence')}
              <select value={draft.schedule} onChange={(event) => changeSchedule(event.target.value as ScheduleKind)}>
                <option value="daily">{t(locale, 'daily')}</option>
                <option value="weekly">{t(locale, 'weekly')}</option>
                <option value="date">{t(locale, 'specificDate')}</option>
              </select>
            </label>
            <label className="field-label">
              {t(locale, 'ruleTimezone')}
              <TimezonePicker
                value={draft.timezone}
                locale={locale}
                primaryTimezone={primaryTimezone}
                secondaryTimezone={secondaryTimezone}
                recentTimezones={recentTimezones}
                timezones={timezones}
                ariaLabel={t(locale, 'ruleTimezone')}
                onChange={(timezone) => {
                  update({ timezone })
                  onTimezoneSelected(timezone)
                }}
              />
            </label>
          </div>

          {draft.schedule === 'date' ? (
            <div className="date-range-editor">
              <div className="date-range-label">{t(locale, 'effectiveDate')} <span>{t(locale, 'multiDay')}</span></div>
              <div className="form-grid">
                <label className="field-label" htmlFor="rule-date-start">
                  {t(locale, 'startDate')}
                  <input
                    id="rule-date-start"
                    type="date"
                    value={draft.dateStart ?? draft.date ?? ''}
                    onChange={(event) => {
                      const nextStart = event.target.value
                      update({
                        dateStart: nextStart,
                        dateEnd:
                          !draft.dateEnd || draft.dateEnd < nextStart ? nextStart : draft.dateEnd,
                      })
                    }}
                  />
                </label>
                <label className="field-label" htmlFor="rule-date-end">
                  {t(locale, 'endDate')}
                  <input
                    id="rule-date-end"
                    type="date"
                    value={draft.dateEnd ?? draft.dateStart ?? draft.date ?? ''}
                    onChange={(event) => update({ dateEnd: event.target.value })}
                  />
                </label>
              </div>
            </div>
          ) : draft.schedule === 'weekly' ? (
            <fieldset className="field-label weekday-field">
              <legend>{t(locale, 'repeatWeekdays')}</legend>
              <div className="weekday-picker">
                {WEEKDAYS.map((weekday) => (
                  <button
                    key={weekday.value}
                    className={draft.weekdays?.includes(weekday.value) ? 'selected' : ''}
                    type="button"
                    onClick={() => toggleWeekday(weekday.value)}
                    aria-label={formatWeekdayNumber(weekday.value, locale, 'long')}
                    aria-pressed={draft.weekdays?.includes(weekday.value)}
                  >
                    {formatWeekdayNumber(weekday.value, locale)}
                  </button>
                ))}
              </div>
            </fieldset>
          ) : (
            <div className="daily-note">
              <Icon name="repeat" size={15} />
              <span>{t(locale, 'dailyNote')}</span>
            </div>
          )}

          <div className="form-grid time-grid">
            <label className="field-label" htmlFor="rule-start">
              {t(locale, 'startTime')}
              <TimeInput
                id="rule-start"
                value={draft.startTime}
                locale={locale}
                aria-label={t(locale, 'startTime')}
                onChange={(value) => update({ startTime: value })}
              />
            </label>
            <label className="field-label" htmlFor="rule-end">
              {t(locale, 'endTime')}
              <TimeInput
                id="rule-end"
                value={draft.endTime}
                locale={locale}
                aria-label={t(locale, 'endTime')}
                onChange={(value) => update({ endTime: value })}
              />
            </label>
          </div>

          <div className="helper-note">
            <span className="helper-icon"><Icon name="help-circle" size={15} /></span>
            <span>{t(locale, 'timeInputHelp')} {t(locale, 'overnightHelper')}</span>
          </div>

          {error ? <div className="form-error">{error}</div> : null}

          <div className="editor-actions">
            <button className="button secondary" type="button" onClick={onClose}>
              {t(locale, 'cancel')}
            </button>
            <button className="button primary" type="submit">
              {t(locale, 'saveRule')} <Icon name="check" size={15} />
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
