import { formatDisplayDate, formatTimeForDay, formatWeekday } from '../lib/dateUtils'
import { formatDuration, t } from '../lib/i18n'
import { intervalMinutes, intervalPosition } from '../lib/scheduler'
import Icon from './Icon'
import type { DailySchedule, Locale, TimeInterval } from '../types'

interface ScheduleViewProps {
  days: DailySchedule[]
  targetTimezone: string
  locale: Locale
}

function segmentStyle(interval: TimeInterval, day: DailySchedule) {
  const position = intervalPosition(interval, day)
  return {
    left: `${position.left}%`,
    width: `${position.width}%`,
  }
}

function intervalLabel(interval: TimeInterval, day: DailySchedule, timezone: string) {
  return `${formatTimeForDay(interval.start, day.dayStart, day.dayEnd, timezone)}–${formatTimeForDay(interval.end, day.dayStart, day.dayEnd, timezone)}`
}

function SegmentRow({
  intervals,
  day,
  timezone,
  className,
  label,
}: {
  intervals: TimeInterval[]
  day: DailySchedule
  timezone: string
  className: string
  label: string
}) {
  return (
    <div className={`segment-row ${className}`} aria-label={label}>
      {intervals.map((interval, index) => (
        <div
          className="timeline-segment"
          key={`${interval.start}-${interval.end}-${index}`}
          style={segmentStyle(interval, day)}
          title={`${label} ${intervalLabel(interval, day, timezone)}`}
        >
          {className === 'available-row' ? intervalLabel(interval, day, timezone) : ''}
        </div>
      ))}
    </div>
  )
}

function TimeAxis() {
  return (
    <div className="time-axis" aria-hidden="true">
      <span style={{ left: '0%' }}>00:00</span>
      <span style={{ left: '25%' }}>06:00</span>
      <span style={{ left: '50%' }}>12:00</span>
      <span style={{ left: '75%' }}>18:00</span>
      <span style={{ left: '100%' }}>24:00</span>
    </div>
  )
}

function DayCard({ day, targetTimezone, locale }: { day: DailySchedule; targetTimezone: string; locale: Locale }) {
  const availableMinutes = day.available.reduce((total, interval) => total + intervalMinutes(interval), 0)
  const dayLabel = formatWeekday(day.date, locale)
  return (
    <article className="day-card">
      <div className="day-card-header">
        <div className="date-lockup">
          <span className="date-number">{day.date.slice(8)}</span>
          <div>
            <strong>{dayLabel}</strong>
            <span>{formatDisplayDate(day.date, locale)}</span>
          </div>
        </div>
        <div className={`day-total ${availableMinutes ? '' : 'empty'}`}>
          <span>{availableMinutes ? formatDuration(availableMinutes, locale) : t(locale, 'noAvailableTime')}</span>
          {availableMinutes ? <i><Icon name="check" size={12} />{t(locale, 'available')}</i> : null}
        </div>
      </div>

      <div className="timeline-layout">
        <div className="timeline-labels" aria-hidden="true">
          <span>{t(locale, 'intersection')}</span>
          <span>{t(locale, 'excluded')}</span>
          <span className="final-label">{t(locale, 'finalAvailable')}</span>
        </div>
        <div className="timeline-wrap">
          <div className="timeline-track">
            <div className="timeline-grid-lines">
              <i style={{ left: '0%' }} />
              <i style={{ left: '25%' }} />
              <i style={{ left: '50%' }} />
              <i style={{ left: '75%' }} />
              <i style={{ left: '100%' }} />
            </div>
            <SegmentRow intervals={day.coverage} day={day} timezone={targetTimezone} className="coverage-row" label={t(locale, 'coverageLabel')} />
            <SegmentRow intervals={day.exclusions} day={day} timezone={targetTimezone} className="exclude-row" label={t(locale, 'exclusionLabel')} />
            <SegmentRow intervals={day.available} day={day} timezone={targetTimezone} className="available-row" label={t(locale, 'availableLabel')} />
          </div>
          <TimeAxis />
        </div>
      </div>

      <div className="day-card-footer">
        <div className="mini-legend">
          <span><i className="legend-swatch available" />{t(locale, 'available')}</span>
          <span><i className="legend-swatch excluded" />{t(locale, 'excluded')}</span>
          <span><i className="legend-swatch coverage" />{t(locale, 'coverageLabel')}</span>
        </div>
        {day.available.length > 0 ? (
          <div className="available-list">
            {day.available.map((interval, index) => (
              <span key={`${interval.start}-${interval.end}-${index}`}>
                {intervalLabel(interval, day, targetTimezone)}
              </span>
            ))}
          </div>
        ) : (
          <span className="muted-result"><Icon name="clock" size={13} />{t(locale, 'noAvailableReason')}</span>
        )}
      </div>
    </article>
  )
}

export default function ScheduleView({ days, targetTimezone, locale }: ScheduleViewProps) {
  return (
    <div className="schedule-list">
      {days.map((day) => (
        <DayCard key={day.date} day={day} targetTimezone={targetTimezone} locale={locale} />
      ))}
    </div>
  )
}
