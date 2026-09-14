import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import Icon from './components/Icon'
import RuleEditor from './components/RuleEditor'
import RuleList from './components/RuleList'
import ScheduleView from './components/ScheduleView'
import { buildTextExport, downloadFile, downloadJson } from './lib/export'
import {
  addDays,
  formatDisplayDate,
  getTimeZones,
  resolveBrowserTimeZone,
  todayInTimeZone,
} from './lib/dateUtils'
import { computeSchedule, totalAvailableMinutes } from './lib/scheduler'
import { loadState, parseState, saveState } from './lib/storage'
import type { ExportLanguage, RuleType, SchedulerState, TimeRule } from './types'

type Notice = { tone: 'success' | 'error' | 'info'; message: string }

function createDefaultState(): SchedulerState {
  const timezone = resolveBrowserTimeZone()
  const start = todayInTimeZone(timezone)
  return {
    version: 1,
    rangeStart: start,
    rangeEnd: addDays(start, 6),
    targetTimezone: timezone,
    exportLanguage: 'zh',
    rules: [],
  }
}

function createRule(type: RuleType, state: SchedulerState): TimeRule {
  const randomId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return {
    id: randomId,
    name: type === 'override' ? '覆盖时间' : '排除时间',
    type,
    schedule: 'weekly',
    timezone: state.targetTimezone,
    weekdays: [1, 2, 3, 4, 5],
    dateStart: state.rangeStart,
    dateEnd: state.rangeStart,
    startTime: '09:00',
    endTime: '17:00',
    enabled: true,
  }
}

function totalDurationLabel(minutes: number): string {
  if (!minutes) return '—'
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  if (!hours) return `${remaining} 分钟`
  return remaining ? `${hours} 小时 ${remaining} 分钟` : `${hours} 小时`
}

function App() {
  const [state, setState] = useState<SchedulerState>(() => loadState() ?? createDefaultState())
  const [editingRule, setEditingRule] = useState<TimeRule | null>(null)
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create')
  const [notice, setNotice] = useState<Notice | null>(null)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'error'>('saved')
  const importInput = useRef<HTMLInputElement>(null)
  const timezones = useMemo(() => getTimeZones(), [])
  const result = useMemo(() => computeSchedule(state), [state])

  useEffect(() => {
    const saved = saveState(state)
    setSaveStatus(saved ? 'saved' : 'error')
    const timer = window.setTimeout(() => setSaveStatus('saved'), 1600)
    return () => window.clearTimeout(timer)
  }, [state])

  function showNotice(message: string, tone: Notice['tone'] = 'success') {
    setNotice({ message, tone })
    window.setTimeout(() => setNotice(null), 3200)
  }

  function updateState(patch: Partial<SchedulerState>) {
    setState((current) => ({ ...current, ...patch }))
  }

  function addRule(type: RuleType) {
    setEditorMode('create')
    setEditingRule(createRule(type, state))
  }

  function editRule(rule: TimeRule) {
    setEditorMode('edit')
    setEditingRule(rule)
  }

  function saveRule(rule: TimeRule) {
    setState((current) => {
      const exists = current.rules.some((existing) => existing.id === rule.id)
      return {
        ...current,
        rules: exists
          ? current.rules.map((existing) => (existing.id === rule.id ? rule : existing))
          : [...current.rules, rule],
      }
    })
    setEditingRule(null)
    showNotice(editorMode === 'create' ? '时间规则已添加' : '时间规则已更新')
  }

  function toggleRule(id: string) {
    setState((current) => ({
      ...current,
      rules: current.rules.map((rule) => (rule.id === id ? { ...rule, enabled: !rule.enabled } : rule)),
    }))
  }

  function deleteRule(id: string) {
    setState((current) => ({ ...current, rules: current.rules.filter((rule) => rule.id !== id) }))
    showNotice('时间规则已删除', 'info')
  }

  async function importConfiguration(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const imported = parseState(JSON.parse(await file.text()))
      if (!imported) throw new Error('invalid')
      setState(imported)
      setEditingRule(null)
      showNotice('配置已成功导入')
    } catch {
      showNotice('导入失败：文件不是有效的 Meeting Scheduler 配置。', 'error')
    }
  }

  function exportResult() {
    const language = state.exportLanguage
    downloadFile(
      buildTextExport(result, state, language),
      `meeting-scheduler-${state.rangeStart}-${state.rangeEnd}-${language}.txt`,
      'text/plain;charset=utf-8',
    )
    showNotice(language === 'zh' ? '中文结果已导出' : 'English result exported')
  }

  function saveNow() {
    const saved = saveState(state)
    setSaveStatus(saved ? 'saved' : 'error')
    showNotice(saved ? '配置已保存到浏览器' : '保存失败，请检查浏览器存储权限', saved ? 'success' : 'error')
  }

  const overrideCount = state.rules.filter((rule) => rule.type === 'override').length
  const excludeCount = state.rules.filter((rule) => rule.type === 'exclude').length
  const availableMinutes = totalAvailableMinutes(result)

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand-lockup">
            <div className="brand-symbol" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <span className="brand-name">meetwell</span>
          </div>
          <span className="topbar-divider" aria-hidden="true" />
          <div className="workspace-label">
            <span>工作区</span>
            <strong>会议时间规划</strong>
          </div>
          <div className="topbar-actions">
            <span className={`save-indicator ${saveStatus}`}>
              <i />
              <span>{saveStatus === 'error' ? '保存失败' : '已自动保存'}</span>
            </span>
            <span className="action-divider" aria-hidden="true" />
            <button className="topbar-button" type="button" onClick={saveNow}>
              <Icon name="save" size={15} />
              <span className="topbar-button-label">保存</span>
            </button>
            <button className="topbar-button" type="button" onClick={() => importInput.current?.click()}>
              <Icon name="download" size={15} />
              <span className="topbar-button-label">导入配置</span>
            </button>
            <button className="topbar-button" type="button" onClick={() => downloadJson(state)}>
              <Icon name="upload" size={15} />
              <span className="topbar-button-label">导出配置</span>
            </button>
            <input ref={importInput} type="file" accept="application/json,.json" hidden onChange={importConfiguration} />
          </div>
        </div>
      </header>

      <main className="app-content">
        <section className="page-header">
          <div className="page-header-copy">
            <span className="page-kicker">时间规划</span>
            <h1>找到所有人都方便的时间</h1>
            <p>设置参与者的可用时间，实时查看共同空档。</p>
          </div>
          <div className="summary-card" aria-label="当前可用时间总计">
            <span>可用时间总计</span>
            <strong>{totalDurationLabel(availableMinutes)}</strong>
            <small><Icon name="globe" size={12} /> {state.targetTimezone}</small>
          </div>
        </section>

        <section className="control-bar panel">
          <div className="control-block date-controls">
            <span className="control-icon"><Icon name="calendar" size={17} /></span>
            <label>
              <span>计算范围</span>
              <div className="date-pair">
                <input
                  type="date"
                  value={state.rangeStart}
                  onChange={(event) => updateState({ rangeStart: event.target.value })}
                  aria-label="计算开始日期"
                />
                <b aria-hidden="true">→</b>
                <input
                  type="date"
                  value={state.rangeEnd}
                  onChange={(event) => updateState({ rangeEnd: event.target.value })}
                  aria-label="计算结束日期"
                />
              </div>
            </label>
          </div>
          <div className="control-divider" />
          <div className="control-block timezone-control">
            <span className="control-icon"><Icon name="globe" size={17} /></span>
            <label>
              <span>结果时区</span>
              <select value={state.targetTimezone} onChange={(event) => updateState({ targetTimezone: event.target.value })}>
                {timezones.map((timezone) => (
                  <option value={timezone} key={timezone}>
                    {timezone}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="control-divider" />
          <div className="control-block language-control">
            <span className="control-icon"><Icon name="language" size={17} /></span>
            <label>
              <span>导出语言</span>
              <select
                value={state.exportLanguage}
                onChange={(event) => updateState({ exportLanguage: event.target.value as ExportLanguage })}
              >
                <option value="zh">中文</option>
                <option value="en">English</option>
              </select>
            </label>
          </div>
          <button className="button primary export-result-button" type="button" onClick={exportResult}>
            导出最终结果 <Icon name="arrow-up-right" size={15} />
          </button>
        </section>

        <div className="workspace-grid">
          <aside className="rules-panel panel">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">输入条件</span>
                <h2>时间规则 <span className="heading-count">{state.rules.length}</span></h2>
              </div>
              <button className="add-rule-button" type="button" onClick={() => addRule('override')}>
                <Icon name="plus" size={15} /> 新增
              </button>
            </div>
            <p className="panel-intro">覆盖时间必须全部重叠，排除时间会从结果中扣除。</p>
            <RuleList rules={state.rules} onAdd={addRule} onEdit={editRule} onToggle={toggleRule} onDelete={deleteRule} />
            <div className="rules-footer">
              <div><i className="footer-dot override" />{overrideCount} 个覆盖规则</div>
              <div><i className="footer-dot exclude" />{excludeCount} 个排除规则</div>
            </div>
          </aside>

          <section className="results-panel">
            <div className="results-heading">
              <div>
                <span className="panel-kicker">计算结果</span>
                <h2>最终可用时间</h2>
              </div>
              <div className="result-context">
                <span className="context-dot" />
                <span>{state.targetTimezone}</span>
                <b aria-hidden="true">·</b>
                <span>{state.rangeStart && state.rangeEnd ? `${formatDisplayDate(state.rangeStart, 'zh')} — ${formatDisplayDate(state.rangeEnd, 'zh')}` : '日期范围未设置'}</span>
              </div>
            </div>

            {result.hasInvalidDateRange ? (
              <div className="notice-card error-card">
                <span className="notice-icon"><Icon name="alert-circle" size={18} /></span>
                <div>
                  <strong>日期范围需要调整</strong>
                  <p>请确认开始日期和结束日期均有效，并且开始日期不晚于结束日期。</p>
                </div>
              </div>
            ) : !result.hasEnabledOverride ? (
              <div className="notice-card empty-card">
                <span className="notice-icon"><Icon name="calendar" size={18} /></span>
                <div>
                  <strong>先添加一个覆盖时间</strong>
                  <p>覆盖时间定义会议必须发生的范围。添加后，结果会在这里实时出现。</p>
                  <button className="inline-action" type="button" onClick={() => addRule('override')}>
                    添加覆盖时间 <Icon name="arrow-right" size={15} />
                  </button>
                </div>
              </div>
            ) : (
              <ScheduleView days={result.days} targetTimezone={state.targetTimezone} />
            )}

            <div className="result-footnote">
              <span className="footnote-line" />
              <span><Icon name="globe" size={12} /> 所有时间按规则所属时区计算，再转换到结果时区。</span>
              <span className="footnote-line" />
            </div>
          </section>
        </div>
      </main>

      {notice ? <div className={`toast ${notice.tone}`}>{notice.message}</div> : null}
      {editingRule ? (
        <RuleEditor
          initialRule={editingRule}
          mode={editorMode}
          onClose={() => setEditingRule(null)}
          onSave={saveRule}
        />
      ) : null}
    </div>
  )
}

export default App
