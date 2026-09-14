import { formatRuleDays } from '../lib/dateUtils'
import { ruleTypeLabel } from '../lib/scheduler'
import Icon from './Icon'
import type { RuleType, TimeRule } from '../types'

interface RuleListProps {
  rules: TimeRule[]
  onAdd: (type: RuleType) => void
  onEdit: (rule: TimeRule) => void
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

function RuleCard({ rule, onEdit, onToggle, onDelete }: Omit<RuleListProps, 'rules' | 'onAdd'> & { rule: TimeRule }) {
  const dateStart = rule.dateStart ?? rule.date
  const dateEnd = rule.dateEnd ?? dateStart
  const dateLabel = dateStart === dateEnd || !dateEnd ? dateStart : `${dateStart} → ${dateEnd}`
  const scheduleLabel = rule.schedule === 'date'
    ? dateLabel
    : rule.schedule === 'daily'
      ? '每天'
      : formatRuleDays(undefined, rule.weekdays)
  return (
    <article className={`rule-card ${rule.enabled ? '' : 'disabled'}`}>
      <div className="rule-card-topline">
        <span className={`rule-type-dot ${rule.type}`} />
        <div className="rule-card-title">
          <span className="rule-card-name">{rule.name}</span>
          {!rule.enabled ? <span className="rule-disabled-label">已停用</span> : null}
        </div>
        <button
          className={`toggle ${rule.enabled ? 'on' : ''}`}
          type="button"
          role="switch"
          aria-checked={rule.enabled}
          onClick={() => onToggle(rule.id)}
          aria-label={`${rule.enabled ? '停用' : '启用'} ${rule.name}`}
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
        {ruleTypeLabel(rule.type)}
      </div>
      <div className="rule-card-actions">
        <button type="button" onClick={() => onEdit(rule)} aria-label={`编辑 ${rule.name}`} title="编辑">
          <Icon name="edit" size={14} />
          <span>编辑</span>
        </button>
        <button type="button" className="danger-text" onClick={() => onDelete(rule.id)} aria-label={`删除 ${rule.name}`} title="删除">
          <Icon name="trash" size={14} />
          <span>删除</span>
        </button>
      </div>
    </article>
  )
}

function RuleGroup({
  type,
  rules,
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
          <h3>{isOverride ? '覆盖时间' : '排除时间'}</h3>
          <span className="count-pill">{items.length}</span>
        </div>
        <button className="add-small" type="button" onClick={() => onAdd(type)}>
          <Icon name="plus" size={14} />
          添加
        </button>
      </div>
      {items.length ? (
        <div className="rule-cards">
          {items.map((rule) => (
            <RuleCard key={rule.id} rule={rule} onEdit={onEdit} onToggle={onToggle} onDelete={onDelete} />
          ))}
        </div>
      ) : (
        <button className="empty-rule-card" type="button" onClick={() => onAdd(type)}>
          <span className="empty-plus"><Icon name="plus" size={15} /></span>
          <span>{isOverride ? '添加第一个覆盖时间' : '添加一个排除时间'}</span>
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
