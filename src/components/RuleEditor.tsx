import { useEffect, useState } from 'react'
import { getTimeZones, isValidTimeZone, parseDate, timeToMinutes } from '../lib/dateUtils'
import Icon from './Icon'
import type { RuleType, ScheduleKind, TimeRule } from '../types'

interface RuleEditorProps {
  initialRule: TimeRule
  mode: 'create' | 'edit'
  onClose: () => void
  onSave: (rule: TimeRule) => void
}

const WEEKDAYS = [
  { value: 1, label: '一', fullLabel: '周一' },
  { value: 2, label: '二', fullLabel: '周二' },
  { value: 3, label: '三', fullLabel: '周三' },
  { value: 4, label: '四', fullLabel: '周四' },
  { value: 5, label: '五', fullLabel: '周五' },
  { value: 6, label: '六', fullLabel: '周六' },
  { value: 7, label: '日', fullLabel: '周日' },
]

export default function RuleEditor({ initialRule, mode, onClose, onSave }: RuleEditorProps) {
  const [draft, setDraft] = useState<TimeRule>(initialRule)
  const [error, setError] = useState('')
  const timezones = getTimeZones()

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
      name: type === 'override' ? '覆盖时间' : '排除时间',
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
      setError('请填写规则名称。')
      return
    }
    if (!isValidTimeZone(draft.timezone)) {
      setError('请选择有效的 IANA 时区。')
      return
    }
    const start = timeToMinutes(draft.startTime)
    const end = timeToMinutes(draft.endTime)
    if (start === null || end === null || start === end) {
      setError('开始和结束时间必须有效且不能相同。')
      return
    }
    const dateStart = draft.dateStart ?? draft.date
    const dateEnd = draft.dateEnd ?? dateStart
    if (draft.schedule === 'date' && (!dateStart || !dateEnd || !parseDate(dateStart) || !parseDate(dateEnd))) {
      setError('请选择有效的生效日期范围。')
      return
    }
    if (draft.schedule === 'date' && dateStart! > dateEnd!) {
      setError('结束日期不能早于开始日期。')
      return
    }
    if (draft.schedule === 'weekly' && !(draft.weekdays?.length ?? 0)) {
      setError('请至少选择一个重复星期。')
      return
    }
    onSave({
      ...draft,
      name: draft.name.trim(),
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
              <i /> {draft.type === 'override' ? '覆盖时间' : '排除时间'}
            </span>
            <h2 id="rule-editor-title">{mode === 'create' ? '添加时间规则' : '编辑时间规则'}</h2>
          </div>
          <button className="icon-button" onClick={onClose} type="button" aria-label="关闭编辑器">
            <Icon name="close" size={17} />
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="form-section-heading">规则类型</div>
          <div className="segmented-control type-control" aria-label="规则类型">
            <button
              className={draft.type === 'override' ? 'active override-tab' : ''}
              onClick={() => changeType('override')}
              type="button"
            >
              <span className="legend-dot override-dot" />覆盖时间
            </button>
            <button
              className={draft.type === 'exclude' ? 'active exclude-tab' : ''}
              onClick={() => changeType('exclude')}
              type="button"
            >
              <span className="legend-dot exclude-dot" />排除时间
            </button>
          </div>

          <label className="field-label" htmlFor="rule-name">
            规则名称
            <input
              id="rule-name"
              value={draft.name}
              onChange={(event) => update({ name: event.target.value })}
              placeholder="例如：核心团队工作时间"
              autoFocus
            />
          </label>

          <div className="form-grid">
            <label className="field-label">
              重复方式
              <select value={draft.schedule} onChange={(event) => changeSchedule(event.target.value as ScheduleKind)}>
                <option value="daily">每天</option>
                <option value="weekly">按星期重复</option>
                <option value="date">具体日期</option>
              </select>
            </label>
            <label className="field-label">
              所属时区
              <select value={draft.timezone} onChange={(event) => update({ timezone: event.target.value })}>
                {timezones.map((timezone) => (
                  <option value={timezone} key={timezone}>
                    {timezone}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {draft.schedule === 'date' ? (
            <div className="date-range-editor">
              <div className="date-range-label">生效日期 <span>可选择跨多天</span></div>
              <div className="form-grid">
                <label className="field-label" htmlFor="rule-date-start">
                  开始日期
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
                  结束日期
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
              <legend>重复星期</legend>
              <div className="weekday-picker">
                {WEEKDAYS.map((weekday) => (
                  <button
                    key={weekday.value}
                    className={draft.weekdays?.includes(weekday.value) ? 'selected' : ''}
                    type="button"
                    onClick={() => toggleWeekday(weekday.value)}
                    aria-label={weekday.fullLabel}
                    aria-pressed={draft.weekdays?.includes(weekday.value)}
                  >
                    {weekday.label}
                  </button>
                ))}
              </div>
            </fieldset>
          ) : (
            <div className="daily-note">
              <Icon name="repeat" size={15} />
              <span>这条规则会在计算范围内的每天生效。</span>
            </div>
          )}

          <div className="form-grid time-grid">
            <label className="field-label" htmlFor="rule-start">
              开始时间
              <input
                id="rule-start"
                type="time"
                value={draft.startTime}
                onChange={(event) => update({ startTime: event.target.value })}
              />
            </label>
            <label className="field-label" htmlFor="rule-end">
              结束时间
              <input
                id="rule-end"
                type="time"
                value={draft.endTime}
                onChange={(event) => update({ endTime: event.target.value })}
              />
            </label>
          </div>

          <div className="helper-note">
            <span className="helper-icon"><Icon name="help-circle" size={15} /></span>
            允许跨午夜，例如 23:00–01:00。结果会按目标时区拆分到相邻日期。
          </div>

          {error ? <div className="form-error">{error}</div> : null}

          <div className="editor-actions">
            <button className="button secondary" type="button" onClick={onClose}>
              取消
            </button>
            <button className="button primary" type="submit">
              保存规则 <Icon name="check" size={15} />
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
