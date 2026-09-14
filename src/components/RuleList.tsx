import { formatDisplayDate, formatRuleDays } from '../lib/dateUtils'
import { ruleTypeLabel, t } from '../lib/i18n'
import Icon from './Icon'
import type { Locale, RuleType, TimeRule } from '../types'

interface RuleListProps {
  rules: TimeRule[]
  locale: Locale
  onAdd: (type: RuleType) => void
  onEdit: (rule: TimeRule) => void
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

function RuleCard({ rule, locale, onEdit, onToggle, onDelete }: Omit<RuleListProps, 'rules' | 'onAdd'> & { rule: TimeRule }) {
  const dateStart = rule.dateStart ?? rule.date
  const dateEnd = rule.dateEnd ?? dateStart
  const dateLabel = dateStart
    ? dateStart === dateEnd || !dateEnd
      ? formatDisplayDate(dateStart, locale)
      : `${formatDisplayDate(dateStart, locale)} → ${formatDisplayDate(dateEnd, locale)}`
    : ''
  const scheduleLabel = rule.schedule === 'date'
    ? dateLabel
    : rule.schedule === 'daily'
      ? t(locale, 'daily')
      : formatRuleDays(undefined, rule.weekdays, locale)
  return (
    <article className={`rule-card ${rule.enabled ? '' : 'disabled'}`}>
      <div className="rule-card-topline">
        <span className={`rule-type-dot ${rule.type}`} />
        <div className="rule-card-title">
          <span className="rule-card-name">{rule.name}</span>
          {!rule.enabled ? <span className="rule-disabled-label">{t(locale, 'disabled')}</span> : null}
        </div>
        <button
          className={`toggle ${rule.enabled ? 'on' : ''}`}
          type="button"
          role="switch"
          aria-checked={rule.enabled}
          onClick={() => onToggle(rule.id)}
          aria-label={t(locale, rule.enabled ? 'disableRuleAria' : 'enableRuleAria', { name: rule.name })}
        >
          <span />
        </button>
      </div>
      <div className="rule-card-time">
        <strong>
          {rule.startTime} <span aria-hidden="true">→</span> {rule.endTime}
        </strong>
        <span className="rule-card-zone" title={rule.timezone}>{rule.timezone.replace(/_/g, ' ')}</span>
      </div>
      <div className="rule-card-meta">
        <span className="meta-icon">
          <Icon name={rule.schedule === 'date' ? 'calendar' : 'repeat'} size={13} />
        </span>
        {scheduleLabel}
        <span className="meta-divider" aria-hidden="true">·</span>
        {ruleTypeLabel(locale, rule.type)}
      </div>
      <div className="rule-card-actions">
        <button type="button" onClick={() => onEdit(rule)} aria-label={t(locale, 'editRuleAria', { name: rule.name })} title={t(locale, 'edit')}>
          <Icon name="edit" size={14} />
          <span>{t(locale, 'edit')}</span>
        </button>
        <button type="button" className="danger-text" onClick={() => onDelete(rule.id)} aria-label={t(locale, 'deleteRuleAria', { name: rule.name })} title={t(locale, 'delete')}>
          <Icon name="trash" size={14} />
          <span>{t(locale, 'delete')}</span>
        </button>
      </div>
    </article>
  )
}

function RuleGroup({
  type,
  rules,
  locale,
  onAdd,
  onEdit,
  onToggle,
  onDelete,
}: RuleListProps & { type: RuleType }) {
  const items = rules.filter((rule) => rule.type === type)
  const isOverride = type === 'override'
  return (
    <section className="rule-group">
      <div className="group-heading">
        <div>
          <span className={`section-mark ${type}`} />
          <h3>{ruleTypeLabel(locale, type)}</h3>
          <span className="count-pill">{items.length}</span>
        </div>
        <button className="add-small" type="button" onClick={() => onAdd(type)}>
          <Icon name="plus" size={14} />
          {t(locale, 'add')}
        </button>
      </div>
      {items.length ? (
        <div className="rule-cards">
          {items.map((rule) => (
            <RuleCard key={rule.id} rule={rule} locale={locale} onEdit={onEdit} onToggle={onToggle} onDelete={onDelete} />
          ))}
        </div>
      ) : (
        <button className="empty-rule-card" type="button" onClick={() => onAdd(type)}>
          <span className="empty-plus"><Icon name="plus" size={15} /></span>
          <span>{t(locale, isOverride ? 'firstOverride' : 'oneExclude')}</span>
        </button>
      )}
    </section>
  )
}

export default function RuleList(props: RuleListProps) {
  return (
    <div className="rule-list">
      <RuleGroup {...props} type="override" />
      <div className="group-separator" />
      <RuleGroup {...props} type="exclude" />
    </div>
  )
}
