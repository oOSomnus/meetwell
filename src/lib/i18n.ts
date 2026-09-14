import type { Locale, RuleType } from '../types'

export const LOCALE_STORAGE_KEY = 'meetwell.locale.v1'

const zhMessages = {
  documentTitle: 'Meetwell · 会议时间规划',
  workspace: '工作区',
  workspaceName: '会议时间规划',
  autoSaved: '已自动保存',
  saveFailed: '保存失败',
  save: '保存',
  importConfig: '导入配置',
  exportConfig: '导出配置',
  schedulePlanning: '时间规划',
  heroTitle: '找到所有人都方便的时间',
  heroSubtitle: '设置参与者的可用时间，实时查看共同空档。',
  availableTotalAria: '当前可用时间总计',
  availableTotal: '可用时间总计',
  dateRange: '计算范围',
  dateRangeStartAria: '计算开始日期',
  dateRangeEndAria: '计算结束日期',
  targetTimezone: '结果时区',
  interfaceLanguage: '界面语言',
  exportLanguage: '导出语言',
  chinese: '中文',
  english: 'English',
  exportResult: '导出最终结果',
  inputConditions: '输入条件',
  timeRules: '时间规则',
  add: '新增',
  rulesIntro: '覆盖时间必须全部重叠，排除时间会从结果中扣除。',
  ruleCount: '{count} 个{type}规则',
  ruleCountSingular: '{count} 个{type}规则',
  overrideCountName: '覆盖',
  excludeCountName: '排除',
  calculationResult: '计算结果',
  finalAvailableTime: '最终可用时间',
  dateRangeUnset: '日期范围未设置',
  invalidDateRangeTitle: '日期范围需要调整',
  invalidDateRangeBody: '请确认开始日期和结束日期均有效，并且开始日期不晚于结束日期。',
  addOverrideTitle: '先添加一个覆盖时间',
  addOverrideBody: '覆盖时间定义会议必须发生的范围。添加后，结果会在这里实时出现。',
  addOverrideAction: '添加覆盖时间',
  allTimesNote: '所有时间按规则所属时区计算，再转换到结果时区。',
  ruleAdded: '时间规则已添加',
  ruleUpdated: '时间规则已更新',
  ruleDeleted: '时间规则已删除',
  addTimeRule: '添加时间规则',
  editTimeRule: '编辑时间规则',
  errorRuleName: '请填写规则名称。',
  errorTimezone: '请选择有效的 IANA 时区。',
  errorTimeRange: '开始和结束时间必须有效且不能相同。',
  errorDateRange: '请选择有效的生效日期范围。',
  errorEndDate: '结束日期不能早于开始日期。',
  errorWeekday: '请至少选择一个重复星期。',
  configImported: '配置已成功导入',
  configImportFailed: '导入失败：文件不是有效的 Meeting Scheduler 配置。',
  exportedChinese: '中文结果已导出',
  exportedEnglish: 'English result exported',
  configSaved: '配置已保存到浏览器',
  storageSaveFailed: '保存失败，请检查浏览器存储权限',
  overrideTime: '覆盖时间',
  excludeTime: '排除时间',
  defaultOverrideName: '覆盖时间',
  defaultExcludeName: '排除时间',
  disabled: '已停用',
  enable: '启用',
  disable: '停用',
  edit: '编辑',
  delete: '删除',
  editRuleAria: '编辑 {name}',
  deleteRuleAria: '删除 {name}',
  enableRuleAria: '启用 {name}',
  disableRuleAria: '停用 {name}',
  daily: '每天',
  weekly: '按星期重复',
  specificDate: '具体日期',
  ruleName: '规则名称',
  ruleNamePlaceholder: '例如：核心团队工作时间',
  recurrence: '重复方式',
  ruleTimezone: '所属时区',
  effectiveDate: '生效日期',
  multiDay: '可选择跨多天',
  startDate: '开始日期',
  endDate: '结束日期',
  repeatWeekdays: '重复星期',
  dailyNote: '这条规则会在计算范围内的每天生效。',
  startTime: '开始时间',
  endTime: '结束时间',
  overnightHelper: '允许跨午夜，例如 23:00–01:00。结果会按目标时区拆分到相邻日期。',
  cancel: '取消',
  saveRule: '保存规则',
  closeEditor: '关闭编辑器',
  ruleType: '规则类型',
  available: '可用',
  noAvailableTime: '无可用时间',
  intersection: '交集',
  excluded: '排除',
  finalAvailable: '可用',
  coverageLabel: '覆盖交集',
  exclusionLabel: '排除时间',
  availableLabel: '最终可用时间',
  noOverlap: '覆盖规则在当天没有重叠',
  firstOverride: '添加第一个覆盖时间',
  oneExclude: '添加一个排除时间',
  durationEmpty: '—',
  durationMinute: '分钟',
  durationMinutes: '分钟',
  durationHour: '小时',
  durationHours: '小时',
} as const

export type TranslationKey = keyof typeof zhMessages

const enMessages = {
  documentTitle: 'Meetwell · Meeting Scheduler',
  workspace: 'Workspace',
  workspaceName: 'Meeting planning',
  autoSaved: 'Saved automatically',
  saveFailed: 'Save failed',
  save: 'Save',
  importConfig: 'Import config',
  exportConfig: 'Export config',
  schedulePlanning: 'TIME PLANNING',
  heroTitle: 'Find a time that works for everyone',
  heroSubtitle: 'Set participant availability and see shared openings in real time.',
  availableTotalAria: 'Total available time',
  availableTotal: 'Total available time',
  dateRange: 'Calculation range',
  dateRangeStartAria: 'Calculation start date',
  dateRangeEndAria: 'Calculation end date',
  targetTimezone: 'Result timezone',
  interfaceLanguage: 'Interface language',
  exportLanguage: 'Export language',
  chinese: 'Chinese',
  english: 'English',
  exportResult: 'Export final result',
  inputConditions: 'INPUTS',
  timeRules: 'Time rules',
  add: 'Add',
  rulesIntro: 'Availability windows must all overlap; excluded time is removed from the result.',
  ruleCount: '{count} {type} rules',
  ruleCountSingular: '{count} {type} rule',
  overrideCountName: 'availability',
  excludeCountName: 'excluded time',
  calculationResult: 'RESULTS',
  finalAvailableTime: 'Final availability',
  dateRangeUnset: 'Date range not set',
  invalidDateRangeTitle: 'Adjust the date range',
  invalidDateRangeBody: 'Confirm both dates are valid and the start date is not after the end date.',
  addOverrideTitle: 'Add an availability window first',
  addOverrideBody: 'Availability windows define when the meeting can happen. Add one to see results here in real time.',
  addOverrideAction: 'Add availability',
  allTimesNote: 'Times are calculated in each rule’s timezone, then converted to the result timezone.',
  ruleAdded: 'Time rule added',
  ruleUpdated: 'Time rule updated',
  ruleDeleted: 'Time rule deleted',
  addTimeRule: 'Add time rule',
  editTimeRule: 'Edit time rule',
  errorRuleName: 'Enter a rule name.',
  errorTimezone: 'Select a valid IANA timezone.',
  errorTimeRange: 'Start and end times must be valid and different.',
  errorDateRange: 'Select a valid effective date range.',
  errorEndDate: 'The end date cannot be before the start date.',
  errorWeekday: 'Select at least one weekday.',
  configImported: 'Configuration imported successfully',
  configImportFailed: 'Import failed: the file is not a valid Meeting Scheduler configuration.',
  exportedChinese: 'Chinese result exported',
  exportedEnglish: 'English result exported',
  configSaved: 'Configuration saved in the browser',
  storageSaveFailed: 'Save failed. Check your browser storage permissions.',
  overrideTime: 'Availability',
  excludeTime: 'Excluded time',
  defaultOverrideName: 'Availability',
  defaultExcludeName: 'Excluded time',
  disabled: 'Disabled',
  enable: 'Enable',
  disable: 'Disable',
  edit: 'Edit',
  delete: 'Delete',
  editRuleAria: 'Edit {name}',
  deleteRuleAria: 'Delete {name}',
  enableRuleAria: 'Enable {name}',
  disableRuleAria: 'Disable {name}',
  daily: 'Daily',
  weekly: 'Weekly',
  specificDate: 'Specific date',
  ruleName: 'Rule name',
  ruleNamePlaceholder: 'e.g. Core team working hours',
  recurrence: 'Repeats',
  ruleTimezone: 'Rule timezone',
  effectiveDate: 'Effective dates',
  multiDay: 'Can span multiple days',
  startDate: 'Start date',
  endDate: 'End date',
  repeatWeekdays: 'Repeat on',
  dailyNote: 'This rule applies every day in the calculation range.',
  startTime: 'Start time',
  endTime: 'End time',
  overnightHelper: 'Overnight windows are supported, such as 23:00–01:00. Results are split across target dates.',
  cancel: 'Cancel',
  saveRule: 'Save rule',
  closeEditor: 'Close editor',
  ruleType: 'Rule type',
  available: 'Available',
  noAvailableTime: 'No available time',
  intersection: 'Intersection',
  excluded: 'Excluded',
  finalAvailable: 'Available',
  coverageLabel: 'Availability intersection',
  exclusionLabel: 'Excluded time',
  availableLabel: 'Final available time',
  noOverlap: 'Availability rules do not overlap on this day',
  firstOverride: 'Add the first availability window',
  oneExclude: 'Add an excluded time',
  durationEmpty: '—',
  durationMinute: 'minute',
  durationMinutes: 'minutes',
  durationHour: 'hour',
  durationHours: 'hours',
} satisfies Record<TranslationKey, string>

const messages: Record<Locale, Record<TranslationKey, string>> = {
  zh: zhMessages,
  en: enMessages,
}

export const TRANSLATION_KEYS = Object.keys(zhMessages) as TranslationKey[]

export function isLocale(value: unknown): value is Locale {
  return value === 'zh' || value === 'en'
}

export function detectBrowserLocale(languages: readonly string[]): Locale {
  const preferredLanguage = languages[0]?.toLowerCase() ?? ''
  return /^zh(?:-|$)/.test(preferredLanguage) ? 'zh' : 'en'
}

export function resolveLocale(stored: unknown, languages: readonly string[]): Locale {
  return isLocale(stored) ? stored : detectBrowserLocale(languages)
}

export function loadLocale(): Locale {
  let stored: string | null = null
  try {
    stored = typeof window === 'undefined' ? null : window.localStorage.getItem(LOCALE_STORAGE_KEY)
  } catch {
    stored = null
  }

  const languages = typeof navigator !== 'undefined'
    ? navigator.languages?.length
      ? navigator.languages
      : [navigator.language]
    : []
  return resolveLocale(stored, languages)
}

export function saveLocale(locale: Locale): boolean {
  try {
    if (typeof window === 'undefined') return false
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
    return true
  } catch {
    return false
  }
}

export function t(
  locale: Locale,
  key: TranslationKey,
  values?: Readonly<Record<string, string | number>>,
): string {
  const template = messages[locale][key]
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = values?.[name]
    return value === undefined ? match : String(value)
  })
}

export function formatDuration(minutes: number, locale: Locale): string {
  const normalized = Math.max(0, Math.round(minutes))
  if (!normalized) return t(locale, 'durationEmpty')

  const hours = Math.floor(normalized / 60)
  const remainingMinutes = normalized % 60
  if (!hours) {
    const unit = remainingMinutes === 1 ? 'durationMinute' : 'durationMinutes'
    return `${remainingMinutes} ${t(locale, unit)}`
  }

  const hourUnit = hours === 1 ? 'durationHour' : 'durationHours'
  if (!remainingMinutes) return `${hours} ${t(locale, hourUnit)}`

  const minuteUnit = remainingMinutes === 1 ? 'durationMinute' : 'durationMinutes'
  return `${hours} ${t(locale, hourUnit)} ${remainingMinutes} ${t(locale, minuteUnit)}`
}

export function ruleTypeLabel(locale: Locale, type: RuleType): string {
  return t(locale, type === 'override' ? 'overrideTime' : 'excludeTime')
}

export function ruleCountLabel(locale: Locale, type: RuleType, count: number): string {
  return t(locale, count === 1 ? 'ruleCountSingular' : 'ruleCount', {
    count,
    type: t(locale, type === 'override' ? 'overrideCountName' : 'excludeCountName'),
  })
}
