import { useState } from 'react'
import Icon from './Icon'
import TimezonePicker from './TimezonePicker'
import { t } from '../lib/i18n'
import type { Locale } from '../types'

interface SettingsModalProps {
  locale: Locale
  primaryTimezone: string
  secondaryTimezone: string | null
  recentTimezones: readonly string[]
  timezones: readonly string[]
  onClose: () => void
  onSave: (primaryTimezone: string, secondaryTimezone: string | null) => void
  onTimezoneSelected: (timezone: string) => void
}

export default function SettingsModal({
  locale,
  primaryTimezone,
  secondaryTimezone,
  recentTimezones,
  timezones,
  onClose,
  onSave,
  onTimezoneSelected,
}: SettingsModalProps) {
  const [draftPrimary, setDraftPrimary] = useState(primaryTimezone)
  const [draftSecondary, setDraftSecondary] = useState(secondaryTimezone)

  function selectPrimary(timezone: string) {
    setDraftPrimary(timezone)
    onTimezoneSelected(timezone)
  }

  function selectSecondary(timezone: string) {
    setDraftSecondary(timezone)
    onTimezoneSelected(timezone)
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="settings-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="timezone-settings-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="settings-heading">
          <div>
            <span className="editor-kicker"><Icon name="star" size={11} /> {t(locale, 'settings')}</span>
            <h2 id="timezone-settings-title">{t(locale, 'timezoneSettings')}</h2>
          </div>
          <button className="icon-button" onClick={onClose} type="button" aria-label={t(locale, 'closeEditor')}>
            <Icon name="close" size={17} />
          </button>
        </div>

        <p className="settings-intro">{t(locale, 'timezoneSettingsIntro')}</p>

        <div className="settings-field">
          <div className="settings-field-label">
            <span>{t(locale, 'primaryTimezone')}</span>
            <small>{t(locale, 'primaryTimezoneHelp')}</small>
          </div>
          <TimezonePicker
            value={draftPrimary}
            locale={locale}
            primaryTimezone={draftPrimary}
            secondaryTimezone={draftSecondary}
            recentTimezones={recentTimezones}
            timezones={timezones}
            excludedTimezones={draftSecondary ? [draftSecondary] : []}
            ariaLabel={t(locale, 'primaryTimezone')}
            onChange={selectPrimary}
          />
        </div>

        <div className="settings-field">
          <div className="settings-field-label">
            <span>{t(locale, 'secondaryTimezone')}</span>
            <small>{t(locale, 'secondaryTimezoneHelp')}</small>
          </div>
          {draftSecondary ? (
            <TimezonePicker
              value={draftSecondary}
              locale={locale}
              primaryTimezone={draftPrimary}
              secondaryTimezone={draftSecondary}
              recentTimezones={recentTimezones}
              timezones={timezones}
              excludedTimezones={[draftPrimary]}
              ariaLabel={t(locale, 'secondaryTimezone')}
              onChange={selectSecondary}
            />
          ) : (
            <TimezonePicker
              value=""
              locale={locale}
              primaryTimezone={draftPrimary}
              secondaryTimezone={null}
              recentTimezones={recentTimezones}
              timezones={timezones}
              excludedTimezones={[draftPrimary]}
              ariaLabel={t(locale, 'secondaryTimezone')}
              placeholder={t(locale, 'secondaryTimezone')}
              onChange={selectSecondary}
            />
          )}
          {draftSecondary ? (
            <button className="clear-secondary-button" type="button" onClick={() => setDraftSecondary(null)}>
              {t(locale, 'clearSecondaryTimezone')}
            </button>
          ) : null}
        </div>

        <div className="settings-actions">
          <button className="button secondary" type="button" onClick={onClose}>
            {t(locale, 'cancel')}
          </button>
          <button className="button primary" type="button" onClick={() => onSave(draftPrimary, draftSecondary)}>
            {t(locale, 'save')} <Icon name="check" size={15} />
          </button>
        </div>
      </section>
    </div>
  )
}
