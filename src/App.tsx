import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import Icon from './components/Icon'
import RuleEditor from './components/RuleEditor'
import RuleList from './components/RuleList'
import ScheduleView from './components/ScheduleView'
import SettingsModal from './components/SettingsModal'
import TimezonePicker from './components/TimezonePicker'
import { buildTextExport, downloadFile, downloadJson } from './lib/export'
import {
  addDays,
  formatDisplayDate,
  getTimeZones,
  resolveBrowserTimeZone,
  todayInTimeZone,
} from './lib/dateUtils'
import { formatDuration, loadLocale, ruleCountLabel, saveLocale, t } from './lib/i18n'
import { computeSchedule, totalAvailableMinutes } from './lib/scheduler'
import { loadState, parseState, saveState } from './lib/storage'
import { recordRecentTimezone } from './lib/timezones'
import type { ExportLanguage, Locale, RuleType, SchedulerState, TimeRule } from './types'

type Notice = { tone: 'success' | 'error' | 'info'; message: string }

function createDefaultState(): SchedulerState {
  const timezone = resolveBrowserTimeZone()
  const start = todayInTimeZone(timezone)
  return {
    version: 2,
    rangeStart: start,
    rangeEnd: addDays(start, 6),
    targetTimezone: timezone,
    primaryTimezone: timezone,
    secondaryTimezone: null,
    recentTimezones: [],
    exportLanguage: 'zh',
    rules: [],
  }
}

function createRule(type: RuleType, state: SchedulerState, locale: Locale): TimeRule {
  const randomId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return {
    id: randomId,
    name: t(locale, type === 'override' ? 'defaultOverrideName' : 'defaultExcludeName'),
    type,
    schedule: 'weekly',
    timezone: state.primaryTimezone,
    weekdays: [1, 2, 3, 4, 5],
    dateStart: state.rangeStart,
    dateEnd: state.rangeStart,
    startTime: '09:00',
    endTime: '17:00',
    enabled: true,
  }
}

function App() {
  const [state, setState] = useState<SchedulerState>(() => loadState() ?? createDefaultState())
  const [locale, setLocale] = useState<Locale>(() => loadLocale())
  const [editingRule, setEditingRule] = useState<TimeRule | null>(null)
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create')
  const [notice, setNotice] = useState<Notice | null>(null)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'error'>('saved')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const importInput = useRef<HTMLInputElement>(null)
  const timezones = useMemo(() => getTimeZones(), [])
  const result = useMemo(() => computeSchedule(state), [state])

  useEffect(() => {
    const saved = saveState(state)
    setSaveStatus(saved ? 'saved' : 'error')
    const timer = window.setTimeout(() => setSaveStatus('saved'), 1600)
    return () => window.clearTimeout(timer)
  }, [state])

  useEffect(() => {
    document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en'
    document.title = t(locale, 'documentTitle')
    saveLocale(locale)
  }, [locale])

  function showNotice(message: string, tone: Notice['tone'] = 'success') {
    setNotice({ message, tone })
    window.setTimeout(() => setNotice(null), 3200)
  }

  function updateState(patch: Partial<SchedulerState>) {
    setState((current) => ({ ...current, ...patch }))
  }

  function recordTimezoneSelection(timezone: string) {
    setState((current) => ({
      ...current,
      recentTimezones: recordRecentTimezone(current.recentTimezones, timezone),
    }))
  }

  function selectTargetTimezone(timezone: string) {
    setState((current) => ({
      ...current,
      targetTimezone: timezone,
      recentTimezones: recordRecentTimezone(current.recentTimezones, timezone),
    }))
  }

  function saveTimezoneSettings(primaryTimezone: string, secondaryTimezone: string | null) {
    setState((current) => ({
      ...current,
      primaryTimezone,
      secondaryTimezone,
      targetTimezone: primaryTimezone,
    }))
    setSettingsOpen(false)
    showNotice(t(locale, 'timezoneSettingsSaved'))
  }

  function addRule(type: RuleType) {
    setEditorMode('create')
    setEditingRule(createRule(type, state, locale))
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
    showNotice(t(locale, editorMode === 'create' ? 'ruleAdded' : 'ruleUpdated'))
  }

  function toggleRule(id: string) {
    setState((current) => ({
      ...current,
      rules: current.rules.map((rule) => (rule.id === id ? { ...rule, enabled: !rule.enabled } : rule)),
    }))
  }

  function deleteRule(id: string) {
    setState((current) => ({ ...current, rules: current.rules.filter((rule) => rule.id !== id) }))
    showNotice(t(locale, 'ruleDeleted'), 'info')
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
      showNotice(t(locale, 'configImported'))
    } catch {
      showNotice(t(locale, 'configImportFailed'), 'error')
    }
  }

  function exportResult() {
    const language = state.exportLanguage
    downloadFile(
      buildTextExport(result, state, language),
      `meeting-scheduler-${state.rangeStart}-${state.rangeEnd}-${language}.txt`,
      'text/plain;charset=utf-8',
    )
    showNotice(t(locale, language === 'zh' ? 'exportedChinese' : 'exportedEnglish'))
  }

  function saveNow() {
    const saved = saveState(state)
    setSaveStatus(saved ? 'saved' : 'error')
    showNotice(
      t(locale, saved ? 'configSaved' : 'storageSaveFailed'),
      saved ? 'success' : 'error',
    )
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
            <span>{t(locale, 'workspace')}</span>
            <strong>{t(locale, 'workspaceName')}</strong>
          </div>
          <div className="topbar-actions">
            <span className={`save-indicator ${saveStatus}`}>
              <i />
              <span>{t(locale, saveStatus === 'error' ? 'saveFailed' : 'autoSaved')}</span>
            </span>
            <span className="action-divider" aria-hidden="true" />
            <label className="topbar-locale-control">
              <Icon name="language" size={15} />
              <span className="visually-hidden">{t(locale, 'interfaceLanguage')}</span>
              <select
                value={locale}
                aria-label={t(locale, 'interfaceLanguage')}
                onChange={(event) => setLocale(event.target.value as Locale)}
              >
                <option value="zh">{t(locale, 'chinese')}</option>
                <option value="en">{t(locale, 'english')}</option>
              </select>
            </label>
            <span className="action-divider" aria-hidden="true" />
            <button className="topbar-button" type="button" onClick={() => setSettingsOpen(true)}>
              <Icon name="settings" size={15} />
              <span className="topbar-button-label">{t(locale, 'settings')}</span>
            </button>
            <button className="topbar-button" type="button" onClick={saveNow}>
              <Icon name="save" size={15} />
              <span className="topbar-button-label">{t(locale, 'save')}</span>
            </button>
            <button className="topbar-button" type="button" onClick={() => importInput.current?.click()}>
              <Icon name="download" size={15} />
              <span className="topbar-button-label">{t(locale, 'importConfig')}</span>
            </button>
            <button className="topbar-button" type="button" onClick={() => downloadJson(state)}>
              <Icon name="upload" size={15} />
              <span className="topbar-button-label">{t(locale, 'exportConfig')}</span>
            </button>
            <input ref={importInput} type="file" accept="application/json,.json" hidden onChange={importConfiguration} />
          </div>
        </div>
      </header>

      <main className="app-content">
        <section className="page-header">
          <div className="page-header-copy">
            <span className="page-kicker">{t(locale, 'schedulePlanning')}</span>
            <h1>{t(locale, 'heroTitle')}</h1>
            <p>{t(locale, 'heroSubtitle')}</p>
          </div>
          <div className="summary-card" aria-label={t(locale, 'availableTotalAria')}>
            <span>{t(locale, 'availableTotal')}</span>
            <strong>{formatDuration(availableMinutes, locale)}</strong>
            <small><Icon name="globe" size={12} /> {state.targetTimezone}</small>
          </div>
        </section>

        <section className="control-bar panel">
          <div className="control-block date-controls">
            <span className="control-icon"><Icon name="calendar" size={17} /></span>
            <label>
              <span>{t(locale, 'dateRange')}</span>
              <div className="date-pair">
                <input
                  type="date"
                  value={state.rangeStart}
                  onChange={(event) => updateState({ rangeStart: event.target.value })}
                  aria-label={t(locale, 'dateRangeStartAria')}
                />
                <b aria-hidden="true">→</b>
                <input
                  type="date"
                  value={state.rangeEnd}
                  onChange={(event) => updateState({ rangeEnd: event.target.value })}
                  aria-label={t(locale, 'dateRangeEndAria')}
                />
              </div>
            </label>
          </div>
          <div className="control-divider" />
          <div className="control-block timezone-control">
            <span className="control-icon"><Icon name="globe" size={17} /></span>
            <label>
              <span>{t(locale, 'targetTimezone')}</span>
              <TimezonePicker
                value={state.targetTimezone}
                locale={locale}
                primaryTimezone={state.primaryTimezone}
                secondaryTimezone={state.secondaryTimezone}
                recentTimezones={state.recentTimezones}
                timezones={timezones}
                ariaLabel={t(locale, 'targetTimezone')}
                onChange={selectTargetTimezone}
              />
            </label>
          </div>
          <div className="control-divider" />
          <div className="control-block language-control">
            <span className="control-icon"><Icon name="language" size={17} /></span>
            <label>
              <span>{t(locale, 'exportLanguage')}</span>
              <select
                value={state.exportLanguage}
                onChange={(event) => updateState({ exportLanguage: event.target.value as ExportLanguage })}
              >
                <option value="zh">{t(locale, 'chinese')}</option>
                <option value="en">{t(locale, 'english')}</option>
              </select>
            </label>
          </div>
          <button className="button primary export-result-button" type="button" onClick={exportResult}>
            {t(locale, 'exportResult')} <Icon name="arrow-up-right" size={15} />
          </button>
        </section>

        <div className="workspace-grid">
          <aside className="rules-panel panel">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">{t(locale, 'inputConditions')}</span>
                <h2>{t(locale, 'timeRules')} <span className="heading-count">{state.rules.length}</span></h2>
              </div>
              <button className="add-rule-button" type="button" onClick={() => addRule('override')}>
                <Icon name="plus" size={15} /> {t(locale, 'add')}
              </button>
            </div>
            <p className="panel-intro">{t(locale, 'rulesIntro')}</p>
            <RuleList locale={locale} rules={state.rules} onAdd={addRule} onEdit={editRule} onToggle={toggleRule} onDelete={deleteRule} />
            <div className="rules-footer">
              <div><i className="footer-dot override" />{ruleCountLabel(locale, 'override', overrideCount)}</div>
              <div><i className="footer-dot exclude" />{ruleCountLabel(locale, 'exclude', excludeCount)}</div>
            </div>
          </aside>

          <section className="results-panel">
            <div className="results-heading">
              <div>
                <span className="panel-kicker">{t(locale, 'calculationResult')}</span>
                <h2>{t(locale, 'finalAvailableTime')}</h2>
              </div>
              <div className="result-context">
                <span className="context-dot" />
                <span>{state.targetTimezone}</span>
                <b aria-hidden="true">·</b>
                <span>{state.rangeStart && state.rangeEnd ? `${formatDisplayDate(state.rangeStart, locale)} — ${formatDisplayDate(state.rangeEnd, locale)}` : t(locale, 'dateRangeUnset')}</span>
              </div>
            </div>

            {result.hasInvalidDateRange ? (
              <div className="notice-card error-card">
                <span className="notice-icon"><Icon name="alert-circle" size={18} /></span>
                <div>
                  <strong>{t(locale, 'invalidDateRangeTitle')}</strong>
                  <p>{t(locale, 'invalidDateRangeBody')}</p>
                </div>
              </div>
            ) : (
              <ScheduleView days={result.days} targetTimezone={state.targetTimezone} locale={locale} />
            )}

            <div className="result-footnote">
              <span className="footnote-line" />
              <span><Icon name="globe" size={12} /> {t(locale, 'allTimesNote')}</span>
              <span className="footnote-line" />
            </div>
          </section>
        </div>
      </main>

      {notice ? <div className={`toast ${notice.tone}`}>{notice.message}</div> : null}
      {settingsOpen ? (
        <SettingsModal
          locale={locale}
          primaryTimezone={state.primaryTimezone}
          secondaryTimezone={state.secondaryTimezone}
          recentTimezones={state.recentTimezones}
          timezones={timezones}
          onClose={() => setSettingsOpen(false)}
          onSave={saveTimezoneSettings}
          onTimezoneSelected={recordTimezoneSelection}
        />
      ) : null}
      {editingRule ? (
        <RuleEditor
          initialRule={editingRule}
          mode={editorMode}
          locale={locale}
          primaryTimezone={state.primaryTimezone}
          secondaryTimezone={state.secondaryTimezone}
          recentTimezones={state.recentTimezones}
          timezones={timezones}
          onTimezoneSelected={recordTimezoneSelection}
          onClose={() => setEditingRule(null)}
          onSave={saveRule}
        />
      ) : null}
    </div>
  )
}

export default App
