import { formatTimeForDay, formatWeekday } from '../lib/dateUtils'
import { intervalMinutes, intervalPosition } from '../lib/scheduler'
import Icon from './Icon'
import type { DailySchedule, TimeInterval } from '../types'

interface ScheduleViewProps {
  days: DailySchedule[]
  targetTimezone: string
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

function durationLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} 分钟`
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  return remaining ? `${hours} 小时 ${remaining} 分钟` : `${hours} 小时`
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

function DayCard({ day, targetTimezone }: { day: DailySchedule; targetTimezone: string }) {
  const availableMinutes = day.available.reduce((total, interval) => total + intervalMinutes(interval), 0)
  const dayLabel = formatWeekday(day.date, 'zh')
  return (
    <article className="day-card">
      <div className="day-card-header">
        <div className="date-lockup">
          <span className="date-number">{day.date.slice(8)}</span>
          <div>
            <strong>{dayLabel}</strong>
            <span>{day.date}</span>
          </div>
        </div>
        <div className={`day-total ${availableMinutes ? '' : 'empty'}`}>
          <span>{availableMinutes ? durationLabel(availableMinutes) : '无可用时间'}</span>
          {availableMinutes ? <i><Icon name="check" size={12} />可用</i> : null}
        </div>
      </div>

      <div className="timeline-layout">
        <div className="timeline-labels" aria-hidden="true">
          <span>交集</span>
          <span>排除</span>
          <span className="final-label">可用</span>
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
            <SegmentRow intervals={day.coverage} day={day} timezone={targetTimezone} className="coverage-row" label="覆盖交集" />
            <SegmentRow intervals={day.exclusions} day={day} timezone={targetTimezone} className="exclude-row" label="排除时间" />
            <SegmentRow intervals={day.available} day={day} timezone={targetTimezone} className="available-row" label="最终可用时间" />
          </div>
          <TimeAxis />
        </div>
      </div>

      <div className="day-card-footer">
        <div className="mini-legend">
          <span><i className="legend-swatch available" />可用</span>
          <span><i className="legend-swatch excluded" />排除</span>
          <span><i className="legend-swatch coverage" />覆盖交集</span>
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
          <span className="muted-result"><Icon name="clock" size={13} />覆盖规则在当天没有重叠</span>
        )}
      </div>
    </article>
  )
}

export default function ScheduleView({ days, targetTimezone }: ScheduleViewProps) {
  return (
    <div className="schedule-list">
      {days.map((day) => (
        <DayCard key={day.date} day={day} targetTimezone={targetTimezone} />
      ))}
    </div>
  )
}
